import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Calendar,
  User,
  Pill,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

const FREQUENCY_OPTIONS = [
  '1-0-1 (Twice a day - Morning & Night after food)',
  '1-1-1 (Thrice a day - After food)',
  '1-0-0 (Once daily - Morning after food)',
  '0-0-1 (Once daily - Night after food)',
  'SOS (Only when necessary / pain)'
];

const COMMON_DENTAL_MEDS = [
  { name: 'Amoxicillin 500mg', dosage: '1 Cap', freq: '1-0-1', dur: '5 days', inst: 'After food' },
  { name: 'Augmentin 625mg', dosage: '1 Tab', freq: '1-0-1', dur: '5 days', inst: 'After food' },
  { name: 'Aceclofenac + Paracetamol (Zerodol-P)', dosage: '1 Tab', freq: '1-0-1', dur: '3 days', inst: 'After food' },
  { name: 'Pantoprazole 40mg (Pan-40)', dosage: '1 Tab', freq: '1-0-0', dur: '5 days', inst: 'Before breakfast' },
  { name: 'Metronidazole 400mg', dosage: '1 Tab', freq: '1-0-1', dur: '5 days', inst: 'After food' },
  { name: 'Chlorhexidine 0.2% Mouthwash', dosage: '10ml', freq: '1-0-1', dur: '7 days', inst: 'Rinse for 1 min after brushing' }
];

