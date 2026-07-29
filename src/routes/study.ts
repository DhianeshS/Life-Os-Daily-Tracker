import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { studySessions } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// Helper to compute daily, weekly, monthly, yearly study hours graphs
function computeStudyAnalytics(sessionsList: any[]) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // 1. Daily (Last 14 days)
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = 0;
  }

  // 2. Weekly (Last 12 weeks)
  const weeklyMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    // Format week start date label e.g., "Wk of MM/DD"
    const weekLabel = `Wk ${d.getMonth() + 1}/${d.getDate()}`;
    weeklyMap[weekLabel] = 0;
  }

  // 3. Monthly (All 12 months of current year)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap: Record<string, number> = {};
  monthNames.forEach((m) => {
    monthlyMap[m] = 0;
  });

  // 4. Yearly (Past 5 years)
  const yearlyMap: Record<string, number> = {};
  for (let y = currentYear - 4; y <= currentYear; y++) {
    yearlyMap[`${y}`] = 0;
  }

  // Aggregate sessions
  sessionsList.forEach((s) => {
    const hours = Number(s.hoursStudied) || (Number(s.durationMinutes) ? Number(s.durationMinutes) / 60 : 0);
    const dateStr = s.studyDate || (s.completedAt ? new Date(s.completedAt).toISOString().split('T')[0] : '');

    if (!dateStr) return;

    // Daily mapping
    if (dailyMap[dateStr] !== undefined) {
      dailyMap[dateStr] = Math.round((dailyMap[dateStr] + hours) * 100) / 100;
    }

    const sessionDate = new Date(dateStr);
    if (!isNaN(sessionDate.getTime())) {
      // Monthly mapping
      if (sessionDate.getFullYear() === currentYear) {
        const mName = monthNames[sessionDate.getMonth()];
        if (mName && monthlyMap[mName] !== undefined) {
          monthlyMap[mName] = Math.round((monthlyMap[mName] + hours) * 100) / 100;
        }
      }

      // Yearly mapping
      const yr = `${sessionDate.getFullYear()}`;
      if (yearlyMap[yr] !== undefined) {
        yearlyMap[yr] = Math.round((yearlyMap[yr] + hours) * 100) / 100;
      }
    }
  });

  // Format into chart arrays
  const dailyChart = Object.entries(dailyMap).map(([date, hours]) => ({
    date,
    label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours,
  }));

  const monthlyChart = monthNames.map((m) => ({
    month: m,
    hours: monthlyMap[m] || 0,
  }));

  const yearlyChart = Object.entries(yearlyMap).map(([year, hours]) => ({
    year,
    hours,
  }));

  return {
    dailyChart,
    monthlyChart,
    yearlyChart,
  };
}

// GET /api/study - List all study sessions + analytics
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userSessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt));

    const analytics = computeStudyAnalytics(userSessions);

    return res.json({
      sessions: userSessions,
      analytics,
    });
  } catch (error) {
    console.error('Fetch study sessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch study sessions' });
  }
});

// POST /api/study - Create study session
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const {
      subject,
      hoursStudied,
      topic,
      difficulty,
      completed,
      revisionDate,
      studyDate,
      notes,
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [newSession] = await db
      .insert(studySessions)
      .values({
        userId,
        userUid,
        subject: subject.trim(),
        hoursStudied: parseFloat(hoursStudied) || 0,
        topic: topic ? topic.trim() : '',
        difficulty: difficulty || 'Medium',
        completed: completed !== undefined ? Boolean(completed) : true,
        revisionDate: revisionDate || '',
        studyDate: studyDate || todayStr,
        notes: notes || '',
      })
      .returning();

    return res.json(newSession);
  } catch (error) {
    console.error('Create study session error:', error);
    return res.status(500).json({ error: 'Failed to create study session' });
  }
});

// PUT /api/study/:id - Update study session
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const [existing] = await db
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: 'Study session not found or unauthorized' });
    }

    const {
      subject,
      hoursStudied,
      topic,
      difficulty,
      completed,
      revisionDate,
      studyDate,
      notes,
    } = req.body;

    const [updated] = await db
      .update(studySessions)
      .set({
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(hoursStudied !== undefined && { hoursStudied: parseFloat(hoursStudied) || 0 }),
        ...(topic !== undefined && { topic: topic.trim() }),
        ...(difficulty !== undefined && { difficulty }),
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(revisionDate !== undefined && { revisionDate }),
        ...(studyDate !== undefined && { studyDate }),
        ...(notes !== undefined && { notes: notes.trim() }),
      })
      .where(eq(studySessions.id, sessionId))
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error('Update study session error:', error);
    return res.status(500).json({ error: 'Failed to update study session' });
  }
});

// DELETE /api/study/:id - Delete study session
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const deleted = await db
      .delete(studySessions)
      .where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId)))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ error: 'Study session not found or unauthorized' });
    }

    return res.json({ message: 'Study session deleted successfully', id: sessionId });
  } catch (error) {
    console.error('Delete study session error:', error);
    return res.status(500).json({ error: 'Failed to delete study session' });
  }
});

export default router;
