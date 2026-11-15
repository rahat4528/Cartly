import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BookstoreStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-bookstore-2026-production-testing';
const JWT_EXPIRES_IN = '1d';

export class AuthService {
  private store = BookstoreStore.getInstance();

  async register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'CUSTOMER' | 'ADMIN';
  }) {
    const existing = this.store.findUserByEmail(params.email);
    if (existing) {
      throw new Error(`Email ${params.email} is already registered`);
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    const newUser = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: params.email.toLowerCase(),
      passwordHash,
      role: params.role || 'CUSTOMER',
      firstName: params.firstName,
      lastName: params.lastName,
      profile: {
        street: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
        phone: null,
        bio: null
      },
      createdAt: new Date().toISOString()
    };

    this.store.users.push(newUser);

    const token = this.generateToken(newUser);
    return {
      user: this.sanitizeUser(newUser),
      token
    };
  }

  async login(params: { email: string; password: string }) {
    const user = this.store.findUserByEmail(params.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  generateToken(user: any): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid or expired authentication token');
    }
  }

  sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
