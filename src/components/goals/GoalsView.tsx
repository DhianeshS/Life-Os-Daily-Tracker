import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Edit3,
  ListTodo,
  Sparkles,
  TrendingUp,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  Layers,
} from 'lucide-react';

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: string;
  timeframe: 'Yearly' | 'Monthly' | 'Weekly' | 'Daily';
  priority: 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  targetDate?: string;
  progressPercent: number;
  subgoals: string; // JSON array of SubGoal
  createdAt: string;
  updatedAt: string;
}

export const GoalsView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'All' | 'Yearly' | 'Monthly' | 'Weekly' | 'Daily'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [timeframe, setTimeframe] = useState<'Yearly' | 'Monthly' | 'Weekly' | 'Daily'>('Monthly');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [targetDate, setTargetDate] = useState('');
  const [manualProgress, setManualProgress] = useState(0);
  const [subgoalsList, setSubgoalsList] = useState<SubGoal[]>([]);
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch goals from PostgreSQL backend
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/goals');
      if (Array.isArray(data)) {
        setGoals(data);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setTimeframe('Monthly');
    setPriority('Medium');
    setTargetDate('');
    setManualProgress(0);
    setSubgoalsList([]);
    setNewSubgoalTitle('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || 'Personal');
    setTimeframe(goal.timeframe || 'Monthly');
    setPriority(goal.priority || 'Medium');
    setTargetDate(goal.targetDate || '');
    setManualProgress(goal.progressPercent || 0);

    try {
      const parsed = JSON.parse(goal.subgoals || '[]');
      setSubgoalsList(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setSubgoalsList([]);
    }
    setNewSubgoalTitle('');
    setIsModalOpen(true);
  };

  // Add sub-goal item to draft form
  const handleAddSubgoalItem = () => {
    if (!newSubgoalTitle.trim()) return;
    const newItem: SubGoal = {
      id: Date.now().toString(),
      title: newSubgoalTitle.trim(),
      completed: false,
    };
    setSubgoalsList([...subgoalsList, newItem]);
    setNewSubgoalTitle('');
  };

  const handleRemoveSubgoalItem = (id: string) => {
    setSubgoalsList(subgoalsList.filter((s) => s.id !== id));
  };

  const handleToggleSubgoalItem = (id: string) => {
    setSubgoalsList(
      subgoalsList.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  // Create or Update Goal
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        timeframe,
        priority,
        targetDate,
        progressPercent: manualProgress,
        subgoals: subgoalsList,
      };

      if (editingGoal) {
        await apiFetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkbox completion toggle for full goal
  const handleToggleGoalStatus = async (goal: Goal) => {
    try {
      await apiFetch(`/api/goals/${goal.id}/toggle`, {
        method: 'POST',
      });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to toggle goal:', err);
    }
  };

  // Toggle sub-goal directly in card view with auto progress update
  const handleCardSubgoalToggle = async (goal: Goal, subgoalId: string) => {
    let currentList: SubGoal[] = [];
    try {
      currentList = JSON.parse(goal.subgoals || '[]');
    } catch (e) {
      currentList = [];
    }

    const updatedList = currentList.map((s) =>
      s.id === subgoalId ? { ...s, completed: !s.completed } : s
    );

    try {
      await apiFetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          subgoals: updatedList,
        }),
      });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to update subgoal:', err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: number) => {
    try {
      await apiFetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  // Filter goals by timeframe tab
  const filteredGoals = goals.filter((g) => {
    if (activeTimeframe === 'All') return true;
    return g.timeframe === activeTimeframe;
  });

  // Calculate stats
  const completedCount = goals.filter((g) => g.status === 'Completed').length;
  const inProgressCount = goals.filter((g) => g.status === 'In Progress').length;
  const avgProgress = goals.length
    ? Math.round(goals.reduce((acc, g) => acc + g.progressPercent, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="glass p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>PostgreSQL Strategic Objectives Module</span>
          </div>
          <h2 className="text-2xl font-black text-white">Goal & Milestone Management</h2>
          <p className="text-xs text-slate-400">
            Define Yearly, Monthly, Weekly, and Daily targets with automated progress calculations.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Goals</p>
            <p className="text-2xl font-black text-white font-mono">{goals.length}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
            <p className="text-2xl font-black text-white font-mono">{completedCount}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Average Progress</p>
            <p className="text-2xl font-black text-white font-mono">{avgProgress}%</p>
          </div>
        </div>
      </div>

      {/* Timeframe Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          {(['All', 'Yearly', 'Monthly', 'Weekly', 'Daily'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTimeframe === tf
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf === 'All' ? 'All Timeframes' : `${tf} Goals`}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading goals from database...
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <Target className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-200">No goals in this timeframe</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Add New Goal" to set target objectives for {activeTimeframe.toLowerCase()} milestones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map((goal) => {
            let subList: SubGoal[] = [];
            try {
              subList = JSON.parse(goal.subgoals || '[]');
            } catch (e) {
              subList = [];
            }

            const priorityColors = {
              High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Low: 'bg-slate-800 text-slate-300 border-slate-700',
            };

            const isDone = goal.status === 'Completed' || goal.progressPercent === 100;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4 transition-all ${
                  isDone ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleGoalStatus(goal)}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                            : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-emerald-500'
                        }`}
                        title="Toggle Full Goal Completion"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div>
                        <h4
                          className={`text-base font-bold text-white transition-all ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {goal.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              priorityColors[goal.priority] || priorityColors.Medium
                            }`}
                          >
                            {goal.priority} Priority
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {goal.timeframe}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Edit Goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-400">{goal.description}</p>
                  )}

                  {/* Deadline date */}
                  {goal.targetDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Deadline: {goal.targetDate}</span>
                    </div>
                  )}

                  {/* Subgoals Checklist with Auto Progress Calculation */}
                  {subList.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Subgoals Checklist</span>
                        <span className="text-slate-500 font-mono">
                          {subList.filter((s) => s.completed).length} / {subList.length}
                        </span>
                      </p>
                      <div className="space-y-1.5">
                        {subList.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCardSubgoalToggle(goal, sub.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white w-full text-left"
                          >
                            {sub.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <span className={sub.completed ? 'line-through text-slate-500' : ''}>
                              {sub.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Goal Progress</span>
                    <span className="font-bold text-rose-400">{goal.progressPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Add / Edit Modal */}
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
                  <Target className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold">
                    {editingGoal ? 'Edit Goal' : 'Add New Strategic Goal'}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Full-Stack Architecture or Run 100km"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Description / Target Outcome
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detailed goal description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Timeframe
                    </label>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Target Deadline
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Subgoals list builder for auto progress calculation */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="block text-xs font-bold text-slate-300">
                    Subgoals (Auto-Calculates Goal Progress %)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add subgoal milestone..."
                      value={newSubgoalTitle}
                      onChange={(e) => setNewSubgoalTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubgoalItem();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubgoalItem}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Add
                    </button>
                  </div>

                  {subgoalsList.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {subgoalsList.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => handleToggleSubgoalItem(sub.id)}
                              className="rounded text-rose-500"
                            />
                            <span className={sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {sub.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubgoalItem(sub.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual progress slider fallback */}
                {subgoalsList.length === 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                      <span>Manual Progress Override</span>
                      <span className="text-rose-400 font-mono">{manualProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={manualProgress}
                      onChange={(e) => setManualProgress(parseInt(e.target.value, 10))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                )}

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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20"
                  >
                    {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
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
