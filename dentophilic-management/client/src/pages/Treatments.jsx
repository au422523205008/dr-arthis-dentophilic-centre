import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Plus,
  Search,
  DollarSign,
  Clock,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/Common/EmptyState';
import Modal from '../components/Common/Modal';

export default function Treatments({ defaultPatient, onVisitCreated }) {
  const { isAdmin, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('RECORDS'); // 'RECORDS' | 'CATALOG'
  const [services, setServices] = useState([]);
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isLogVisitModalOpen, setIsLogVisitModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Log Visit Form
  const [visitForm, setVisitForm] = useState({
    patientId: defaultPatient?.id || '',
    serviceName: '',
    toothNumber: '',
    diagnosis: '',
    procedureDone: '',
    clinicalNotes: '',
    fee: '',
    followUpDate: ''
  });

  // Service Catalog Form
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'General Dentistry',
    price: '',
    durationMinutes: 30,
    description: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [servicesRes, recordsRes, patientsRes] = await Promise.all([
        api.get('/treatments/services'),
        api.get('/treatments/records'),
        api.get('/patients?limit=200')
      ]);

      if (servicesRes.success) setServices(servicesRes.services || []);
      if (recordsRes.success) setTreatmentRecords(recordsRes.records || []);
      if (patientsRes.success) setPatients(patientsRes.patients || []);
    } catch (err) {
      console.error('Failed to load treatments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (defaultPatient?.id) {
      setVisitForm(prev => ({ ...prev, patientId: defaultPatient.id }));
      setIsLogVisitModalOpen(true);
    }
  }, [defaultPatient]);

  const handleSelectServiceForVisit = (svcName) => {
    const s = services.find(x => x.name === svcName);
    setVisitForm(prev => ({
      ...prev,
      serviceName: svcName,
      fee: s ? s.price : prev.fee,
      procedureDone: prev.procedureDone || svcName
    }));
  };

  const handleLogVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.patientId || !visitForm.serviceName || !visitForm.diagnosis || !visitForm.procedureDone) {
      error('Please complete all required fields.');
      return;
    }

    try {
      const res = await api.post('/treatments/records', {
        ...visitForm,
        patientId: parseInt(visitForm.patientId, 10),
        fee: parseFloat(visitForm.fee || 0)
      });
      success(res.message || 'Clinical visit logged successfully');
      setIsLogVisitModalOpen(false);
      setVisitForm({
        patientId: '',
        serviceName: '',
        toothNumber: '',
        diagnosis: '',
        procedureDone: '',
        clinicalNotes: '',
        fee: '',
        followUpDate: ''
      });
      fetchData();
      if (onVisitCreated) onVisitCreated(res.record);
    } catch (err) {
      error(err.message || 'Failed to record visit');
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) {
      error('Procedure name and price are required');
      return;
    }

    try {
      if (editingService) {
        await api.put(`/treatments/services/${editingService.id}`, serviceForm);
        success('Service updated successfully');
      } else {
        await api.post('/treatments/services', serviceForm);
        success('New dental procedure added to catalog');
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        category: 'General Dentistry',
        price: '',
        durationMinutes: 30,
        description: ''
      });
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the service catalog?`)) return;
    try {
      await api.delete(`/treatments/services/${id}`);
      success(`Service ${name} removed`);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to remove service');
    }
  };

  const canManagePricing = isAdmin || hasPermission('MANAGE_SERVICES_PRICING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Clinical Treatments & Services
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Log doctor consultation visits, diagnoses, tooth-specific procedures, and manage clinic pricing fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CATALOG' && canManagePricing && (
            <button
              type="button"
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  name: '',
                  category: 'General Dentistry',
                  price: '',
                  durationMinutes: 30,
                  description: ''
                });
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add Procedure</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsLogVisitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Log Clinical Visit</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('RECORDS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'RECORDS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Patient Visit Records ({treatmentRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'CATALOG'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-content-subtle hover:text-content-main hover:bg-purple-500/10'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Services & Pricing Catalog ({services.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: VISIT RECORDS */}
      {activeTab === 'RECORDS' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-content-subtle text-sm">Loading treatment records...</div>
          ) : treatmentRecords.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No clinical treatment records yet"
              description="Clinical notes recorded after patient consultations will appear here with dental tooth numbers and procedure summaries."
              actionLabel="Log First Clinical Visit"
              onAction={() => setIsLogVisitModalOpen(true)}
            />
          ) : (
            <div className="divide-y divide-[var(--border-main)]">
              {treatmentRecords.map(r => (
                <div key={r.id} className="p-5 hover:bg-purple-500/5 transition-colors text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-content-main text-sm">{r.patientName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 font-mono text-[10px] text-purple-400 border border-purple-500/20">
                          {r.formattedPatientId}
                        </span>
                        {r.toothNumber && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                            Tooth #{r.toothNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {r.serviceName} • Treated by {r.doctorName || 'Dr. Arthi'} on {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {r.fee && (
                      <div className="font-mono text-sm font-bold text-emerald-400">
                        ₹{r.fee.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 text-slate-300 text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Diagnosis:</span>
                      <span className="font-medium text-white">{r.diagnosis}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Procedure Carried Out:</span>
                      <span className="font-medium text-white">{r.procedureDone}</span>
                    </div>
                  </div>

                  {r.clinicalNotes && (
                    <p className="text-slate-300 italic">"{r.clinicalNotes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: SERVICES CATALOG */}
      {activeTab === 'CATALOG' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Service / Dental Procedure</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Standard Fee</th>
                  <th className="p-4">Est. Duration</th>
                  {canManagePricing && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.description}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{s.price.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {s.durationMinutes || 30} mins
                    </td>
                    {canManagePricing && (
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(s);
                            setServiceForm({
                              name: s.name,
                              category: s.category,
                              price: s.price,
                              durationMinutes: s.durationMinutes || 30,
                              description: s.description || ''
                            });
                            setIsServiceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Edit Service"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOG CLINICAL VISIT MODAL */}
      <Modal
        isOpen={isLogVisitModalOpen}
        onClose={() => setIsLogVisitModalOpen(false)}
        title="Record Clinical Visit Notes"
        subtitle="Document diagnosis, dental procedures performed, tooth number, and consultation fees."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleLogVisit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Patient *</label>
            <select
              required
              value={visitForm.patientId}
              onChange={e => setVisitForm({ ...visitForm, patientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            >
              <option value="">Choose patient from EMR...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} • {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Service / Procedure *</label>
              <select
                required
                value={visitForm.serviceName}
                onChange={e => handleSelectServiceForVisit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              >
                <option value="">Select dental procedure...</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} (₹{s.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">FDI Tooth # (Optional)</label>
              <input
                type="number"
                value={visitForm.toothNumber}
                onChange={e => setVisitForm({ ...visitForm, toothNumber: e.target.value })}
                placeholder="e.g. 11, 26, 46"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Clinical Diagnosis *</label>
            <input
              type="text"
              required
              value={visitForm.diagnosis}
              onChange={e => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
              placeholder="e.g. Irreversible pulpitis on lower right molar #46"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Procedure Details Performed *</label>
            <input
              type="text"
              required
              value={visitForm.procedureDone}
              onChange={e => setVisitForm({ ...visitForm, procedureDone: e.target.value })}
              placeholder="e.g. Access opening, biomechanical preparation (BMP), calcium hydroxide dressing"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Doctor's Clinical Notes</label>
            <textarea
              rows={2}
              value={visitForm.clinicalNotes}
              onChange={e => setVisitForm({ ...visitForm, clinicalNotes: e.target.value })}
              placeholder="Observation notes, canal measurements, patient comfort..."
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Consultation / Procedure Fee (₹)</label>
              <input
                type="number"
                value={visitForm.fee}
                onChange={e => setVisitForm({ ...visitForm, fee: e.target.value })}
                placeholder="₹"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Next Follow-up Due Date</label>
              <input
                type="date"
                value={visitForm.followUpDate}
                onChange={e => setVisitForm({ ...visitForm, followUpDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLogVisitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              Save Clinical Record
            </button>
          </div>
        </form>
      </Modal>

      {/* SERVICE CATALOG MODAL */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? 'Edit Dental Procedure' : 'Add Dental Procedure to Catalog'}
        subtitle="Manage the clinic's treatment offerings and standard fee schedule."
      >
        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Procedure Name *</label>
            <input
              type="text"
              required
              value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              placeholder="e.g. Composite Restoration"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={serviceForm.category}
                onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs"
              >
                <option value="General Dentistry">General Dentistry</option>
                <option value="Preventive Care">Preventive Care</option>
                <option value="Endodontics (RCT)">Endodontics (RCT)</option>
                <option value="Prosthodontics (Crowns/Dentures)">Prosthodontics (Crowns/Dentures)</option>
                <option value="Oral Surgery & Implants">Oral Surgery & Implants</option>
                <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                <option value="Pediatric Dentistry">Pediatric Dentistry</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Standard Fee (₹) *</label>
              <input
                type="number"
                required
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Estimated Duration (Minutes)</label>
            <input
              type="number"
              value={serviceForm.durationMinutes}
              onChange={e => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
              placeholder="30"
              className="w-full px-3 py-2 rounded-xl glass-input text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description / Clinical Notes</label>
            <textarea
              rows={2}
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Procedure overview..."
              className="w-full p-2.5 rounded-xl glass-input text-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
            >
              {editingService ? 'Update Procedure' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
