import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Database,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  Building,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Palette,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import EmptyState from '../components/Common/EmptyState';
import Badge from '../components/Common/Badge';

export default function SettingsAndBackup() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const { theme, isDark, isLight, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('THEME'); // 'THEME' | 'BACKUPS' | 'PROFILE'
  const [backups, setBackups] = useState([]);
  const [dbPath, setDbPath] = useState('');
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [bRes, sRes] = await Promise.all([
        api.get('/backups'),
        api.get('/settings')
      ]);

      if (bRes.success) {
        setBackups(bRes.backups || []);
        setDbPath(bRes.databasePath || '');
      }
      if (sRes.success) {
        setSettings(sRes.settings || {});
      }
    } catch (err) {
      console.error('Failed to load settings & backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const res = await api.post('/backups/create');
      success(res.message || 'Database snapshot created successfully');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create snapshot');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const blob = await api.get(`/backups/download/${encodeURIComponent(filename)}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`Downloaded ${filename}`);
    } catch (err) {
      error(err.message || 'Failed to download snapshot');
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (!window.confirm(`CRITICAL RESTORE WARNING: Restoring from snapshot "${filename}" will replace the current active database. A safety snapshot will be created automatically. Proceed?`)) return;

    try {
      setIsRestoring(true);
      const res = await api.post('/backups/restore', { filename });
      success(res.message || 'Database restored successfully');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      success('Clinic configuration updated');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif">
            Clinic Settings & System Customization
          </h1>
          <p className="text-xs opacity-75 mt-1">
            Configure system themes (Dark/Light Purple), manage automated SQLite snapshots, and edit clinic details.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-purple-900/20 pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('THEME')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'THEME'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BACKUPS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'BACKUPS'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups & Disaster Recovery ({backups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Clinic Profile & Schedule</span>
        </button>
      </div>

      {/* TAB 1: APPEARANCE & THEME (NEW FEATURE) */}
      {activeTab === 'THEME' && (
        <div className="space-y-6 max-w-4xl">
          <div className="glass-panel p-6 rounded-2xl border space-y-6">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <span>Theme Mode Customization</span>
              </h2>
              <p className="text-xs opacity-75 mt-1">
                Select your preferred visual style. The theme automatically synchronizes across all navigation bars, tables, charts, dialogs, and odontogram views.
              </p>
            </div>

            {/* Theme Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dark Theme Card */}
              <div
                onClick={() => {
                  setTheme('dark');
                  success('Dark theme activated: Obsidian Purple');
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  isDark
                    ? 'border-purple-500 bg-purple-950/40 shadow-xl shadow-purple-950/50 ring-2 ring-purple-500/50'
                    : 'border-slate-200 dark:border-purple-900/30 bg-slate-50 dark:bg-slate-900/40 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-content-main">Obsidian Purple (Dark)</h3>
                      <span className="text-[11px] text-purple-500 dark:text-purple-300/80">Default Clinical Mode</span>
                    </div>
                  </div>
                  {isDark && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-content-subtle leading-relaxed mb-4">
                  Rich dark plum & obsidian background with glowing violet highlights. Optimal for clinical rooms and evening reception shifts.
                </p>

                {/* Preview miniature */}
                <div className="p-3 rounded-xl bg-[#090518] border border-purple-900/40 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-purple-300 font-bold">Dr. Arthi's Dentophilic</span>
                    <Badge status="Confirmed" />
                  </div>
                  <div className="h-1.5 w-full bg-purple-950 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-purple-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Light Theme Card */}
              <div
                onClick={() => {
                  setTheme('light');
                  success('Light theme activated: Lavender Clean');
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  isLight
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-xl shadow-purple-600/15 ring-2 ring-purple-600/40'
                    : 'border-slate-200 dark:border-purple-900/20 bg-slate-50 dark:bg-slate-800/20 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-content-main">Lavender Pearl (Light)</h3>
                      <span className="text-[11px] opacity-75">Clean Medical Daylight</span>
                    </div>
                  </div>
                  {isLight && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-content-subtle leading-relaxed mb-4">
                  Pristine bright clinic aesthetic with soft lavender cream cards, high-contrast dark violet text, and purple dental accents.
                </p>

                {/* Preview miniature */}
                <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2 text-slate-800 shadow-sm">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-purple-900 font-bold">Dr. Arthi's Dentophilic</span>
                    <Badge status="Confirmed" />
                  </div>
                  <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-purple-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Palette Info */}
            <div className="p-4 rounded-xl glass-card flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-sm" />
                <div>
                  <span className="font-semibold block">Primary Accent Palette</span>
                  <span className="text-[11px] opacity-75">Royal Violet & Amethyst Purple (#9333EA)</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-400">Active Palette</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BACKUPS */}
      {activeTab === 'BACKUPS' && (
        <div className="space-y-6">
          {/* Active Database Info Card */}
          <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Single Shared Database (WAL Mode Active)</span>
              </div>
              <p className="text-xs font-mono mt-1 break-all opacity-85">
                {dbPath || 'appointments.db'}
              </p>
              <p className="text-[11px] opacity-75 mt-2">
                Automated daily snapshots run automatically every 24 hours. Retention: Last 30 daily snapshots + permanent monthly archives.
              </p>
            </div>

            <button
              type="button"
              disabled={isCreatingBackup}
              onClick={handleCreateBackup}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isCreatingBackup ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>Create Snapshot Now</span>
            </button>
          </div>

          {/* Backup Snapshots List */}
          <div className="glass-panel rounded-2xl border overflow-hidden">
            <div className="p-4 border-b border-purple-900/20 flex items-center justify-between">
              <span className="font-bold text-sm">Stored Snapshots ({backups.length})</span>
              <span className="text-xs opacity-75">Stored in /server/backups/</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center opacity-75 text-sm">Scanning snapshots...</div>
            ) : backups.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No backup snapshots found"
                description="Click 'Create Snapshot Now' above to generate your first transactional SQLite snapshot."
                actionLabel="Create Snapshot"
                onAction={handleCreateBackup}
              />
            ) : (
              <div className="divide-y divide-purple-900/20">
                {backups.map(b => (
                  <div
                    key={b.filename}
                    className="p-4 sm:p-5 hover:bg-purple-600/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{b.filename}</span>
                        {b.isAuto ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold border border-indigo-500/30">
                            Automated Daily
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-semibold border border-purple-500/30">
                            Manual Snapshot
                          </span>
                        )}
                      </div>
                      <div className="opacity-75 text-[11px] mt-1 font-mono">
                        Created on {new Date(b.createdAt).toLocaleString()} • Size: {b.sizeFormatted}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(b.filename)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card hover:border-purple-500/50 font-semibold cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>Download DB</span>
                      </button>

                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={() => handleRestoreBackup(b.filename)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-semibold cursor-pointer transition-colors"
                        title="Restore database from this snapshot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC PROFILE & SETTINGS */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border space-y-4 text-xs max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Clinic Name</label>
              <input
                type="text"
                value={settings.clinicName || "Dr. Arthi's Dentophilic Centre"}
                onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-serif font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Chief Doctor Name & Qualifications</label>
              <input
                type="text"
                value={settings.doctorName || "Dr. Arthi Mukeshkannan, B.D.S"}
                onChange={e => setSettings({ ...settings, doctorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">TNDC Regd No.</label>
              <input
                type="text"
                value={settings.doctorRegNo || "31263"}
                onChange={e => setSettings({ ...settings, doctorRegNo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Primary Mobile</label>
              <input
                type="text"
                value={settings.phone || "+91 95971 26248"}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email || "drarthidentophilic@gmail.com"}
                onChange={e => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Clinic Address</label>
            <textarea
              rows={2}
              value={settings.address || "1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Hosur - 635109, Tamil Nadu"}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full p-2.5 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Working Hours (Mon - Sat)</label>
              <input
                type="text"
                value={settings.workingHours || "09:30 AM - 01:30 PM, 04:30 PM - 08:30 PM"}
                onChange={e => setSettings({ ...settings, workingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Sunday Schedule</label>
              <input
                type="text"
                value={settings.sundayHours || "10:00 AM - 01:00 PM (By Appointment Only)"}
                onChange={e => setSettings({ ...settings, sundayHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-purple-900/20">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Clinic Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
