import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PwaStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-pwa-store-2026-production-testing';

export class AuthService {
  private store = PwaStore.getInstance();

  async register(params: { email: string; password: string; name: string }) {
    const existing = this.store.findUserByEmail(params.email);
    if (existing) throw new Error('Email is already registered');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    const newUser = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: params.email.toLowerCase(),
      passwordHash,
      role: 'CUSTOMER',
      name: params.name,
      createdAt: new Date().toISOString()
    };

    this.store.users.push(newUser);
    const token = this.generateToken(newUser);

    return { user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, token };
  }

  async login(params: { email: string; password: string }) {
    const user = this.store.findUserByEmail(params.email);
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(params.password, user.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    const token = this.generateToken(user);
    return { user: { id: user.id, email: user.email, role: user.role, name: user.name }, token };
  }

  generateToken(user: any) {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new Error('Invalid or expired token');
    }
  }
}
