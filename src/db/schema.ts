import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique identifier
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  verificationToken: text('verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  googleId: text('google_id'),
  avatarUrl: text('avatar_url'),
  sheetsSpreadsheetId: text('sheets_spreadsheet_id'),
  sheetsAutoSync: boolean('sheets_auto_sync').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_uid_idx').on(table.uid),
]);

// 2. Daily Tracker table
export const dailyTracker = pgTable('daily_tracker', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  mood: text('mood'), // e.g. Happy, Neutral, Productive
  energyLevel: integer('energy_level'), // 1-10
  focusScore: integer('focus_score'), // 1-100
  productivityScore: integer('productivity_score'), // 1-100
  waterIntakeMl: integer('water_intake_ml').default(0).notNull(),
  sleepHours: real('sleep_hours'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('daily_tracker_user_date_idx').on(table.userId, table.date),
  index('daily_tracker_user_uid_idx').on(table.userUid),
]);

// 3. Habits table
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Health').notNull(),
  targetFrequency: text('target_frequency').default('Daily').notNull(),
  targetDaysPerWeek: integer('target_days_per_week').default(7).notNull(),
  color: text('color').default('#3b82f6').notNull(),
  icon: text('icon').default('zap').notNull(),
  streak: integer('streak').default(0).notNull(),
  bestStreak: integer('best_streak').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('habits_user_idx').on(table.userId),
]);

// 4. Goals table
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Personal').notNull(),
  timeframe: text('timeframe').default('Monthly').notNull(), // Yearly, Monthly, Weekly, Daily
  priority: text('priority').default('Medium').notNull(), // High, Medium, Low
  status: text('status').default('In Progress').notNull(), // In Progress, Completed, On Hold, Cancelled
  targetDate: text('target_date'), // YYYY-MM-DD
  progressPercent: integer('progress_percent').default(0).notNull(),
  subgoals: text('subgoals').default('[]').notNull(), // JSON string array of subgoals [{id, title, completed}]
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('goals_user_status_idx').on(table.userId, table.status),
]);

// 5. Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  startDate: text('start_date'), // YYYY-MM-DD
  deadline: text('deadline'), // YYYY-MM-DD
  dueDate: text('due_date'), // YYYY-MM-DD (legacy fallback)
  priority: text('priority').default('Medium').notNull(), // High, Medium, Low
  progress: integer('progress').default(0).notNull(), // Progress percentage (0-100)
  status: text('status').default('In Progress').notNull(), // Planning, In Progress, On Hold, Completed, Cancelled
  githubRepo: text('github_repo'),
  deploymentLink: text('deployment_link'),
  notes: text('notes'),
  tasks: text('tasks').default('[]').notNull(), // JSON string array of tasks [{id, title, completed}] for auto progress calculation
  color: text('color').default('#6366f1').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('projects_user_status_idx').on(table.userId, table.status),
]);

// 6. Study Sessions table
export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  subject: text('subject').notNull(),
  hoursStudied: real('hours_studied').default(0).notNull(),
  durationMinutes: integer('duration_minutes').default(0), // legacy fallback
  topic: text('topic'),
  difficulty: text('difficulty').default('Medium').notNull(), // Easy, Medium, Hard
  completed: boolean('completed').default(true).notNull(), // Completion status
  revisionDate: text('revision_date'), // YYYY-MM-DD
  studyDate: text('study_date').default('').notNull(), // YYYY-MM-DD
  technique: text('technique').default('Pomodoro'),
  effectivenessRating: integer('effectiveness_rating'),
  notes: text('notes'),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('study_sessions_user_date_idx').on(table.userId, table.studyDate),
]);

// 7. Health table
export const health = pgTable('health_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  weightKg: real('weight_kg'),
  waterMl: integer('water_ml').default(0).notNull(),
  sleepHours: real('sleep_hours').default(0),
  sleepQuality: text('sleep_quality'), // Poor, Fair, Good, Excellent
  workoutMinutes: integer('workout_minutes').default(0).notNull(),
  workoutType: text('workout_type'),
  stepsCount: integer('steps_count').default(0).notNull(),
  caloriesBurned: integer('calories_burned').default(0).notNull(),
  mood: text('mood').default('Neutral'), // Great, Good, Neutral, Tired, Stressed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('health_user_date_idx').on(table.userId, table.date),
]);

// 8. Journal table
export const journal = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  mood: text('mood'),
  tags: text('tags'),
  isPrivate: boolean('is_private').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('journal_user_date_idx').on(table.userId, table.date),
]);

// 9. Achievements table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  badgeIcon: text('badge_icon').default('trophy').notNull(),
  category: text('category').default('Milestone').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('achievements_user_idx').on(table.userId),
]);

