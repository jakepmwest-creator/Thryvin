/**
 * JWT Authentication Service
 * 
 * PART A: Bearer token authentication for mobile app (Expo Go)
 * - Generates JWT access tokens on login/register
 * - Validates Bearer tokens on protected routes
 * - Replaces cookie-based sessions for mobile
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User as SelectUser } from '@shared/schema';
import { storage } from './storage';

// JWT secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'thryvin-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: SelectUser;
  tokenAuth?: boolean; // true if authenticated via Bearer token
}

/**
 * Generate JWT access token for a user
 */
export function generateAccessToken(user: SelectUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware: Authenticate via Bearer token OR session
 * - First tries Bearer token (for mobile)
 * - Falls back to session auth (for web)
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // First, check for Bearer token
  const token = extractBearerToken(req);
  
  if (token) {
    const payload = verifyAccessToken(token);
    
    if (payload) {
      // Token is valid - fetch user from DB
      try {
        const user = await storage.getUser(payload.userId);
        if (user) {
          req.user = user;
          req.tokenAuth = true;
          return next();
        }
      } catch (error) {
        console.error('Error fetching user for token:', error);
      }
    }
    
    // Token invalid or user not found
    return res.status(401).json({
      ok: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
  }
  
  // Fall back to session authentication (for web)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.tokenAuth = false;
    return next();
  }
  
  // No valid auth
  return res.status(401).json({
    ok: false,
    error: 'Authentication required',
    code: 'AUTH_REQUIRED',
    message: 'Please log in to access this resource',
  });
}

/**
 * Middleware: Optional authentication
 * - Attempts auth but continues even if not authenticated
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractBearerToken(req);
  
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      try {
        const user = await storage.getUser(payload.userId);
        if (user) {
          req.user = user;
          req.tokenAuth = true;
        }
      } catch (error) {
        // Ignore errors for optional auth
      }
    }
  } else if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.tokenAuth = false;
  }
  
  next();
}

/**
 * Check if request is authenticated (either token or session)
 */
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.user;
}
