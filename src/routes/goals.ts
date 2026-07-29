import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { goals } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// Helper function to auto-calculate progress from subgoals if present
function calculateGoalProgress(subgoalsJson: string, manualProgress?: number): number {
  try {
    const list = JSON.parse(subgoalsJson || '[]');
    if (Array.isArray(list) && list.length > 0) {
      const completedCount = list.filter((item: any) => item.completed).length;
      return Math.round((completedCount / list.length) * 100);
    }
  } catch (e) {
    // Fail gracefully to manual progress
  }
  return manualProgress ?? 0;
}

// GET /api/goals - Fetch all goals for logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));

    return res.json(userGoals);
  } catch (error) {
    console.error('Fetch goals error:', error);
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals - Create new goal
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const {
      title,
      description,
      category,
      timeframe,
      priority,
      status,
      targetDate,
      progressPercent,
      subgoals,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Goal title is required' });
    }

    const subgoalsStr = typeof subgoals === 'string' ? subgoals : JSON.stringify(subgoals || []);
    const calculatedProgress = calculateGoalProgress(subgoalsStr, progressPercent ?? 0);

    const [newGoal] = await db
      .insert(goals)
      .values({
        userId,
        userUid,
        title: title.trim(),
        description: description || '',
        category: category || 'Personal',
        timeframe: timeframe || 'Monthly',
        priority: priority || 'Medium',
        status: status || 'In Progress',
        targetDate: targetDate || '',
        progressPercent: calculatedProgress,
        subgoals: subgoalsStr,
      })
      .returning();

    return res.json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id - Edit goal / update progress / subgoals
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found or unauthorized' });
    }

    const {
      title,
      description,
      category,
      timeframe,
      priority,
      status,
      targetDate,
      progressPercent,
      subgoals,
    } = req.body;

    let subgoalsStr = existing.subgoals;
    if (subgoals !== undefined) {
      subgoalsStr = typeof subgoals === 'string' ? subgoals : JSON.stringify(subgoals);
    }

    let nextProgress = existing.progressPercent;
    if (subgoals !== undefined) {
      nextProgress = calculateGoalProgress(subgoalsStr, progressPercent);
    } else if (progressPercent !== undefined) {
      nextProgress = parseInt(progressPercent, 10);
    }

    let nextStatus = status || existing.status;
    if (nextProgress === 100 && nextStatus !== 'Completed') {
      nextStatus = 'Completed';
    } else if (nextProgress < 100 && nextStatus === 'Completed') {
      nextStatus = 'In Progress';
    }

    const [updated] = await db
      .update(goals)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category }),
        ...(timeframe !== undefined && { timeframe }),
        ...(priority !== undefined && { priority }),
        ...(targetDate !== undefined && { targetDate }),
        status: nextStatus,
        progressPercent: nextProgress,
        subgoals: subgoalsStr,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId))
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({ error: 'Failed to update goal' });
  }
});

// POST /api/goals/:id/toggle - Checkbox completion toggle
router.post('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: 'Goal not found or unauthorized' });
    }

    const isCurrentlyCompleted = existing.status === 'Completed';
    const newStatus = isCurrentlyCompleted ? 'In Progress' : 'Completed';
    const newProgress = isCurrentlyCompleted ? 0 : 100;

    const [updated] = await db
      .update(goals)
      .set({
        status: newStatus,
        progressPercent: newProgress,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId))
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error('Toggle goal error:', error);
    return res.status(500).json({ error: 'Failed to toggle goal status' });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const deleted = await db
      .delete(goals)
      .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ error: 'Goal not found or unauthorized' });
    }

    return res.json({ message: 'Goal deleted successfully', id: goalId });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
