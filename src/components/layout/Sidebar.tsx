import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Target,
  BookOpen,
  FolderKanban,
  HeartPulse,
  PenTool,
  Timer,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Sparkles,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { NavSection } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingTaskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingTaskCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as NavSection, label: 'Tasks', icon: CheckSquare, badge: pendingTaskCount > 0 ? pendingTaskCount : null },
    { id: 'habits' as NavSection, label: 'Habit Tracker', icon: Flame },
    { id: 'goals' as NavSection, label: 'Goals', icon: Target },
    { id: 'study' as NavSection, label: 'Study Tracker', icon: BookOpen },
    { id: 'projects' as NavSection, label: 'Project Tracker', icon: FolderKanban },
    { id: 'health' as NavSection, label: 'Health Tracker', icon: HeartPulse },
    { id: 'journal' as NavSection, label: 'Journal', icon: PenTool },
    { id: 'focus' as NavSection, label: 'Focus Timer', icon: Timer },
    { id: 'analytics' as NavSection, label: 'Insights', icon: BarChart3 },
    { id: 'sheets' as NavSection, label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 shrink-0 text-slate-800 dark:text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
          L
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">LifeOS</span>
          <p className="text-[10px] text-slate-400 font-mono">v2.4 HIGH DENSITY</p>
        </div>
      </div>

      {/* Navigation Body */}
      <nav className="flex-1 py-4 px-4 overflow-y-auto space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-2.5 px-2">
            Navigation
          </p>
          <ul className="space-y-1 text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold">
                        {item.badge < 10 ? `0${item.badge}` : item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Nodes / System Category Stats */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mb-2 px-2">
            System Nodes
          </p>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li
              onClick={() => onSelectSection('tasks')}
              className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
            >
              <span className="text-[11px]">Productivity</span>
              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                12
              </span>
            </li>
            <li
              onClick={() => onSelectSection('habits')}
              className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
            >
              <span className="text-[11px]">Habits & Streaks</span>
              <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                04
              </span>
            </li>
            <li
              onClick={() => onSelectSection('sheets')}
              className="flex justify-between items-center px-3 py-1.5 hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
            >
              <span className="text-[11px]">Google Sheets</span>
              <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                SYNCED
              </span>
            </li>
          </ul>
        </div>
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        <div className="glass p-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold truncate leading-tight text-slate-800 dark:text-slate-200">
                {user?.name || 'Jordan V.'}
              </p>
              <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                PRO PLAN
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
