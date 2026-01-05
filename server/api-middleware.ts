/**
 * API Middleware - JSON Response Guarantee & Request Logging
 * 
 * PRIORITY 3 & 4: Server-side logging and JSON enforcement
 */

import { Request, Response, NextFunction, Express } from 'express';
import { randomUUID } from 'crypto';

// Request ID tracking
export interface ApiRequest extends Request {
  requestId: string;
}

// Error response shape
export interface ApiErrorResponse {
  ok: false;
  error: string;
  code: string;
  requestId: string;
}

// Store last 100 API errors for diagnostics
export const recentApiErrors: Array<{
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  error: string;
}> = [];

const MAX_ERRORS = 100;

function addError(entry: typeof recentApiErrors[0]) {
  recentApiErrors.unshift(entry);
  if (recentApiErrors.length > MAX_ERRORS) {
    recentApiErrors.pop();
  }
}

/**
 * Middleware: Add requestId to all requests
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as ApiRequest).requestId = randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', (req as ApiRequest).requestId);
  next();
}

/**
 * Middleware: Log all /api/* requests
 */
export function apiLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const startTime = Date.now();
  const requestId = (req as ApiRequest).requestId || 'unknown';

  // Capture original send to log response
  const originalSend = res.send.bind(res);
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    const contentType = res.get('Content-Type') || 'unknown';
    
    console.log(`[API] ${requestId} | ${req.method} ${req.path} | ${res.statusCode} | ${contentType} | ${duration}ms`);
    
    // Log errors for diagnostics
    if (res.statusCode >= 400) {
      addError({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        error: typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200),
      });
    }
    
    return originalSend(body);
  };

  next();
}

/**
 * Middleware: Enforce JSON responses on /api/* routes
 */
export function jsonEnforcementMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  // Override res.send to ensure JSON
  const originalSend = res.send.bind(res);
  res.send = function(body: any) {
    // If body is already a string that's not JSON, wrap it
    if (typeof body === 'string' && !body.startsWith('{') && !body.startsWith('[')) {
      res.setHeader('Content-Type', 'application/json');
      return originalSend(JSON.stringify({ 
        ok: false, 
        error: body,
        code: 'UNEXPECTED_RESPONSE',
        requestId: (req as ApiRequest).requestId || 'unknown'
      }));
    }
    
    // Ensure content-type is JSON for API routes
    if (!res.get('Content-Type')?.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    
    return originalSend(body);
  };

  next();
}

/**
 * Error handler: Catch all errors and return JSON
 */
export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith('/api')) {
    return next(err);
  }

  const requestId = (req as ApiRequest).requestId || 'unknown';
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'SERVER_ERROR';

  console.error(`[API ERROR] ${requestId} | ${req.method} ${req.path} | ${status} | ${message}`);
  
  addError({
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    status,
    error: message,
  });

  res.status(status).json({
    ok: false,
    error: message,
    code,
    requestId,
  } as ApiErrorResponse);
}

/**
 * 404 handler for missing API routes
 */
export function api404Handler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api') && !res.headersSent) {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    addError({
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      status: 404,
      error: 'Endpoint not found',
    });
    
    return res.status(404).json({
      ok: false,
      error: `Endpoint not found: ${req.method} ${req.path}`,
      code: 'NOT_FOUND',
      requestId,
    } as ApiErrorResponse);
  }
  next();
}

/**
 * Setup all API middleware
 */
export function setupApiMiddleware(app: Express) {
  // Add requestId first
  app.use(requestIdMiddleware);
  
  // JSON enforcement for /api/*
  app.use(jsonEnforcementMiddleware);
  
  // Logging
  app.use(apiLoggingMiddleware);
}

/**
 * Setup error handlers (call after all routes)
 */
export function setupApiErrorHandlers(app: Express) {
  app.use(api404Handler);
  app.use(apiErrorHandler);
}
