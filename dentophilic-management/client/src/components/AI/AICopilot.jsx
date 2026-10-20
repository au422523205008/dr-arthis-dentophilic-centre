import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Clock,
  Calendar,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Pill,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AICopilot({
  isOpen,
  onClose,
  onNavigateToPatients,
  onNavigateToAppointments,
  onOpenScheduleModal
}) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello Doctor ${user?.name ? user.name.split(' ')[0] : ''}! 🩺\n\nI am your **Dentophilic Clinical Copilot**. I can register patients conversationally, inspect today's appointments, check low stock materials, or provide dental pharmacological protocols.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Add new patient',
        "Today's queue & schedule",
        'Check low stock inventory',
        'Prescription for acute pulpitis',
        "Today's revenue summary"
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Multi-Turn Patient Registration State
  const [patientFormState, setPatientFormState] = useState({
    active: false,
    step: null, // 'NAME' | 'PHONE' | 'AGE_GENDER' | 'COMPLAINT' | 'ALLERGIES' | 'CONFIRM'
    data: {
      name: '',
      phone: '',
      age: '',
      gender: 'Not Specified',
      complaint: '',
      allergies: 'None',
      medicalHistory: ''
    }
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  // Try to parse one-shot patient inputs (e.g. "Add patient Ramesh, 35M, 9876543210, toothache, no allergies")
  const parseOneShotPatient = (text) => {
    const phoneMatch = text.match(/\b[6-9]\d{9}\b/);
    const ageGenderMatch = text.match(/\b(\d{1,2})\s*(?:y\/o|yrs|years old)?\s*(m(?:ale)?|f(?:emale)?)\b/i);
    const nameMatch = text.match(/(?:add|new|register|create)\s+patient\s+([A-Za-z\s]+?)(?:,|\bwith\b|\bphone\b|\b\d|\bage\b|$)/i);

    if (phoneMatch && nameMatch && nameMatch[1]) {
      const parsedName = nameMatch[1].trim();
      const parsedPhone = phoneMatch[0];
      const parsedAge = ageGenderMatch ? ageGenderMatch[1] : '';
      const parsedGender = ageGenderMatch
        ? (ageGenderMatch[2].toLowerCase().startsWith('m') ? 'Male' : 'Female')
        : 'Not Specified';

      let complaint = 'General Dental Consultation';
      if (/toothache|pain|ache/i.test(text)) complaint = 'Toothache / Acute Dental Pain';
      else if (/cleaning|scaling/i.test(text)) complaint = 'Routine Cleaning & Scaling';
      else if (/rct|root canal/i.test(text)) complaint = 'Root Canal Treatment Consultation';
      else if (/braces|aligner/i.test(text)) complaint = 'Orthodontic / Aligner Consultation';

      let allergies = 'None';
      if (/penicillin/i.test(text)) allergies = 'Allergic to Penicillin';
      else if (/no allerg|none/i.test(text)) allergies = 'No known drug allergies';

      return {
        name: parsedName,
        phone: parsedPhone,
        age: parsedAge,
        gender: parsedGender,
        complaint,
        allergies,
        medicalHistory: ''
      };
    }
    return null;
  };

  const handleSend = async (userMessageText = null) => {
    const textToSend = typeof userMessageText === 'string' ? userMessageText : input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const lower = textToSend.toLowerCase().trim();

    // 1. CHECK IF IN MULTI-TURN ADD PATIENT FLOW
    if (patientFormState.active) {
      await handlePatientFormProgress(textToSend);
      return;
    }

    // 2. CHECK FOR ONE-SHOT ADD PATIENT COMMAND
    const oneShotData = parseOneShotPatient(textToSend);
    if (oneShotData) {
      setTimeout(() => {
        setIsTyping(false);
        setPatientFormState({
          active: true,
          step: 'CONFIRM',
          data: oneShotData
        });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `I've intelligently extracted **${oneShotData.name}**'s clinical details from your message. 📋\n\nPlease verify the patient record below and click **Register Patient** to commit directly to the clinic database:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientPreview: oneShotData
          }
        ]);
      }, 600);
      return;
    }

    // 3. START STEP-BY-STEP PATIENT REGISTRATION
    if (
      lower.includes('add patient') ||
      lower.includes('new patient') ||
      lower.includes('register patient') ||
      lower.includes('create patient')
    ) {
      setTimeout(() => {
        setIsTyping(false);
        setPatientFormState({
          active: true,
          step: 'NAME',
          data: {
            name: '',
            phone: '',
            age: '',
            gender: 'Not Specified',
            complaint: '',
            allergies: 'None',
            medicalHistory: ''
          }
        });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: "Let's register the new patient step-by-step! 🩺\n\nWhat is the **patient's full name**?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 1, total: 5, label: 'Patient Full Name' }
          }
        ]);
      }, 500);
      return;
    }

    // 4. CALL BACKEND AI CHAT API
    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        context: {
          userName: user?.name,
          role: user?.role
        }
      });

      setIsTyping(false);

      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: res.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intent: res.intent,
            data: res.data,
            suggestions: res.quickSuggestions || (res.intent === 'DENTAL_PROTOCOL' ? [
              'Add new patient',
              "Check today's queue",
              'Check low stock items'
            ] : null)
          }
        ]);
      } else {
        throw new Error(res.message || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('AI Copilot Error:', err);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I experienced a brief connection glitch, but I'm ready to assist. You can register patients, check today's queue, or inspect low stock inventory anytime.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Add new patient', "Today's queue & schedule", 'Check low stock inventory']
        }
      ]);
    }
  };

  // Multi-Turn Step Progression
  const handlePatientFormProgress = async (text) => {
    const currentStep = patientFormState.step;
    const currentData = { ...patientFormState.data };
    const trimmed = text.trim();

    setTimeout(async () => {
      setIsTyping(false);

      if (currentStep === 'NAME') {
        currentData.name = trimmed;
        setPatientFormState({ active: true, step: 'PHONE', data: currentData });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Got it! **${trimmed}**.\n\nNow, what is their **10-digit mobile phone number**?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 2, total: 5, label: 'Phone Number' }
          }
        ]);
      } else if (currentStep === 'PHONE') {
        const cleanPhone = trimmed.replace(/\D/g, '');
        currentData.phone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : trimmed;
        setPatientFormState({ active: true, step: 'AGE_GENDER', data: currentData });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Phone noted (**${currentData.phone}**).\n\nWhat is the patient's **age and gender**?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 3, total: 5, label: 'Age & Gender' },
            chips: [
              '25 Male',
              '28 Female',
              '35 Male',
              '42 Female',
              'Child (8 Female)',
              'Skip Age/Gender'
            ]
          }
        ]);
      } else if (currentStep === 'AGE_GENDER') {
        if (!trimmed.toLowerCase().includes('skip')) {
          const ageMatch = trimmed.match(/\d+/);
          if (ageMatch) currentData.age = ageMatch[0];
          if (/female|f\b/i.test(trimmed)) currentData.gender = 'Female';
          else if (/male|m\b/i.test(trimmed)) currentData.gender = 'Male';
        }
        setPatientFormState({ active: true, step: 'COMPLAINT', data: currentData });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Thank you. What is their **chief complaint or reason for visit**?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 4, total: 5, label: 'Chief Complaint' },
            chips: [
              'Severe Toothache',
              'Routine Cleaning & Scaling',
              'Cavity / Broken Tooth',
              'Crown / Bridge Consultation',
              'Braces / Clear Aligners',
              'General Checkup'
            ]
          }
        ]);
      } else if (currentStep === 'COMPLAINT') {
        currentData.complaint = trimmed;
        setPatientFormState({ active: true, step: 'ALLERGIES', data: currentData });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Complaint noted: *"${trimmed}"*.\n\nAny known **drug allergies** (e.g., Penicillin, NSAIDs) or systemic conditions (Diabetes, Hypertension)?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 5, total: 5, label: 'Allergies & Medical History' },
            chips: [
              'No Allergies / Healthy',
              'Allergic to Penicillin',
              'Diabetic (Type 2)',
              'Hypertensive',
              'Asthmatic'
            ]
          }
        ]);
      } else if (currentStep === 'ALLERGIES') {
        currentData.allergies = trimmed;
        currentData.medicalHistory = trimmed.includes('Diabetic') || trimmed.includes('Hypertensive') ? trimmed : '';
        setPatientFormState({ active: true, step: 'CONFIRM', data: currentData });
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `All clinical details gathered! 📋\n\nPlease review the patient profile below and click **Register Patient** to record them in the clinic database:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientPreview: currentData
          }
        ]);
      }
    }, 450);
  };

  // Submit and commit patient to database
  const handleCommitPatient = async (patientData) => {
    try {
      setIsTyping(true);
      const payload = {
        name: patientData.name,
        phone: patientData.phone,
        age: patientData.age || '',
        gender: patientData.gender || 'Not Specified',
        allergies: patientData.allergies || 'None',
        medicalHistory: patientData.medicalHistory || '',
        address: ''
      };

      const res = await api.post('/patients', payload);
      setIsTyping(false);

      if (res.success && res.patient) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
        success(`Patient ${res.patient.name} registered successfully!`);

        setPatientFormState({ active: false, step: null, data: {} });

        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: `🎉 **Success!** Patient record has been permanently created with clinical ID **${res.patient.patientId}**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientCreated: res.patient
          }
        ]);
      } else {
        throw new Error(res.message || 'Failed to register patient');
      }
    } catch (err) {
      setIsTyping(false);
      toastError(err.message || 'Failed to commit patient');
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: `❌ Could not complete registration: ${err.message}. Would you like to try again?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCancelPatientForm = () => {
    setPatientFormState({ active: false, step: null, data: {} });
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'ai',
        text: 'Patient registration cancelled. Let me know whenever you need anything else, Doctor!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['Add new patient', "Today's queue & schedule", 'Check low stock inventory']
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex justify-end p-3 sm:p-6">
        {/* Backdrop for mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs pointer-events-auto sm:hidden"
        />

        {/* Main AI Drawer */}
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`pointer-events-auto relative w-full flex flex-col rounded-3xl glass-panel border border-purple-500/30 shadow-2xl shadow-purple-950/40 overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'max-w-2xl h-[90vh]'
              : 'max-w-md h-[82vh] sm:h-[75vh]'
          }`}
        >
          {/* Top Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-slate-900/60 border-b border-purple-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                    <span>Dentophilic Copilot</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-semibold">
                    AI Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Clinical assistant • Dr. Arthi's Dental Practice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl hover:bg-purple-500/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand width'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Step Progress Pill (if in multi-turn form) */}
          {patientFormState.active && (
            <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span className="font-semibold text-purple-700 dark:text-purple-300 text-[11px]">
                  Guided Patient Onboarding Active
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelPatientForm}
                className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
              >
                Cancel Form
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-xs shadow-md shadow-purple-600/20'
                      : 'bg-white dark:bg-slate-900/80 border border-purple-500/20 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {/* Step Indicator Header */}
                  {msg.stepIndicator && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15 text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                      <span>Step {msg.stepIndicator.current} of {msg.stepIndicator.total}</span>
                      <span>{msg.stepIndicator.label}</span>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text}
                  </div>

                  {/* Quick Click Chips */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PATIENT PREVIEW CARD BEFORE COMMIT */}
                  {msg.patientPreview && (
                    <div className="mt-3 p-3.5 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {msg.patientPreview.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                          Ready to Save
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                          <span className="font-mono font-semibold">{msg.patientPreview.phone || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Demographics:</span>
                          <span>{msg.patientPreview.age ? `${msg.patientPreview.age} yrs` : 'Age N/A'} • {msg.patientPreview.gender}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">Chief Complaint:</span>
                          <span className="font-medium text-purple-700 dark:text-purple-300">{msg.patientPreview.complaint || 'General Dental Consultation'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">Allergies / Medical Alerts:</span>
                          <span className="font-medium text-rose-600 dark:text-rose-400">{msg.patientPreview.allergies || 'No known allergies'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCommitPatient(msg.patientPreview)}
                          className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Register Patient</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelPatientForm}
                          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PATIENT CREATED SUCCESS CARD */}
                  {msg.patientCreated && (
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {msg.patientCreated.name}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                            {msg.patientCreated.patientId} • Ph: {msg.patientCreated.phone}
                          </div>
                        </div>
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenScheduleModal) onOpenScheduleModal(msg.patientCreated);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-sm transition-all"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule Visit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNavigateToPatients) onNavigateToPatients(msg.patientCreated.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-500/10 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Open File</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggestions underneath AI responses */}
                  {msg.suggestions && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-purple-500/10">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(sug)}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium text-[10px] transition-colors cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-[9px] pt-1 ${msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 text-white mt-0.5 shadow-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-slate-400 text-xs"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-500">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-purple-500/20 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-purple-600 dark:text-purple-300 ml-1 font-medium">
                    Consulting clinical database...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-white/80 dark:bg-slate-950/80 border-t border-purple-500/20 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  patientFormState.active
                    ? `Reply for ${patientFormState.step}...`
                    : "Ask AI Copilot: 'Add patient', 'Queue today', 'Pulpitis dosage'..."
                }
                className="flex-1 px-3.5 py-2.5 rounded-2xl glass-input text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden"
              />

              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