// 10. Monthly Reviews table
export const monthlyReviews = pgTable('monthly_reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  monthYear: text('month_year').notNull(), // YYYY-MM
  highlights: text('highlights'),
  challenges: text('challenges'),
  goalsAchieved: text('goals_achieved'),
  rating: integer('rating'), // 1-10
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('monthly_reviews_user_month_idx').on(table.userId, table.monthYear),
]);

// 11. Weekly Reviews table
export const weeklyReviews = pgTable('weekly_reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  weekStartDate: text('week_start_date').notNull(), // YYYY-MM-DD
  wins: text('wins'),
  improvements: text('improvements'),
  productivityRating: integer('productivity_rating'), // 1-10
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('weekly_reviews_user_week_idx').on(table.userId, table.weekStartDate),
]);

// 12. Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info').notNull(), // info, warning, achievement, reminder
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('notifications_user_read_idx').on(table.userId, table.isRead),
]);

// 13. Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  userUid: text('user_uid').notNull().unique(),
  theme: text('theme').default('dark').notNull(),
  accentColor: text('accent_color').default('indigo').notNull(), // indigo, blue, emerald, violet, rose, amber
  dailyTargetFocusMins: integer('daily_target_focus_mins').default(120).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  emailDigest: text('email_digest').default('weekly').notNull(),
  sheetsAutoSync: boolean('sheets_auto_sync').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('settings_user_idx').on(table.userId),
]);

// 14. Reminder Schedules table
export const reminderSchedules = pgTable('reminder_schedules', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  category: text('category').notNull(), // 'Workout', 'Study', 'Water', 'Sleep', 'Goals', 'Projects'
  title: text('title').notNull(),
  time: text('time').default('09:00').notNull(), // HH:mm
  enabled: boolean('enabled').default(true).notNull(),
  browserNotify: boolean('browser_notify').default(true).notNull(),
  emailNotify: boolean('email_notify').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('reminder_schedules_user_idx').on(table.userId),
]);

// Tasks table (existing feature)
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Personal').notNull(),
  priority: text('priority').default('Medium').notNull(), // High, Medium, Low
  dueDate: text('due_date'), // YYYY-MM-DD
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  subtasks: text('subtasks').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tasks_user_status_idx').on(table.userId, table.isCompleted),
]);

// Habit Logs table (existing feature)
export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  completedDate: text('completed_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('habit_logs_habit_date_idx').on(table.habitId, table.completedDate),
]);

// Focus Sessions table (existing feature)
export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  title: text('title').default('Focus Session').notNull(),
  category: text('category').default('Work').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  notes: text('notes'),
}, (table) => [
  index('focus_sessions_user_date_idx').on(table.userId, table.completedAt),
]);

// Sheet Sync Logs table (existing feature)
export const sheetSyncLogs = pgTable('sheet_sync_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userUid: text('user_uid').notNull(),
  status: text('status').notNull(),
  rowsSynced: integer('rows_synced').default(0).notNull(),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('sheet_sync_logs_user_idx').on(table.userId),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  dailyTracker: many(dailyTracker),
  habits: many(habits),
  goals: many(goals),
  projects: many(projects),
  studySessions: many(studySessions),
  health: many(health),
  journal: many(journal),
  achievements: many(achievements),
  monthlyReviews: many(monthlyReviews),
  weeklyReviews: many(weeklyReviews),
  notifications: many(notifications),
  settings: one(settings),
  tasks: many(tasks),
  focusSessions: many(focusSessions),
  sheetSyncLogs: many(sheetSyncLogs),
}));

export const dailyTrackerRelations = relations(dailyTracker, ({ one }) => ({
  user: one(users, { fields: [dailyTracker.userId], references: [users.id] }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, { fields: [habits.userId], references: [users.id] }),
  logs: many(habitLogs),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, { fields: [studySessions.userId], references: [users.id] }),
}));

export const healthRelations = relations(health, ({ one }) => ({
  user: one(users, { fields: [health.userId], references: [users.id] }),
}));

export const journalRelations = relations(journal, ({ one }) => ({
  user: one(users, { fields: [journal.userId], references: [users.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const monthlyReviewsRelations = relations(monthlyReviews, ({ one }) => ({
  user: one(users, { fields: [monthlyReviews.userId], references: [users.id] }),
}));

export const weeklyReviewsRelations = relations(weeklyReviews, ({ one }) => ({
  user: one(users, { fields: [weeklyReviews.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, { fields: [focusSessions.userId], references: [users.id] }),
}));

export const sheetSyncLogsRelations = relations(sheetSyncLogs, ({ one }) => ({
  user: one(users, { fields: [sheetSyncLogs.userId], references: [users.id] }),
}));
