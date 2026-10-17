import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  Stethoscope,
  Activity,
  Edit,
  Plus,
  Printer,
  ChevronRight,
  GitMerge
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DentalChart from '../components/DentalChart/DentalChart';
import Badge from '../components/Common/Badge';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function PatientDetail({ patientId, onBack, onNewAppointment, onNewInvoice, onNewTreatment, onNewPrescription }) {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'treatments', 'prescriptions', 'billing', 'history'
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/patients/${patientId}`);
      if (res.success && res.patient) {
        setPatient(res.patient);
        setEditFormData({
          name: res.patient.name,
          phone: res.patient.phone,
          email: res.patient.email || '',
          age: res.patient.age || '',
          gender: res.patient.gender || 'Not Specified',
          bloodGroup: res.patient.bloodGroup || '',
          allergies: res.patient.allergies || '',
          medicalHistory: res.patient.medicalHistory || '',
          address: res.patient.address || '',
          notes: res.patient.notes || ''
        });
      }
    } catch (err) {
      console.error('Failed to load patient profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [patientId]);

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/patients/${patientId}`, editFormData);
      success('Patient medical record updated successfully');
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (err) {
      error(err.message || 'Failed to update patient record');
    }
  };

  if (isLoading || !patient) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Loading electronic medical record for patient #{patientId}...
      </div>
    );
  }

  const {
    name,
    patientId: formattedId,
    phone,
    email,
    age,
    gender,
    bloodGroup,
    allergies,
    medicalHistory,
    address,
    notes,
    timeline = [],
    treatmentRecords = [],
    prescriptions = [],
    invoices = []
  } = patient;

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Patient Directory</span>
      </button>

      {/* Patient Profile Card */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xl shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-content-main">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono text-xs font-bold border border-purple-500/20">
                {formattedId}
              </span>
              {bloodGroup && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                  {bloodGroup}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-content-subtle mt-2 font-mono">
              <span className="flex items-center gap-1 text-content-main">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                {phone}
              </span>
              {email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-content-subtle" />
                  {email}
                </span>
              )}
              {age && <span>Age: {age} yrs</span>}
              {gender && <span>Gender: {gender}</span>}
              {address && <span className="truncate max-w-xs">{address}</span>}
            </div>

            {allergies && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Allergies: <strong>{allergies}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onNewTreatment && onNewTreatment(patient)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 cursor-pointer transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Add Visit Note</span>
          </button>

          <button
            type="button"
            onClick={() => onNewPrescription && onNewPrescription(patient)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 cursor-pointer transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Issue Rx</span>
          </button>

          <button
            type="button"
            onClick={() => onNewInvoice && onNewInvoice(patient)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* Profile Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'chart', label: 'Dental Chart (FDI)', icon: Activity },
          { id: 'treatments', label: `Visits & Clinical Notes (${treatmentRecords.length})`, icon: Stethoscope },
          { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
          { id: 'billing', label: `Invoices & Payments (${invoices.length})`, icon: CreditCard },
          { id: 'history', label: 'Medical History & Notes', icon: Calendar }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: DENTAL CHART */}
      {activeTab === 'chart' && (
        <DentalChart patientId={patient.id} />
      )}

      {/* TAB CONTENT 2: TREATMENTS & CLINICAL NOTES */}
      {activeTab === 'treatments' && (
        <div className="space-y-4">
          {treatmentRecords.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8">
              <EmptyState
                icon={Stethoscope}
                title="No clinical visit records"
                description="Record the diagnosis, procedures done, teeth treated, and clinical notes for this patient's visits."
                actionLabel="Log Clinical Visit"
                onAction={() => onNewTreatment && onNewTreatment(patient)}
              />
            </div>
          ) : (
            treatmentRecords.map(tr => (
              <div
                key={tr.id}
                className="p-5 rounded-2xl glass-panel space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-content-main flex items-center gap-2">
                      <span>{tr.serviceName}</span>
                      {tr.toothNumber && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                          Tooth #{tr.toothNumber}
                        </span>
                      )}
                    </h3>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Treated by: {tr.doctorName || 'Dr. Arthi'} • {new Date(tr.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {tr.fee && (
                    <div className="text-right font-mono text-sm font-bold text-emerald-400">
                      ₹{tr.fee.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 text-slate-300 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Diagnosis:</span>
                    <span className="font-medium text-white">{tr.diagnosis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Procedure Carried Out:</span>
                    <span className="font-medium text-white">{tr.procedureDone}</span>
                  </div>
                </div>

                {tr.clinicalNotes && (
                  <p className="text-slate-300 italic">
                    "{tr.clinicalNotes}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 3: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800">
              <EmptyState
                icon={FileText}
                title="No prescriptions generated yet"
                description="Issue an official clinic prescription with medicine dosage, frequency, and instructions."
                actionLabel="Generate Prescription"
                onAction={() => onNewPrescription && onNewPrescription(patient)}
              />
            </div>
          ) : (
            prescriptions.map(rx => {
              const items = typeof rx.items === 'string' ? JSON.parse(rx.items) : (rx.items || []);
              return (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-purple-400 font-bold text-sm">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="text-content-subtle text-[11px] ml-2">
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-content-subtle">
                      Prescribed by {rx.doctorName}
                    </div>
                  </div>

                  {/* Medicines table */}
                  <div className="border border-[var(--border-main)] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-purple-500/10 text-content-subtle text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Medicine</th>
                          <th className="p-2.5">Dosage</th>
                          <th className="p-2.5">Frequency</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-main)] text-content-main">
                        {items.map((m, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-semibold text-content-main">{m.name}</td>
                            <td className="p-2.5 font-mono">{m.dosage || '-'}</td>
                            <td className="p-2.5">{m.frequency || '-'}</td>
                            <td className="p-2.5">{m.duration || '-'}</td>
                            <td className="p-2.5 italic text-content-subtle">{m.instructions || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.generalAdvice && (
                    <div className="text-[11px] text-content-subtle">
                      <span className="font-semibold text-content-main">Advice: </span>
                      {rx.generalAdvice}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT 4: INVOICES & PAYMENTS */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8">
              <EmptyState
                icon={CreditCard}
                title="No invoices generated yet"
                description="Create itemized dental treatment invoices and record patient cash/UPI/card payments."
                actionLabel="Create Invoice"
                onAction={() => onNewInvoice && onNewInvoice(patient)}
              />
            </div>
          ) : (
            invoices.map(inv => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl glass-panel flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-400 font-bold text-sm">
                      {inv.invoiceNumber}
                    </span>
                    <Badge status={inv.status} />
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1 font-mono">
                    Created on {new Date(inv.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-white">
                    Total: ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    Paid: ₹{inv.paidAmount.toLocaleString('en-IN')}
                  </div>
                  {inv.balanceDue > 0 && (
                    <div className="text-[11px] text-amber-400 font-bold">
                      Balance Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT 5: MEDICAL HISTORY & NOTES */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white">Systemic Medical History</h3>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {medicalHistory || 'No systemic medical conditions recorded (e.g. Hypertension, Diabetes, Cardiac conditions).'}
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-white">General Clinic Notes</h3>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {notes || 'No general patient notes logged.'}
            </p>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient EMR Profile"
        subtitle="Update patient demographic details and clinical medical history."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUpdatePatient} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={editFormData.phone}
                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={editFormData.age}
                onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={editFormData.gender}
                onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Blood Group</label>
              <input
                type="text"
                value={editFormData.bloodGroup}
                onChange={e => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                placeholder="e.g. O+, B+"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Known Drug Allergies</label>
            <input
              type="text"
              value={editFormData.allergies}
              onChange={e => setEditFormData({ ...editFormData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Sulfa drugs, Latex, NSAIDs..."
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs text-rose-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Systemic Medical History</label>
            <textarea
              rows={2}
              value={editFormData.medicalHistory}
              onChange={e => setEditFormData({ ...editFormData, medicalHistory: e.target.value })}
              placeholder="e.g. Diabetic, Hypertensive, Thyroid, Pregnant..."
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Address / Location</label>
            <input
              type="text"
              value={editFormData.address}
              onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
              placeholder="e.g. Muneeshwar Nagar, Hosur"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
