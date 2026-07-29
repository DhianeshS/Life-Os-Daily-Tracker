import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit } from '../../types.ts';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  X,
  Calendar,
  Zap,
  Sparkles,
  Trophy,
  Edit2,
  Heart,
  Droplets,
  Target,
  Smile,
  Coffee,
  Dumbbell,
  Sun,
  Brain,
  Star,
  Activity,
  BookOpen,
  CalendarDays,
  Percent,
} from 'lucide-react';

interface HabitsViewProps {
  habits: Habit[];
  onCreateHabit: (data: Partial<Habit>) => Promise<void>;
  onUpdateHabit?: (habitId: number, data: Partial<Habit>) => Promise<void>;
  onToggleHabitDate: (habitId: number, dateStr: string) => Promise<void>;
  onDeleteHabit: (habitId: number) => Promise<void>;
}

// Icon mapping helper
const ICON_OPTIONS = [
  { name: 'zap', label: 'Zap', Icon: Zap },
  { name: 'flame', label: 'Flame', Icon: Flame },
  { name: 'book', label: 'Book', Icon: BookOpen },
  { name: 'activity', label: 'Activity', Icon: Activity },
  { name: 'heart', label: 'Health', Icon: Heart },
  { name: 'droplet', label: 'Hydration', Icon: Droplets },
  { name: 'target', label: 'Target', Icon: Target },
  { name: 'smile', label: 'Mindset', Icon: Smile },
  { name: 'coffee', label: 'Routine', Icon: Coffee },
  { name: 'dumbbell', label: 'Fitness', Icon: Dumbbell },
  { name: 'sun', label: 'Morning', Icon: Sun },
  { name: 'brain', label: 'Focus', Icon: Brain },
  { name: 'star', label: 'Special', Icon: Star },
];

