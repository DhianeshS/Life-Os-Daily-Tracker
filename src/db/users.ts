import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, googleId?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        googleId,
        isEmailVerified: !!googleId, // Google login is auto-verified
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(googleId ? { googleId, isEmailVerified: true } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('getOrCreateUser database error:', error);
    throw new Error('Database user sync failed', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return result[0] || null;
  } catch (error) {
    console.error('getUserByEmail database error:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function getUserById(id: number) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  } catch (error) {
    console.error('getUserById database error:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid));
    return result[0] || null;
  } catch (error) {
    console.error('getUserByUid database error:', error);
    throw new Error('Database query failed', { cause: error });
  }
}
