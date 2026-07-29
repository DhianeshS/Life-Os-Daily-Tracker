import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { tasks } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Apply requireAuth middleware to all task routes
router.use(requireAuth);

// GET /api/tasks
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const userTasks = await db.select()
      .from(tasks)
      .where(eq(tasks.userUid, userUid))
      .orderBy(desc(tasks.createdAt));

    return res.json(userTasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, priority, dueDate, subtasks } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const [newTask] = await db.insert(tasks)
      .values({
        userId,
        userUid,
        title: title.trim(),
        description: description?.trim() || '',
        category: category || 'Personal',
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        subtasks: Array.isArray(subtasks) ? JSON.stringify(subtasks) : '[]',
      })
      .returning();

    return res.json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { title, description, category, priority, dueDate, isCompleted, subtasks } = req.body;

    const existing = await db.select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (!existing.length) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const updates: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (subtasks !== undefined) updates.subtasks = typeof subtasks === 'string' ? subtasks : JSON.stringify(subtasks);

    if (isCompleted !== undefined) {
      updates.isCompleted = isCompleted;
      updates.completedAt = isCompleted ? new Date() : null;
    }

    const [updatedTask] = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const deleted = await db.delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    return res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
