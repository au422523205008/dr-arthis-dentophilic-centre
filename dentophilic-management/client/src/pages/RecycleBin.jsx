import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';

export default function RecycleBin() {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      setIsLoading(true);
      let query = '';
      if (filterEntity !== 'ALL') query = `?entity=${filterEntity}`;
      const res = await api.get(`/recycle-bin${query}`);
      if (res.success) {
        setItems(res.items || []);
      }
    } catch (err) {
      console.error('Failed to load recycle bin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, [filterEntity]);

  const handleRestore = async (entityKey, id, title) => {
    try {
      await api.post(`/recycle-bin/restore/${entityKey}/${id}`);
      success(`Restored "${title}" successfully`);
      fetchDeleted();
    } catch (err) {
      error(err.message || 'Failed to restore record');
    }
  };

  const handlePermanentDelete = async (entityKey, id, title) => {
    if (!window.confirm(`PERMANENT DELETION WARNING: Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/recycle-bin/permanent/${entityKey}/${id}`);
      success(`"${title}" permanently deleted from database`);
      fetchDeleted();
    } catch (err) {
      error(err.message || 'Failed to permanently delete item');
    }
  };

  const canPermanentDelete = isAdmin || hasPermission('PERMANENT_DELETE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
          <span>Clinic Recycle Bin</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            Soft Delete Protection
          </span>
        </h1>
        <p className="text-xs text-content-subtle mt-1">
          Safeguards clinic records against accidental loss. Soft-deleted items can be restored with a single click.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'ALL', label: 'All Deleted Items' },
          { id: 'appointment', label: 'Appointments' },
          { id: 'patient', label: 'Patients' },
          { id: 'invoice', label: 'Invoices' },
          { id: 'expense', label: 'Expenses' },
          { id: 'service', label: 'Services' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'user', label: 'Staff Accounts' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterEntity(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filterEntity === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">Scanning Recycle Bin...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Recycle bin is clean"
            description="No deleted records found. When items are removed, they will appear here safely for restoration."
          />
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {items.map(it => (
              <div
                key={`${it.entityKey}-${it.id}`}
                className="p-4 sm:p-5 hover:bg-purple-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      {it.entityType}
                    </span>
                    <span className="font-semibold text-content-main text-sm">{it.title}</span>
                  </div>

                  <div className="text-content-subtle text-[11px] mt-1 font-mono">
                    Deleted on {new Date(it.deletedAt).toLocaleString()} by {it.deletedByName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(it.entityKey, it.id, it.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Record</span>
                  </button>

                  {canPermanentDelete && (
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(it.entityKey, it.id, it.title)}
                      className="px-3 py-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold cursor-pointer transition-colors"
                      title="Permanently remove from database"
                    >
                      Delete Forever
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
