import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'GUEST' | 'HOST' | 'ADMIN';
    name: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

export function requireRole(role: 'GUEST' | 'HOST' | 'ADMIN') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: `Forbidden: requires ${role} privileges` });
      return;
    }
    next();
  };
}
