import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  GitMerge,
  Trash2,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PatientDetail from './PatientDetail';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function Patients({ onNewAppointment, onNewInvoice, onNewTreatment, onNewPrescription }) {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Not Specified',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    address: ''
  });

  // Merge Modal State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      let query = `?limit=100`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(`/patients${query}`);
      if (res.success) {
        setPatients(res.patients || []);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', formData);
      success(res.message || 'Patient registered successfully');
      setIsRegisterModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Not Specified',
        bloodGroup: '',
        allergies: '',
        medicalHistory: '',
        address: ''
      });
      fetchPatients();
      if (res.patient?.id) {
        setSelectedPatientId(res.patient.id);
      }
    } catch (err) {
      error(err.message || 'Failed to register patient');
    }
  };

  const handleMergePatients = async (e) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId) {
      error('Please select both source and target patients');
      return;
    }
    if (mergeSourceId === mergeTargetId) {
      error('Source and target patient cannot be the same');
      return;
    }
    try {
      const res = await api.post('/patients/merge', {
        sourcePatientId: parseInt(mergeSourceId, 10),
        targetPatientId: parseInt(mergeTargetId, 10)
      });
      success(res.message || 'Patients merged successfully');
      setIsMergeModalOpen(false);
      setMergeSourceId('');
      setMergeTargetId('');
      fetchPatients();
    } catch (err) {
      error(err.message || 'Failed to merge patients');
    }
  };

  const handleDeletePatient = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to move patient "${name}" to the Recycle Bin?`)) return;
    try {
      await api.delete(`/patients/${id}`);
      success(`Patient ${name} moved to Recycle Bin`);
      fetchPatients();
    } catch (err) {
      error(err.message || 'Failed to delete patient');
    }
  };

  // If viewing a single patient detail
  if (selectedPatientId) {
    return (
      <PatientDetail
        patientId={selectedPatientId}
        onBack={() => setSelectedPatientId(null)}
        onNewAppointment={onNewAppointment}
        onNewInvoice={onNewInvoice}
        onNewTreatment={onNewTreatment}
        onNewPrescription={onNewPrescription}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Patient Directory (EMR)
          </h1>
          <p className="text-xs text-content-subtle mt-1">
            Complete electronic medical records, clinical dental charts, treatment timelines, and billing history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-colors"
              title="Merge duplicate patient profiles"
            >
              <GitMerge className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Merge Profiles</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 rounded-2xl glass-panel flex items-center gap-3">
        <Search className="w-4 h-4 text-purple-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by patient name, mobile number, or ID (e.g. P-001)..."
          className="flex-1 bg-transparent text-content-main text-xs sm:text-sm placeholder:text-content-subtle outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs text-content-subtle hover:text-content-main"
          >
            Clear
          </button>
        )}
      </div>

      {/* Patient List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">
            Searching patient directory...
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            description="The patient database is clean. Click below to register your first patient or confirm a website booking."
            actionLabel="Register Patient"
            onAction={() => setIsRegisterModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {patients.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className="p-4 sm:p-5 hover:bg-purple-500/5 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content-main text-sm hover:text-purple-400 transition-colors">
                        {p.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 font-mono text-[10px] text-purple-400 border border-purple-500/20">
                        {p.patientId}
                      </span>
                      {p.allergies && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                          Allergy Alert
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-content-subtle text-[11px] mt-1 font-mono">
                      <span className="flex items-center gap-1 text-content-main">
                        <Phone className="w-3 h-3 text-purple-400" />
                        {p.phone}
                      </span>
                      {p.age && <span>{p.age} yrs</span>}
                      {p.gender && <span>{p.gender}</span>}
                      {p.bloodGroup && <span className="text-rose-400 font-bold">{p.bloodGroup}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePatient(p.id, p.name, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Move patient to Recycle Bin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Patient"
        subtitle="Create an Electronic Medical Record (EMR) profile."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anandhi Sundaram"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Mobile Number (10 Digits) *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9597126248"
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
                placeholder="28"
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
              <label className="block font-semibold text-content-main mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="e.g. O+, A+"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="patient@example.com"
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Known Drug Allergies</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Aspirin, Sulfa drugs..."
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Systemic Medical History</label>
            <textarea
              rows={2}
              value={formData.medicalHistory}
              onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="e.g. Diabetic, High BP, Asthma, Cardiac issues..."
              className="w-full p-2.5 rounded-xl glass-input text-xs resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Hosur, Tamil Nadu"
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-main)]">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl text-content-subtle hover:text-content-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Register Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* MERGE MODAL */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title="Merge Duplicate Patient Records"
        subtitle="Transfers all appointments, visit notes, teeth chart records, and invoices from duplicate source to master target."
      >
        <form onSubmit={handleMergePatients} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-content-subtle mb-1">Duplicate Source Patient (Will be archived) *</label>
            <select
              required
              value={mergeSourceId}
              onChange={e => setMergeSourceId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-content-main text-xs"
            >
              <option value="">Select source patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-content-subtle mb-1">Master Target Patient (Keeps all consolidated data) *</label>
            <select
              required
              value={mergeTargetId}
              onChange={e => setMergeTargetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-content-main text-xs"
            >
              <option value="">Select target patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="px-4 py-2 rounded-xl text-content-subtle hover:text-content-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Execute Safe Merge
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
