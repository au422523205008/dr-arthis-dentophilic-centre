import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { siteData } from '../config/siteData';

export default function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(
      `Hello Dr. Arthi's Dentophilic Centre, I would like to book an appointment or consult regarding dental treatment.`
    );
    window.open(`https://wa.me/91${siteData.clinic.phoneRaw}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-3 pointer-events-none">
      
      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="pointer-events-auto p-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-purple-300 shadow-xl border border-purple-500/30 backdrop-blur-sm active:scale-95 transition-all group cursor-pointer"
            aria-label="Scroll to top of page"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Action with Tooltip & Pulsing Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="pointer-events-auto relative group"
      >
        {/* Tooltip on hover */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700">
          Chat with Dr. Arthi on WhatsApp
        </div>

        <button
          onClick={handleWhatsApp}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-900/40 hover:scale-108 active:scale-95 transition-all duration-200"
          aria-label="Chat on WhatsApp"
        >
          {/* Pulsing ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping -z-10" />

          {/* Official WhatsApp SVG Icon */}
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current drop-shadow-sm">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.37C9.37 7.37 9.11 7.43 8.89 7.67C8.68 7.91 8.07 8.48 8.07 9.63C8.07 10.79 8.91 11.9 9.02 12.06C9.14 12.21 10.67 14.57 13.01 15.58C13.57 15.82 14 15.97 14.35 16.08C14.9 16.25 15.4 16.23 15.8 16.17C16.24 16.1 17.17 15.6 17.36 15.06C17.56 14.53 17.56 14.07 17.5 13.97C17.44 13.88 17.28 13.82 17.04 13.7C16.81 13.59 15.66 13.02 15.45 12.94C15.24 12.87 15.08 12.83 14.92 13.07C14.77 13.31 14.32 13.82 14.18 13.98C14.05 14.14 13.91 14.16 13.68 14.05C13.44 13.93 12.69 13.68 11.79 12.88C11.09 12.26 10.62 11.49 10.48 11.26C10.35 11.02 10.47 10.89 10.59 10.77C10.7 10.66 10.83 10.49 10.96 10.34C11.08 10.19 11.13 10.07 11.21 9.91C11.29 9.75 11.25 9.62 11.19 9.5C11.13 9.38 10.67 8.24 10.47 7.78C10.28 7.33 10.08 7.39 9.93 7.38C9.79 7.37 9.65 7.37 9.53 7.37Z" />
          </svg>
        </button>
      </motion.div>

    </div>
  );
}
