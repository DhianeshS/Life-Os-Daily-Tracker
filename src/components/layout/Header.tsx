import React, { useState } from 'react';
import { NavSection } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Plus,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MailWarning,
} from 'lucide-react';

interface HeaderProps {
  activeSection: NavSection;
  onQuickAddTask?: () => void;
  onSyncSheets?: () => void;
  isSyncingSheets?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onQuickAddTask,
  onSyncSheets,
  isSyncingSheets = false,
}) => {
  const { user, verifyEmail } = useAuth();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sectionTitles: Record<NavSection, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'System overview & high-density metrics' },
    tasks: { title: 'Tasks', subtitle: 'Organize priorities, categories, and checklist items' },
    habits: { title: 'Habit Tracker', subtitle: 'Consistency tracking & daily streak logs' },
    goals: { title: 'Goals & Milestones', subtitle: 'Strategic objectives, timeframes & progress tracking' },
    study: { title: 'Study Tracker', subtitle: 'Subjects, topics, revision dates & multi-period study hour analytics' },
    projects: { title: 'Project Tracker', subtitle: 'Deliverables, deadlines, repo links & automated progress' },
    health: { title: 'Health & Fitness', subtitle: 'Track weight, water, sleep, workout minutes, steps & mood' },
    journal: { title: 'Journal & Reflections', subtitle: 'Document thoughts, weekly retrospectives & monthly milestone reviews' },
    focus: { title: 'Focus Timer', subtitle: 'Deep work timer & focus session logs' },
    analytics: { title: 'Insights', subtitle: 'Data trends, metrics & category distribution' },
    sheets: { title: 'Google Sheets', subtitle: 'Real-time dataset export & synchronization' },
    settings: { title: 'Settings', subtitle: 'Account parameters & preferences' },
  };

  const handleVerifyEmailClick = async () => {
    setIsVerifyingEmail(true);
    try {
      await verifyEmail();
      setVerifyMessage('Email verified successfully!');
      setTimeout(() => setVerifyMessage(null), 3000);
    } catch {
      setVerifyMessage('Verification failed. Try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const current = sectionTitles[activeSection] || sectionTitles.dashboard;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' GMT';

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-3">
      {/* Email Verification Banner */}
      {user && !user.isEmailVerified && (
        <div className="mb-2.5 p-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailWarning className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">
              Email ({user.email}) not verified. Verify for full security.
            </span>
          </div>
          <button
            onClick={handleVerifyEmailClick}
            disabled={isVerifyingEmail}
            className="px-2.5 py-0.5 rounded bg-amber-500 text-white font-semibold text-[10px] hover:bg-amber-600 transition-all shrink-0"
          >
            {isVerifyingEmail ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      )}

      {verifyMessage && (
        <div className="mb-2.5 p-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-[11px]">{verifyMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Title & Quick Command Search */}
        <div className="flex items-center gap-6 flex-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {current.title}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{current.subtitle}</p>
          </div>

          <div className="relative w-full max-w-xs hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-mono">/</span>
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg py-1.5 pl-7 pr-3 text-xs w-full focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Right Timestamp & Action Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{formattedDate}</p>
            <p className="text-[10px] text-slate-400 font-mono">{formattedTime}</p>
          </div>

          <div className="flex items-center gap-2">
            {onSyncSheets && (
              <button
                onClick={onSyncSheets}
                disabled={isSyncingSheets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all"
                title="Sync to Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">{isSyncingSheets ? 'Syncing...' : 'Sync Sheets'}</span>
                {isSyncingSheets && <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />}
              </button>
            )}

            {onQuickAddTask && (
              <button
                onClick={onQuickAddTask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
