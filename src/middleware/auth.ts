import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getUserByUid, getOrCreateUser } from '../db/users.ts';

export const JWT_SECRET = process.env.JWT_SECRET || 'lifeos-super-secret-jwt-key-2026';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
  isEmailVerified: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    // 1. Try verifying as local JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        uid: string;
        email: string;
        name?: string;
        isEmailVerified: boolean;
      };

      // Verify user exists in database
      const dbUser = await getUserByUid(decoded.uid);
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          uid: dbUser.uid,
          email: dbUser.email,
          name: dbUser.name,
          isEmailVerified: dbUser.isEmailVerified,
        };
        return next();
      }
    } catch {
      // Token was not a local JWT or expired, try Firebase ID token
    }

    // 2. Try verifying as Firebase ID Token
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      const dbUser = await getOrCreateUser(
        decodedFirebase.uid,
        decodedFirebase.email || '',
        decodedFirebase.name || decodedFirebase.email?.split('@')[0],
        decodedFirebase.uid
      );

      req.user = {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        isEmailVerified: dbUser.isEmailVerified,
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token session' });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
};
