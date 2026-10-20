import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';

export default function Reports() {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingType, setExportingType] = useState(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports/financial');
      if (res.success) {
        setReportData(res.reports);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = async (type) => {
    try {
      setExportingType(type);
      const blob = await api.get(`/reports/export/csv?type=${type}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dentophilic-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`${type.toUpperCase()} database exported as CSV`);
    } catch (err) {
      error(err.message || 'Export failed');
    } finally {
      setExportingType(null);
    }
  };

  if (isLoading || !reportData) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Generating financial and clinical performance reports...
      </div>
    );
  }

  const {
    summary = {},
    monthlyTrends = [],
    topTreatments = []
  } = reportData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Clinic Reports & Analytics
          </h1>
          <p className="text-xs text-content-subtle mt-1">
            Executive financial statements, monthly revenue vs expense P&L, procedure demand, and CSV backups.
          </p>
        </div>

        {/* CSV Export Quick Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={exportingType === 'patients'}
            onClick={() => handleExportCsv('patients')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>Export Patients</span>
          </button>

          <button
            type="button"
            disabled={exportingType === 'appointments'}
            onClick={() => handleExportCsv('appointments')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>Export Appointments</span>
          </button>

          <button
            type="button"
            disabled={exportingType === 'invoices'}
            onClick={() => handleExportCsv('invoices')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Invoices CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-content-subtle text-xs mb-1">
            <span>Gross Revenue (All Time)</span>
            <DollarSign className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-content-main font-mono">
            ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-purple-500 dark:text-purple-400 mt-1 block">Invoiced collections</span>
        </div>

        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-content-subtle text-xs mb-1">
            <span>Clinic Expenditures</span>
            <TrendingDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-300 font-mono">
            ₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-content-subtle mt-1 block">Supplies, lab fees, utilities</span>
        </div>

        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-content-subtle text-xs mb-1">
            <span>Net Operating Profit</span>
            <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{(summary.netProfit || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">After all recorded expenses</span>
        </div>

        <div className="p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-content-subtle text-xs mb-1">
            <span>Outstanding Due</span>
            <CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-300 font-mono">
            ₹{(summary.totalBalanceDue || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-content-subtle mt-1 block">Uncollected patient balances</span>
        </div>
      </div>

      {/* MONTHLY REVENUE VS EXPENSES COMPARISON CHART */}
      <div className="p-6 rounded-2xl glass-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-content-main">Monthly Revenue vs Overhead Expenses</h3>
            <p className="text-xs text-content-subtle">Comparison of cash intake vs operating overhead</p>
          </div>
        </div>

        {monthlyTrends.length === 0 ? (
          <EmptyState
            title="No financial trends to display"
            description="As invoices are settled and expenses are logged, monthly performance charts will populate automatically."
          />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a855f7" opacity={0.2} />
                <XAxis dataKey="month" stroke="#a855f7" fontSize={11} />
                <YAxis stroke="#a855f7" fontSize={11} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  formatter={(val, name) => [`₹${val.toLocaleString('en-IN')}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (₹)" fill="#9333ea" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses (₹)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TOP TREATMENTS DEMAND */}
      <div className="p-6 rounded-2xl glass-panel">
        <h3 className="text-sm font-bold text-content-main mb-4">Top Treatments & Procedures Performed</h3>
        {topTreatments.length === 0 ? (
          <EmptyState
            title="No treatment statistics yet"
            description="Clinical visit records will aggregate demand analytics here."
          />
        ) : (
          <div className="space-y-3">
            {topTreatments.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl glass-card">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-content-main">{t.serviceName}</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-content-subtle">{t.count} visits</span>
                  <span className="font-bold text-emerald-400">₹{(t.totalRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
