import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import { getUserByEmail, getUserByUid, getOrCreateUser } from '../db/users.ts';
import { requireAuth, AuthRequest, JWT_SECRET } from '../middleware/auth.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

const router = Router();

// Sign Up
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email and password (min 6 characters) are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = 'usr_' + crypto.randomBytes(12).toString('hex');
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const [newUser] = await db.insert(users)
      .values({
        uid,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        passwordHash,
        isEmailVerified: false,
        verificationToken,
      })
      .returning();

    const token = jwt.sign(
      {
        id: newUser.id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        isEmailVerified: newUser.isEmailVerified,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        isEmailVerified: newUser.isEmailVerified,
        verificationToken: newUser.verificationToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(cleanEmail);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign(
      {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      JWT_SECRET,
      { expiresIn }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        sheetsSpreadsheetId: user.sheetsSpreadsheetId,
        sheetsAutoSync: user.sheetsAutoSync,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Google Login Endpoint
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token required.' });
    }

    const decodedToken = await adminAuth.verifyIdToken(firebaseToken);
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || decodedFirebaseEmailName(decodedToken.email),
      decodedToken.uid
    );

    const token = jwt.sign(
      {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        isEmailVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        isEmailVerified: true,
        sheetsSpreadsheetId: dbUser.sheetsSpreadsheetId,
        sheetsAutoSync: dbUser.sheetsAutoSync,
      },
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(401).json({ error: 'Google login failed.' });
  }
});

function decodedFirebaseEmailName(email?: string) {
  return email ? email.split('@')[0] : 'User';
}

// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({
        message: 'If an account exists with this email, a reset token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    return res.json({
      message: 'Password reset link/token generated successfully.',
      resetToken, // Provided directly for immediate testing in UI
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Forgot password request failed.' });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Token and new password (min 6 chars) are required.' });
    }

    const matchingUsers = await db.select()
      .from(users)
      .where(
        and(
          eq(users.resetPasswordToken, token),
          gt(users.resetPasswordExpires, new Date())
        )
      );

    if (!matchingUsers.length) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const user = matchingUsers[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.id, user.id));

    return res.json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Password reset failed.' });
  }
});

// Verify Email
router.post('/verify-email', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, req.user.id));

    return res.json({ message: 'Email address verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Email verification failed.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dbUser = await getUserByUid(req.user.uid);
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        isEmailVerified: dbUser.isEmailVerified,
        sheetsSpreadsheetId: dbUser.sheetsSpreadsheetId,
        sheetsAutoSync: dbUser.sheetsAutoSync,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
