import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Task, Habit, FocusSession, NavSection } from './types.ts';

import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';

import { DashboardOverview } from './components/dashboard/DashboardOverview.tsx';
import { TasksView } from './components/tasks/TasksView.tsx';
import { HabitsView } from './components/habits/HabitsView.tsx';
import { GoalsView } from './components/goals/GoalsView.tsx';
import { StudyTrackerView } from './components/study/StudyTrackerView.tsx';
import { ProjectsView } from './components/projects/ProjectsView.tsx';
import { HealthTrackerView } from './components/health/HealthTrackerView.tsx';
import { JournalView } from './components/journal/JournalView.tsx';
import { FocusView } from './components/focus/FocusView.tsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.tsx';
import { SheetsView } from './components/sheets/SheetsView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';

import { Sparkles, ShieldCheck, CheckCircle2, Flame, Clock, FileSpreadsheet } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, apiFetch } = useAuth();
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

  // Application State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [sheetsSpreadsheetId, setSheetsSpreadsheetId] = useState<string | null>(null);

  // UI state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch all user data
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [tasksData, habitsData, focusData, sheetsConfig] = await Promise.all([
        apiFetch('/api/tasks').catch(() => []),
        apiFetch('/api/habits').catch(() => []),
        apiFetch('/api/focus').catch(() => []),
        apiFetch('/api/sheets/config').catch(() => null),
      ]);

      setTasks(tasksData || []);
      setHabits(habitsData || []);
      setFocusSessions(focusData || []);
      if (sheetsConfig) {
        setSheetsSpreadsheetId(sheetsConfig.spreadsheetId);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [isAuthenticated, apiFetch]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Task Actions
  const handleCreateTask = async (data: Partial<Task>) => {
    const newTask = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = async (id: number, data: Partial<Task>) => {
    const updated = await apiFetch(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDeleteTask = async (id: number) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTask = async (id: number, isCompleted: boolean) => {
    await handleUpdateTask(id, { isCompleted });
  };

  // Habit Actions
  const handleCreateHabit = async (data: Partial<Habit>) => {
    const newHabit = await apiFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setHabits((prev) => [newHabit, ...prev]);
  };

  const handleUpdateHabit = async (id: number, data: Partial<Habit>) => {
    const updated = await apiFetch(`/api/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
  };

  const handleToggleHabitDate = async (habitId: number, dateStr: string) => {
    const res = await apiFetch(`/api/habits/${habitId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date: dateStr }),
    });

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            streak: res.streak,
            bestStreak: res.bestStreak,
            completedDates: res.completedDates,
          };
        }
        return h;
      })
    );
  };

  const handleDeleteHabit = async (habitId: number) => {
    await apiFetch(`/api/habits/${habitId}`, { method: 'DELETE' });
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Focus Actions
  const handleLogFocusSession = async (data: {
    title: string;
    category: string;
    durationMinutes: number;
    notes?: string;
  }) => {
    const newSession = await apiFetch('/api/focus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setFocusSessions((prev) => [newSession, ...prev]);
  };

  // Sheets Sync Action
  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    try {
      await apiFetch('/api/sheets/sync', { method: 'POST' });
      await loadUserData();
    } catch (err: any) {
      alert(err?.message || 'Google Sheets sync failed.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading LifeOS...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Welcome Canvas
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>Personal Productivity Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent leading-tight">
            Elevate Your Life & Productivity
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Manage tasks, build habit streaks, log focus pomodoros, and auto-sync your productivity dataset with Google Sheets.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setIsAuthModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all"
            >
              Get Started Free
            </button>
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all"
            >
              Sign In
            </button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 text-left">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <CheckCircle2 className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Task Management</h4>
              <p className="text-[11px] text-slate-500">Categories & subtasks</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <Flame className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Habit Streaks</h4>
              <p className="text-[11px] text-slate-500">Daily completion grid</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <Clock className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Focus Timer</h4>
              <p className="text-[11px] text-slate-500">Pomodoro focus logs</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-200">Google Sheets</h4>
              <p className="text-[11px] text-slate-500">Real-time sync</p>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </div>
    );
  }

  // Authenticated App Shell
  const pendingTaskCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingTaskCount={pendingTaskCount}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeSection={activeSection}
          onQuickAddTask={() => {
            setActiveSection('tasks');
            setIsTaskModalOpen(true);
          }}
          onSyncSheets={handleSyncSheets}
          isSyncingSheets={isSyncingSheets}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {activeSection === 'dashboard' && (
            <DashboardOverview
              tasks={tasks}
              habits={habits}
              focusSessions={focusSessions}
              onToggleTask={handleToggleTask}
              onToggleHabit={(id) => handleToggleHabitDate(id, new Date().toISOString().split('T')[0])}
              onNavigate={setActiveSection}
              onOpenTaskModal={() => setIsTaskModalOpen(true)}
              sheetsSpreadsheetId={sheetsSpreadsheetId}
            />
          )}

          {activeSection === 'tasks' && (
            <TasksView
              tasks={tasks}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              isModalOpen={isTaskModalOpen}
              onCloseModal={() => setIsTaskModalOpen(false)}
              onOpenModal={() => setIsTaskModalOpen(true)}
            />
          )}

          {activeSection === 'habits' && (
            <HabitsView
              habits={habits}
              onCreateHabit={handleCreateHabit}
              onUpdateHabit={handleUpdateHabit}
              onToggleHabitDate={handleToggleHabitDate}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeSection === 'goals' && <GoalsView />}

          {activeSection === 'study' && <StudyTrackerView />}

          {activeSection === 'projects' && <ProjectsView />}

          {activeSection === 'health' && <HealthTrackerView />}

          {activeSection === 'journal' && <JournalView />}

          {activeSection === 'focus' && (
            <FocusView
              sessions={focusSessions}
              onLogSession={handleLogFocusSession}
            />
          )}

          {activeSection === 'analytics' && <AnalyticsView />}

          {activeSection === 'sheets' && <SheetsView />}

          {activeSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
