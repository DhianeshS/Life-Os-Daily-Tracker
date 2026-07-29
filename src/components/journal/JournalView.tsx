import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { JournalEntry, WeeklyReview, MonthlyReview } from '../../types.ts';
import {
  BookOpen,
  Plus,
  Calendar,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  Award,
  Layers,
  Star,
  RefreshCw
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Daily Entry Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('Happy');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete Confirmation Dialog
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Weekly Review Form State
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [wins, setWins] = useState('');
  const [improvements, setImprovements] = useState('');
  const [productivityRating, setProductivityRating] = useState(8);
  const [isSavingWeekly, setIsSavingWeekly] = useState(false);

  // Monthly Review Form State
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [goalsAchieved, setGoalsAchieved] = useState('');
  const [rating, setRating] = useState(8);
  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch Journal Data
  const fetchJournalData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/journal');
      if (res) {
        setEntries(res.entries || []);
        setWeeklyReviews(res.weeklyReviews || []);
        setMonthlyReviews(res.monthlyReviews || []);
      }
    } catch (err) {
      console.error('Failed to load journal data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchJournalData();
  }, [fetchJournalData]);

  // Open Add/Edit Daily Entry Modal
  const handleOpenModal = (entry?: JournalEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setTitle(entry.title);
      setContent(entry.content);
      setDate(entry.date);
      setMood(entry.mood || 'Happy');
      setTags(entry.tags || '');
      setIsPrivate(entry.isPrivate);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setMood('Happy');
      setTags('');
      setIsPrivate(true);
    }
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Save Daily Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please enter a title and journal content');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payload = { title, content, date, mood, tags, isPrivate };

      if (editingId) {
        const updated = await apiFetch(`/api/journal/entries/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setEntries(prev => prev.map(item => item.id === editingId ? updated : item));
        showToast('Journal entry updated!');
      } else {
        const created = await apiFetch('/api/journal/entries', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setEntries(prev => [created, ...prev]);
        showToast('Journal entry created!');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete Entry
  const handleDeleteEntry = async () => {
    if (!deletingId) return;
    try {
      await apiFetch(`/api/journal/entries/${deletingId}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== deletingId));
      showToast('Journal entry deleted');
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Save Weekly Review
  const handleSaveWeeklyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingWeekly(true);
      const saved = await apiFetch('/api/journal/weekly', {
        method: 'POST',
        body: JSON.stringify({ weekStartDate, wins, improvements, productivityRating }),
      });
      setWeeklyReviews(prev => {
        const idx = prev.findIndex(w => w.weekStartDate === weekStartDate);
        if (idx >= 0) {
          const updatedArr = [...prev];
          updatedArr[idx] = saved;
          return updatedArr;
        }
        return [saved, ...prev];
      });
      showToast('Weekly review saved!');
      setWins('');
      setImprovements('');
    } catch (err: any) {
      alert('Failed to save weekly review: ' + err.message);
    } finally {
      setIsSavingWeekly(false);
    }
  };

  // Save Monthly Review
  const handleSaveMonthlyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingMonthly(true);
      const saved = await apiFetch('/api/journal/monthly', {
        method: 'POST',
        body: JSON.stringify({ monthYear, highlights, challenges, goalsAchieved, rating }),
      });
      setMonthlyReviews(prev => {
        const idx = prev.findIndex(m => m.monthYear === monthYear);
        if (idx >= 0) {
          const updatedArr = [...prev];
          updatedArr[idx] = saved;
          return updatedArr;
        }
        return [saved, ...prev];
      });
      showToast('Monthly review saved!');
      setHighlights('');
      setChallenges('');
      setGoalsAchieved('');
    } catch (err: any) {
      alert('Failed to save monthly review: ' + err.message);
    } finally {
      setIsSavingMonthly(false);
    }
  };

  const filteredEntries = entries.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.tags && e.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Personal Journal & Reflections</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Document daily thoughts, complete weekly wins/retrospectives, and record monthly milestone reviews.
          </p>
        </div>

        {/* Tab Selector & New Entry Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'daily' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Journal
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'weekly' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Reviews
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monthly' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Reviews
            </button>
          </div>

          {activeTab === 'daily' && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> New Entry
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Daily Journal */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search journal entries by title, content or tags..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-800/60 rounded w-full" />
                  <div className="h-3 bg-slate-800/60 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-purple-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-white">No Journal Entries Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm ? 'No entries match your search filters.' : 'Start capturing your daily reflections, creative ideas, or emotional check-ins.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create First Entry
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((e) => (
                <div key={e.id} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 flex flex-col justify-between transition-all group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {e.date}
                      </span>
                      <div className="flex items-center gap-2">
                        {e.mood && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-medium">
                            {e.mood === 'Happy' ? '😊 Happy' : e.mood === 'Focused' ? '🎯 Focused' : e.mood === 'Stressed' ? '😰 Stressed' : '😐 Neutral'}
                          </span>
                        )}
                        {e.isPrivate ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {e.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                      {e.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {e.tags?.split(',').map((tag, idx) => tag.trim() && (
                        <span key={idx} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-mono truncate">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenModal(e)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(e.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Weekly Review Form & List */}
      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Weekly Review Form */}
          <form onSubmit={handleSaveWeeklyReview} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Log Weekly Retrospective
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Week Starting Date</label>
                <input
                  type="date"
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Key Wins & Achievements</label>
                <textarea
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  rows={3}
                  placeholder="What went exceptionally well this week?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Areas for Improvement</label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  rows={3}
                  placeholder="What friction points or distractions need fixing next week?"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Productivity Rating</span>
                  <span className="font-bold text-purple-400">{productivityRating} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={productivityRating}
                  onChange={(e) => setProductivityRating(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingWeekly}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              {isSavingWeekly ? 'Saving...' : 'Save Weekly Review'}
            </button>
          </form>

          {/* Historical Weekly Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Historical Weekly Reviews
            </h3>

            {weeklyReviews.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No weekly reviews saved yet. Complete your first weekly retrospective above!
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyReviews.map((w) => (
                  <div key={w.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 font-mono">Week of {w.weekStartDate}</span>
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-xs font-bold">
                        ⭐ Rating: {w.productivityRating || 5}/10
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-emerald-400 font-bold">🏆 Wins & Accomplishments</span>
                        <p className="text-slate-300">{w.wins || 'None recorded'}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold">💡 Focus for Next Week</span>
                        <p className="text-slate-300">{w.improvements || 'None recorded'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Review Form & List */}
      {activeTab === 'monthly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Monthly Review Form */}
          <form onSubmit={handleSaveMonthlyReview} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Log Monthly Reflection
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Month & Year (YYYY-MM)</label>
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Monthly Highlights</label>
                <textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={2}
                  placeholder="Standout moments and milestones this month"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Challenges Faced</label>
                <textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  rows={2}
                  placeholder="Obstacles encountered and lessons learned"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Goals & Projects Completed</label>
                <textarea
                  value={goalsAchieved}
                  onChange={(e) => setGoalsAchieved(e.target.value)}
                  rows={2}
                  placeholder="List finished goals, projects or certifications"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Overall Month Rating</span>
                  <span className="font-bold text-purple-400">{rating} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingMonthly}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              {isSavingMonthly ? 'Saving...' : 'Save Monthly Review'}
            </button>
          </form>

          {/* Historical Monthly Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Monthly Archives
            </h3>

            {monthlyReviews.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No monthly reviews recorded yet. Log your first monthly reflection above!
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyReviews.map((m) => (
                  <div key={m.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 font-mono">Month {m.monthYear}</span>
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-xs font-bold">
                        ⭐ Rating: {m.rating || 5}/10
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-indigo-400 font-bold">✨ Highlights</span>
                        <p className="text-slate-300">{m.highlights || 'None'}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-rose-400 font-bold">⚡ Challenges</span>
                        <p className="text-slate-300">{m.challenges || 'None'}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-emerald-400 font-bold">🎯 Completed Goals</span>
                        <p className="text-slate-300">{m.goalsAchieved || 'None'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Daily Journal Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                {editingId ? 'Edit Journal Entry' : 'New Daily Journal Entry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Entry Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Breakthoughts on Project Architecture"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Happy">Happy 😊</option>
                    <option value="Focused">Focused 🎯</option>
                    <option value="Neutral">Neutral 😐</option>
                    <option value="Stressed">Stressed 😰</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300">Journal Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Write your thoughts, feelings, reflections or ideas..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ideas, architecture, productivity"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
                  />
                  <span>Keep Private</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30"
                  >
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Delete Journal Entry?</h3>
            <p className="text-xs text-slate-400">This entry will be permanently removed from your database.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEntry}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
