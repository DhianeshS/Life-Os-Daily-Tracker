import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { habits, habitLogs } from '../db/schema.ts';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// GET /api/habits
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const userHabits = await db.select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(desc(habits.createdAt));

    if (!userHabits.length) {
      return res.json([]);
    }

    const habitIds = userHabits.map((h) => h.id);
    const logs = await db.select()
      .from(habitLogs)
      .where(inArray(habitLogs.habitId, habitIds));

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysElapsedInYear = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Combine habits with completion dates array & yearly stats
    const result = userHabits.map((habit) => {
      const habitCompletionDates = logs
        .filter((log) => log.habitId === habit.id)
        .map((log) => log.completedDate);

      const thisYearCompletions = habitCompletionDates.filter(d => d.startsWith(`${currentYear}`));
      const yearlyCompletionPercentage = Math.min(100, Math.round((thisYearCompletions.length / daysElapsedInYear) * 100));

      return {
        ...habit,
        completedDates: habitCompletionDates,
        yearlyCompletionPercentage,
        totalCompletedDays: habitCompletionDates.length,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('Fetch habits error:', error);
    return res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, targetFrequency, targetDaysPerWeek, color, icon } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Habit title is required' });
    }

    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const [newHabit] = await db.insert(habits)
      .values({
        userId,
        userUid,
        title: title.trim(),
        description: description || '',
        category: category || 'Health',
        targetFrequency: targetFrequency || 'Daily',
        targetDaysPerWeek: targetDaysPerWeek ? parseInt(targetDaysPerWeek, 10) : 7,
        color: color || '#3b82f6',
        icon: icon || 'zap',
        streak: 0,
        bestStreak: 0,
      })
      .returning();

    return res.json({ ...newHabit, completedDates: [], yearlyCompletionPercentage: 0, totalCompletedDays: 0 });
  } catch (error) {
    console.error('Create habit error:', error);
    return res.status(500).json({ error: 'Failed to create habit' });
  }
});

// PUT /api/habits/:id - Edit Habit details
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { title, description, category, targetFrequency, targetDaysPerWeek, color, icon } = req.body;

    const [existing] = await db.select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: 'Habit not found or unauthorized' });
    }

    const [updated] = await db.update(habits)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(targetFrequency !== undefined && { targetFrequency }),
        ...(targetDaysPerWeek !== undefined && { targetDaysPerWeek: parseInt(targetDaysPerWeek, 10) }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        updatedAt: new Date(),
      })
      .where(eq(habits.id, habitId))
      .returning();

    // Fetch logs to retain completedDates in return payload
    const logs = await db.select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, habitId));
    const completedDates = logs.map(l => l.completedDate);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    const daysElapsedInYear = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const thisYearCompletions = completedDates.filter(d => d.startsWith(`${currentYear}`));
    const yearlyCompletionPercentage = Math.min(100, Math.round((thisYearCompletions.length / daysElapsedInYear) * 100));

    return res.json({
      ...updated,
      completedDates,
      yearlyCompletionPercentage,
      totalCompletedDays: completedDates.length,
    });
  } catch (error) {
    console.error('Update habit error:', error);
    return res.status(500).json({ error: 'Failed to update habit' });
  }
});

// POST /api/habits/:id/toggle
router.post('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const dateStr = req.body.date || new Date().toISOString().split('T')[0];

    const [habit] = await db.select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or unauthorized' });
    }

    const existingLog = await db.select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.completedDate, dateStr)));

    let isCompletedNow = false;

    if (existingLog.length > 0) {
      // Toggle off
      await db.delete(habitLogs)
        .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.completedDate, dateStr)));
      isCompletedNow = false;
    } else {
      // Toggle on
      await db.insert(habitLogs).values({
        habitId,
        userUid,
        completedDate: dateStr,
      });
      isCompletedNow = true;
    }

    // Recalculate streak
    const allLogs = await db.select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, habitId));

    const sortedDates = allLogs.map(l => l.completedDate).sort().reverse();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      let checkDate = new Date();
      if (!sortedDates.includes(today) && sortedDates.includes(yesterday)) {
        checkDate = new Date(Date.now() - 86400000);
      }

      while (true) {
        const iso = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(iso)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const newBest = Math.max(habit.bestStreak, currentStreak);

    await db.update(habits)
      .set({
        streak: currentStreak,
        bestStreak: newBest,
      })
      .where(eq(habits.id, habitId));

    return res.json({
      habitId,
      date: dateStr,
      isCompleted: isCompletedNow,
      streak: currentStreak,
      bestStreak: newBest,
      completedDates: sortedDates,
    });
  } catch (error) {
    console.error('Toggle habit error:', error);
    return res.status(500).json({ error: 'Failed to toggle habit completion' });
  }
});

// DELETE /api/habits/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const deleted = await db.delete(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ error: 'Habit not found or unauthorized' });
    }

    return res.json({ message: 'Habit deleted', id: habitId });
  } catch (error) {
    console.error('Delete habit error:', error);
    return res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
