import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import { api } from './services/api';

// Pages
import FirstRunSetup from './pages/FirstRunSetup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Treatments from './pages/Treatments';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import FollowUps from './pages/FollowUps';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import AuditLog from './pages/AuditLog';
import RecycleBin from './pages/RecycleBin';
import SettingsAndBackup from './pages/SettingsAndBackup';

// Layout & Common Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Modal from './components/Common/Modal';
import Badge from './components/Common/Badge';
import AICopilot from './components/AI/AICopilot';

const TIME_SLOTS = [
  '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

function MainApp() {
  const { user, isAuthenticated, isLoading, hasAdmin, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [pendingWebsiteCount, setPendingWebsiteCount] = useState(0);

  // Cross-module states
  const [activePatientForAction, setActivePatientForAction] = useState(null);

  // Global Modals
  const [isQuickWalkInOpen, setIsQuickWalkInOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPendingBookingsModalOpen, setIsPendingBookingsModalOpen] = useState(false);
  const [pendingBookingsList, setPendingBookingsList] = useState([]);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Quick Walk-In Form
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Not Specified',
    service: 'General Dental Consultation',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    message: '',
    source: 'Walk-in / Clinic'
  });

  const [walkInBookedSlots, setWalkInBookedSlots] = useState([]);
  const [isLoadingWalkInSlots, setIsLoadingWalkInSlots] = useState(false);

  const [servicesList, setServicesList] = useState([]);

  // Live polling for pending website bookings
  const checkPendingBookings = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/appointments/pending-website');
      if (res.success) {
        const count = (res.appointments || []).length;
        setPendingWebsiteCount(count);
        setPendingBookingsList(res.appointments || []);
      }
    } catch (e) {
      // background sync
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkPendingBookings();
      const interval = setInterval(checkPendingBookings, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/treatments/services');
        if (res.success && res.services) {
          setServicesList(res.services);
        }
      } catch (e) {}
    };
    if (isAuthenticated) fetchServices();
  }, [isAuthenticated]);

  // Fetch slot availability for quick walk-in registration
  useEffect(() => {
    if (!walkInForm.date || !isAuthenticated || !isQuickWalkInOpen) return;
    let isMounted = true;
    const fetchWalkInAvailability = async () => {
      try {
        setIsLoadingWalkInSlots(true);
        const res = await api.get(`/appointments/availability?date=${walkInForm.date}`);
        if (isMounted && res.success) {
          const booked = res.bookedSlots || [];
          setWalkInBookedSlots(booked);
          const available = TIME_SLOTS.filter(s => !booked.includes(s));
          if (booked.includes(walkInForm.timeSlot) || !walkInForm.timeSlot) {
            setWalkInForm(prev => ({
              ...prev,
              timeSlot: available.length > 0 ? available[0] : ''
            }));
          }
        }
      } catch (e) {
        console.warn('Could not fetch walk-in availability:', e);
      } finally {
        if (isMounted) setIsLoadingWalkInSlots(false);
      }
    };
    fetchWalkInAvailability();
    return () => { isMounted = false; };
  }, [walkInForm.date, isQuickWalkInOpen, isAuthenticated]);

  const handleQuickWalkInSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', walkInForm);
      success(res.message || 'Walk-in patient scheduled successfully');
      setIsQuickWalkInOpen(false);
      setWalkInForm({
        name: '',
        phone: '',
        age: '',
        gender: 'Not Specified',
        service: 'General Dental Consultation',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM',
        message: '',
        source: 'Walk-in / Clinic'
      });
      checkPendingBookings();
    } catch (err) {
      error(err.message || 'Failed to schedule walk-in');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }
    try {
      await api.post('/auth/change-password', { currentPassword: oldPassword, newPassword });
      success('Password updated successfully');
      setIsChangePasswordOpen(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      error(err.message || 'Failed to change password');
    }
  };

  const handleConfirmWebsiteBookingFromModal = async (id) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'Confirmed' });
      success('Website booking confirmed and registered');
      checkPendingBookings();
    } catch (err) {
      error(err.message || 'Failed to confirm booking');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center text-purple-400 gap-3">
        <div className="w-10 h-10 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-sm font-medium tracking-wide text-content-subtle">Loading Dentophilic System...</span>
      </div>
    );
  }

  // 1. First-Run Setup needed
  if (!hasAdmin) {
    return <FirstRunSetup />;
  }

  // 2. Not authenticated -> Login Screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // 3. Authenticated -> Full Management Workspace
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        pendingWebsiteCount={pendingWebsiteCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <Header
          onQuickWalkIn={() => setIsQuickWalkInOpen(true)}
          pendingWebsiteCount={pendingWebsiteCount}
          onOpenPendingBookings={() => setIsPendingBookingsModalOpen(true)}
          onSearch={(query) => {
            setGlobalSearch(query);
            if (query && activeTab !== 'patients' && activeTab !== 'appointments') {
              setActiveTab('patients');
            }
          }}
          searchQuery={globalSearch}
          onChangePassword={() => setIsChangePasswordOpen(true)}
        />

        {/* Viewport Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToAppointments={() => setActiveTab('appointments')}
              onNavigateToPatients={() => setActiveTab('patients')}
              onQuickWalkIn={() => setIsQuickWalkInOpen(true)}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments
              onStartTreatment={(apt) => {
                setActivePatientForAction({ id: apt.patientId, name: apt.name });
                setActiveTab('treatments');
              }}
              onIssueBill={(apt) => {
                setActivePatientForAction({ id: apt.patientId, name: apt.name });
                setActiveTab('billing');
              }}
            />
          )}

          {activeTab === 'patients' && (
            <Patients
              onNewAppointment={(patient) => {
                setWalkInForm(prev => ({
                  ...prev,
                  name: patient.name,
                  phone: patient.phone,
                  age: patient.age || '',
                  gender: patient.gender || 'Not Specified'
                }));
                setIsQuickWalkInOpen(true);
              }}
              onNewTreatment={(patient) => {
                setActivePatientForAction(patient);
                setActiveTab('treatments');
              }}
              onNewPrescription={(patient) => {
                setActivePatientForAction(patient);
                setActiveTab('prescriptions');
              }}
              onNewInvoice={(patient) => {
                setActivePatientForAction(patient);
                setActiveTab('billing');
              }}
            />
          )}

          {activeTab === 'treatments' && (
            <Treatments
              defaultPatient={activePatientForAction}
              onVisitCreated={() => setActivePatientForAction(null)}
            />
          )}

          {activeTab === 'prescriptions' && (
            <Prescriptions defaultPatient={activePatientForAction} />
          )}

          {activeTab === 'billing' && (
            <Billing defaultPatient={activePatientForAction} />
          )}

          {activeTab === 'follow-ups' && (
            <FollowUps />
          )}

          {activeTab === 'inventory' && (
            <Inventory />
          )}

          {activeTab === 'expenses' && (
            <Expenses />
          )}

          {activeTab === 'reports' && (
            <Reports />
          )}

          {activeTab === 'staff' && (
            <StaffManagement />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLog />
          )}

          {activeTab === 'recycle-bin' && (
            <RecycleBin />
          )}

          {activeTab === 'settings' && (
            <SettingsAndBackup />
          )}
        </main>
      </div>

      {/* QUICK WALK-IN APPOINTMENT MODAL */}
      <Modal
        isOpen={isQuickWalkInOpen}
        onClose={() => setIsQuickWalkInOpen(false)}
        title="Quick Walk-In Registration"
        subtitle="Immediately seat or schedule a patient in the clinic queue."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleQuickWalkInSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={walkInForm.name}
                onChange={e => setWalkInForm({ ...walkInForm, name: e.target.value })}
                placeholder="Patient Name"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number (10 Digits) *</label>
              <input
                type="text"
                required
                value={walkInForm.phone}
                onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={walkInForm.date}
                onChange={e => setWalkInForm({ ...walkInForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Slot *</label>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  {TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).length} Avail
                </span>
              </div>
              <select
                required
                value={walkInForm.timeSlot}
                onChange={e => setWalkInForm({ ...walkInForm, timeSlot: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                disabled={TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).length === 0}
              >
                {TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).length === 0 ? (
                  <option value="">No slots</option>
                ) : (
                  <>
                    <option value="" disabled>-- Slot --</option>
                    {TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={walkInForm.age}
                onChange={e => setWalkInForm({ ...walkInForm, age: e.target.value })}
                placeholder="Age"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select
                value={walkInForm.gender}
                onChange={e => setWalkInForm({ ...walkInForm, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          {TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).length === 0 && (
            <p className="text-amber-500 dark:text-amber-400 text-[10px] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> All slots for this date are already booked.
            </p>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Treatment / Complaint *</label>
            <select
              value={walkInForm.service}
              onChange={e => setWalkInForm({ ...walkInForm, service: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            >
              {servicesList.length > 0 ? (
                servicesList.map(s => (
                  <option key={s.id} value={s.name}>{s.name} (₹{s.price})</option>
                ))
              ) : (
                <option value="General Dental Consultation">General Dental Consultation (₹300)</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickWalkInOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={TIME_SLOTS.filter(s => !walkInBookedSlots.includes(s)).length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Add to Queue
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change Your Account Password"
        subtitle="Ensure your new password is secure."
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (Min 6 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* PENDING WEBSITE BOOKINGS MODAL */}
      <Modal
        isOpen={isPendingBookingsModalOpen}
        onClose={() => setIsPendingBookingsModalOpen(false)}
        title="Pending Online Website Bookings"
        subtitle="Bookings submitted by patients on drarthidentophilic.com awaiting clinic confirmation."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          {pendingBookingsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No pending online bookings. All website appointments have been confirmed.
            </div>
          ) : (
            pendingBookingsList.map(b => (
              <div
                key={b.id}
                className="p-4 rounded-xl glass-card flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</span>
                    <span className="text-purple-700 dark:text-purple-400 font-mono text-[11px] font-semibold">{b.referenceId}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                    {b.service} • {b.date} at {b.timeSlot} • Ph: {b.phone}
                  </div>
                  {b.message && (
                    <div className="text-slate-600 dark:text-slate-400 italic text-[11px] mt-1">"{b.message}"</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmWebsiteBookingFromModal(b.id)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shrink-0 cursor-pointer shadow-md shadow-purple-600/30"
                >
                  Confirm & Register
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* FLOATING AI COPILOT LAUNCHER BUTTON */}
      <motion.button
        type="button"
        onClick={() => setIsAICopilotOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-600/50 flex items-center gap-2.5 border border-purple-400/40 cursor-pointer group transition-all"
        title="Open Dentophilic AI Clinical Copilot"
      >
        <div className="relative">
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-purple-800 animate-pulse" />
        </div>
        <span className="hidden sm:inline font-bold text-xs tracking-wide">
          AI Copilot
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 hidden sm:inline" />
      </motion.button>

      {/* AI CLINICAL COPILOT MODAL / DRAWER */}
      <AICopilot
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        onNavigateToPatients={() => setActiveTab('patients')}
        onNavigateToAppointments={() => setActiveTab('appointments')}
        onOpenScheduleModal={(patient) => {
          setWalkInForm(prev => ({
            ...prev,
            name: patient.name,
            phone: patient.phone,
            age: patient.age || '',
            gender: patient.gender || 'Not Specified'
          }));
          setIsQuickWalkInOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

