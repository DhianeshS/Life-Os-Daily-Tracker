import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { projects } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// Helper function to calculate completion percentage from project tasks
function computeProjectProgress(tasksJsonStr: string, defaultProgress = 0): number {
  try {
    const list = JSON.parse(tasksJsonStr || '[]');
    if (Array.isArray(list) && list.length > 0) {
      const doneCount = list.filter((t: any) => t.completed).length;
      return Math.round((doneCount / list.length) * 100);
    }
  } catch (e) {
    // Fallback to manual progress
  }
  return defaultProgress;
}

// GET /api/projects - List all projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return res.json(userProjects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects - Create project
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const {
      name,
      description,
      startDate,
      deadline,
      priority,
      progress,
      status,
      githubRepo,
      deploymentLink,
      notes,
      tasks,
      color,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const tasksStr = typeof tasks === 'string' ? tasks : JSON.stringify(tasks || []);
    const calculatedProgress = computeProjectProgress(tasksStr, progress ?? 0);
    let finalStatus = status || 'In Progress';
    if (calculatedProgress === 100 && finalStatus !== 'Completed') {
      finalStatus = 'Completed';
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        userId,
        userUid,
        name: name.trim(),
        description: description || '',
        startDate: startDate || '',
        deadline: deadline || '',
        dueDate: deadline || '',
        priority: priority || 'Medium',
        progress: calculatedProgress,
        status: finalStatus,
        githubRepo: githubRepo || '',
        deploymentLink: deploymentLink || '',
        notes: notes || '',
        tasks: tasksStr,
        color: color || '#6366f1',
      })
      .returning();

    return res.json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Edit project
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!existing) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const {
      name,
      description,
      startDate,
      deadline,
      priority,
      progress,
      status,
      githubRepo,
      deploymentLink,
      notes,
      tasks,
      color,
    } = req.body;

    let tasksStr = existing.tasks;
    if (tasks !== undefined) {
      tasksStr = typeof tasks === 'string' ? tasks : JSON.stringify(tasks);
    }

    let nextProgress = existing.progress;
    if (tasks !== undefined) {
      nextProgress = computeProjectProgress(tasksStr, progress);
    } else if (progress !== undefined) {
      nextProgress = parseInt(progress, 10);
    }

    let nextStatus = status || existing.status;
    if (nextProgress === 100 && nextStatus !== 'Completed') {
      nextStatus = 'Completed';
    } else if (nextProgress < 100 && nextStatus === 'Completed') {
      nextStatus = 'In Progress';
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(startDate !== undefined && { startDate }),
        ...(deadline !== undefined && { deadline, dueDate: deadline }),
        ...(priority !== undefined && { priority }),
        ...(githubRepo !== undefined && { githubRepo: githubRepo.trim() }),
        ...(deploymentLink !== undefined && { deploymentLink: deploymentLink.trim() }),
        ...(notes !== undefined && { notes: notes.trim() }),
        ...(color !== undefined && { color }),
        progress: nextProgress,
        status: nextStatus,
        tasks: tasksStr,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    const deleted = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    if (!deleted.length) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    return res.json({ message: 'Project deleted successfully', id: projectId });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
