import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from './db';
import { UserRecord } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'melody-dev-secret-key-2026';

export interface AuthRequest extends Request {
  user?: UserRecord;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '14d' });
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return decoded.sub || null;
  } catch {
    return null;
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const userId = verifyToken(token);
    if (userId) {
      const user = await findUserById(userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }
  // Fallback: check demo user header if explicitly passed or leave undefined
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }
  req.user = user;
  next();
}
