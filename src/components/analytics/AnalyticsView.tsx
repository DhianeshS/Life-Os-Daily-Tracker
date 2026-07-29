import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  CheckCircle2,
  Flame,
  Target,
  BookOpen,
  FolderKanban,
  HeartPulse,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    taskCompletionRate: number;
    habitCompletionRate: number;
    goalCompletionRate: number;
    projectCompletionRate: number;
    avgProjectProgress: number;
    totalStudyHours: number;
    totalFocusMinutes: number;
    totalTasks: number;
    completedTasks: number;
    completedGoals: number;
    totalGoals: number;
    completedProjects: number;
    totalProjects: number;
  };
  studyBySubject: { subject: string; hours: number }[];
  dailyTrends: { date: string; tasks: number; focusMins: number; studyHours: number }[];
  monthlyTrends: { month: string; completedTasks: number; focusHours: number; studyHours: number }[];
  yearlyTrend: {
    year: number;
    totalTasksCompleted: number;
    totalFocusHours: number;
    totalStudyHours: number;
    completedGoals: number;
    completedProjects: number;
  };
  healthTrends: {
    date: string;
    weightKg: number;
    stepsCount: number;
    caloriesBurned: number;
    workoutMinutes: number;
    waterMl: number;
    sleepHours: number;
    mood: string;
  }[];
  heatmapData: Record<string, number>;
}