export default function Prescriptions({ defaultPatient }) {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRx, setViewingRx] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: defaultPatient?.id || '',
    generalAdvice: 'Maintain good oral hygiene. Avoid hard foods on treated tooth. Complete the full antibiotic course.',
    items: [
      { name: 'Amoxicillin 500mg', dosage: '1 Cap', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }
    ]
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rxRes, patientsRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/patients?limit=200')
      ]);

      if (rxRes.success) setPrescriptions(rxRes.prescriptions || []);
      if (patientsRes.success) setPatients(patientsRes.patients || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (defaultPatient?.id) {
      setFormData(prev => ({ ...prev, patientId: defaultPatient.id }));
      setIsCreateModalOpen(true);
    }
  }, [defaultPatient]);

  const handleAddItem = (preset) => {
    if (preset) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          name: preset.name,
          dosage: preset.dosage,
          frequency: preset.freq,
          duration: preset.dur,
          instructions: preset.inst
        }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { name: '', dosage: '', frequency: '1-0-1', duration: '3 days', instructions: 'After food' }]
      }));
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index][field] = value;
      return { ...prev, items: updated };
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      error('Please select a patient');
      return;
    }
    if (formData.items.length === 0 || !formData.items[0].name) {
      error('Please add at least one medicine item');
      return;
    }

    try {
      const res = await api.post('/prescriptions', {
        ...formData,
        patientId: parseInt(formData.patientId, 10)
      });
      success(res.message || 'Prescription generated successfully');
      setIsCreateModalOpen(false);
      setFormData({
        patientId: '',
        generalAdvice: 'Maintain good oral hygiene. Avoid hard foods on treated tooth. Complete the full antibiotic course.',
        items: [{ name: '', dosage: '', frequency: '1-0-1', duration: '3 days', instructions: 'After food' }]
      });
      fetchData();
      if (res.prescription) {
        setViewingRx(res.prescription);
      }
    } catch (err) {
      error(err.message || 'Failed to generate prescription');
    }
  };

  const handleDelete = async (id, rxNumber) => {
    if (!window.confirm(`Move prescription ${rxNumber} to Recycle Bin?`)) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      success('Prescription moved to Recycle Bin');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete prescription');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Prescriptions (Rx)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and print official clinic prescriptions on Dr. Arthi's Dentophilic letterhead.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Prescription (Rx)</span>
        </button>
      </div>

      {/* Prescription List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-subtle text-sm">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No prescriptions generated yet"
            description="Prescriptions issued to patients will be securely stored here with printable clinic letterhead."
            actionLabel="Issue First Prescription"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[var(--border-main)]">
            {prescriptions.map(rx => {
              const items = typeof rx.items === 'string' ? JSON.parse(rx.items) : (rx.items || []);
              return (
                <div
                  key={rx.id}
                  className="p-5 hover:bg-purple-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-purple-400 font-bold text-sm">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="font-semibold text-content-main text-sm">
                        {rx.patientName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 font-mono text-[10px] text-purple-400 border border-purple-500/20">
                        {rx.formattedPatientId}
                      </span>
                    </div>

                    <div className="text-content-subtle text-[11px] mt-1 font-mono">
                      Issued on {new Date(rx.createdAt).toLocaleDateString()} by {rx.doctorName} • {items.length} medicines prescribed
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingRx(rx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-semibold cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(rx.id, rx.prescriptionNumber)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                        title="Delete Prescription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ISSUE PRESCRIPTION MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Official Prescription"
        subtitle="Specify patient, medicines, dosages, and clinical advice."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePrescription} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={e => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="">Choose patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Dental Presets */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Quick Dental Medicine Presets (Click to add):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DENTAL_MEDS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddItem(preset)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500 text-[11px] text-content-main transition-colors cursor-pointer"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Items List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-content-main">Prescribed Medicines ({formData.items.length})</span>
              <button
                type="button"
                onClick={() => handleAddItem(null)}
                className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
              >
                + Add Custom Row
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                    value={item.name}
                    onChange={e => handleUpdateItem(index, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Dosage (1 Tab)"
                    value={item.dosage}
                    onChange={e => handleUpdateItem(index, 'dosage', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Frequency (1-0-1)"
                    value={item.frequency}
                    onChange={e => handleUpdateItem(index, 'frequency', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={item.duration}
                    onChange={e => handleUpdateItem(index, 'duration', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                  />
                </div>
                <div className="sm:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    placeholder="Special Instructions (e.g. After food, warm water gargle)"
                    value={item.instructions}
                    onChange={e => handleUpdateItem(index, 'instructions', e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg glass-input text-slate-300 text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">General Clinical Advice</label>
            <textarea
              rows={2}
              value={formData.generalAdvice}
              onChange={e => setFormData({ ...formData, generalAdvice: e.target.value })}
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Generate & Save Prescription
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE PRESCRIPTION MODAL */}
      {viewingRx && (
        <Modal
          isOpen={!!viewingRx}
          onClose={() => setViewingRx(null)}
          title={`Prescription Letterhead - ${viewingRx.prescriptionNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* The printable document */}
            <div id="printable-rx" className="print-page p-6 sm:p-8 bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200">
              {/* Letterhead Header */}
              <div className="border-b-2 border-purple-800 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-purple-950 tracking-wide">
                      Dr. Arthi's Dentophilic Centre
                    </h2>
                    <p className="text-xs font-semibold text-purple-900">
                      Dr. Arthi Mukeshkannan, B.D.S
                    </p>
                    <p className="text-[11px] text-slate-600">
                      General Dental Surgeon • Chief Dentist
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      TNDC Regd. No: 31263
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 leading-tight">
                    <p className="font-semibold text-slate-800">Clinic Location:</p>
                    <p>1st Floor, Pk Complex, Muneeshwar Nagar,</p>
                    <p>ESI Ring Road, Hosur - 635109</p>
                    <p className="font-mono text-purple-900 font-bold mt-1">Ph: +91 95971 26248</p>
                  </div>
                </div>
              </div>

              {/* Patient Info Row */}
              <div className="grid grid-cols-2 gap-4 py-2.5 px-3 bg-slate-50 rounded-lg text-xs mb-6 border border-slate-200">
                <div>
                  <span className="text-slate-500">Patient: </span>
                  <span className="font-bold text-slate-900">{viewingRx.patientName}</span>
                  {viewingRx.patientAge && <span> ({viewingRx.patientAge}y / {viewingRx.patientGender})</span>}
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-500">Date: </span>
                  <span className="font-semibold">{new Date(viewingRx.createdAt).toLocaleDateString()}</span>
                  <span className="text-slate-400 ml-2">[{viewingRx.prescriptionNumber}]</span>
                </div>
              </div>

              {/* Rx Symbol */}
              <div className="text-xl font-serif font-black text-purple-900 mb-3">℞</div>

              {/* Medicines Table */}
              <table className="w-full text-left text-xs mb-6 border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2">Medicine / Generic</th>
                    <th className="py-2">Dosage</th>
                    <th className="py-2">Frequency</th>
                    <th className="py-2">Duration</th>
                    <th className="py-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(typeof viewingRx.items === 'string' ? JSON.parse(viewingRx.items) : (viewingRx.items || [])).map((m, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2.5 font-mono">{m.dosage || '-'}</td>
                      <td className="py-2.5">{m.frequency || '-'}</td>
                      <td className="py-2.5">{m.duration || '-'}</td>
                      <td className="py-2.5 italic text-slate-600">{m.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Clinical Advice */}
              {viewingRx.generalAdvice && (
                <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200/80 text-xs text-purple-950 mb-8">
                  <span className="font-bold block mb-0.5">Instructions & Care Advice:</span>
                  <p>{viewingRx.generalAdvice}</p>
                </div>
              )}

              {/* Signature Area */}
              <div className="flex justify-between items-end pt-8 border-t border-slate-200 mt-8">
                <div className="text-[10px] text-slate-400">
                  Valid with clinical consultation stamp.
                </div>
                <div className="text-center text-xs">
                  <div className="font-serif italic font-bold text-slate-900 mb-1">
                    Dr. Arthi Mukeshkannan
                  </div>
                  <div className="text-[10px] text-slate-500">
                    B.D.S • Dental Surgeon (Reg: 31263)
                  </div>
                </div>
              </div>
            </div>

            {/* Print action button */}
            <div className="flex justify-end gap-2.5 no-print pt-2">
              <button
                type="button"
                onClick={() => setViewingRx(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Letterhead</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
