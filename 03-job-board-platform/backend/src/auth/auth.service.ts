import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JobBoardStore } from '../database/store.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-job-board-2026-production-testing';

export class AuthService {
  private store = JobBoardStore.getInstance();

  async register(params: {
    email: string;
    password: string;
    name: string;
    role: 'JOB_SEEKER' | 'EMPLOYER';
    companyName?: string;
  }) {
    const existing = this.store.findUserByEmail(params.email);
    if (existing) throw new Error('Email is already registered');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(params.password, salt);

    let companyId: string | undefined = undefined;

    if (params.role === 'EMPLOYER' && params.companyName) {
      companyId = `comp_${uuidv4().substring(0, 8)}`;
      this.store.companies.push({
        id: companyId,
        name: params.companyName,
        slug: params.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: 'New hiring organization',
        headquarters: 'Remote',
        isVerified: false,
        createdAt: new Date().toISOString()
      });
    }

    const newUser = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      email: params.email.toLowerCase(),
      passwordHash,
      role: params.role,
      name: params.name,
      companyId,
      skills: params.role === 'JOB_SEEKER' ? [] : undefined,
      createdAt: new Date().toISOString()
    };

    this.store.users.push(newUser);
    const token = this.generateToken(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        companyId: newUser.companyId
      },
      token
    };
  }

  async login(params: { email: string; password: string }) {
    const user = this.store.findUserByEmail(params.email);
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(params.password, user.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      },
      token
    };
  }

  generateToken(user: any) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyId: user.companyId
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }
}
