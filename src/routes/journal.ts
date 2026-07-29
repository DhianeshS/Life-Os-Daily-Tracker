import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { journal, weeklyReviews, monthlyReviews } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/journal - Fetch all journal entries, weekly reviews & monthly reviews
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;

    const [entries, weekly, monthly] = await Promise.all([
      db.select().from(journal).where(eq(journal.userUid, userUid)).orderBy(desc(journal.date)),
      db.select().from(weeklyReviews).where(eq(weeklyReviews.userUid, userUid)).orderBy(desc(weeklyReviews.weekStartDate)),
      db.select().from(monthlyReviews).where(eq(monthlyReviews.userUid, userUid)).orderBy(desc(monthlyReviews.monthYear)),
    ]);

    return res.json({ entries, weeklyReviews: weekly, monthlyReviews: monthly });
  } catch (error) {
    console.error('Fetch journal error:', error);
    return res.status(500).json({ error: 'Failed to fetch journal data' });
  }
});

// POST /api/journal/entries - Create a journal entry
router.post('/entries', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { title, content, date, mood, tags, isPrivate } = req.body;

    if (!title || !content || !date) {
      return res.status(400).json({ error: 'Title, content, and date are required' });
    }

    const [created] = await db.insert(journal).values({
      userId,
      userUid,
      title: title.trim(),
      content: content.trim(),
      date,
      mood: mood || 'neutral',
      tags: tags || '',
      isPrivate: isPrivate !== false,
    }).returning();

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create journal entry error:', error);
    return res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// PUT /api/journal/entries/:id - Update a journal entry
router.put('/entries/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userUid = req.user!.uid;
    const { title, content, date, mood, tags, isPrivate } = req.body;

    const [updated] = await db.update(journal)
      .set({
        title,
        content,
        date,
        mood,
        tags,
        isPrivate,
        updatedAt: new Date(),
      })
      .where(and(eq(journal.id, id), eq(journal.userUid, userUid)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Update journal entry error:', error);
    return res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// DELETE /api/journal/entries/:id - Delete a journal entry
router.delete('/entries/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userUid = req.user!.uid;

    const [deleted] = await db.delete(journal)
      .where(and(eq(journal.id, id), eq(journal.userUid, userUid)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    return res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// POST /api/journal/weekly - Create or update a weekly review
router.post('/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { weekStartDate, wins, improvements, productivityRating } = req.body;

    if (!weekStartDate) {
      return res.status(400).json({ error: 'weekStartDate is required' });
    }

    const existing = await db.select()
      .from(weeklyReviews)
      .where(and(eq(weeklyReviews.userUid, userUid), eq(weeklyReviews.weekStartDate, weekStartDate)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(weeklyReviews)
        .set({
          wins,
          improvements,
          productivityRating: Number(productivityRating) || 5,
          updatedAt: new Date(),
        })
        .where(eq(weeklyReviews.id, existing[0].id))
        .returning();
      return res.json(updated);
    } else {
      const [created] = await db.insert(weeklyReviews).values({
        userId,
        userUid,
        weekStartDate,
        wins: wins || '',
        improvements: improvements || '',
        productivityRating: Number(productivityRating) || 5,
      }).returning();
      return res.status(201).json(created);
    }
  } catch (error) {
    console.error('Save weekly review error:', error);
    return res.status(500).json({ error: 'Failed to save weekly review' });
  }
});

// POST /api/journal/monthly - Create or update a monthly review
router.post('/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userUid = req.user!.uid;
    const { monthYear, highlights, challenges, goalsAchieved, rating } = req.body;

    if (!monthYear) {
      return res.status(400).json({ error: 'monthYear is required' });
    }

    const existing = await db.select()
      .from(monthlyReviews)
      .where(and(eq(monthlyReviews.userUid, userUid), eq(monthlyReviews.monthYear, monthYear)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(monthlyReviews)
        .set({
          highlights,
          challenges,
          goalsAchieved,
          rating: Number(rating) || 5,
          updatedAt: new Date(),
        })
        .where(eq(monthlyReviews.id, existing[0].id))
        .returning();
      return res.json(updated);
    } else {
      const [created] = await db.insert(monthlyReviews).values({
        userId,
        userUid,
        monthYear,
        highlights: highlights || '',
        challenges: challenges || '',
        goalsAchieved: goalsAchieved || '',
        rating: Number(rating) || 5,
      }).returning();
      return res.status(201).json(created);
    }
  } catch (error) {
    console.error('Save monthly review error:', error);
    return res.status(500).json({ error: 'Failed to save monthly review' });
  }
});

export default router;
