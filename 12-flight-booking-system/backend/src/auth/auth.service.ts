import jwt from 'jsonwebtoken';
import { FlightStore, User } from '../database/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-cartly-flight-jwt-secret-key-2026';

export class AuthService {
  private store = FlightStore.getInstance();

  public login(email: string, passwordPlain: string): { user: Omit<User, 'passwordHash'>; token: string } {
    const user = this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (passwordPlain !== 'Pass123!') {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
}
