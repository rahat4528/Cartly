import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN';
    name: string;
  };
}

const authService = new AuthService();

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = payload as any;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid token' });
  }
}
