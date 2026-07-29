-- Initial PostgreSQL Database Migration for Productivity Tracker

-- 1. Users
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "google_id" TEXT,
    "avatar_url" TEXT,
    "sheets_spreadsheet_id" TEXT,
    "sheets_auto_sync" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2. Daily Tracker
CREATE TABLE "daily_tracker" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mood" TEXT,
    "energy_level" INTEGER,
    "focus_score" INTEGER,
    "productivity_score" INTEGER,
    "water_intake_ml" INTEGER NOT NULL DEFAULT 0,
    "sleep_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_tracker_pkey" PRIMARY KEY ("id")
);

-- 3. Habits
CREATE TABLE "habits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Health',
    "target_frequency" TEXT NOT NULL DEFAULT 'Daily',
    "target_days_per_week" INTEGER NOT NULL DEFAULT 7,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT NOT NULL DEFAULT 'zap',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- 4. Goals
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Personal',
    "status" TEXT NOT NULL DEFAULT 'In Progress',
    "target_date" TEXT,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- 5. Projects
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "due_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- 6. Study Sessions
CREATE TABLE "study_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "technique" TEXT NOT NULL DEFAULT 'Pomodoro',
    "effectiveness_rating" INTEGER,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- 7. Health Logs
CREATE TABLE "health_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "steps_count" INTEGER NOT NULL DEFAULT 0,
    "calories_burned" INTEGER NOT NULL DEFAULT 0,
    "sleep_quality" TEXT,
    "workout_minutes" INTEGER NOT NULL DEFAULT 0,
    "workout_type" TEXT,
    "weight_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_logs_pkey" PRIMARY KEY ("id")
);

-- 8. Journal Entries
CREATE TABLE "journal_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "mood" TEXT,
    "tags" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- 9. Achievements
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "badge_icon" TEXT NOT NULL DEFAULT 'trophy',
    "category" TEXT NOT NULL DEFAULT 'Milestone',
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- 10. Monthly Reviews
CREATE TABLE "monthly_reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "highlights" TEXT,
    "challenges" TEXT,
    "goals_achieved" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_reviews_pkey" PRIMARY KEY ("id")
);

-- 11. Weekly Reviews
CREATE TABLE "weekly_reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "week_start_date" TEXT NOT NULL,
    "wins" TEXT,
    "improvements" TEXT,
    "productivity_rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- 12. Notifications
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- 13. Settings
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "daily_target_focus_mins" INTEGER NOT NULL DEFAULT 120,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_digest" TEXT NOT NULL DEFAULT 'weekly',
    "sheets_auto_sync" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- Additional system tables
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Personal',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "due_date" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "subtasks" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "habit_logs" (
    "id" SERIAL NOT NULL,
    "habit_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "completed_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "focus_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Focus Session',
    "category" TEXT NOT NULL DEFAULT 'Work',
    "duration_minutes" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sheet_sync_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_uid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rowsSynced" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sheet_sync_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "users_uid_key" ON "users"("uid");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "settings_user_id_key" ON "settings"("user_id");
CREATE UNIQUE INDEX "settings_user_uid_key" ON "settings"("user_uid");

-- Performance Indexes
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_uid_idx" ON "users"("uid");
CREATE INDEX "daily_tracker_user_date_idx" ON "daily_tracker"("user_id", "date");
CREATE INDEX "daily_tracker_user_uid_idx" ON "daily_tracker"("user_uid");
CREATE INDEX "habits_user_idx" ON "habits"("user_id");
CREATE INDEX "goals_user_status_idx" ON "goals"("user_id", "status");
CREATE INDEX "projects_user_status_idx" ON "projects"("user_id", "status");
CREATE INDEX "study_sessions_user_date_idx" ON "study_sessions"("user_id", "completed_at");
CREATE INDEX "health_user_date_idx" ON "health_logs"("user_id", "date");
CREATE INDEX "journal_user_date_idx" ON "journal_entries"("user_id", "date");
CREATE INDEX "achievements_user_idx" ON "achievements"("user_id");
CREATE INDEX "monthly_reviews_user_month_idx" ON "monthly_reviews"("user_id", "month_year");
CREATE INDEX "weekly_reviews_user_week_idx" ON "weekly_reviews"("user_id", "week_start_date");
CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "settings_user_idx" ON "settings"("user_id");
CREATE INDEX "tasks_user_status_idx" ON "tasks"("user_id", "is_completed");
CREATE INDEX "habit_logs_habit_date_idx" ON "habit_logs"("habit_id", "completed_date");
CREATE INDEX "focus_sessions_user_date_idx" ON "focus_sessions"("user_id", "completed_at");
CREATE INDEX "sheet_sync_logs_user_idx" ON "sheet_sync_logs"("user_id");

-- Foreign key constraints
ALTER TABLE "daily_tracker" ADD CONSTRAINT "daily_tracker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "monthly_reviews" ADD CONSTRAINT "monthly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sheet_sync_logs" ADD CONSTRAINT "sheet_sync_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
