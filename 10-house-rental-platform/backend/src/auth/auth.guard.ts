import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'TENANT' | 'LANDLORD' | 'ADMIN';
    fullName: string;
  };
}

export function authGuard(roles?: Array<'TENANT' | 'LANDLORD' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: missing authentication token' });
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    }

    req.user = decoded;

    if (roles && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }

    next();
  };
}
