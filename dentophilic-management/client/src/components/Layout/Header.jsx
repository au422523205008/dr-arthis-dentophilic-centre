import React, { useState } from 'react';
import { Search, Plus, Bell, User, LogOut, KeyRound, Sparkles, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({
  onQuickWalkIn,
  pendingWebsiteCount = 0,
  onOpenPendingBookings,
  onSearch,
  searchQuery,
  onChangePassword
}) {
  const { user, logout, isAdmin } = useAuth();
  const { success } = useToast();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
  };

  const isAttender = user?.role === 'ATTENDER';
  const displayName = user?.name || (isAttender ? 'Attender Staff' : "Dr. Arthi Mukeshkannan");
  const roleDisplay = isAttender ? 'Attender / Reception' : 'Doctor / Admin';
  const roleSubtitle = isAttender ? 'Front Desk & Patient Flow' : 'Chief Dental Surgeon';

  const getInitials = (name, username) => {
    if (name) {
      const clean = name.replace(/^Dr\.\s*/i, '').trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return clean.slice(0, 2).toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return 'DA';
  };

  const initials = getInitials(user?.name, user?.username);

  return (
    <header className="h-16 glass-panel border-b px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 opacity-70" />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={e => onSearch && onSearch(e.target.value)}
          placeholder="Search patient name, phone, ID (e.g. P-001) or Ref #..."
          className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm placeholder:text-slate-400"
        />
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl glass-card hover:border-purple-500/50 text-purple-400 hover:text-purple-300 transition-all cursor-pointer"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-600" />}
        </button>

        {/* Pending Website Bookings Alert Pill */}
        {pendingWebsiteCount > 0 && (
          <button
            type="button"
            onClick={onOpenPendingBookings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-pulse transition-all cursor-pointer"
            title="Click to view and confirm pending bookings from website"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{pendingWebsiteCount} Website Bookings</span>
            <span className="sm:hidden">{pendingWebsiteCount}</span>
          </button>
        )}

        {/* Quick Walk-In Button */}
        <button
          type="button"
          onClick={onQuickWalkIn}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>

        {/* Profile Menu Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl glass-card hover:border-purple-500/50 transition-colors cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                isAttender
                  ? 'bg-indigo-600/25 text-indigo-400 dark:text-indigo-300 border-indigo-500/40'
                  : 'bg-purple-600/25 text-purple-400 dark:text-purple-300 border-purple-500/40'
              }`}
            >
              {initials}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="text-xs font-semibold block max-w-[140px] truncate text-content-main">
                {displayName}
              </span>
              <span className={`text-[10px] font-mono block ${isAttender ? 'text-indigo-400' : 'text-purple-400'}`}>
                {roleDisplay}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl py-2 z-50 text-xs border border-purple-500/30"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-3 border-b border-purple-900/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                      isAttender
                        ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40'
                        : 'bg-purple-600/25 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate text-content-main">{displayName}</div>
                    <div className="text-[11px] text-content-subtle font-mono truncate">@{user?.username || 'user'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isAttender
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {roleDisplay}
                  </span>
                  <span className="text-[10px] text-content-subtle truncate">• {roleSubtitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onChangePassword && onChangePassword();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-purple-600/15 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-purple-600/15 transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-purple-600" />}
                <span>Theme: {isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border-t border-purple-900/20 mt-1"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
