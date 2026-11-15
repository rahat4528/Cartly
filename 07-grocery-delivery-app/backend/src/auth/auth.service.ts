import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GroceryStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-grocery-jwt-token-key-2026';

export class AuthService {
  private store = GroceryStore.getInstance();

  async register(data: { email: string; password: string; name: string; phone?: string; address?: string }) {
    const existing = this.store.findUserByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone || '',
      role: 'CUSTOMER',
      address: data.address || ''
    };

    this.store.users.push(user);

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async login(email: string, password: string) {
    const user = this.store.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }
}
