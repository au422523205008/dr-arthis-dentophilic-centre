import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneCall,
  Calendar,
  Clock,
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  User
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function FollowUps() {
  const { success, error } = useToast();

  const [followUps, setFollowUps] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'due_today' | 'overdue' | 'upcoming'

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'Post-Procedure Care Check',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let query = '';
      if (filterType !== 'ALL') query = `?filter=${filterType}`;

      const [fuRes, patRes] = await Promise.all([
        api.get(`/follow-ups${query}`),
        api.get('/patients?limit=200')
      ]);

      if (fuRes.success) setFollowUps(fuRes.followUps || []);
      if (patRes.success) setPatients(patRes.patients || []);
    } catch (err) {
      console.error('Failed to load follow ups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.dueDate) {
      error('Please select patient and due date');
      return;
    }
    try {
      const res = await api.post('/follow-ups', {
        ...formData,
        patientId: parseInt(formData.patientId, 10)
      });
      success(res.message || 'Follow-up scheduled successfully');
      setIsCreateModalOpen(false);
      setFormData({
        patientId: '',
        dueDate: new Date().toISOString().split('T')[0],
        type: 'Post-Procedure Care Check',
        notes: ''
      });
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to schedule follow up');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/follow-ups/${id}`, { status });
      success(`Follow-up marked as ${status}`);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to update follow-up');
    }
  };

  const handleOpenWhatsApp = async (fu) => {
    try {
      const res = await api.post('/follow-ups/whatsapp-template', {
        type: fu.type === '6-Month Recall' ? 'SIX_MONTH_RECALL' : 'FOLLOW_UP_CARE',
        patientName: fu.patientName,
        phone: fu.patientPhone,
        date: fu.dueDate
      });
      if (res.success && res.waUrl) {
        window.open(res.waUrl, '_blank');
      }
    } catch (err) {
      error('Failed to open WhatsApp');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Patient Follow-ups & Recalls
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Automate post-treatment care check-ins and 6-month routine cleaning recalls via click-to-chat WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: 'ALL', label: 'All Follow-ups' },
          { id: 'due_today', label: 'Due Today' },
          { id: 'overdue', label: 'Overdue Reminders' },
          { id: 'upcoming', label: 'Upcoming' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              filterType === tab.id
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
          <div className="p-12 text-center text-content-subtle text-sm">Loading reminders...</div>
        ) : followUps.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No follow-up reminders pending"
            description="All patient check-ins and recalls are up to date. Schedule a reminder when completing visits."
            actionLabel="Schedule Follow-up"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {followUps.map(fu => (
              <div
                key={fu.id}
                className="p-5 hover:bg-purple-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-content-main text-sm">{fu.patientName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 font-mono text-[10px] text-purple-700 dark:text-purple-400 border border-purple-500/20">
                      {fu.formattedPatientId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold text-[10px]">
                      {fu.type}
                    </span>
                  </div>

                  <div className="text-content-subtle text-[11px] mt-1 font-mono flex items-center gap-2">
                    <span>Due Date: <strong className="text-content-main">{fu.dueDate}</strong></span>
                    <span>•</span>
                    <span>{fu.patientPhone}</span>
                  </div>

                  {fu.notes && (
                    <p className="text-content-subtle text-[11px] mt-1 italic">
                      "{fu.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge status={fu.status} />

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(fu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {fu.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(fu.id, 'Completed')}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-semibold cursor-pointer"
                    >
                      Mark Contacted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Follow-up Reminder"
        subtitle="Queue a routine checkup or clinical post-op care reminder."
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={e => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
            >
              <option value="">Choose patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reminder Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
              >
                <option value="Post-Procedure Care Check">Post-Procedure Care Check</option>
                <option value="6-Month Recall">6-Month Routine Cleaning Recall</option>
                <option value="Suture Removal">Suture Removal</option>
                <option value="Crown / Cap Fitting">Crown / Cap Fitting</option>
                <option value="Aligner Progress Review">Aligner Progress Review</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Care Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Check for swelling or post-op pain after extraction..."
              className="w-full p-2.5 rounded-xl glass-input text-slate-900 dark:text-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Schedule Reminder
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