const COLOR_PRESETS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#6366f1', // Indigo
];

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onCreateHabit,
  onUpdateHabit,
  onToggleHabitDate,
  onDeleteHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitForHeatmap, setSelectedHabitForHeatmap] = useState<number | 'all'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Health');
  const [targetFrequency, setTargetFrequency] = useState('Daily');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('zap');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate last 7 days for quick weekly toggle
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        iso: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      });
    }
    return dates;
  };

  const daysList = getLast7Days();

  // Generate 52 weeks (364 days) for GitHub-style Heatmap Calendar
  const getGitHubStyleHeatmapDays = () => {
    const days = [];
    const today = new Date();

    // Generate 365 days leading up to today
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        iso,
        date: d,
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  };

  const heatmapDays = getGitHubStyleHeatmapDays();

  const handleOpenCreateModal = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setCategory('Health');
    setTargetFrequency('Daily');
    setTargetDaysPerWeek(7);
    setColor('#3b82f6');
    setIcon('zap');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (h: Habit) => {
    setEditingHabit(h);
    setTitle(h.title);
    setDescription(h.description || '');
    setCategory(h.category || 'Health');
    setTargetFrequency(h.targetFrequency || 'Daily');
    setTargetDaysPerWeek(h.targetDaysPerWeek || 7);
    setColor(h.color || '#3b82f6');
    setIcon(h.icon || 'zap');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        targetFrequency,
        targetDaysPerWeek,
        color,
        icon,
      };

      if (editingHabit && onUpdateHabit) {
        await onUpdateHabit(editingHabit.id, payload);
      } else {
        await onCreateHabit(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render icon component
  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    const item = ICON_OPTIONS.find((i) => i.name === iconName);
    const IconComp = item ? item.Icon : Zap;
    return <IconComp className={className} />;
  };

  // Helper to calculate heatmap intensity for a specific date (0 to 4)
  const getHeatmapIntensity = (isoDate: string) => {
    if (habits.length === 0) return 0;

    if (selectedHabitForHeatmap !== 'all') {
      const targetHabit = habits.find((h) => h.id === selectedHabitForHeatmap);
      return targetHabit?.completedDates.includes(isoDate) ? 4 : 0;
    }

    // Combined intensity across all habits
    let count = 0;
    habits.forEach((h) => {
      if (h.completedDates.includes(isoDate)) count++;
    });

    const ratio = count / habits.length;
    if (ratio === 0) return 0;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="glass p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Habit Tracker & Consistency Hub
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              PostgreSQL persistent tracking with active streak calculators and GitHub-style heatmaps.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* GitHub-style Heatmap Calendar Section */}
      <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Yearly Habit Activity Heatmap (GitHub-Style)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Visual log of completed habits over the past 365 days.
            </p>
          </div>

          {/* Filter by habit */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Heatmap Habit:</span>
            <select
              value={selectedHabitForHeatmap}
              onChange={(e) =>
                setSelectedHabitForHeatmap(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Habits Combined</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[720px]">
            {heatmapDays.map((day) => {
              const intensity = getHeatmapIntensity(day.iso);
              const colorClasses = [
                'bg-slate-900 border-slate-800/60', // 0: None
                'bg-emerald-950 border-emerald-900/80 text-emerald-400', // 1: Low
                'bg-emerald-700/80 border-emerald-600/80', // 2: Medium
                'bg-emerald-500 border-emerald-400', // 3: High
                'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/50', // 4: Perfect
              ];

              return (
                <div
                  key={day.iso}
                  title={`${day.iso}: ${intensity > 0 ? `Completed (${intensity}/4 level)` : 'No entries'}`}
                  className={`w-3.5 h-3.5 rounded-sm border transition-all hover:scale-125 hover:z-10 cursor-pointer ${colorClasses[intensity]}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3 px-1">
            <span>365 days ago</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950 border border-emerald-900" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Habits List Cards */}
      {habits.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <Zap className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-200">No habits registered yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first habit like "Morning Reading" or "10k Steps" to start logging streaks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Left Habit Details */}
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-xl text-white shadow-md"
                    style={{ backgroundColor: habit.color || '#3b82f6' }}
                  >
                    {renderIcon(habit.icon, 'w-4 h-4')}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      {habit.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {habit.category}
                      </span>
                      <span>Target: {habit.targetFrequency} ({habit.targetDaysPerWeek || 7}x/wk)</span>
                    </div>
                  </div>
                </div>

                {habit.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{habit.description}</p>
                )}

                {/* Metrics Badges */}
                <div className="flex items-center gap-4 text-xs font-mono pt-1">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Flame className="w-4 h-4 fill-amber-500/20" />
                    Streak: {habit.streak} Days
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-semibold">
                    <Trophy className="w-3.5 h-3.5" />
                    Best: {habit.bestStreak} Days
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Percent className="w-3.5 h-3.5" />
                    Yearly Rate: {habit.yearlyCompletionPercentage ?? 0}%
                  </span>
                </div>
              </div>

              {/* Center 7-Day Quick Toggle Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {daysList.map((day) => {
                  const isDone = habit.completedDates.includes(day.iso);
                  return (
                    <button
                      key={day.iso}
                      onClick={() => onToggleHabitDate(habit.id, day.iso)}
                      className={`flex flex-col items-center justify-center w-11 h-14 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-indigo-500'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        {day.dayName}
                      </span>
                      <span className="text-xs font-bold mt-0.5">{day.dayNum}</span>
                      <div className="mt-1">
                        {isDone ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 block" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons (Edit & Delete) */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  onClick={() => handleOpenEditModal(habit)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
                  title="Edit Habit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all border border-slate-800"
                  title="Delete Habit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Habit Modal */}
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
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold">
                    {editingHabit ? 'Edit Habit Configuration' : 'Create New Habit'}
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
                    Habit Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Hydration or 30 mins Reading"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Description / Purpose
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why is this habit important..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Health">Health & Fitness</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Mindfulness">Mindfulness</option>
                      <option value="Learning">Learning</option>
                      <option value="Finance">Finance</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Target Frequency
                    </label>
                    <select
                      value={targetFrequency}
                      onChange={(e) => setTargetFrequency(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Daily">Daily (7 days/week)</option>
                      <option value="Weekdays">Weekdays (5 days/week)</option>
                      <option value="3x/Week">3x per Week</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Custom Icon Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Select Icon
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {ICON_OPTIONS.map((item) => {
                      const IconC = item.Icon;
                      const isSel = icon === item.name;
                      return (
                        <button
                          type="button"
                          key={item.name}
                          onClick={() => setIcon(item.name)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                            isSel
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={item.label}
                        >
                          <IconC className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Palette Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Theme Color
                  </label>
                  <div className="flex gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                          color === c
                            ? 'scale-110 border-white ring-2 ring-indigo-500'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20"
                  >
                    {isSubmitting ? 'Saving...' : editingHabit ? 'Update Habit' : 'Create Habit'}
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