export const AnalyticsView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly' | 'heatmap'>('weekly');

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/analytics');
      if (res) setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Generating analytics from database...</p>
      </div>
    );
  }

  const { summary, studyBySubject, dailyTrends, monthlyTrends, yearlyTrend, healthTrends, heatmapData } = data;

  // Max values for scaling visual bar charts
  const maxDailyTasks = Math.max(...dailyTrends.map(d => d.tasks), 5);
  const maxDailyFocus = Math.max(...dailyTrends.map(d => d.focusMins), 120);
  const maxMonthlyTasks = Math.max(...monthlyTrends.map(m => m.completedTasks), 10);
  const totalSubjectHours = studyBySubject.reduce((acc, s) => acc + s.hours, 0) || 1;

  // Helper for generating GitHub-style Heatmap Calendar Cells
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    // Generate past 180 days
    for (let i = 179; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = heatmapData[dateStr] || 0;
      days.push({ date: dateStr, count });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-900 border-slate-800';
    if (count === 1) return 'bg-indigo-950 border-indigo-800/50';
    if (count === 2) return 'bg-indigo-800/80 border-indigo-700';
    if (count >= 3 && count <= 4) return 'bg-indigo-600 border-indigo-500';
    return 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Productivity & Health Analytics</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Comprehensive real-time analytics for weekly, monthly, and yearly productivity, habits, goals, study hours, and health trends.
          </p>
        </div>

        {/* View Period Selector */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'monthly'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'yearly'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity Heatmap
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Task Completion Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.taskCompletionRate}%</div>
          <p className="text-[11px] text-slate-400">{summary.completedTasks} of {summary.totalTasks} tasks completed</p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${summary.taskCompletionRate}%` }} />
          </div>
        </div>

        {/* Habit Completion Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Habit Consistency</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.habitCompletionRate}%</div>
          <p className="text-[11px] text-slate-400">Streak momentum & daily habits</p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${summary.habitCompletionRate}%` }} />
          </div>
        </div>

        {/* Goal Completion Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Goal Completion</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.goalCompletionRate}%</div>
          <p className="text-[11px] text-slate-400">{summary.completedGoals} of {summary.totalGoals} goals achieved</p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${summary.goalCompletionRate}%` }} />
          </div>
        </div>

        {/* Project Completion Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects Progress</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary.avgProjectProgress}%</div>
          <p className="text-[11px] text-slate-400">{summary.completedProjects} of {summary.totalProjects} projects done</p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${summary.avgProjectProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts Breakdown Section */}
      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: Daily Completed Tasks */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Weekly Completed Tasks (Bar Chart)</h3>
              </div>
              <span className="text-xs text-slate-400">Last 14 Days</span>
            </div>

            <div className="h-52 flex items-end gap-2 pt-6 border-b border-slate-800 pb-2">
              {dailyTrends.slice(16, 30).map((item, idx) => {
                const pct = Math.min(100, (item.tasks / maxDailyTasks) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[10px] text-white px-2 py-0.5 rounded pointer-events-none transition-all">
                      {item.tasks} tasks
                    </div>
                    <div className="w-full bg-slate-950 rounded-t h-full flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:brightness-125"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">{item.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line Chart: Daily Focus & Study Hours */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Focus & Study Minutes Trend (Line Chart)</h3>
              </div>
              <span className="text-xs text-slate-400">Daily Activity</span>
            </div>

            <div className="h-52 flex items-end gap-2 pt-6 border-b border-slate-800 pb-2">
              {dailyTrends.slice(16, 30).map((item, idx) => {
                const focusPct = Math.min(100, (item.focusMins / maxDailyFocus) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[10px] text-white px-2 py-0.5 rounded pointer-events-none">
                      {item.focusMins} mins
                    </div>
                    <div
                      className="w-2.5 bg-purple-500 rounded-t transition-all"
                      style={{ height: `${focusPct}%` }}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">{item.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Bar Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Monthly Tasks Completed (Bar Chart)</h3>
              </div>
              <span className="text-xs text-slate-400">Last 12 Months</span>
            </div>

            <div className="h-56 flex items-end gap-3 pt-6 border-b border-slate-800 pb-2">
              {monthlyTrends.map((m, idx) => {
                const pct = Math.min(100, (m.completedTasks / maxMonthlyTasks) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[10px] text-white px-2 py-0.5 rounded pointer-events-none">
                      {m.completedTasks} tasks
                    </div>
                    <div className="w-full bg-slate-950 rounded-t h-full flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono truncate w-full text-center">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Study & Focus Hours Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Monthly Study & Focus Hours</h3>
              </div>
              <span className="text-xs text-slate-400">Accumulated</span>
            </div>

            <div className="space-y-3">
              {monthlyTrends.slice(-6).map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-300">{m.month}</span>
                    <span className="text-amber-400 font-mono">{m.studyHours + m.focusHours} Hours Total</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((m.studyHours + m.focusHours) / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'yearly' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Year {yearlyTrend.year} Overall Executive Summary</h3>
              <p className="text-xs text-slate-400">Total milestones accumulated throughout the current year from the database.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-2xl font-black text-indigo-400">{yearlyTrend.totalTasksCompleted}</span>
              <p className="text-xs text-slate-400 font-medium">Tasks Completed</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-2xl font-black text-purple-400">{yearlyTrend.totalFocusHours}h</span>
              <p className="text-xs text-slate-400 font-medium">Focus Timer Hours</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-2xl font-black text-amber-400">{yearlyTrend.totalStudyHours}h</span>
              <p className="text-xs text-slate-400 font-medium">Study Hours Logged</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-2xl font-black text-emerald-400">{yearlyTrend.completedGoals}</span>
              <p className="text-xs text-slate-400 font-medium">Goals Achieved</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-1">
              <span className="text-2xl font-black text-blue-400">{yearlyTrend.completedProjects}</span>
              <p className="text-xs text-slate-400 font-medium">Projects Shipped</p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Tab: GitHub-style Calendar Activity Intensity */}
      {activeTab === 'heatmap' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Activity Intensity Heatmap (Past 180 Days)
              </h3>
              <p className="text-xs text-slate-400">Daily productivity matrix tracking tasks, study sessions, focus time, and health logs.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800" />
                <span className="w-3 h-3 rounded bg-indigo-950 border border-indigo-800/50" />
                <span className="w-3 h-3 rounded bg-indigo-800 border border-indigo-700" />
                <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-500" />
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] justify-start">
              {heatmapDays.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.date}: ${day.count} activities logged`}
                  className={`w-3.5 h-3.5 rounded-sm border transition-all hover:scale-125 cursor-pointer ${getHeatmapColor(day.count)}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Second Row: Pie Charts for Study Subjects & Health Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Study Hours by Subject */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Study Hours Distribution (Pie Breakdown)</h3>
            </div>
            <span className="text-xs text-slate-400">By Subject</span>
          </div>

          {studyBySubject.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No study sessions logged yet to generate subject pie breakdown.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {studyBySubject.map((item, idx) => {
                const pct = Math.round((item.hours / totalSubjectHours) * 100);
                const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-blue-500'];
                const color = colors[idx % colors.length];
                return (
                  <div key={item.subject} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-300 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        {item.subject}
                      </span>
                      <span className="text-slate-400 font-mono">{item.hours} hrs ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Health Trends Overview */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Health & Vitals Trends</h3>
            </div>
            <span className="text-xs text-slate-400">Recent Logs</span>
          </div>

          {healthTrends.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No health logs logged yet. Track vitals in the Health Tracker tab!</p>
          ) : (
            <div className="space-y-3">
              {healthTrends.slice(-5).map((h) => (
                <div key={h.date} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-white">{h.date}</span>
                  <div className="flex items-center gap-4">
                    <span>🔥 {h.caloriesBurned} kcal</span>
                    <span>👟 {h.stepsCount?.toLocaleString()} steps</span>
                    <span>💧 {h.waterMl} ml</span>
                    <span>😴 {h.sleepHours} hrs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
