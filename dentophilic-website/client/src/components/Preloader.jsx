import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader({ isLoading }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 text-white"
        >
          {/* Subtle radial purple glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.2)_0%,transparent_70%)] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-4 relative z-10"
          >
            {/* Tooth Crest Icon with glowing royal purple ring */}
            <div className="w-20 h-20 mb-6 rounded-2xl bg-purple-900/80 border border-purple-400/40 flex items-center justify-center shadow-2xl relative animate-pulse-glow">
              <motion.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-12 h-12 text-purple-200"
              >
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
                  <path
                    d="M50 18C36 18 26 27 26 40C26 53 32 64 38 80C41 87 47 85 50 78C53 85 59 87 62 80C68 64 74 53 74 40C74 27 64 18 50 18Z"
                    fill="#F3E8FF"
                  />
                  <path
                    d="M42 35C42 35 47 31 50 31C53 31 58 35 58 35"
                    stroke="#7E22CE"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="46" r="4" fill="#7E22CE" />
                </svg>
              </motion.div>
              <div className="absolute -inset-1 rounded-2xl bg-purple-500/25 blur-sm -z-10" />
            </div>

            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2"
            >
              Dr. Arthi's Dentophilic Centre
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-purple-300 text-sm font-medium tracking-wide uppercase"
            >
              Hosur • Advanced Gentle Dentistry
            </motion.p>

            {/* Pulsing purple loading bar */}
            <div className="w-48 h-1 bg-purple-900/60 rounded-full mt-6 overflow-hidden border border-purple-800/40">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-full bg-gradient-to-r from-purple-500 via-purple-300 to-indigo-400 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
