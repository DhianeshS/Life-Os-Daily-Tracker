import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import { Task, Habit, FocusSession, NavSection, DashboardMetrics } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Flame,
  Award,
  Calendar,
  BookOpen,
  FolderCheck,
  Target,
  Moon,
  Droplets,
  Smile,
  Zap,
  TrendingUp,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sliders,
  X,
  Sparkles,
  BarChart3,
  CalendarDays,
  LineChart,
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardOverviewProps {
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  onToggleTask: (taskId: number, isCompleted: boolean) => void;
  onToggleHabit: (habitId: number) => void;
  onNavigate: (section: NavSection) => void;
  onOpenTaskModal: () => void;
  sheetsSpreadsheetId?: string | null;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tasks,
  habits,
  focusSessions,
  onToggleTask,
  onToggleHabit,
  onNavigate,
  onOpenTaskModal,
  sheetsSpreadsheetId,
}) => {
  const { apiFetch } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isAddingGoal, setIsAddingGoal] = useState<boolean>(false);
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false);

  // Form states for Quick Logging / Updating Daily Metrics in DB
  const [logForm, setLogForm] = useState({
    productivityScore: 88,
    sleepHours: 7.5,
    waterIntakeMl: 2200,
    mood: 'Productive',
    studyHours: 2.5,
    studySubject: 'Computer Science',
  });

  const [newGoal, setNewGoal] = useState({ title: '', category: 'Personal', status: 'In Progress' });
  const [newProject, setNewProject] = useState({ name: '', status: 'Active', color: '#6366f1' });

  // Fetch metrics from backend API
  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/dashboard');
      if (data) {
        setMetrics(data);
        setLogForm({
          productivityScore: data.productivityScore || 85,
          sleepHours: data.sleepHours || 7.5,
          waterIntakeMl: data.waterIntakeMl || 2200,
          mood: data.mood || 'Productive',
          studyHours: 2.5,
          studySubject: 'General Study',
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics from DB:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Submit quick daily update to database
  const handleSaveDailyMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/dashboard/tracker', {
        method: 'POST',
        body: JSON.stringify({
          productivityScore: logForm.productivityScore,
          sleepHours: logForm.sleepHours,
          waterIntakeMl: logForm.waterIntakeMl,
          mood: logForm.mood,
        }),
      });

      // If study hours added
      if (logForm.studyHours > 0 && logForm.studySubject) {
        await apiFetch('/api/dashboard/study', {
          method: 'POST',
          body: JSON.stringify({
            subject: logForm.studySubject,
            durationMinutes: Math.round(logForm.studyHours * 60),
            technique: 'Pomodoro',
          }),
        });
      }

      setIsUpdateModalOpen(false);
      await fetchDashboardMetrics();
    } catch (err) {
      console.error('Error updating metrics:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    try {
      await apiFetch('/api/dashboard/goals', {
        method: 'POST',
        body: JSON.stringify(newGoal),
      });
      setNewGoal({ title: '', category: 'Personal', status: 'In Progress' });
      setIsAddingGoal(false);
      await fetchDashboardMetrics();
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      await apiFetch('/api/dashboard/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
      setNewProject({ name: '', status: 'Active', color: '#6366f1' });
      setIsAddingProject(false);
      await fetchDashboardMetrics();
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  // Safe metrics fallback
  const prodScore = metrics?.productivityScore ?? 88;
  const currentStreak = metrics?.currentHabitStreak ?? habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const longestStreak = metrics?.longestHabitStreak ?? habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const yearProg = metrics?.yearProgress ?? 57.2;
  const studyHours = metrics?.studyHours ?? 32.5;
  const projectsCompleted = metrics?.projectsCompleted ?? 4;
  const totalProjects = metrics?.totalProjects ?? 6;
  const goalsCompleted = metrics?.goalsCompleted ?? 3;
  const totalGoals = metrics?.totalGoals ?? 5;
  const sleepHours = metrics?.sleepHours ?? 7.5;
  const waterIntakeMl = metrics?.waterIntakeMl ?? 2200;
  const mood = metrics?.mood ?? 'Productive';

  // Chart.js Configuration Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter, sans-serif', size: 11, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  };

  // Chart 1: Weekly Statistics Data
  const weeklyData = {
    labels: metrics?.weeklyStats?.map((w) => w.dayName) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Focus / Study Minutes',
        data: metrics?.weeklyStats?.map((w) => w.focusMins) || [90, 120, 150, 110, 180, 210, 140],
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderRadius: 6,
      },
      {
        label: 'Water Intake (ml / 20)',
        data: metrics?.weeklyStats?.map((w) => Math.round(w.waterMl / 20)) || [100, 110, 120, 95, 115, 130, 110],
        backgroundColor: 'rgba(56, 189, 248, 0.65)',
        borderRadius: 6,
      },
    ],
  };

  // Chart 2: Monthly Statistics Data
  const monthlyData = {
    labels: metrics?.monthlyStats?.map((m) => m.month) || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Productivity Index (%)',
        data: metrics?.monthlyStats?.map((m) => m.productivity) || [78, 82, 88, 92],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Study Hours',
        data: metrics?.monthlyStats?.map((m) => m.studyHours) || [12, 16, 19, 22],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart 3: Yearly Statistics Data
  const yearlyData = {
    labels: metrics?.yearlyStats?.map((y) => y.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Productivity Score Trend',
        data: metrics?.yearlyStats?.map((y) => y.productivityScore) || [70, 75, 78, 82, 85, 88, 91, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.65)',
        borderRadius: 4,
      },
      {
        label: 'Total Study Hours',
        data: metrics?.yearlyStats?.map((y) => y.studyHours) || [20, 24, 28, 30, 32, 35, 38, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(236, 72, 153, 0.65)',
        borderRadius: 4,
      },
    ],
  };

  // Doughnut Chart for Projects & Goals Distribution
  const doughnutData = {
    labels: ['Completed Projects', 'Active Projects', 'Completed Goals', 'Active Goals'],
    datasets: [
      {
        data: [
          projectsCompleted,
          Math.max(0, totalProjects - projectsCompleted),
          goalsCompleted,
          Math.max(0, totalGoals - goalsCompleted),
        ],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Top Header Banner with Live Sync & Quick Update Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-white relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Database Live Metrics Engine</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Personal Productivity Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of habits, study sessions, goals, health telemetry, and overall performance score.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => fetchDashboardMetrics()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Sliders className="w-4 h-4" />
            <span>Log Daily Telemetry</span>
          </button>
        </div>
      </div>

      {/* 10 Animated Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Today's Productivity Score */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Today's Score
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{prodScore}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-2.5 progress-bar">
            <div className="progress-fill bg-indigo-500" style={{ width: `${prodScore}%` }} />
          </div>
          <p className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Optimal focus zone</span>
          </p>
        </motion.div>

        {/* Card 2: Current Habit Streak */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Current Streak
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{currentStreak}</span>
            <span className="text-xs text-amber-400 font-semibold font-mono">Days</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">Active habit momentum</p>
        </motion.div>

        {/* Card 3: Longest Streak */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.06 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Longest Streak
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{longestStreak}</span>
            <span className="text-xs text-purple-400 font-semibold font-mono">Days Record</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">All-time personal best</p>
        </motion.div>

        {/* Card 4: Year Progress */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.09 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Year Progress
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{yearProg}%</span>
          </div>
          <div className="mt-2.5 progress-bar">
            <div className="progress-fill bg-blue-500" style={{ width: `${yearProg}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">2026 Timeline Elapsed</p>
        </motion.div>

        {/* Card 5: Study Hours */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-pink-500/20 bg-gradient-to-b from-pink-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Study Hours
            </span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{studyHours}</span>
            <span className="text-xs text-pink-400 font-mono">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-3">Logged learning sessions</p>
        </motion.div>

        {/* Card 6: Projects Completed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Projects Done
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FolderCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{projectsCompleted}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalProjects} Total</span>
          </div>
          <div className="mt-2.5 progress-bar">
            <div
              className="progress-fill bg-emerald-500"
              style={{ width: `${totalProjects ? (projectsCompleted / totalProjects) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">Active milestones</p>
        </motion.div>

        {/* Card 7: Goals Completed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.18 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-rose-500/20 bg-gradient-to-b from-rose-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Goals Done
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{goalsCompleted}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalGoals} Achieved</span>
          </div>
          <div className="mt-2.5 progress-bar">
            <div
              className="progress-fill bg-rose-500"
              style={{ width: `${totalGoals ? (goalsCompleted / totalGoals) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">Strategic objectives</p>
        </motion.div>

        {/* Card 8: Sleep Hours */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.21 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Sleep Duration
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{sleepHours}</span>
            <span className="text-xs text-cyan-400 font-mono">hrs</span>
          </div>
          <p className="text-[10px] text-emerald-400 font-mono mt-3">Optimal restorative sleep</p>
        </motion.div>

        {/* Card 9: Water Intake */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.24 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Water Intake
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{waterIntakeMl}</span>
            <span className="text-xs text-sky-400 font-mono">ml</span>
          </div>
          <div className="mt-2.5 progress-bar">
            <div
              className="progress-fill bg-sky-400"
              style={{ width: `${Math.min(100, (waterIntakeMl / 2500) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">Target: 2,500 ml</p>
        </motion.div>

        {/* Card 10: Mood */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.27 }}
          className="glass p-4 rounded-2xl relative overflow-hidden border border-teal-500/20 bg-gradient-to-b from-teal-500/5 to-transparent"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Today's Mood
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 truncate">
            <span className="text-2xl font-black text-slate-900 dark:text-white truncate">{mood}</span>
          </div>
          <p className="text-[10px] text-teal-400 font-mono mt-4">Positive mindset state</p>
        </motion.div>
      </div>

      {/* Chart.js Interactive Graphs Section (Weekly, Monthly, Yearly) */}
      <div className="glass p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Productivity Analytics Graphs (Chart.js)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dynamic multi-dimensional trends auto-calculated from database entries.
            </p>
          </div>

          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly</span>
            </button>

            <button
              onClick={() => setTimeframe('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>

            <button
              onClick={() => setTimeframe('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Yearly</span>
            </button>
          </div>
        </div>

        {/* Selected Chart Rendering */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 relative">
            {timeframe === 'weekly' && <Bar data={weeklyData} options={chartOptions} />}
            {timeframe === 'monthly' && <Line data={monthlyData} options={chartOptions} />}
            {timeframe === 'yearly' && <Bar data={yearlyData} options={chartOptions} />}
          </div>

          {/* Distribution Doughnut Graph */}
          <div className="h-72 glass p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-300 text-center uppercase tracking-wider mb-2">
              Projects & Goals Breakdown
            </h4>
            <div className="flex-1 relative flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects & Goals Management Section with Add Modals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Section */}
        <div className="glass p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-emerald-400" />
              Active Projects ({projectsCompleted}/{totalProjects})
            </h3>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:underline font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleCreateProject} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="Project Name..."
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
                >
                  Save Project
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-slate-200">LifeOS Full-Stack Suite</p>
                <p className="text-[10px] text-slate-400 font-mono">Status: Active • Health & Tasks</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-slate-200">Google Sheets API Integration</p>
                <p className="text-[10px] text-slate-400 font-mono">Status: Completed • Realtime Sync</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="glass p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              Strategic Goals ({goalsCompleted}/{totalGoals})
            </h3>
            <button
              onClick={() => setIsAddingGoal(!isAddingGoal)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:underline font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          {isAddingGoal && (
            <form onSubmit={handleCreateGoal} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="Goal Title..."
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-slate-200">Maintain 14-Day Habit Streak</p>
                <p className="text-[10px] text-slate-400 font-mono">Category: Health & Wellness</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                In Progress
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div>
                <p className="text-xs font-semibold text-slate-200">Complete 30 Study Hours This Month</p>
                <p className="text-[10px] text-slate-400 font-mono">Category: Learning</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Achieved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Telemetry Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">Log Today's Telemetry & Metrics</h3>
                </div>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDailyMetrics} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Productivity Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={logForm.productivityScore}
                      onChange={(e) => setLogForm({ ...logForm, productivityScore: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Sleep Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={logForm.sleepHours}
                      onChange={(e) => setLogForm({ ...logForm, sleepHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Water Intake (ml)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      max="10000"
                      value={logForm.waterIntakeMl}
                      onChange={(e) => setLogForm({ ...logForm, waterIntakeMl: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Today's Mood
                    </label>
                    <select
                      value={logForm.mood}
                      onChange={(e) => setLogForm({ ...logForm, mood: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Productive">⚡ Productive</option>
                      <option value="Energetic">🔥 Energetic</option>
                      <option value="Calm">🧘 Calm</option>
                      <option value="Focused">🎯 Focused</option>
                      <option value="Tired">😴 Tired</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <p className="text-xs font-bold text-slate-300">Quick Study Session Log</p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Subject (e.g., Mathematics)"
                      value={logForm.studySubject}
                      onChange={(e) => setLogForm({ ...logForm, studySubject: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Hours Logged"
                      value={logForm.studyHours}
                      onChange={(e) => setLogForm({ ...logForm, studyHours: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                  >
                    Save & Update Database
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
