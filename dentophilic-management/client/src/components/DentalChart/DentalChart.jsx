import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, X, Sparkles, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CONDITIONS = [
  { label: 'Healthy', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' },
  { label: 'Caries / Cavity', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' },
  { label: 'Filled / Restored', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40', dot: 'bg-sky-400' },
  { label: 'Root Canal (RCT)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dot: 'bg-rose-400' },
  { label: 'Crown / Cap', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: 'bg-purple-400' },
  { label: 'Implant', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', dot: 'bg-indigo-400' },
  { label: 'Missing', color: 'bg-slate-700/50 text-slate-400 border-slate-600', dot: 'bg-slate-500' },
  { label: 'Extraction Needed', color: 'bg-red-600/30 text-red-300 border-red-500', dot: 'bg-red-500' }
];

export default function DentalChart({ patientId, readOnly = false }) {
  const { success, error } = useToast();
  const [teeth, setTeeth] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [editCondition, setEditCondition] = useState('Healthy');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Upper Jaw
  const quad1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const quad2 = [21, 22, 23, 24, 25, 26, 27, 28];
  // Lower Jaw
  const quad4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const quad3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const fetchChart = async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/dental-chart/patient/${patientId}`);
      if (res.success && res.teeth) {
        const map = {};
        res.teeth.forEach(t => {
          map[t.toothNumber] = t;
        });
        setTeeth(map);
      }
    } catch (err) {
      console.error('Failed to load dental chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [patientId]);

  const handleSelectTooth = (toothNum) => {
    const info = teeth[toothNum] || { condition: 'Healthy', notes: '' };
    setSelectedTooth(toothNum);
    setEditCondition(info.condition || 'Healthy');
    setEditNotes(info.notes || '');
  };

  const handleSaveCondition = async () => {
    if (!selectedTooth || readOnly) return;
    try {
      setIsSaving(true);
      await api.post(`/dental-chart/patient/${patientId}`, {
        toothNumber: selectedTooth,
        condition: editCondition,
        notes: editNotes
      });

      setTeeth(prev => ({
        ...prev,
        [selectedTooth]: {
          toothNumber: selectedTooth,
          condition: editCondition,
          notes: editNotes,
          updatedAt: new Date().toISOString()
        }
      }));

      success(`Tooth #${selectedTooth} marked as ${editCondition}`);
      setSelectedTooth(null);
    } catch (err) {
      error(err.message || 'Failed to update tooth record');
    } finally {
      setIsSaving(false);
    }
  };

  const getToothStyle = (num) => {
    const t = teeth[num];
    const cond = t ? t.condition : 'Healthy';
    const cfg = CONDITIONS.find(c => c.label.toLowerCase() === cond.toLowerCase()) || CONDITIONS[0];
    return cfg;
  };

  const renderToothBox = (num) => {
    const style = getToothStyle(num);
    const isSelected = selectedTooth === num;
    const hasNotes = teeth[num]?.notes;

    return (
      <button
        key={num}
        type="button"
        disabled={readOnly}
        onClick={() => handleSelectTooth(num)}
        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-purple-400 border-purple-400 bg-purple-500/30 scale-105'
            : `${style.color} hover:brightness-125 hover:scale-102`
        }`}
      >
        <span className="text-xs font-mono font-bold">{num}</span>
        {/* Simple dental tooth icon representation */}
        <svg className="w-5 h-5 my-1" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 6 5 6 9c0 3 1.5 6 2 9s1 4 2 4 1-2 2-2 1 2 2 2 1.5-1 2-4 2-6 2-9c0-4-2-7-6-7z" />
        </svg>
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        {hasNotes && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-400" title="Has clinical notes" />
        )}
      </button>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-content-main flex items-center gap-2">
            <span>FDI Two-Digit Dental Chart</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Adult (32 Teeth)
            </span>
          </h3>
          <p className="text-xs text-content-subtle mt-1">
            Standard clinical odontogram (Quadrants 1–4). Click any tooth to record caries, restorations, RCT or conditions.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {CONDITIONS.slice(0, 4).map(c => (
            <span key={c.label} className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span>{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-slate-400 text-sm">
          Loading patient dental chart...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Maxillary / Upper Arch */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-3 text-center">
              Maxilla (Upper Jaw)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {quad1.map(renderToothBox)}
              </div>
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {quad2.map(renderToothBox)}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
              <span>Quadrant 1 (Upper Right)</span>
              <span>Midline</span>
              <span>Quadrant 2 (Upper Left)</span>
            </div>
          </div>

          {/* Mandibular / Lower Arch */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-3 text-center">
              Mandible (Lower Jaw)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {quad4.map(renderToothBox)}
              </div>
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {quad3.map(renderToothBox)}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
              <span>Quadrant 4 (Lower Right)</span>
              <span>Midline</span>
              <span>Quadrant 3 (Lower Left)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tooth Edit Modal */}
      <AnimatePresence>
        {selectedTooth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-purple-500/40 text-content-main"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)] mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center">
                    #{selectedTooth}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-content-main">Update Tooth Condition</h4>
                    <span className="text-[11px] text-content-subtle">FDI Tooth #{selectedTooth}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTooth(null)}
                  className="p-1 rounded-lg text-content-subtle hover:text-content-main hover:bg-purple-500/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-content-subtle mb-2">
                    Diagnostic Condition
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS.map(cond => (
                      <button
                        key={cond.label}
                        type="button"
                        onClick={() => setEditCondition(cond.label)}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all cursor-pointer ${
                          editCondition === cond.label
                            ? 'bg-purple-500/25 border-purple-400 text-purple-300 ring-1 ring-purple-400'
                            : 'bg-purple-500/5 border-[var(--border-main)] text-content-main hover:border-purple-400/40'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${cond.dot}`} />
                        <span>{cond.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-subtle mb-1.5">
                    Clinical Notes & Observations
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="e.g. Occlusal pit caries, tender on percussion, recommended composite resin..."
                    className="w-full p-3 rounded-xl glass-input text-content-main text-xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTooth(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-content-subtle hover:text-content-main"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveCondition}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
                  >
                    {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Condition</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
