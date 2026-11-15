import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { HotelStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private store = HotelStore.getInstance();
  private jwtSecret = process.env.JWT_SECRET || 'hotel-booking-dev-secret-key-2026';

  async register(data: { email: string; password: string; name: string; phone?: string; role?: string }) {
    const existing = this.store.findUserByEmail(data.email);
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      name: data.name,
      phone: data.phone || '',
      role: data.role || 'GUEST',
      createdAt: new Date().toISOString()
    };

    this.store.users.push(user);
    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async login(email: string, pass: string) {
    const user = this.store.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const matches = await bcrypt.compare(pass, user.passwordHash);
    if (!matches) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  private generateToken(user: any): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.jwtSecret);
  }
}
