import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SheetSyncLog } from '../../types.ts';
import {
  FileSpreadsheet,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  History,
  Check,
  Zap,
} from 'lucide-react';

export const SheetsView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SheetSyncLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/sheets/config');
      setSpreadsheetId(data.spreadsheetId || '');
      setAutoSync(data.autoSync || false);
      setSyncLogs(data.syncLogs || []);
    } catch (err: any) {
      console.error('Fetch sheets config error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await apiFetch('/api/sheets/config', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId, autoSync }),
      });
      setMessage({ type: 'success', text: 'Google Sheets configuration saved.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save config.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreating(true);
    setMessage(null);
    try {
      const data = await apiFetch('/api/sheets/create', { method: 'POST' });
      setSpreadsheetId(data.spreadsheetId);
      setMessage({
        type: 'success',
        text: `New Google Sheet created! ID: ${data.spreadsheetId}`,
      });
      fetchConfig();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create Google Sheet.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const data = await apiFetch('/api/sheets/sync', {
        method: 'POST',
        body: JSON.stringify({ spreadsheetId }),
      });
      setMessage({ type: 'success', text: data.message });
      fetchConfig();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Google Sheets Dataset Node
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Export tasks, habit streaks & focus logs directly into Google Sheets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Sheet</span>
            </a>
          )}

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !spreadsheetId}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-2.5 px-3.5 rounded-xl text-xs font-mono border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Configuration Card */}
      <div className="glass p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">Spreadsheet Configuration</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Spreadsheet ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Google Spreadsheet ID or auto-generate below"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 font-mono text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-xs transition-all text-slate-800 dark:text-slate-200"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSyncToggle"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoSyncToggle" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Auto-sync on record updates
              </label>
            </div>

            <button
              type="button"
              onClick={handleCreateNewSheet}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-semibold text-xs hover:bg-emerald-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Creating Sheet...' : 'Auto-Create New Google Sheet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Log History */}
      <div className="glass p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-emerald-500" />
          Sync Log History
        </h4>

        {syncLogs.length === 0 ? (
          <p className="text-[11px] font-mono text-slate-400 text-center py-6">No sync events logged yet.</p>
        ) : (
          <div className="space-y-2">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 font-mono font-bold rounded text-[9px] ${
                      log.status === 'Success'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">{log.message}</span>
                </div>
                <span className="text-slate-400 text-[10px] font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
