import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { health } from '../db/schema.ts';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/health-tracker - Get all health logs & weekly averages
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const logs = await db.select()
      .from(health)
      .where(eq(health.userUid, userUid))
      .orderBy(desc(health.date));

    // Calculate weekly averages (last 7 logs or last 7 days)
    const recentLogs = logs.slice(0, 7);
    const count = recentLogs.length || 1;

    const weeklyAverages = {
      avgWeight: Number((recentLogs.reduce((acc, curr) => acc + (curr.weightKg || 0), 0) / (recentLogs.filter(l => l.weightKg).length || 1)).toFixed(1)),
      avgWaterMl: Math.round(recentLogs.reduce((acc, curr) => acc + (curr.waterMl || 0), 0) / count),
      avgSleepHours: Number((recentLogs.reduce((acc, curr) => acc + (curr.sleepHours || 0), 0) / count).toFixed(1)),
      avgWorkoutMins: Math.round(recentLogs.reduce((acc, curr) => acc + (curr.workoutMinutes || 0), 0) / count),
      avgSteps: Math.round(recentLogs.reduce((acc, curr) => acc + (curr.stepsCount || 0), 0) / count),
      avgCalories: Math.round(recentLogs.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0) / count),
    };

    return res.json({ logs, weeklyAverages });
  } catch (error) {
    console.error('Fetch health logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch health logs' });
  }
});

// POST /api/health-tracker - Upsert health log for a date
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { date, weightKg, waterMl, sleepHours, sleepQuality, workoutMinutes, workoutType, stepsCount, caloriesBurned, mood, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Check if log already exists for this date
    const [existing] = await db.select()
      .from(health)
      .where(and(eq(health.userUid, userUid), eq(health.date, date)));

    if (existing) {
      const [updated] = await db.update(health)
        .set({
          weightKg: weightKg !== undefined ? weightKg : existing.weightKg,
          waterMl: waterMl !== undefined ? waterMl : existing.waterMl,
          sleepHours: sleepHours !== undefined ? sleepHours : existing.sleepHours,
          sleepQuality: sleepQuality || existing.sleepQuality,
          workoutMinutes: workoutMinutes !== undefined ? workoutMinutes : existing.workoutMinutes,
          workoutType: workoutType || existing.workoutType,
          stepsCount: stepsCount !== undefined ? stepsCount : existing.stepsCount,
          caloriesBurned: caloriesBurned !== undefined ? caloriesBurned : existing.caloriesBurned,
          mood: mood || existing.mood,
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(health.id, existing.id))
        .returning();

      return res.json(updated);
    } else {
      const [newLog] = await db.insert(health)
        .values({
          userId,
          userUid,
          date,
          weightKg: weightKg || null,
          waterMl: waterMl || 0,
          sleepHours: sleepHours || 0,
          sleepQuality: sleepQuality || 'Good',
          workoutMinutes: workoutMinutes || 0,
          workoutType: workoutType || 'General',
          stepsCount: stepsCount || 0,
          caloriesBurned: caloriesBurned || 0,
          mood: mood || 'Neutral',
          notes: notes || '',
        })
        .returning();

      return res.json(newLog);
    }
  } catch (error) {
    console.error('Save health log error:', error);
    return res.status(500).json({ error: 'Failed to save health log' });
  }
});

// DELETE /api/health-tracker/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userUid = req.user!.uid;

    await db.delete(health)
      .where(and(eq(health.id, id), eq(health.userUid, userUid)));

    return res.json({ message: 'Health log deleted successfully' });
  } catch (error) {
    console.error('Delete health log error:', error);
    return res.status(500).json({ error: 'Failed to delete health log' });
  }
});

export default router;
