import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Eye,
  Check,
  Phone,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Sunset
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';

export default function Dashboard({ onNavigateToAppointments, onNavigateToPatients, onQuickWalkIn }) {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingId, setIsConfirmingId] = useState(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard');
      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto refresh every 30 seconds for live updates
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmWebsiteBooking = async (appointmentId) => {
    try {
      setIsConfirmingId(appointmentId);
      await api.patch(`/appointments/${appointmentId}/status`, { status: 'Confirmed' });
      success('Website booking confirmed! Patient record updated.');
      fetchMetrics();
    } catch (err) {
      error(err.message || 'Failed to confirm booking');
    } finally {
      setIsConfirmingId(null);
    }
  };

  const handleUpdateQueueStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      success(`Status updated to ${newStatus}`);
      fetchMetrics();
    } catch (err) {
      error(err.message || 'Failed to update status');
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh] text-content-subtle text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
          <span>Synchronizing live clinic data...</span>
        </div>
      </div>
    );
  }

  const {
    today = {},
    pendingWebsiteBookings = [],
    pendingWebsiteCount = 0,
    financials,
    inventoryAlerts = {}
  } = metrics || {};

  // Time-based greeting helper
  const getTimeGreetingInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return {
        greeting: 'Good morning',
        icon: Sunrise,
        iconColor: 'text-amber-400',
        tagline: 'Morning clinic sessions & patient registrations'
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good afternoon',
        icon: Sun,
        iconColor: 'text-amber-500',
        tagline: 'Afternoon dental procedures & consultations'
      };
    }
    if (hour >= 17 && hour < 22) {
      return {
        greeting: 'Good evening',
        icon: Sunset,
        iconColor: 'text-purple-400',
        tagline: 'Evening treatments, follow-ups & clinic queue'
      };
    }
    return {
      greeting: 'Good night',
      icon: Moon,
      iconColor: 'text-indigo-400',
      tagline: 'After-hours clinic portal & operations'
    };
  };

  const greetingInfo = getTimeGreetingInfo();
  const GreetingIcon = greetingInfo.icon;
  const isAttender = user?.role === 'ATTENDER';
  const displayName = user?.name || (isAttender ? 'Attender Staff' : "Dr. Arthi Mukeshkannan");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <GreetingIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${greetingInfo.iconColor}`} />
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-content-main">
                {greetingInfo.greeting},{' '}
                <span className={isAttender ? 'text-indigo-400 font-semibold' : 'text-purple-400 font-semibold'}>
                  {displayName}
                </span>
              </h1>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isAttender
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              {isAttender ? 'Attender / Reception' : 'Doctor / Admin'}
            </span>
          </div>
          <p className="text-xs text-content-subtle mt-1.5 flex items-center gap-1.5">
            <span>{greetingInfo.tagline}</span>
            <span>•</span>
            <span className="font-medium">Dr. Arthi's Dentophilic Centre</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onQuickWalkIn}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-in</span>
          </button>
        </div>
      </div>

      {/* ADMIN FINANCIAL METRICS (Strictly omitted for Attenders) */}
      {isAdmin && financials && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-card">
            <div className="flex items-center justify-between text-content-subtle text-xs mb-2">
              <span>Today's Collections</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-content-main font-mono">
              ₹{(financials.revenueToday || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Real-time settled
            </span>
          </div>

          <div className="p-5 rounded-2xl glass-card">
            <div className="flex items-center justify-between text-content-subtle text-xs mb-2">
              <span>Month Revenue</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-content-main font-mono">
              ₹{(financials.revenueThisMonth || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-purple-400 mt-1 block">Current billing cycle</span>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Pending Balances Due</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono">
              ₹{(financials.pendingBalancesDue || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Unpaid invoices</span>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Net Profit (This Month)</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300 font-mono">
              ₹{(financials.netProfitThisMonth || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              After ₹{(financials.expensesThisMonth || 0).toLocaleString('en-IN')} expenses
            </span>
          </div>
        </div>
      )}

      {/* OPERATIONS STATS (Both Roles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Today's Visits</div>
          <div className="text-2xl font-bold text-white font-mono">{today.total || 0}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">In Treatment</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{today.byStatus?.['In-Treatment'] || 0}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Completed Today</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{today.byStatus?.['Completed'] || 0}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Pending Web Bookings</div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{pendingWebsiteCount}</div>
        </div>
      </div>

      {/* REVENUE CHART (Admin Only) */}
      {isAdmin && financials?.monthlyTrend && financials.monthlyTrend.length > 0 && (
        <div className="p-6 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-content-main">Monthly Clinic Revenue Trend</h3>
            <span className="text-xs text-content-subtle font-mono">Last 6 Months</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financials.monthlyTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#a855f7" fontSize={11} />
                <YAxis stroke="#a855f7" fontSize={11} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID: PENDING WEBSITE BOOKINGS & TODAY'S PATIENT QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Website Bookings */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-content-main">Website Bookings (Live)</h3>
              {pendingWebsiteCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                  {pendingWebsiteCount} pending
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onNavigateToAppointments}
              className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer font-medium"
            >
              View all
            </button>
          </div>

          {pendingWebsiteBookings.length === 0 ? (
            <EmptyState
              title="No pending website bookings"
              description="New appointments booked by patients on the clinic website will immediately appear here for confirmation."
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {pendingWebsiteBookings.map(b => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-white text-sm">{b.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{b.referenceId} • {b.phone}</div>
                    </div>
                    <Badge status={b.status} />
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950/50 text-[11px] text-slate-300 space-y-1 mb-3">
                    <div><span className="text-slate-400">Treatment:</span> {b.service}</div>
                    <div><span className="text-slate-400">Slot:</span> {b.date} at {b.timeSlot}</div>
                    {b.message && (
                      <div className="italic text-slate-400 truncate">"{b.message}"</div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isConfirmingId === b.id}
                      onClick={() => handleConfirmWebsiteBooking(b.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isConfirmingId === b.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm & Register</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Today's Live Queue */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-content-main">Today's Patient Queue</h3>
              <p className="text-xs text-content-subtle">Active consultations and visits scheduled for today</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToAppointments}
              className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer font-medium"
            >
              Full Calendar
            </button>
          </div>

          {!today.queue || today.queue.length === 0 ? (
            <EmptyState
              title="No patients scheduled for today"
              description="Today's appointment queue is clear. Click 'New Walk-in' to register and seat a walk-in patient."
              actionLabel="New Walk-In Appointment"
              onAction={onQuickWalkIn}
            />
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {today.queue.map(apt => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                      <span className="text-[10px] font-mono font-bold text-content-main">{apt.timeSlot}</span>
                    </div>

                    <div>
                      <div className="font-semibold text-content-main text-sm flex items-center gap-2">
                        <span>{apt.name}</span>
                        {(apt.formattedPatientId || apt.patientId) && (
                          <span className="text-[10px] text-purple-400 font-mono">
                            {apt.formattedPatientId || `P-${String(apt.patientId).padStart(3, '0')}`}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {apt.service} • {apt.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge status={apt.status} />

                    {/* Quick status transition dropdown/buttons */}
                    {apt.status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQueueStatus(apt.id, 'In-Treatment')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] cursor-pointer"
                      >
                        Start Visit
                      </button>
                    )}

                    {apt.status === 'In-Treatment' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQueueStatus(apt.id, 'Completed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INVENTORY ALERTS (If any item is low stock) */}
      {inventoryAlerts.lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Inventory Notice:</strong> {inventoryAlerts.lowStockCount} items are running below minimum threshold level.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-300">Restock needed</span>
        </div>
      )}
    </div>
  );
}
