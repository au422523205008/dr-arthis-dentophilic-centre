import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  User,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/Common/EmptyState';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ actions: [], entityTypes: [] });
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchFilters = async () => {
    try {
      const res = await api.get('/audit-logs/filters');
      if (res.success) {
        setFilters({ actions: res.actions || [], entityTypes: res.entityTypes || [] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      let query = `?page=${page}&limit=50`;
      if (selectedAction) query += `&action=${selectedAction}`;
      if (selectedEntity) query += `&entityType=${selectedEntity}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(`/audit-logs${query}`);
      if (res.success) {
        setLogs(res.logs || []);
        setPagination(res.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [selectedAction, selectedEntity, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-content-main flex items-center gap-2">
          <span>Immutable Audit Trail</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans">
            Tamper-Proof Ledger
          </span>
        </h1>
        <p className="text-xs text-content-subtle mt-1">
          Every critical modification, appointment cancellation, prescription, and user session action is permanently recorded.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
          >
            <option value="">All Actions</option>
            {filters.actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={selectedEntity}
            onChange={e => setSelectedEntity(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
          >
            <option value="">All Entities</option>
            {filters.entityTypes.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Inspecting immutable audit logs...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events found"
            description="All system activities, logins, and data modifications will generate immutable timestamped records here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-purple-900 dark:text-purple-300 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-content-main">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-4 font-mono text-content-subtle text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-content-main">{log.userName}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">{log.userRole || 'SYSTEM'}</div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-content-main whitespace-nowrap">
                      {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                    </td>

                    <td className="p-4 max-w-md">
                      <div className="text-[11px] text-content-subtle font-mono truncate">
                        {log.newValues ? JSON.stringify(log.newValues) : (log.oldValues ? `Old: ${JSON.stringify(log.oldValues)}` : '-')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-content-subtle px-2">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
