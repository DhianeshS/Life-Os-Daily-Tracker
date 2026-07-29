import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudySession } from '../../types.ts';
import {
  BookOpen,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  X,
  Trash2,
  Edit3,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Award,
} from 'lucide-react';

interface StudyAnalytics {
  dailyChart: { date: string; label: string; hours: number }[];
  monthlyChart: { month: string; hours: number }[];
  yearlyChart: { year: string; hours: number }[];
}

export const StudyTrackerView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics>({
    dailyChart: [],
    monthlyChart: [],
    yearlyChart: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');

  // Form states
  const [subject, setSubject] = useState('');
  const [hoursStudied, setHoursStudied] = useState<string>('1.5');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [completed, setCompleted] = useState<boolean>(true);
  const [revisionDate, setRevisionDate] = useState('');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudyData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/study');
      if (res && res.sessions) {
        setSessions(res.sessions);
      }
      if (res && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch study data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchStudyData();
  }, [fetchStudyData]);

  const handleOpenCreateModal = () => {
    setEditingSession(null);
    setSubject('');
    setHoursStudied('1.5');
    setTopic('');
    setDifficulty('Medium');
    setCompleted(true);
    setRevisionDate('');
    setStudyDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: StudySession) => {
    setEditingSession(session);
    setSubject(session.subject);
    setHoursStudied(String(session.hoursStudied || 0));
    setTopic(session.topic || '');
    setDifficulty((session.difficulty as any) || 'Medium');
    setCompleted(session.completed ?? true);
    setRevisionDate(session.revisionDate || '');
    setStudyDate(session.studyDate || new Date().toISOString().split('T')[0]);
    setNotes(session.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        subject: subject.trim(),
        hoursStudied: parseFloat(hoursStudied) || 0,
        topic: topic.trim(),
        difficulty,
        completed,
        revisionDate,
        studyDate,
        notes: notes.trim(),
      };

      if (editingSession) {
        await apiFetch(`/api/study/${editingSession.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/study', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchStudyData();
    } catch (err) {
      console.error('Failed to save study session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await apiFetch(`/api/study/${id}`, {
        method: 'DELETE',
      });
      await fetchStudyData();
    } catch (err) {
      console.error('Failed to delete study session:', err);
    }
  };

  // Helper calculation for weekly chart from daily
  const getWeeklyChartData = () => {
    // Group daily data into 7-day chunks
    const daily = analytics.dailyChart || [];
    const w1 = daily.slice(0, 7).reduce((acc, d) => acc + d.hours, 0);
    const w2 = daily.slice(7, 14).reduce((acc, d) => acc + d.hours, 0);

    return [
      { week: 'Last Week', hours: Math.round(w1 * 10) / 10 },
      { week: 'This Week', hours: Math.round(w2 * 10) / 10 },
    ];
  };

  // Filter sessions
  const subjectsList = Array.from(new Set(sessions.map((s) => s.subject))).filter(Boolean);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubjectFilter === 'All' || s.subject === selectedSubjectFilter;

    return matchesSearch && matchesSubject;
  });

  // Calculate totals
  const totalHours = sessions.reduce((acc, s) => acc + (Number(s.hoursStudied) || 0), 0);
  const completedSessionsCount = sessions.filter((s) => s.completed).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>PostgreSQL Study & Revision Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white">Study Tracker & Analytics</h2>
          <p className="text-xs text-slate-400">
            Log subject topics, study duration, difficulty ratings, and scheduled revision dates.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Study Session</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Hours Studied</p>
            <p className="text-2xl font-black text-white font-mono">{Math.round(totalHours * 10) / 10} hrs</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Completed Sessions</p>
            <p className="text-2xl font-black text-white font-mono">{completedSessionsCount}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Active Subjects</p>
            <p className="text-2xl font-black text-white font-mono">{subjectsList.length}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Upcoming Revisions</p>
            <p className="text-2xl font-black text-white font-mono">
              {sessions.filter((s) => s.revisionDate && s.revisionDate >= new Date().toISOString().split('T')[0]).length}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Period Graphs Section (Daily, Weekly, Monthly, Yearly) */}
      <div className="glass p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Study Hours Graph Analytics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualize study effort across Daily, Weekly, Monthly, and Yearly periods.
            </p>
          </div>

          {/* Period selector tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setActiveChartTab(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeChartTab === period
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Visualizer Area */}
        <div className="pt-2">
          {activeChartTab === 'daily' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-2">
                <span>Daily Hours (Past 14 Days)</span>
                <span>Max: {Math.max(...(analytics.dailyChart.map((d) => d.hours) || [1]), 4)} hrs/day</span>
              </div>
              <div className="grid grid-cols-14 gap-2 items-end h-40 pt-6 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {(analytics.dailyChart || []).map((d) => {
                  const maxH = Math.max(...(analytics.dailyChart.map((item) => item.hours) || [1]), 4);
                  const barHeight = Math.max((d.hours / maxH) * 100, 6);
                  return (
                    <div key={d.date} className="flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.hours}h
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-blue-500 group-hover:from-indigo-400 group-hover:to-blue-400 transition-all shadow-md shadow-indigo-500/20"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'weekly' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-2">
                <span>Weekly Hours Comparison</span>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end h-40 pt-6 px-6 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {getWeeklyChartData().map((w) => {
                  const maxH = Math.max(w.hours, 10);
                  return (
                    <div key={w.week} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-xs font-mono font-bold text-indigo-400">{w.hours} hrs</span>
                      <div
                        className="w-24 rounded-t-xl bg-gradient-to-t from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20"
                        style={{ height: `${Math.max((w.hours / maxH) * 80, 10)}%` }}
                      />
                      <span className="text-xs font-bold text-slate-300">{w.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'monthly' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-2">
                <span>Monthly Hours (Current Year)</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end h-40 pt-6 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {(analytics.monthlyChart || []).map((m) => {
                  const maxH = Math.max(...(analytics.monthlyChart.map((item) => item.hours) || [1]), 10);
                  const barHeight = Math.max((m.hours / maxH) * 100, 6);
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.hours}h
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-400 transition-all shadow-md"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[10px] font-mono text-slate-400">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'yearly' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-2">
                <span>Yearly Hours Comparison</span>
              </div>
              <div className="grid grid-cols-5 gap-4 items-end h-40 pt-6 px-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {(analytics.yearlyChart || []).map((y) => {
                  const maxH = Math.max(...(analytics.yearlyChart.map((item) => item.hours) || [1]), 20);
                  const barHeight = Math.max((y.hours / maxH) * 100, 8);
                  return (
                    <div key={y.year} className="flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[11px] font-mono font-bold text-amber-400">{y.hours}h</div>
                      <div
                        className="w-12 rounded-t-xl bg-gradient-to-t from-amber-600 to-orange-500 shadow-md shadow-amber-500/20"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-xs font-bold text-slate-300">{y.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search subjects, topics, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">Subject:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Subjects ({sessions.length})</option>
            {subjectsList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading study sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-200">No study sessions logged</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Log Study Session" above to add your subject, duration, and revision date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const diffBadges = {
              Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            };

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                        {session.subject}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">
                        {session.topic || 'General Topic Study'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(session)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {session.notes && <p className="text-xs text-slate-400 line-clamp-2">{session.notes}</p>}

                  {/* Badges & Metrics */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {session.hoursStudied} hrs
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                        diffBadges[session.difficulty as keyof typeof diffBadges] || diffBadges.Medium
                      }`}
                    >
                      {session.difficulty}
                    </span>

                    {session.completed ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[11px]">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Dates */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 font-mono">
                  <span>Studied: {session.studyDate}</span>
                  {session.revisionDate && (
                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                      <RefreshCw className="w-3 h-3" /> Rev: {session.revisionDate}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">
                    {editingSession ? 'Edit Study Session' : 'Log New Study Session'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science, Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Hours Studied *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      required
                      placeholder="e.g. 2.5"
                      value={hoursStudied}
                      onChange={(e) => setHoursStudied(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Topic / Concept
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Backpropagation & Neural Networks"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={completed ? 'Completed' : 'In Progress'}
                      onChange={(e) => setCompleted(e.target.value === 'Completed')}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Study Date
                    </label>
                    <input
                      type="date"
                      required
                      value={studyDate}
                      onChange={(e) => setStudyDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Revision Date (Reminders)
                    </label>
                    <input
                      type="date"
                      value={revisionDate}
                      onChange={(e) => setRevisionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Notes / Key Takeaways
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key formulas, formulas to memorize, or study summary..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                  >
                    {isSubmitting ? 'Saving...' : editingSession ? 'Update Session' : 'Save Session'}
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
