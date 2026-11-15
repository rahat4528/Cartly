import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { store, User } from '../database/store';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-cartly-rental-jwt-secret-key-2026';

export class AuthService {
  static login(email: string, password: string): { token: string; user: Omit<User, 'passwordHash'> } | null {
    const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) return null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { passwordHash, ...safeUser } = user;
    return { token, user: safeUser };
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}
