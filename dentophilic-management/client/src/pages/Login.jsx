import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, User, Lock, Eye, EyeOff, LogIn, Stethoscope, Users, HelpCircle, ArrowRight, Mail, KeyRound, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleMode, setRoleMode] = useState('ADMIN'); // Visual role helper
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // 2-Step OTP Password Reset State
  const [forgotStep, setForgotStep] = useState(1); // 1 = request OTP, 2 = enter OTP & reset
  const [resetUsername, setResetUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [otpSentDetails, setOtpSentDetails] = useState(null);

  const handleOpenForgotModal = () => {
    setResetUsername(username.trim() || (roleMode === 'ADMIN' ? 'drarthi' : 'receptionist'));
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotStep(1);
    setOtpSentDetails(null);
    setShowForgotModal(true);
  };

  const handleRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!resetUsername.trim()) {
      error('Please enter the username to reset');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await api.post('/auth/forgot-password', { username: resetUsername.trim() });
      if (res.success) {
        success(res.message);
        setOtpSentDetails(res);
        if (res.devOtp) {
          setOtpCode(res.devOtp);
        }
        setForgotStep(2);
      }
    } catch (err) {
      error(err.message || 'Failed to request password reset OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      error('Please enter the valid 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      error('Passwords do not match');
      return;
    }

    try {
      setIsResettingPassword(true);
      const res = await api.post('/auth/reset-password', {
        username: resetUsername.trim(),
        otp: otpCode.trim(),
        newPassword
      });

      if (res.success) {
        success(res.message);
        setUsername(resetUsername.trim());
        setPassword(newPassword);
        setShowForgotModal(false);
      }
    } catch (err) {
      error(err.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error('Please enter both username and password');
      triggerShake();
      return;
    }

    try {
      setIsLoading(true);
      const user = await login(username.trim(), password);
      success(`Welcome back, ${user.name}! Access granted as ${user.role}.`);
    } catch (err) {
      triggerShake();
      error(err.message || 'Invalid credentials or account locked.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#090518] via-[#12082d] to-[#1e0e45] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glowing Purple Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.18, 0.28, 0.18]
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="absolute top-1/6 left-1/5 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.12, 0.22, 0.12]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        className="absolute bottom-1/6 right-1/5 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none"
      />

      {/* Floating dental tooth motif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <svg className="absolute top-10 left-10 w-40 h-40 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 6 5 6 9c0 3 1.5 6 2 9s1 4 2 4 1-2 2-2 1 2 2 2 1.5-1 2-4 2-6 2-9c0-4-2-7-6-7z" />
        </svg>
        <svg className="absolute bottom-10 right-10 w-52 h-52 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 6 5 6 9c0 3 1.5 6 2 9s1 4 2 4 1-2 2-2 1 2 2 2 1.5-1 2-4 2-6 2-9c0-4-2-7-6-7z" />
        </svg>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-0 glass-panel rounded-3xl border border-purple-500/25 shadow-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand & Identity Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-b from-purple-950/80 to-[#12082c]/90 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-purple-500/20 text-white">
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-xl shadow-purple-950/40 border border-purple-300 flex items-center justify-center shrink-0">
                <img
                  src="/clinic-logo.jpg"
                  alt="Dr. Arthi's Dentophilic Centre Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Clinic Portal 2.0</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
              Dr. Arthi's <br />
              <span className="text-purple-400">Dentophilic Centre</span>
            </h1>

            <p className="text-purple-200/80 text-sm mt-3 leading-relaxed">
              Unified Clinic Management & Electronic Medical Records System.
            </p>

            <div className="mt-8 space-y-3.5 text-xs text-purple-200/75">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Live synchronization with patient website</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Interactive FDI 32-tooth dental chart</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Strict role isolation (Admin vs Attender)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Dark & Light Elegant Purple themes</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-purple-900/40 text-xs text-purple-400/80 flex items-center justify-between font-mono">
            <span>TNDC Regd: 31263</span>
            <span>Hosur, Tamil Nadu</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <motion.div
          animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-slate-950/40"
        >
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs sm:text-sm mt-1 opacity-75">
              Select your role category and enter your registered credentials.
            </p>
          </div>

          {/* Role Mode Selector Toggle */}
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-purple-900/30 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRoleMode('ADMIN')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleMode === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor / Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleMode('ATTENDER')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                roleMode === 'ATTENDER'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attender / Reception</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={roleMode === 'ADMIN' ? 'drarthi' : 'reception_staff'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick account presets */}
            <div className="pt-1">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5">
                Quick Sign-In Presets:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setRoleMode('ADMIN');
                    setUsername('drarthi');
                    setPassword('Password@123');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3 h-3 text-purple-400" />
                  <span>Dr. Arthi (Doctor)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleMode('ATTENDER');
                    setUsername('receptionist');
                    setPassword('AttenderPass@123');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Priya (Attender)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleMode('ATTENDER');
                    setUsername('reception_staff');
                    setPassword('AttenderPass@123');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-medium transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Kavitha (Reception)</span>
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as {roleMode === 'ADMIN' ? 'Doctor' : 'Attender'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Forgot Password OTP Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-panel p-6 sm:p-7 rounded-3xl border border-purple-500/30 text-white shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif">
                    {forgotStep === 1 ? 'Reset Account Password' : 'Enter 6-Digit OTP'}
                  </h3>
                  <p className="text-[11px] text-purple-300/80 font-mono">
                    Security Policy • Dr. Arthi's Dentophilic Centre
                  </p>
                </div>
              </div>

              {/* Informative notice about doctor email */}
              <div className="my-4 p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200/90 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <span>For clinical data security, verification OTPs for <strong>both Doctor and Attender</strong> accounts are dispatched exclusively to Dr. Arthi's official email:</span>
                  <div className="font-mono text-purple-300 font-semibold mt-0.5">drarthidentophilic@gmail.com</div>
                </div>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Account Username to Reset
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type="text"
                        required
                        value={resetUsername}
                        onChange={e => setResetUsername(e.target.value)}
                        placeholder="e.g. drarthi, receptionist, reception_staff"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Works for Chief Doctor account or any registered Attender account.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 rounded-xl glass-card hover:border-purple-500/40 text-xs text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching OTP...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send 6-Digit OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                  {/* Account badge */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Account: </span>
                      <strong className="text-purple-300 font-mono">@{resetUsername}</strong>
                      {otpSentDetails?.name && <span className="text-slate-300"> ({otpSentDetails.name})</span>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      {otpSentDetails?.role === 'ADMIN' ? 'Doctor' : 'Attender'}
                    </span>
                  </div>

                  {otpSentDetails?.devOtp && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between">
                      <span>Dev Auto-Code: <strong>{otpSentDetails.devOtp}</strong></span>
                      <span className="text-[10px] font-mono opacity-80">(Local Test Mode)</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[8px] font-mono text-xl py-2.5 rounded-xl glass-input text-purple-300 font-bold placeholder:tracking-normal placeholder:font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      New Password (Min. 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-2 rounded-xl glass-input text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isResettingPassword}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isResettingPassword ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save New Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
