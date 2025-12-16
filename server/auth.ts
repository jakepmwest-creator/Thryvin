import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  let salt: string;
  let hashed: string;
  
  // Handle both formats: "hash.salt" (new) and "salt:hash" (old)
  if (stored.includes(".")) {
    // New format: hash.salt
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.error("Invalid dot format password in database:", stored);
      return false;
    }
    [hashed, salt] = parts;
  } else if (stored.includes(":")) {
    // Old format: salt:hash
    const parts = stored.split(":");
    if (parts.length !== 2) {
      console.error("Invalid colon format password in database:", stored);
      return false;
    }
    [salt, hashed] = parts;
  } else {
    console.error("Invalid password format in database:", stored);
    return false;
  }
  
  if (!hashed || !salt) {
    console.error("Empty hash or salt in stored password");
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Use memory store for sessions to avoid database connection issues
  console.log("Using memory session store for development");
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.COOKIE_SECRET || process.env.AUTH_SECRET || "fitness-app-secret-key",
    resave: false,
    saveUninitialized: false,
    // store: undefined means use default memory store
    cookie: {
      httpOnly: true, // Secure: prevent XSS attacks by blocking JavaScript access
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax for development
      path: '/',
      maxAge: 1000*60*60*24*7 // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          console.error('Database error during authentication:', error);
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error('Database error during user deserialization:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { name, email } = req.body;
      
      // Check if email already exists with retry logic
      let existingUserByEmail;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          existingUserByEmail = await storage.getUserByEmail(email);
          break; // Success, exit retry loop
        } catch (dbError: any) {
          console.log(`Database connection attempt ${retryCount + 1} failed, retrying...`);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.log('All database retry attempts failed, allowing registration to proceed');
            // Allow registration to proceed even if we can't check for duplicates
            existingUserByEmail = null;
            break;
          }
          
          // Wait 2 seconds before retry to allow database to wake up
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (existingUserByEmail) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      // Set trial period (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      let user;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          user = await storage.createUser({
            name: req.body.name,
            email: req.body.email,
            password: await hashPassword(req.body.password),
            // Provide default values for required fields - user will set these during onboarding
            trainingType: req.body.trainingType || 'general-fitness',
            goal: req.body.goal || 'improve-health',
            coachingStyle: req.body.coachingStyle || 'encouraging-positive',
            selectedCoach: req.body.selectedCoach || 'nate-green',
            trialEndsAt,
          });
          console.log('✅ User created successfully in database!');
          break; // Success, exit retry loop
        } catch (dbError: any) {
          console.log(`User creation attempt ${retryCount + 1} failed:`, dbError?.message || dbError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error('Failed to create user after all retries:', dbError);
            return res.status(503).json({ error: "Unable to create account. Please try again in a moment." });
          }
          
          // Wait 2 seconds before retry to allow database to wake up
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Save session before responding to prevent race condition
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          // Remove password from response for security
          const { password, ...safeUser } = user;
          res.status(201).json({ ok: true, user: safeUser });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return next(err);
        }
        // Save session before responding to prevent race condition
        req.session.save((saveErr: any) => {
          if (saveErr) return next(saveErr);
          // Remove password from response for security
          const { password, ...safeUser } = user;
          return res.status(200).json({ ok: true, user: safeUser });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Add GET /api/auth/me endpoint as specified
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.status(200).json({ user: req.user });
  });

  // Add auth-prefixed routes for mobile compatibility
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { name, email } = req.body;
      
      // Check if email already exists with retry logic
      let existingUserByEmail;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          existingUserByEmail = await storage.getUserByEmail(email);
          break; // Success, exit retry loop
        } catch (dbError: any) {
          console.log(`Database connection attempt ${retryCount + 1} failed, retrying...`);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.log('All database retry attempts failed, allowing registration to proceed');
            // Allow registration to proceed even if we can't check for duplicates
            existingUserByEmail = null;
            break;
          }
          
          // Wait 2 seconds before retry to allow database to wake up
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (existingUserByEmail) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      // Set trial period (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      let user;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          // Parse session duration (handle strings like '60+' -> 60)
          let sessionDuration = req.body.sessionDuration;
          if (typeof sessionDuration === 'string') {
            sessionDuration = parseInt(sessionDuration.replace('+', '')) || 45;
          }
          
          // Parse equipment array - could be string or array
          let equipmentAccess = req.body.equipment;
          if (equipmentAccess && typeof equipmentAccess === 'object' && !Array.isArray(equipmentAccess)) {
            equipmentAccess = Object.keys(equipmentAccess).filter(k => equipmentAccess[k]);
          }
          if (Array.isArray(equipmentAccess)) {
            equipmentAccess = JSON.stringify(equipmentAccess);
          }
          
          // Parse fitness goals
          let fitnessGoals = req.body.fitnessGoals;
          if (Array.isArray(fitnessGoals)) {
            fitnessGoals = JSON.stringify(fitnessGoals);
          }
          
          // Parse injuries - could be array or string
          let injuries = req.body.injuries || req.body.injuriesDescription;
          if (Array.isArray(injuries)) {
            injuries = injuries.join(', ');
          }
          
          user = await storage.createUser({
            name: req.body.name,
            email: req.body.email,
            password: await hashPassword(req.body.password),
            // Provide default values for required fields - user will set these during onboarding
            trainingType: req.body.trainingType || 'general-fitness',
            goal: req.body.goal || (req.body.fitnessGoals?.[0]) || 'improve-health',
            coachingStyle: req.body.coachingStyle || 'encouraging-positive',
            selectedCoach: req.body.coachName || req.body.selectedCoach || 'nate-green',
            trialEndsAt,
            // CRITICAL: Save all onboarding data for AI workout generation
            sessionDurationPreference: sessionDuration || 45,
            equipmentAccess: equipmentAccess || JSON.stringify(['bodyweight']),
            trainingDaysPerWeek: parseInt(req.body.trainingDays) || 4,
            injuries: injuries || null,
            focusAreas: fitnessGoals || null,
            hasCompletedAIOnboarding: true, // Mark as completed since they went through full onboarding
          });
          console.log('✅ User created successfully in database with full onboarding data!');
          break; // Success, exit retry loop
        } catch (dbError: any) {
          console.log(`User creation attempt ${retryCount + 1} failed:`, dbError?.message || dbError);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error('Failed to create user after all retries:', dbError);
            return res.status(503).json({ error: "Unable to create account. Please try again in a moment." });
          }
          
          // Wait 2 seconds before retry to allow database to wake up
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      req.login(user, (err) => {
        if (err) return next(err);
        // Save session before responding to prevent race condition
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          // Remove password from response for security
          const { password, ...safeUser } = user;
          res.status(201).json({ ok: true, user: safeUser });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return next(err);
        }
        // Save session before responding to prevent race condition
        req.session.save((saveErr: any) => {
          if (saveErr) return next(saveErr);
          // Remove password from response for security
          const { password, ...safeUser } = user;
          return res.status(200).json({ ok: true, user: safeUser });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
}