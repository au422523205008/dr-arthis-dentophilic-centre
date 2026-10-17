import React from 'react';

const STATUS_VARIANTS = {
  // Appointment statuses
  Pending: 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/30',
  Confirmed: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
  'In-Treatment': 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  Cancelled: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',
  'No-show': 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30',

  // Invoice / Payment statuses
  PAID: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  PARTIAL: 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/30',
  UNPAID: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',

  // Roles
  ADMIN: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30 font-mono',
  ATTENDER: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30 font-mono',

  // General
  ACTIVE: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  DISABLED: 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30'
};

export default function Badge({ status, variant, className = '' }) {
  const appliedClass = variant || STATUS_VARIANTS[status] || 'bg-purple-900/20 text-purple-400 border-purple-700/30';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${appliedClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
}
