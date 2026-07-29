import { Router, Response } from 'express';
import { google } from 'googleapis';
import { db } from '../db/index.ts';
import { users, tasks, habits, focusSessions, sheetSyncLogs } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(requireAuth);

// Get Google Sheets client using Application Default Credentials
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
  });
  return google.sheets({ version: 'v4', auth });
}

// GET /api/sheets/config
router.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    const logs = await db.select()
      .from(sheetSyncLogs)
      .where(eq(sheetSyncLogs.userId, userId))
      .orderBy(desc(sheetSyncLogs.createdAt))
      .limit(10);

    return res.json({
      spreadsheetId: user?.sheetsSpreadsheetId || '',
      autoSync: user?.sheetsAutoSync || false,
      syncLogs: logs,
    });
  } catch (error) {
    console.error('Fetch sheets config error:', error);
    return res.status(500).json({ error: 'Failed to fetch Google Sheets config' });
  }
});

// POST /api/sheets/config
router.post('/config', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { spreadsheetId, autoSync } = req.body;

    await db.update(users)
      .set({
        sheetsSpreadsheetId: spreadsheetId?.trim() || null,
        sheetsAutoSync: !!autoSync,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return res.json({ message: 'Google Sheets settings saved successfully', spreadsheetId, autoSync });
  } catch (error) {
    console.error('Save sheets config error:', error);
    return res.status(500).json({ error: 'Failed to save Google Sheets settings' });
  }
});

// POST /api/sheets/create - Create a new spreadsheet automatically for the user
router.post('/create', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `LifeOS Productivity Tracker Data (${req.user!.email})`,
        },
        sheets: [
          { properties: { title: 'Tasks' } },
          { properties: { title: 'Habits' } },
          { properties: { title: 'Focus Log' } },
        ],
      },
    });

    const newSpreadsheetId = response.data.spreadsheetId;

    if (newSpreadsheetId) {
      await db.update(users)
        .set({ sheetsSpreadsheetId: newSpreadsheetId, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return res.json({
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl: response.data.spreadsheetUrl,
      message: 'New Google Sheet created successfully!',
    });
  } catch (error: any) {
    console.error('Create Google Sheet error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to create new Google Sheet' });
  }
});

// POST /api/sheets/sync - Sync tasks, habits, and focus logs into Google Sheets
router.post('/sync', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userUid = req.user!.uid;

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const spreadsheetId = req.body.spreadsheetId || user?.sheetsSpreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({
        error: 'No Google Spreadsheet ID provided. Create or connect a spreadsheet in settings first.',
      });
    }

    const userTasks = await db.select().from(tasks).where(eq(tasks.userUid, userUid));
    const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));
    const userSessions = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId));

    const sheets = await getSheetsClient();

    // Prepare Task Rows
    const taskValues = [
      ['ID', 'Title', 'Category', 'Priority', 'Due Date', 'Status', 'Completed At', 'Created At'],
      ...userTasks.map((t) => [
        t.id,
        t.title,
        t.category,
        t.priority,
        t.dueDate || 'N/A',
        t.isCompleted ? 'Completed' : 'Pending',
        t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : 'N/A',
        new Date(t.createdAt).toISOString().split('T')[0],
      ]),
    ];

    // Prepare Habit Rows
    const habitValues = [
      ['ID', 'Habit Name', 'Category', 'Frequency', 'Current Streak', 'Best Streak'],
      ...userHabits.map((h) => [
        h.id,
        h.title,
        h.category,
        h.targetFrequency,
        h.streak,
        h.bestStreak,
      ]),
    ];

    // Prepare Focus Rows
    const focusValues = [
      ['ID', 'Title', 'Category', 'Duration (Mins)', 'Logged At', 'Notes'],
      ...userSessions.map((f) => [
        f.id,
        f.title,
        f.category,
        f.durationMinutes,
        new Date(f.completedAt).toISOString().replace('T', ' ').substring(0, 16),
        f.notes || '',
      ]),
    ];

    // Update Tasks Tab
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Tasks!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: taskValues },
    });

    // Update Habits Tab
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Habits!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: habitValues },
    });

    // Update Focus Log Tab
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Focus Log!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: focusValues },
    });

    const totalRows = userTasks.length + userHabits.length + userSessions.length;

    const [log] = await db.insert(sheetSyncLogs)
      .values({
        userId,
        userUid,
        status: 'Success',
        rowsSynced: totalRows,
        message: `Synced ${userTasks.length} tasks, ${userHabits.length} habits, ${userSessions.length} focus logs.`,
      })
      .returning();

    return res.json({
      success: true,
      spreadsheetId,
      message: `Successfully synchronized ${totalRows} records with Google Sheets!`,
      log,
    });
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);

    await db.insert(sheetSyncLogs).values({
      userId,
      userUid,
      status: 'Failed',
      rowsSynced: 0,
      message: error?.message || 'Synchronization failed',
    });

    return res.status(500).json({
      error: error?.message || 'Google Sheets synchronization failed',
    });
  }
});

export default router;
