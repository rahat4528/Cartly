import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name: string;
    role: string;
  };
}

const authService = new AuthService();

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
  }

  const token = header.substring(7);
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export const requireHost = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'HOST' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden: Host or Admin privileges required.' });
    }
    next();
  });
};
