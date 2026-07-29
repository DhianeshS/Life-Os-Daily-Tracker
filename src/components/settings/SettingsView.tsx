import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { ReminderSchedule } from '../../types.ts';
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Moon,
  Sun,
  Palette,
  Bell,
  Download,
  Upload,
  Database,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, apiFetch, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Settings State
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'data' | 'danger'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // Accent Colors & Preferences State
  const [accentColor, setAccentColor] = useState('indigo');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Reminders State
  const [reminders, setReminders] = useState<ReminderSchedule[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<string | null>(null);

  // Backup / Import / Export State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Account Delete State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load User Settings & Reminders
  const loadSettingsData = useCallback(async () => {
    try {
      setRemindersLoading(true);
      const [settingsRes, remindersRes] = await Promise.all([
        apiFetch('/api/settings').catch(() => null),
        apiFetch('/api/notifications/reminders').catch(() => []),
      ]);

      if (settingsRes) {
        if (settingsRes.profile) {
          setName(settingsRes.profile.name || '');
          setAvatarUrl(settingsRes.profile.avatarUrl || '');
        }
        if (settingsRes.settings) {
          setAccentColor(settingsRes.settings.accentColor || 'indigo');
          setNotificationsEnabled(settingsRes.settings.notificationsEnabled ?? true);
          setEmailNotifications(settingsRes.settings.emailNotifications ?? true);
        }
      }

      if (Array.isArray(remindersRes)) {
        setReminders(remindersRes);
      }
    } catch (error) {
      console.error('Failed to load settings data:', error);
    } finally {
      setRemindersLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // Request Browser Notification Permission
  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Browser Notifications Enabled Successfully!');
      } else {
        alert('Notification permission was denied.');
      }
    } else {
      alert('Browser notifications are not supported by this browser.');
    }
  };

  // Avatar Upload Helper
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await apiFetch('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, avatarUrl }),
      });
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Update Email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailSaving(true);
      await apiFetch('/api/settings/email', {
        method: 'PUT',
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      setEmailMessage('Email address updated successfully!');
      setNewEmail('');
      setEmailPassword('');
      setTimeout(() => setEmailMessage(null), 3000);
    } catch (err: any) {
      setEmailMessage(err.message || 'Failed to change email address');
    } finally {
      setEmailSaving(false);
    }
  };

  // Update Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }
    try {
      setPasswordSaving(true);
      await apiFetch('/api/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (newAccent: string) => {
    setAccentColor(newAccent);
    try {
      await apiFetch('/api/settings/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          accentColor: newAccent,
          notificationsEnabled,
          emailNotifications,
        }),
      });
    } catch (err) {
      console.error('Save preference error:', err);
    }
  };

  // Reminder Toggle / Time Change
  const handleUpdateReminder = async (id: number, updates: Partial<ReminderSchedule>) => {
    try {
      const updated = await apiFetch(`/api/notifications/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setReminders(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err) {
      console.error('Update reminder error:', err);
    }
  };

  // Dispatch Test Email
  const handleTestEmailReminder = async (category: string) => {
    try {
      const res = await apiFetch('/api/notifications/test-email', {
        method: 'POST',
        body: JSON.stringify({ category }),
      });
      setTestEmailMsg(res.message);
      setTimeout(() => setTestEmailMsg(null), 4000);
    } catch (err) {
      console.error('Test email error:', err);
    }
  };

  // Export Data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const exportData = await apiFetch('/api/settings/export');
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Import Data File Upload
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const res = await apiFetch('/api/settings/import', {
            method: 'POST',
            body: JSON.stringify({ data: parsed.data || parsed }),
          });
          setImportStatus(`Success! Imported records: ${JSON.stringify(res.importedCounts)}`);
        } catch (err: any) {
          setImportStatus('Invalid JSON file format.');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('Import error:', err);
      setIsImporting(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      setIsDeletingAccount(true);
      await apiFetch('/api/settings/account', { method: 'DELETE' });
      alert('Account and data permanently deleted.');
      logout();
    } catch (err: any) {
      alert('Failed to delete account: ' + err.message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const accentOptions = [
    { id: 'indigo', label: 'Indigo Velvet', bg: 'bg-indigo-600' },
    { id: 'blue', label: 'Ocean Blue', bg: 'bg-blue-600' },
    { id: 'emerald', label: 'Emerald Mint', bg: 'bg-emerald-600' },
    { id: 'violet', label: 'Deep Violet', bg: 'bg-violet-600' },
    { id: 'rose', label: 'Rose Gold', bg: 'bg-rose-600' },
    { id: 'amber', label: 'Sunset Amber', bg: 'bg-amber-600' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Application Settings</h1>
          <p className="text-slate-400 text-sm">
            Manage your personal profile, account security, dark mode themes, custom reminder schedules, and database backups.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile & Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reminders System
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'appearance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Backup & Import/Export
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'danger' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Account
          </button>
        </div>
      </div>

      {/* Tab 1: Profile & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-400" /> Edit Profile & Picture
            </h3>

            {/* Avatar Preview & Upload */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 bg-slate-950 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-400">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-2 w-max">
                  <Camera className="w-3.5 h-3.5" /> Upload Profile Picture
                  <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-500">PNG, JPG or Data URL image</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Turner"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              {profileSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>

            {profileMessage && (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {profileMessage}
              </p>
            )}
          </form>

          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" /> Change Account Password
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>

            {passwordMessage && (
              <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {passwordMessage}
              </p>
            )}
          </form>

          {/* Change Email Address Card */}
          <form onSubmit={handleChangeEmail} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" /> Change Email Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300">Current Email</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newemail@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={emailSaving || !newEmail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              {emailSaving ? 'Updating Email...' : 'Update Email Address'}
            </button>

            {emailMessage && (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {emailMessage}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Notification & Reminder System */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" /> Custom Reminder Schedules
                </h3>
                <p className="text-xs text-slate-400">
                  Set customizable daily reminder times for Workout, Study, Water, Sleep, Goals, and Projects.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Enable Browser Notifications
              </button>
            </div>

            {testEmailMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {testEmailMsg}
              </div>
            )}

            {/* Reminder List Table */}
            <div className="space-y-3 pt-2">
              {reminders.map((r) => (
                <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs">
                      {r.category}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{r.title}</h4>
                      <p className="text-[10px] text-slate-500">Scheduled for daily reminder</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Time Picker */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={r.time}
                        onChange={(e) => handleUpdateReminder(r.id, { time: e.target.value })}
                        className="bg-transparent text-white text-xs focus:outline-none"
                      />
                    </div>

                    {/* Enable Toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) => handleUpdateReminder(r.id, { enabled: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Active</span>
                    </label>

                    {/* Test Email Button */}
                    <button
                      type="button"
                      onClick={() => handleTestEmailReminder(r.category)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 transition-all"
                    >
                      <Send className="w-3 h-3 text-blue-400" /> Send Test Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Appearance & Accent Colors */}
      {activeTab === 'appearance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" /> System Theme & Accent Color
              </h3>
              <p className="text-xs text-slate-400">Customize the high-density glass UI look and primary accent colors.</p>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300">Accent Color Themes</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {accentOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSavePreferences(opt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    accentColor === opt.id
                      ? 'bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${opt.bg} shrink-0`} />
                  <span className="text-xs font-semibold text-white">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Backup, Export & Import */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Database Backup & Import / Export
            </h3>
            <p className="text-xs text-slate-400">
              Export all user tasks, habits, goals, projects, study sessions, and health logs to a structured `.json` backup file or import a backup file to restore database entries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Export Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Download className="w-4 h-4 text-emerald-400" /> Export Database Backup
                </div>
                <p className="text-[11px] text-slate-400">
                  Generates an instant downloadable JSON file containing your complete LifeOS history.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  {isExporting ? 'Exporting...' : 'Download JSON Backup'}
                </button>
              </div>

              {/* Import Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Upload className="w-4 h-4 text-blue-400" /> Restore from JSON Backup
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload a previously exported `.json` file to restore all your database entities.
                </p>
                <label className="block cursor-pointer w-full text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20">
                  {isImporting ? 'Restoring Data...' : 'Select Backup File (.json)'}
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>

            {importStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-mono">
                {importStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Account Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Danger Zone - Account Deletion</h3>
          </div>
          <p className="text-xs text-slate-400">
            Permanently delete your account and remove all tasks, habits, goals, projects, study sessions, and health logs from the database. This action cannot be undone.
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs text-slate-300">
              Type <span className="font-mono text-rose-400 font-bold">DELETE</span> below to confirm account deletion:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-slate-900 border border-slate-800 text-rose-400 font-mono text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
              className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all ${
                deleteConfirmText === 'DELETE'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account & Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
