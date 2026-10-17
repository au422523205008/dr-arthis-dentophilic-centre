import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, User, Lock, Phone, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FirstRunSetup() {
  const { setupFirstAdmin } = useAuth();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    username: 'drarthi',
    name: 'Dr. Arthi Mukeshkannan, B.D.S',
    phone: '9597126248',
    email: 'drarthidentophilic@gmail.com',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.name.trim() || !form.password) {
      error('Please fill in all required fields.');
      return;
    }

    if (form.password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await setupFirstAdmin({
        username: form.username.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      success('Master Administrator account initialized successfully! Welcome to your clinic portal.');
    } catch (err) {
      error(err.message || 'Setup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#120726] to-[#250b44] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-xl glass-panel p-8 sm:p-10 rounded-3xl border border-purple-500/30 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-4 shadow-lg shadow-purple-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide">
            First-Run Setup
          </h1>
          <p className="text-purple-400 font-medium text-sm mt-1">
            Dr. Arthi's Dentophilic Centre
          </p>
          <div className="mt-4 p-3.5 bg-purple-950/40 border border-purple-800/60 rounded-xl text-left text-xs sm:text-sm text-purple-200/90 leading-relaxed">
            <span className="font-semibold text-purple-300">Clean Database Detected:</span> No demo or dummy data will be added. Create your primary Chief Doctor & Master Administrator login below.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Doctor / Admin Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Dr. Arthi Mukeshkannan, B.D.S"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Username *
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="drarthi"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9597126248"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="drarthidentophilic@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-input text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Initialize Admin & Launch System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
