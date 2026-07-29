export interface User {
  id: number;
  uid: string;
  email: string;
  name?: string | null;
  isEmailVerified: boolean;
  sheetsSpreadsheetId?: string | null;
  sheetsAutoSync?: boolean;
  createdAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  description?: string;
  category: 'Work' | 'Personal' | 'Health' | 'Learning' | 'Finance' | string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  subtasks: string; // JSON string of Subtask[]
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  description?: string;
  category: string;
  targetFrequency: string;
  targetDaysPerWeek?: number;
  color: string;
  icon: string;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ['YYYY-MM-DD', ...]
  yearlyCompletionPercentage?: number;
  totalCompletedDays?: number;
  createdAt: string;
}

export interface FocusSession {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  category: string;
  durationMinutes: number;
  completedAt: string;
  notes?: string;
}

export interface SheetSyncLog {
  id: number;
  userId: number;
  userUid: string;
  status: 'Success' | 'Failed';
  rowsSynced: number;
  message?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  productivityScore: number;
  currentHabitStreak: number;
  longestHabitStreak: number;
  yearProgress: number;
  studyHours: number;
  projectsCompleted: number;
  totalProjects: number;
  goalsCompleted: number;
  totalGoals: number;
  sleepHours: number;
  waterIntakeMl: number;
  mood: string;
  weeklyStats: {
    dateStr: string;
    dayName: string;
    focusMins: number;
    tasksCompleted: number;
    waterMl: number;
  }[];
  monthlyStats: {
    month: string;
    productivity: number;
    studyHours: number;
    habitsCompleted: number;
  }[];
  yearlyStats: {
    month: string;
    productivityScore: number;
    studyHours: number;
    goalsAchieved: number;
  }[];
  habitsCount: number;
}

export interface StudySession {
  id: number;
  userId: number;
  userUid: string;
  subject: string;
  hoursStudied: number;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  completed: boolean;
  revisionDate?: string;
  studyDate: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectItem {
  id: number;
  userId: number;
  userUid: string;
  name: string;
  description?: string;
  startDate?: string;
  deadline?: string;
  dueDate?: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  progress: number;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | string;
  githubRepo?: string;
  deploymentLink?: string;
  notes?: string;
  tasks: string; // JSON string of ProjectTask[]
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthLog {
  id: number;
  userId: number;
  userUid: string;
  date: string; // YYYY-MM-DD
  weightKg?: number | null;
  waterMl: number;
  sleepHours: number;
  sleepQuality?: string | null;
  workoutMinutes: number;
  workoutType?: string | null;
  stepsCount: number;
  caloriesBurned: number;
  mood?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderSchedule {
  id: number;
  userId: number;
  userUid: string;
  category: 'Workout' | 'Study' | 'Water' | 'Sleep' | 'Goals' | 'Projects' | string;
  title: string;
  time: string; // HH:mm
  enabled: boolean;
  browserNotify: boolean;
  emailNotify: boolean;
}

export interface UserSettings {
  id: number;
  userId: number;
  userUid: string;
  theme: 'dark' | 'light';
  accentColor: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  dailyTargetFocusMins: number;
}

export interface JournalEntry {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  content: string;
  date: string;
  mood?: string | null;
  tags?: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: number;
  userId: number;
  userUid: string;
  weekStartDate: string;
  wins?: string | null;
  improvements?: string | null;
  productivityRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReview {
  id: number;
  userId: number;
  userUid: string;
  monthYear: string;
  highlights?: string | null;
  challenges?: string | null;
  goalsAchieved?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type NavSection =
  | 'dashboard'
  | 'tasks'
  | 'habits'
  | 'goals'
  | 'study'
  | 'projects'
  | 'health'
  | 'journal'
  | 'focus'
  | 'analytics'
  | 'sheets'
  | 'settings';
