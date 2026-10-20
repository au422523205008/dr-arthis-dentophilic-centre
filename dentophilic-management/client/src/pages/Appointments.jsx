import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Phone,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

const TIME_SLOTS = [
  '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

export default function Appointments({ initialTab = 'ALL', onStartTreatment, onIssueBill }) {
  const { user, isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(initialTab === 'PENDING_WEBSITE' ? 'Pending' : 'ALL');
  const [filterSource, setFilterSource] = useState(initialTab === 'PENDING_WEBSITE' ? 'Website' : 'ALL');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Slot availability
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Not Specified',
    service: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    message: '',
    source: 'Walk-in / Clinic'
  });

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      let query = `?limit=100`;
      if (filterStatus !== 'ALL') query += `&status=${filterStatus}`;
      if (filterSource !== 'ALL') query += `&source=${filterSource}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedDate) query += `&date=${selectedDate}`;

      const res = await api.get(`/appointments${query}`);
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/treatments/services');
      if (res.success && res.services) {
        setServices(res.services);
        if (res.services.length > 0 && !formData.service) {
          setFormData(prev => ({ ...prev, service: res.services[0].name }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus, filterSource, selectedDate]);

  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch slot availability whenever date or modal opens
  useEffect(() => {
    if (!formData.date || !isCreateModalOpen) return;
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setIsLoadingSlots(true);
        const res = await api.get(`/appointments/availability?date=${formData.date}`);
        if (isMounted && res.success) {
          const booked = res.bookedSlots || [];
          setBookedSlots(booked);
          const available = TIME_SLOTS.filter(s => !booked.includes(s));
          // If the currently selected time slot is already booked, pick the first available one
          if (booked.includes(formData.timeSlot) || !formData.timeSlot) {
            setFormData(prev => ({
              ...prev,
              timeSlot: available.length > 0 ? available[0] : ''
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch slot availability:', err);
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };
    fetchAvailability();
    return () => { isMounted = false; };
  }, [formData.date, isCreateModalOpen]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', formData);
      success(res.message || 'Appointment created successfully');
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Not Specified',
        service: services[0]?.name || 'General Dental Consultation',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM',
        message: '',
        source: 'Walk-in / Clinic'
      });
      fetchAppointments();
    } catch (err) {
      error(err.message || 'Failed to create appointment');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      success(res.message || `Status updated to ${status}`);
      fetchAppointments();
    } catch (err) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;
    try {
      await api.patch(`/appointments/${selectedAppointment.id}/status`, {
        status: 'Cancelled',
        cancelReason: cancelReason || 'Cancelled by staff'
      });
      success('Appointment marked as cancelled');
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err) {
      error(err.message || 'Failed to cancel appointment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to move this appointment to Recycle Bin?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      success('Appointment moved to Recycle Bin');
      fetchAppointments();
    } catch (err) {
      error(err.message || 'Failed to delete appointment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Appointment Bookings
          </h1>
          <p className="text-xs text-content-subtle mt-1">
            Manage online website bookings, walk-ins, consultations and schedule queue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'Pending', 'Confirmed', 'In-Treatment', 'Completed', 'Cancelled'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
              }`}
            >
              {s === 'ALL' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {/* Source Filter & Date Selector */}
        <div className="flex items-center gap-2.5">
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website Only</option>
            <option value="Walk-in / Clinic">Walk-in / Phone</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs"
          />

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-content-subtle hover:text-content-main"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments match criteria"
            description="No bookings found for the selected filters. Use 'New Appointment' to book a slot."
            actionLabel="Book Walk-in Patient"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 text-purple-900 dark:bg-slate-950/60 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[var(--border-main)] font-semibold">
                <tr>
                  <th className="p-4">Reference & Patient</th>
                  <th className="p-4">Date & Slot</th>
                  <th className="p-4">Treatment</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)] text-content-main">
                {appointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-purple-500/5 transition-colors border-b border-[var(--border-main)]">
                    <td className="p-4">
                      <div className="font-semibold text-content-main text-sm">{apt.name}</div>
                      <div className="text-content-subtle text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-purple-400 font-semibold">{apt.referenceId}</span>
                        <span>•</span>
                        <span>{apt.phone}</span>
                        {apt.age && <span>• {apt.age}y</span>}
                        {apt.gender && <span>• {apt.gender}</span>}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-content-main">{apt.date}</div>
                      <div className="text-content-subtle text-[11px] font-mono">{apt.timeSlot}</div>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-purple-400">{apt.service}</span>
                      {apt.message && (
                        <p className="text-[11px] text-content-subtle truncate max-w-xs mt-0.5 italic">
                          "{apt.message}"
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                          apt.source === 'Website'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-purple-500/10 text-content-subtle border-purple-500/20'
                        }`}
                      >
                        {apt.source}
                      </span>
                    </td>

                    <td className="p-4">
                      <Badge status={apt.status} />
                      {apt.cancelReason && (
                        <div className="text-[10px] text-rose-400 mt-1 italic">
                          Reason: {apt.cancelReason}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {apt.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}

                      {apt.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(apt.id, 'In-Treatment')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Seat Patient
                        </button>
                      )}

                      {apt.status === 'In-Treatment' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer"
                        >
                          Finish
                        </button>
                      )}

                      {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setIsCancelModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-rose-400 text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Clinical Actions */}
                      {onStartTreatment && (
                        <button
                          type="button"
                          onClick={() => onStartTreatment(apt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                          title="Record Clinical Visit Notes"
                        >
                          Clinical Notes
                        </button>
                      )}

                      {/* Admin delete */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(apt.id)}
                          className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-[11px] cursor-pointer"
                          title="Delete appointment"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE APPOINTMENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Appointment"
        subtitle="Book a walk-in, phone reservation or upcoming clinical consultation."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-content-main mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-content-main mb-1">Mobile Number (10 Digits) *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-content-main mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                placeholder="32"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-content-main mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-content-main mb-1">Booking Source</label>
              <select
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              >
                <option value="Walk-in / Clinic">Walk-in / Clinic</option>
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Treatment / Dental Procedure *</label>
            <select
              required
              value={formData.service}
              onChange={e => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            >
              {services.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} (₹{s.price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-content-main mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-content-main">Time Slot *</label>
                <span className="text-[10px] text-purple-500 font-medium">
                  {TIME_SLOTS.filter(s => !bookedSlots.includes(s)).length} Available
                </span>
              </div>
              <select
                required
                value={formData.timeSlot}
                onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                disabled={TIME_SLOTS.filter(s => !bookedSlots.includes(s)).length === 0}
              >
                {TIME_SLOTS.filter(s => !bookedSlots.includes(s)).length === 0 ? (
                  <option value="">No slots available for this date</option>
                ) : (
                  <>
                    <option value="" disabled>-- Select Time Slot --</option>
                    {TIME_SLOTS.filter(s => !bookedSlots.includes(s)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </>
                )}
              </select>
              {TIME_SLOTS.filter(s => !bookedSlots.includes(s)).length === 0 && (
                <p className="text-amber-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> All slots for this date are already booked.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Doctor / Receptionist Notes</label>
            <textarea
              rows={2}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="Chief complaint or symptoms reported by patient..."
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={TIME_SLOTS.filter(s => !bookedSlots.includes(s)).length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Schedule Appointment
            </button>
          </div>
        </form>
      </Modal>

      {/* CANCEL MODAL */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
        subtitle="Please specify a reason for cancellation (required for clinic audit trail)."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to cancel the booking for <strong>{selectedAppointment?.name}</strong> on {selectedAppointment?.date} at {selectedAppointment?.timeSlot}?
          </p>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Reason for Cancellation *</label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Patient requested reschedule, emergency out of station..."
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
