import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRouter from './src/routes/auth.ts';
import tasksRouter from './src/routes/tasks.ts';
import habitsRouter from './src/routes/habits.ts';
import focusRouter from './src/routes/focus.ts';
import sheetsRouter from './src/routes/sheets.ts';
import dashboardRouter from './src/routes/dashboard.ts';
import goalsRouter from './src/routes/goals.ts';
import studyRouter from './src/routes/study.ts';
import projectsRouter from './src/routes/projects.ts';
import healthRouter from './src/routes/health.ts';
import journalRouter from './src/routes/journal.ts';
import analyticsRouter from './src/routes/analytics.ts';
import notificationsRouter from './src/routes/notifications.ts';
import settingsRouter from './src/routes/settings.ts';
import { securityHeaders, apiRateLimiter } from './src/middleware/security.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(securityHeaders);
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use('/api', apiRateLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'LifeOS Personal Productivity Tracker API', timestamp: new Date() });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/habits', habitsRouter);
  app.use('/api/focus', focusRouter);
  app.use('/api/sheets', sheetsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/goals', goalsRouter);
  app.use('/api/study', studyRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/health-tracker', healthRouter);
  app.use('/api/journal', journalRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/settings', settingsRouter);

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeOS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
