import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { tasks, habits, goals, projects, studySessions, health, focusSessions } from '../db/schema.ts';
import { eq, and, desc, gte } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(requireAuth);

// GET /api/analytics - Aggregate overall productivity and health metrics from database
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;

    // Fetch user data from DB
    const allTasks = await db.select().from(tasks).where(eq(tasks.userUid, userUid));
    const allHabits = await db.select().from(habits).where(eq(habits.userUid, userUid));
    const allGoals = await db.select().from(goals).where(eq(goals.userUid, userUid));
    const allProjects = await db.select().from(projects).where(eq(projects.userUid, userUid));
    const allStudy = await db.select().from(studySessions).where(eq(studySessions.userUid, userUid));
    const allHealth = await db.select().from(health).where(eq(health.userUid, userUid)).orderBy(desc(health.date));
    const allFocus = await db.select().from(focusSessions).where(eq(focusSessions.userUid, userUid));

    // 1. Task Completion Stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.isCompleted).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Habit Completion Stats
    const totalHabits = allHabits.length;
    const avgStreak = totalHabits > 0 ? Math.round(allHabits.reduce((acc, h) => acc + h.streak, 0) / totalHabits) : 0;
    const habitCompletionRate = totalHabits > 0 ? Math.min(100, Math.round((avgStreak / 7) * 100)) : 0;

    // 3. Goal Completion Stats
    const totalGoals = allGoals.length;
    const completedGoals = allGoals.filter(g => g.status === 'Completed').length;
    const inProgressGoals = allGoals.filter(g => g.status === 'In Progress').length;
    const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // 4. Project Completion Stats
    const totalProjects = allProjects.length;
    const completedProjects = allProjects.filter(p => p.status === 'Completed').length;
    const avgProjectProgress = totalProjects > 0 ? Math.round(allProjects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) : 0;
    const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // 5. Study Hours Breakdown
    const totalStudyHours = Number(allStudy.reduce((acc, s) => acc + (s.hoursStudied || 0), 0).toFixed(1));
    const studyBySubjectMap: Record<string, number> = {};
    allStudy.forEach(s => {
      studyBySubjectMap[s.subject] = (studyBySubjectMap[s.subject] || 0) + (s.hoursStudied || 0);
    });
    const studyBySubject = Object.entries(studyBySubjectMap).map(([subject, hours]) => ({
      subject,
      hours: Number(hours.toFixed(1))
    }));

    // 6. Focus Minutes
    const totalFocusMinutes = allFocus.reduce((acc, f) => acc + (f.durationMinutes || 0), 0);

    // 7. Productivity Trends (Weekly, Monthly, Yearly)
    // Group focus & completed tasks by date
    const last30DaysMap: Record<string, { date: string, tasks: number, focusMins: number, studyHours: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last30DaysMap[dateStr] = { date: dateStr, tasks: 0, focusMins: 0, studyHours: 0 };
    }

    allTasks.forEach(t => {
      if (t.isCompleted && t.completedAt) {
        const dateStr = new Date(t.completedAt).toISOString().split('T')[0];
        if (last30DaysMap[dateStr]) last30DaysMap[dateStr].tasks += 1;
      }
    });

    allFocus.forEach(f => {
      if (f.completedAt) {
        const dateStr = new Date(f.completedAt).toISOString().split('T')[0];
        if (last30DaysMap[dateStr]) last30DaysMap[dateStr].focusMins += (f.durationMinutes || 0);
      }
    });

    allStudy.forEach(s => {
      if (s.studyDate && last30DaysMap[s.studyDate]) {
        last30DaysMap[s.studyDate].studyHours += (s.hoursStudied || 0);
      }
    });

    const dailyTrends = Object.values(last30DaysMap);

    // Monthly Productivity (Last 12 months)
    const monthlyTrendsMap: Record<string, { month: string, completedTasks: number, focusHours: number, studyHours: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTrendsMap[monthKey] = { month: monthName, completedTasks: 0, focusHours: 0, studyHours: 0 };
    }

    allTasks.forEach(t => {
      if (t.isCompleted && t.completedAt) {
        const d = new Date(t.completedAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyTrendsMap[monthKey]) monthlyTrendsMap[monthKey].completedTasks += 1;
      }
    });

    allFocus.forEach(f => {
      if (f.completedAt) {
        const d = new Date(f.completedAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyTrendsMap[monthKey]) monthlyTrendsMap[monthKey].focusHours += Number(((f.durationMinutes || 0) / 60).toFixed(1));
      }
    });

    allStudy.forEach(s => {
      if (s.studyDate) {
        const monthKey = s.studyDate.slice(0, 7);
        if (monthlyTrendsMap[monthKey]) monthlyTrendsMap[monthKey].studyHours += Number((s.hoursStudied || 0).toFixed(1));
      }
    });

    const monthlyTrends = Object.values(monthlyTrendsMap);

    // Yearly Productivity summary
    const yearlyTrend = {
      year: now.getFullYear(),
      totalTasksCompleted: completedTasks,
      totalFocusHours: Number((totalFocusMinutes / 60).toFixed(1)),
      totalStudyHours,
      completedGoals,
      completedProjects
    };

    // 8. Health Trends
    const healthTrends = allHealth.slice(0, 14).map(h => ({
      date: h.date,
      weightKg: h.weightKg || 0,
      stepsCount: h.stepsCount || 0,
      caloriesBurned: h.caloriesBurned || 0,
      workoutMinutes: h.workoutMinutes || 0,
      waterMl: h.waterMl || 0,
      sleepHours: h.sleepHours || 0,
      mood: h.mood || 'Neutral',
    })).reverse();

    // 9. Activity Heatmap Data (Count of activities per YYYY-MM-DD for current year)
    const heatmapData: Record<string, number> = {};
    allTasks.forEach(t => {
      if (t.completedAt) {
        const dateStr = new Date(t.completedAt).toISOString().split('T')[0];
        heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
      }
    });
    allStudy.forEach(s => {
      if (s.studyDate) {
        heatmapData[s.studyDate] = (heatmapData[s.studyDate] || 0) + 1;
      }
    });
    allFocus.forEach(f => {
      if (f.completedAt) {
        const dateStr = new Date(f.completedAt).toISOString().split('T')[0];
        heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
      }
    });
    allHealth.forEach(h => {
      if (h.date) {
        heatmapData[h.date] = (heatmapData[h.date] || 0) + 1;
      }
    });

    return res.json({
      summary: {
        taskCompletionRate,
        habitCompletionRate,
        goalCompletionRate,
        projectCompletionRate,
        avgProjectProgress,
        totalStudyHours,
        totalFocusMinutes,
        totalTasks,
        completedTasks,
        completedGoals,
        totalGoals,
        completedProjects,
        totalProjects,
      },
      studyBySubject,
      dailyTrends,
      monthlyTrends,
      yearlyTrend,
      healthTrends,
      heatmapData
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

export default router;
