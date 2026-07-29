import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { focusSessions } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// GET /api/focus
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userSessions = await db.select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.completedAt));

    return res.json(userSessions);
  } catch (error) {
    console.error('Fetch focus sessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

// POST /api/focus
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, durationMinutes, notes } = req.body;
    if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Valid focus duration in minutes is required' });
    }

    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const [newSession] = await db.insert(focusSessions)
      .values({
        userId,
        userUid,
        title: title?.trim() || 'Focus Session',
        category: category || 'Work',
        durationMinutes,
        notes: notes?.trim() || '',
      })
      .returning();

    return res.json(newSession);
  } catch (error) {
    console.error('Log focus session error:', error);
    return res.status(500).json({ error: 'Failed to log focus session' });
  }
});

export default router;
