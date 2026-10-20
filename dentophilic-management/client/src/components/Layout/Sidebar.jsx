import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  CreditCard,
  PhoneCall,
  Package,
  Receipt,
  BarChart3,
  UserCheck,
  History,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, pendingWebsiteCount = 0 }) {
  const { user, isAdmin, hasPermission } = useAuth();

  // Navigation items with role permissions
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: pendingWebsiteCount > 0 ? pendingWebsiteCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      badge: pendingWebsiteCount > 0 ? `${pendingWebsiteCount} new` : null,
      badgeColor: 'bg-purple-600'
    },
    {
      id: 'patients',
      label: 'Patients (EMR)',
      icon: Users
    },
    {
      id: 'treatments',
      label: 'Treatments & Services',
      icon: Stethoscope
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions (Rx)',
      icon: FileText
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: CreditCard
    },
    {
      id: 'follow-ups',
      label: 'Follow-ups & Recalls',
      icon: PhoneCall
    },
    {
      id: 'inventory',
      label: 'Dental Inventory',
      icon: Package
    },
    // Admin-Only Modules
    {
      id: 'expenses',
      label: 'Clinic Expenses',
      icon: Receipt,
      adminOnly: true,
      permission: 'VIEW_EXPENSES'
    },
    {
      id: 'reports',
      label: 'Reports & P&L',
      icon: BarChart3,
      adminOnly: true,
      permission: 'VIEW_FINANCES'
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: UserCheck,
      adminOnly: true,
      permission: 'MANAGE_STAFF'
    },
    {
      id: 'audit-logs',
      label: 'Audit Trail',
      icon: History,
      adminOnly: true,
      permission: 'VIEW_AUDIT_LOGS'
    },
    {
      id: 'recycle-bin',
      label: 'Recycle Bin',
      icon: Trash2,
      adminOnly: true,
      permission: 'PERMANENT_DELETE'
    },
    {
      id: 'settings',
      label: 'Settings & Theme',
      icon: Settings,
      adminOnly: true,
      permission: 'MANAGE_SETTINGS'
    }
  ];

  const visibleNav = navItems.filter(item => {
    if (!item.adminOnly) return true;
    if (isAdmin) return true;
    if (item.permission && hasPermission(item.permission)) return true;
    return false;
  });

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out glass-panel border-r flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-purple-100 dark:border-purple-900/20">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-purple-200 dark:border-purple-600/40 flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/10">
                <img
                  src="/clinic-logo.jpg"
                  alt="Dr. Arthi's Dentophilic Centre Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="leading-tight truncate">
                <span className="font-serif font-bold text-sm truncate block text-slate-900 dark:text-purple-100">
                  Dentophilic Centre
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium tracking-wide block truncate">
                  Dr. Arthi Mukeshkannan
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-white p-1 border border-purple-200 dark:border-purple-600/40 flex items-center justify-center shadow-sm">
              <img
                src="/clinic-logo.jpg"
                alt="Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:text-slate-400 dark:hover:text-purple-400 dark:hover:bg-purple-500/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-sm dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40 dark:shadow-purple-600/10'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 border border-transparent dark:text-slate-400 dark:hover:text-purple-300 dark:hover:bg-purple-500/10'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-purple-700 dark:text-purple-400'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 animate-pulse ${item.badgeColor || 'bg-purple-600'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Role Badge */}
      <div className="p-3 border-t border-purple-100 dark:border-purple-900/20">
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl glass-card ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isAdmin
                ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40'
                : 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="truncate text-left leading-tight">
              <div className="text-xs font-semibold truncate text-slate-800 dark:text-content-main">
                {user?.name || (isAdmin ? "Dr. Arthi Mukeshkannan" : 'Attender Staff')}
              </div>
              <div className={`text-[10px] font-mono ${isAdmin ? 'text-purple-700 dark:text-purple-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                {user?.role === 'ATTENDER' ? 'Attender / Reception' : 'Doctor / Admin'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
