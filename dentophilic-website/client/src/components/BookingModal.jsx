import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import BookingForm from './BookingForm';

export default function BookingModal({ isOpen, onClose, initialService }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-200 z-10 my-8 max-h-[92vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between pb-4 border-b border-purple-100 mb-6">
            <div>
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full mb-1 border border-purple-200">
                <Sparkles className="w-3 h-3 mr-1 text-purple-600" /> Quick Reservation
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Book a Consultation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dr. Arthi's Dentophilic Centre • Hosur
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close booking modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <BookingForm
            initialService={initialService}
            onBookingSuccess={() => {
              // keep modal open to show confirmation card
            }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
