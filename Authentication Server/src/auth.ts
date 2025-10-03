import jwt from 'jsonwebtoken';
import { findUserById } from './userRepo';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const signToken = (userId: string) => {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (e) {
    return null;
  }
};

export const getUserFromToken = async (authHeader?: string | null) => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = findUserById(payload.sub);
  return user ?? null;
};
