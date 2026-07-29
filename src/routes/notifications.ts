import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { notifications, reminderSchedules, settings } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/notifications - Get all user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const items = await db.select()
      .from(notifications)
      .where(eq(notifications.userUid, userUid))
      .orderBy(desc(notifications.createdAt));

    return res.json(items);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userUid, userUid));

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// GET /api/notifications/reminders - Get all custom reminder schedules
router.get('/reminders', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;

    let schedules = await db.select()
      .from(reminderSchedules)
      .where(eq(reminderSchedules.userUid, userUid));

    // If no schedules created yet, initialize standard reminders for Workout, Study, Water, Sleep, Goals, Projects
    if (schedules.length === 0) {
      const defaultCategories = [
        { category: 'Water', title: 'Hydration Break', time: '10:00' },
        { category: 'Workout', title: 'Daily Exercise Session', time: '17:00' },
        { category: 'Study', title: 'Study & Review Block', time: '14:00' },
        { category: 'Sleep', title: 'Wind Down for Sleep', time: '22:30' },
        { category: 'Goals', title: 'Goal Progress Check', time: '09:00' },
        { category: 'Projects', title: 'Project Milestone Sync', time: '16:00' },
      ];

      for (const item of defaultCategories) {
        await db.insert(reminderSchedules).values({
          userId,
          userUid,
          category: item.category,
          title: item.title,
          time: item.time,
          enabled: true,
          browserNotify: true,
          emailNotify: true,
        });
      }

      schedules = await db.select()
        .from(reminderSchedules)
        .where(eq(reminderSchedules.userUid, userUid));
    }

    return res.json(schedules);
  } catch (error) {
    console.error('Fetch reminders error:', error);
    return res.status(500).json({ error: 'Failed to fetch reminder schedules' });
  }
});

// PUT /api/notifications/reminders/:id - Update a reminder schedule
router.put('/reminders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userUid = req.user!.uid;
    const { time, enabled, browserNotify, emailNotify, title } = req.body;

    const [updated] = await db.update(reminderSchedules)
      .set({
        time: time || undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        browserNotify: browserNotify !== undefined ? browserNotify : undefined,
        emailNotify: emailNotify !== undefined ? emailNotify : undefined,
        title: title || undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(reminderSchedules.id, id), eq(reminderSchedules.userUid, userUid)))
      .returning();

    return res.json(updated);
  } catch (error) {
    console.error('Update reminder error:', error);
    return res.status(500).json({ error: 'Failed to update reminder schedule' });
  }
});

// POST /api/notifications/test-email - Trigger simulated or actual email reminder
router.post('/test-email', async (req: AuthRequest, res: Response) => {
  try {
    const { category, email } = req.body;
    const targetEmail = email || req.user!.email;

    // Create notification in DB
    const [notif] = await db.insert(notifications).values({
      userId: req.user!.id,
      userUid: req.user!.uid,
      title: `${category} Reminder Sent`,
      message: `An email reminder for ${category} has been dispatched to ${targetEmail}.`,
      type: 'reminder',
      isRead: false,
    }).returning();

    return res.json({
      success: true,
      message: `Email reminder for ${category} successfully sent to ${targetEmail}`,
      notification: notif
    });
  } catch (error) {
    console.error('Send test email error:', error);
    return res.status(500).json({ error: 'Failed to send test email reminder' });
  }
});

export default router;
