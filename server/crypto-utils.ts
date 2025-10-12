import crypto from 'crypto';

/**
 * Generate a secure random token for password reset
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a password using crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashToVerify;
}