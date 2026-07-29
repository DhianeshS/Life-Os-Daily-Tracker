import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { users, settings, tasks, habits, goals, projects, studySessions, health, journal, notifications, reminderSchedules } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(requireAuth);

// GET /api/settings - Fetch user profile & settings
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId));

    let [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));

    if (!userSettings) {
      [userSettings] = await db.insert(settings).values({
        userId,
        userUid,
        theme: 'dark',
        accentColor: 'indigo',
        notificationsEnabled: true,
        emailNotifications: true,
      }).returning();
    }

    return res.json({ profile: user, settings: userSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/profile - Update profile details (Name, Avatar)
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;

    const [updatedUser] = await db.update(users)
      .set({
        name: name !== undefined ? name : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
      });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/settings/email - Change email address
router.put('/email', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { newEmail, password } = req.body;

    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));

    if (currentUser.passwordHash && password) {
      const isValid = await bcrypt.compare(password, currentUser.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect password' });
      }
    }

    const [updatedUser] = await db.update(users)
      .set({
        email: newEmail,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Change email error:', error);
    return res.status(500).json({ error: 'Failed to update email address' });
  }
});

// PUT /api/settings/password - Change password
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));

    if (currentUser.passwordHash && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

// PUT /api/settings/preferences - Update theme & accent color preferences
router.put('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { theme, accentColor, notificationsEnabled, emailNotifications, dailyTargetFocusMins } = req.body;

    let [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));

    if (userSettings) {
      [userSettings] = await db.update(settings)
        .set({
          theme: theme || userSettings.theme,
          accentColor: accentColor || userSettings.accentColor,
          notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : userSettings.notificationsEnabled,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : userSettings.emailNotifications,
          dailyTargetFocusMins: dailyTargetFocusMins || userSettings.dailyTargetFocusMins,
          updatedAt: new Date(),
        })
        .where(eq(settings.id, userSettings.id))
        .returning();
    } else {
      [userSettings] = await db.insert(settings).values({
        userId,
        userUid,
        theme: theme || 'dark',
        accentColor: accentColor || 'indigo',
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        dailyTargetFocusMins: dailyTargetFocusMins || 120,
      }).returning();
    }

    return res.json(userSettings);
  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /api/settings/export - Export all user data as JSON
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;

    const userTasks = await db.select().from(tasks).where(eq(tasks.userUid, userUid));
    const userHabits = await db.select().from(habits).where(eq(habits.userUid, userUid));
    const userGoals = await db.select().from(goals).where(eq(goals.userUid, userUid));
    const userProjects = await db.select().from(projects).where(eq(projects.userUid, userUid));
    const userStudy = await db.select().from(studySessions).where(eq(studySessions.userUid, userUid));
    const userHealth = await db.select().from(health).where(eq(health.userUid, userUid));
    const userJournal = await db.select().from(journal).where(eq(journal.userUid, userUid));
    const userReminders = await db.select().from(reminderSchedules).where(eq(reminderSchedules.userUid, userUid));

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        email: req.user!.email,
        name: req.user!.name,
      },
      data: {
        tasks: userTasks,
        habits: userHabits,
        goals: userGoals,
        projects: userProjects,
        studySessions: userStudy,
        healthLogs: userHealth,
        journalEntries: userJournal,
        reminders: userReminders,
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=lifeos-backup-${new Date().toISOString().split('T')[0]}.json`);
    return res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export user data' });
  }
});

// POST /api/settings/import - Import / restore user data from JSON payload
router.post('/import', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided to import' });
    }

    let importedCounts = { tasks: 0, habits: 0, goals: 0, projects: 0, study: 0, health: 0 };

    if (Array.isArray(data.tasks)) {
      for (const item of data.tasks) {
        await db.insert(tasks).values({
          userId,
          userUid,
          title: item.title,
          description: item.description || '',
          category: item.category || 'Personal',
          priority: item.priority || 'Medium',
          dueDate: item.dueDate || null,
          isCompleted: item.isCompleted || false,
          subtasks: typeof item.subtasks === 'string' ? item.subtasks : JSON.stringify(item.subtasks || []),
        });
        importedCounts.tasks++;
      }
    }

    if (Array.isArray(data.habits)) {
      for (const item of data.habits) {
        await db.insert(habits).values({
          userId,
          userUid,
          title: item.title,
          description: item.description || '',
          category: item.category || 'Health',
          targetFrequency: item.targetFrequency || 'Daily',
          targetDaysPerWeek: item.targetDaysPerWeek || 7,
          color: item.color || '#3b82f6',
          icon: item.icon || 'zap',
          streak: item.streak || 0,
        });
        importedCounts.habits++;
      }
    }

    if (Array.isArray(data.goals)) {
      for (const item of data.goals) {
        await db.insert(goals).values({
          userId,
          userUid,
          title: item.title,
          description: item.description || '',
          category: item.category || 'Personal',
          timeframe: item.timeframe || 'Monthly',
          priority: item.priority || 'Medium',
          status: item.status || 'In Progress',
          targetDate: item.targetDate || null,
          progressPercent: item.progressPercent || 0,
          subgoals: typeof item.subgoals === 'string' ? item.subgoals : JSON.stringify(item.subgoals || []),
        });
        importedCounts.goals++;
      }
    }

    if (Array.isArray(data.projects)) {
      for (const item of data.projects) {
        await db.insert(projects).values({
          userId,
          userUid,
          name: item.name,
          description: item.description || '',
          startDate: item.startDate || null,
          deadline: item.deadline || null,
          priority: item.priority || 'Medium',
          progress: item.progress || 0,
          status: item.status || 'In Progress',
          githubRepo: item.githubRepo || '',
          deploymentLink: item.deploymentLink || '',
        });
        importedCounts.projects++;
      }
    }

    if (Array.isArray(data.healthLogs)) {
      for (const item of data.healthLogs) {
        await db.insert(health).values({
          userId,
          userUid,
          date: item.date || new Date().toISOString().split('T')[0],
          weightKg: item.weightKg || null,
          waterMl: item.waterMl || 0,
          sleepHours: item.sleepHours || 0,
          workoutMinutes: item.workoutMinutes || 0,
          stepsCount: item.stepsCount || 0,
          caloriesBurned: item.caloriesBurned || 0,
          mood: item.mood || 'Neutral',
          notes: item.notes || '',
        });
        importedCounts.health++;
      }
    }

    return res.json({
      message: 'Backup data imported successfully',
      importedCounts,
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Failed to import backup data' });
  }
});

// DELETE /api/settings/account - Delete user account and all data
router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Delete user from DB (Cascades all child records)
    await db.delete(users).where(eq(users.id, userId));

    return res.json({ message: 'Account and associated data deleted permanently' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
