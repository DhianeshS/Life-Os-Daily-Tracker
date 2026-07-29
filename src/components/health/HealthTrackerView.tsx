import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { HealthLog } from '../../types.ts';
import {
  HeartPulse,
  Droplets,
  Moon,
  Dumbbell,
  Footprints,
  Flame,
  Smile,
  Plus,
  Trash2,
  Calendar,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Scale
} from 'lucide-react';

export const HealthTrackerView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState({
    avgWeight: 0,
    avgWaterMl: 0,
    avgSleepHours: 0,
    avgWorkoutMins: 0,
    avgSteps: 0,
    avgCalories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'analytics' | 'history'>('log');

  // Today's Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weightKg, setWeightKg] = useState<string>('');
  const [waterMl, setWaterMl] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('Good');
  const [workoutMinutes, setWorkoutMinutes] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<string>('Cardio');
  const [stepsCount, setStepsCount] = useState<string>('');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('');
  const [mood, setMood] = useState<string>('Good');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchHealthData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/api/health-tracker');
      if (data && data.logs) {
        setLogs(data.logs);
        setWeeklyAverages(data.weeklyAverages || {
          avgWeight: 0,
          avgWaterMl: 0,
          avgSleepHours: 0,
          avgWorkoutMins: 0,
          avgSteps: 0,
          avgCalories: 0,
        });

        // Fill form if log exists for selected date
        const existing = data.logs.find((l: HealthLog) => l.date === selectedDate);
        if (existing) {
          setWeightKg(existing.weightKg ? String(existing.weightKg) : '');
          setWaterMl(existing.waterMl || 0);
          setSleepHours(existing.sleepHours ? String(existing.sleepHours) : '');
          setSleepQuality(existing.sleepQuality || 'Good');
          setWorkoutMinutes(existing.workoutMinutes ? String(existing.workoutMinutes) : '');
          setWorkoutType(existing.workoutType || 'Cardio');
          setStepsCount(existing.stepsCount ? String(existing.stepsCount) : '');
          setCaloriesBurned(existing.caloriesBurned ? String(existing.caloriesBurned) : '');
          setMood(existing.mood || 'Good');
          setNotes(existing.notes || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch health logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, selectedDate]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = logs.find(l => l.date === dateStr);
    if (existing) {
      setWeightKg(existing.weightKg ? String(existing.weightKg) : '');
      setWaterMl(existing.waterMl || 0);
      setSleepHours(existing.sleepHours ? String(existing.sleepHours) : '');
      setSleepQuality(existing.sleepQuality || 'Good');
      setWorkoutMinutes(existing.workoutMinutes ? String(existing.workoutMinutes) : '');
      setWorkoutType(existing.workoutType || 'Cardio');
      setStepsCount(existing.stepsCount ? String(existing.stepsCount) : '');
      setCaloriesBurned(existing.caloriesBurned ? String(existing.caloriesBurned) : '');
      setMood(existing.mood || 'Good');
      setNotes(existing.notes || '');
    } else {
      setWeightKg('');
      setWaterMl(0);
      setSleepHours('');
      setSleepQuality('Good');
      setWorkoutMinutes('');
      setWorkoutType('Cardio');
      setStepsCount('');
      setCaloriesBurned('');
      setMood('Good');
      setNotes('');
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await apiFetch('/api/health-tracker', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          waterMl: waterMl || 0,
          sleepHours: sleepHours ? parseFloat(sleepHours) : 0,
          sleepQuality,
          workoutMinutes: workoutMinutes ? parseInt(workoutMinutes) : 0,
          workoutType,
          stepsCount: stepsCount ? parseInt(stepsCount) : 0,
          caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : 0,
          mood,
          notes,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchHealthData();
    } catch (error) {
      console.error('Failed to save log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await apiFetch(`/api/health-tracker/${id}`, { method: 'DELETE' });
      await fetchHealthData();
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  const addWater = (amount: number) => {
    setWaterMl(prev => prev + amount);
  };

  // Helper for max value scaling in CSS bar charts
  const maxSteps = Math.max(...logs.map(l => l.stepsCount || 0), 10000);
  const maxCalories = Math.max(...logs.map(l => l.caloriesBurned || 0), 2500);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-teal-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HeartPulse className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Health & Wellness Tracker</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Monitor daily vitals, fitness stats, hydration, and sleep with automatically computed weekly averages.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('log')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'log'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Tracker
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Health Graphs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Logs History
          </button>
        </div>
      </div>

      {/* Automatically Computed Weekly Averages Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Weight</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgWeight || '--'}</span>
            <span className="text-xs text-slate-400">kg</span>
          </div>
          <p className="text-[10px] text-indigo-400 mt-1">7-day rolling avg</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Water</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgWaterMl}</span>
            <span className="text-xs text-slate-400">ml</span>
          </div>
          <p className="text-[10px] text-blue-400 mt-1">Target: 2500ml/day</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Sleep</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgSleepHours}</span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
          <p className="text-[10px] text-purple-400 mt-1">Target: 7.5 - 8 hrs</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Workout</span>
            <Dumbbell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgWorkoutMins}</span>
            <span className="text-xs text-slate-400">mins</span>
          </div>
          <p className="text-[10px] text-amber-400 mt-1">Active time / day</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Steps</span>
            <Footprints className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgSteps.toLocaleString()}</span>
            <span className="text-xs text-slate-400">steps</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">Goal: 10,000 steps</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Weekly Avg Calories</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">{weeklyAverages.avgCalories.toLocaleString()}</span>
            <span className="text-xs text-slate-400">kcal</span>
          </div>
          <p className="text-[10px] text-rose-400 mt-1">Burned per day</p>
        </div>
      </div>

      {/* Main Tab Contents */}
      {activeTab === 'log' && (
        <form onSubmit={handleSaveLog} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Date & Primary Metrics */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Log Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <hr className="border-slate-800" />

              {/* Weight */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" /> Weight (kg)
                  </span>
                  <span className="text-[10px] text-slate-500">Body mass</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 72.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Smile className="w-4 h-4 text-amber-400" /> Today's Mood
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['Great', 'Good', 'Neutral', 'Tired', 'Stressed'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-semibold transition-all border ${
                        mood === m
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Daily Journal / Notes</label>
                <textarea
                  rows={3}
                  placeholder="How did you feel today? Any specific workout details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Water & Sleep */}
          <div className="space-y-6">
            {/* Water Tracker */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Droplets className="w-5 h-5" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Water Intake</h3>
                </div>
                <span className="text-lg font-bold text-blue-400">{waterMl} <span className="text-xs text-slate-400 font-normal">/ 2500 ml</span></span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterMl / 2500) * 100)}%` }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addWater(250)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl py-2 text-xs font-medium transition-all"
                >
                  +250 ml
                </button>
                <button
                  type="button"
                  onClick={() => addWater(500)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl py-2 text-xs font-medium transition-all"
                >
                  +500 ml
                </button>
                <button
                  type="button"
                  onClick={() => addWater(1000)}
                  className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl py-2 text-xs font-medium transition-all"
                >
                  +1.0 L
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs text-slate-400 shrink-0">Custom (ml):</label>
                <input
                  type="number"
                  value={waterMl || ''}
                  onChange={(e) => setWaterMl(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sleep Tracker */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Moon className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-semibold text-white">Sleep Tracker</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 7.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quality</label>
                  <select
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Excellent">Excellent 😴</option>
                    <option value="Good">Good 😊</option>
                    <option value="Fair">Fair 😐</option>
                    <option value="Poor">Poor 😫</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Fitness (Workout, Steps, Calories) & Submit */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Activity className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-semibold text-white">Fitness & Activity</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-amber-400" /> Workout (Mins)
                    </label>
                    <input
                      type="number"
                      placeholder="45"
                      value={workoutMinutes}
                      onChange={(e) => setWorkoutMinutes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Workout Type</label>
                    <select
                      value={workoutType}
                      onChange={(e) => setWorkoutType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength Training</option>
                      <option value="Yoga">Yoga / Stretch</option>
                      <option value="Running">Running</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Walking">Walking</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" /> Daily Steps
                    </label>
                    <input
                      type="number"
                      placeholder="8500"
                      value={stepsCount}
                      onChange={(e) => setStepsCount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-400" /> Active Calories
                    </label>
                    <input
                      type="number"
                      placeholder="450"
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span>Saving Entry...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Save Health Log for {selectedDate}
                  </>
                )}
              </button>
              {saveSuccess && (
                <p className="text-xs text-emerald-400 text-center font-medium mt-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Health entry saved & synced to Cloud SQL database!
                </p>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Analytics Graphs Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Steps & Calories Trend Graph */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Daily Steps Trend</h3>
                </div>
                <span className="text-xs text-slate-400">Last 14 Logs</span>
              </div>

              <div className="h-48 flex items-end gap-2 pt-6 border-b border-slate-800 pb-2">
                {logs.slice(0, 14).reverse().map((item, idx) => {
                  const pct = Math.min(100, ((item.stepsCount || 0) / maxSteps) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Hover Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[10px] text-white p-1 rounded z-20 whitespace-nowrap pointer-events-none transition-all">
                        {item.date}: {item.stepsCount?.toLocaleString()} steps
                      </div>
                      <div className="w-full bg-slate-950 rounded-t h-full flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all group-hover:brightness-125"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center">
                        {item.date.slice(8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sleep & Water Graph */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Sleep Hours & Water Intake</h3>
                </div>
                <span className="text-xs text-slate-400">Daily History</span>
              </div>

              <div className="h-48 flex items-end gap-2 pt-6 border-b border-slate-800 pb-2">
                {logs.slice(0, 14).reverse().map((item, idx) => {
                  const sleepPct = Math.min(100, ((item.sleepHours || 0) / 10) * 100);
                  const waterPct = Math.min(100, ((item.waterMl || 0) / 3000) * 100);
                  return (
                    <div key={idx} className="flex-1 flex items-end justify-center gap-0.5 group relative h-full">
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-800 text-[10px] text-white p-1 rounded z-20 whitespace-nowrap pointer-events-none">
                        {item.date}: {item.sleepHours}h sleep | {item.waterMl}ml water
                      </div>
                      {/* Sleep bar */}
                      <div
                        className="w-1.5 bg-purple-500 rounded-t transition-all"
                        style={{ height: `${sleepPct}%` }}
                      />
                      {/* Water bar */}
                      <div
                        className="w-1.5 bg-blue-500 rounded-t transition-all"
                        style={{ height: `${waterPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Sleep (Hours)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Water Intake (ml)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Table Tab */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">All Logged Health Records</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No health logs created yet. Use the Daily Tracker tab to record entries!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Date</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Water</th>
                    <th className="p-3">Sleep</th>
                    <th className="p-3">Workout</th>
                    <th className="p-3">Steps</th>
                    <th className="p-3">Calories</th>
                    <th className="p-3">Mood</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{log.date}</td>
                      <td className="p-3">{log.weightKg ? `${log.weightKg} kg` : '--'}</td>
                      <td className="p-3">{log.waterMl} ml</td>
                      <td className="p-3">{log.sleepHours} hrs ({log.sleepQuality})</td>
                      <td className="p-3">{log.workoutMinutes}m ({log.workoutType})</td>
                      <td className="p-3">{log.stepsCount?.toLocaleString()}</td>
                      <td className="p-3">{log.caloriesBurned?.toLocaleString()} kcal</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {log.mood}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
