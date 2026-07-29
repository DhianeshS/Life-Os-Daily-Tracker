import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FocusSession } from '../../types.ts';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Tag,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FocusViewProps {
  sessions: FocusSession[];
  onLogSession: (data: {
    title: string;
    category: string;
    durationMinutes: number;
    notes?: string;
  }) => Promise<void>;
}

export const FocusView: React.FC<FocusViewProps> = ({ sessions, onLogSession }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // Minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // Seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('Deep Work Block');
  const [category, setCategory] = useState('Work');
  const [notes, setNotes] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync timeLeft when duration preset is selected and not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(selectedDuration * 60);
    }
  }, [selectedDuration]);

  // Countdown Interval logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      handleCompleteSession();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleCompleteSession = async () => {
    setIsSaving(true);
    try {
      await onLogSession({
        title: sessionTitle.trim() || 'Focus Session',
        category,
        durationMinutes: selectedDuration,
        notes: notes.trim(),
      });
      setTimeLeft(selectedDuration * 60);
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  };

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Timer Ring & Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Header Controls */}
          <div className="w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Pomodoro Node Timer</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Session Title Input */}
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            disabled={isRunning}
            className="text-center font-bold text-base text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500 mb-6 px-4 py-1"
            placeholder="Focus Session Title..."
          />

          {/* Circular Countdown Ring */}
          <div className="relative w-60 h-60 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="120"
                cy="120"
                r="100"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="120"
                cy="120"
                r="100"
                className="stroke-indigo-500 transition-all duration-1000"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-mono font-semibold text-indigo-400 mt-1 uppercase tracking-widest">
                {isRunning ? 'FOCUS ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Duration Presets */}
          <div className="flex items-center gap-2 mb-6">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSelectedDuration(mins);
                  setIsRunning(false);
                }}
                disabled={isRunning}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedDuration === mins
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-200/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartPause}
              className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all"
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right 1 Col: Focus Session History Log */}
      <div className="glass p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Focus Session Log
        </h3>

        {sessions.length === 0 ? (
          <p className="text-[11px] font-mono text-slate-400 text-center py-8">
            No focus logs recorded yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{s.title}</h4>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {s.durationMinutes}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{s.category}</span>
                  <span>{new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
