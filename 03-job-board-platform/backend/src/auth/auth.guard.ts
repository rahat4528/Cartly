import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
    name: string;
    companyId?: string;
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

export function requireEmployer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'EMPLOYER' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Employer privileges required.' });
    }
    next();
  });
}
