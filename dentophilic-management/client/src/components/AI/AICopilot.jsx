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
  AlertCircle,
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
  ChevronRight,
  Package,
  Receipt,
  TrendingUp,
  Languages
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
      text: `Hello Doctor ${user?.name ? user.name.split(' ')[0] : ''}! 🩺\n\nI am your **Dentophilic Clinical Copilot (Multi-Lingual AI Agent)**. You can talk to me in **English, Tamil (தமிழ்), Tanglish ("Inniku evlo patient da"), or Hindi**!\n\nI can register patients, search medical records, check today's queue, lookup low stock materials, record clinic expenses, or recommend dental drug dosages.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Add new patient',
        'Inniku evlo patient vandhanga?',
        'Check Lidocaine stock',
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
    language: 'english', // 'english' | 'tanglish' | 'tamil' | 'hindi'
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
          language: 'english',
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
      }, 500);
      return;
    }

    // 3. CALL BACKEND MULTI-LINGUAL AI CHAT API
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
        // If the AI detected patient registration intent, automatically initiate guided multi-turn flow
        if (res.intent === 'ADD_PATIENT_START') {
          setPatientFormState({
            active: true,
            step: 'NAME',
            language: res.language || 'english',
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
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: res.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intent: res.intent,
            data: res.data,
            stepIndicator: res.intent === 'ADD_PATIENT_START'
              ? {
                  current: 1,
                  total: 5,
                  label: res.language === 'tamil' ? 'நோயாளியின் பெயர்' : res.language === 'tanglish' ? 'Patient Name' : 'Patient Full Name'
                }
              : null,
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

  // Multi-Turn Step Progression with Multi-Lingual Responses
  const handlePatientFormProgress = async (text) => {
    const currentStep = patientFormState.step;
    const currentData = { ...patientFormState.data };
    const lang = patientFormState.language || 'english';
    const trimmed = text.trim();

    setTimeout(async () => {
      setIsTyping(false);

      if (currentStep === 'NAME') {
        currentData.name = trimmed;
        setPatientFormState(prev => ({ ...prev, active: true, step: 'PHONE', data: currentData }));
        
        let replyText = `Got it! **${trimmed}**.\n\nNow, what is their **10-digit mobile phone number**?`;
        let stepLabel = 'Phone Number';
        if (lang === 'tanglish') {
          replyText = `Sari doctor! **${trimmed}** note panniyachu. 👍\n\nAvanga **10-digit mobile phone number** sollunga?`;
          stepLabel = 'Mobile Number';
        } else if (lang === 'tamil') {
          replyText = `சரி மருத்துவரே! **${trimmed}** குறிக்கப்பட்டது. 👍\n\nநோயாளியின் **10 இலக்க மொபைல் எண்** என்ன?`;
          stepLabel = 'மொபைல் எண்';
        } else if (lang === 'hindi') {
          replyText = `नोट कर लिया गया है: **${trimmed}**। 👍\n\nअब मरीज का **10 अंकों का मोबाइल नंबर** बताएं?`;
          stepLabel = 'फ़ोन नंबर';
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 2, total: 5, label: stepLabel }
          }
        ]);
      } else if (currentStep === 'PHONE') {
        const cleanPhone = trimmed.replace(/\D/g, '');
        currentData.phone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : trimmed;
        setPatientFormState(prev => ({ ...prev, active: true, step: 'AGE_GENDER', data: currentData }));

        let replyText = `Phone noted (**${currentData.phone}**).\n\nWhat is the patient's **age and gender**?`;
        let stepLabel = 'Age & Gender';
        let defaultChips = ['25 Male', '28 Female', '35 Male', '42 Female', 'Child (8 Female)', 'Skip Age/Gender'];

        if (lang === 'tanglish') {
          replyText = `Phone number noted (**${currentData.phone}**). 📱\n\nPatient-oda **Age & Gender** enna doctor?`;
          stepLabel = 'Age & Gender';
        } else if (lang === 'tamil') {
          replyText = `மொபைல் எண் பதியப்பட்டது (**${currentData.phone}**). 📱\n\nநோயாளியின் **வயது மற்றும் பாலினம்** என்ன?`;
          stepLabel = 'வயது மற்றும் பாலினம்';
          defaultChips = ['25 ஆண்', '28 பெண்', '35 ஆண்', '42 பெண்', 'தவிர்க்க'];
        } else if (lang === 'hindi') {
          replyText = `फ़ोन नंबर दर्ज: **${currentData.phone}**। 📱\n\nमरीज की **उम्र और लिंग** क्या है?`;
          stepLabel = 'उम्र और लिंग';
          defaultChips = ['25 Male', '28 Female', '35 Male', '42 Female', 'छोड़ें'];
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 3, total: 5, label: stepLabel },
            chips: defaultChips
          }
        ]);
      } else if (currentStep === 'AGE_GENDER') {
        if (!trimmed.toLowerCase().includes('skip') && !trimmed.includes('தவிர்க்க') && !trimmed.includes('छोड़ें')) {
          const ageMatch = trimmed.match(/\d+/);
          if (ageMatch) currentData.age = ageMatch[0];
          if (/female|f\b|பெண்/i.test(trimmed)) currentData.gender = 'Female';
          else if (/male|m\b|ஆண்/i.test(trimmed)) currentData.gender = 'Male';
        }
        setPatientFormState(prev => ({ ...prev, active: true, step: 'COMPLAINT', data: currentData }));

        let replyText = `Thank you. What is their **chief complaint or reason for visit**?`;
        let stepLabel = 'Chief Complaint';
        let complaintChips = [
          'Severe Toothache',
          'Routine Cleaning & Scaling',
          'Cavity / Broken Tooth',
          'Crown / Bridge Consultation',
          'Braces / Clear Aligners',
          'General Checkup'
        ];

        if (lang === 'tanglish') {
          replyText = `Noted doctor! Patient-ku enna **chief complaint / reason for visit** (toothache, cleaning, cavity)?`;
          stepLabel = 'Chief Complaint';
        } else if (lang === 'tamil') {
          replyText = `குறிக்கப்பட்டது மருத்துவரே! நோயாளியின் **முக்கிய பிரச்சனை / வருகைக்கான காரணம்** என்ன?`;
          stepLabel = 'முக்கிய பிரச்சனை';
          complaintChips = ['கடும் பல் வலி', 'பல் சுத்தம் செய்தல்', 'பல் சொத்தை / உடைவு', 'ரூட் கெனால்', 'கிளினிக் பரிசோதனை'];
        } else if (lang === 'hindi') {
          replyText = `नोट कर लिया गया है। मरीज की **मुख्य समस्या / तकलीफ** क्या है?`;
          stepLabel = 'मुख्य समस्या';
          complaintChips = ['तेज दांत दर्द', 'दांतों की सफाई', 'दांत में कीड़ा / कैविटी', 'रूट कैनाल', 'सामान्य जांच'];
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 4, total: 5, label: stepLabel },
            chips: complaintChips
          }
        ]);
      } else if (currentStep === 'COMPLAINT') {
        currentData.complaint = trimmed;
        setPatientFormState(prev => ({ ...prev, active: true, step: 'ALLERGIES', data: currentData }));

        let replyText = `Complaint noted: *"${trimmed}"*.\n\nAny known **drug allergies** (e.g., Penicillin, NSAIDs) or systemic conditions (Diabetes, Hypertension)?`;
        let stepLabel = 'Allergies & Medical History';
        let allergyChips = [
          'No Allergies / Healthy',
          'Allergic to Penicillin',
          'Diabetic (Type 2)',
          'Hypertensive',
          'Asthmatic'
        ];

        if (lang === 'tanglish') {
          replyText = `Complaint: *"${trimmed}"*. 👍\n\nEdhavadhu **drug allergies** (Penicillin, etc.) or systemic conditions (Diabetes / BP) irukka?`;
          stepLabel = 'Allergies & History';
        } else if (lang === 'tamil') {
          replyText = `பிரச்சனை: *"${trimmed}"*. 👍\n\nஏதேனும் **மருந்து ஒவ்வாமை (Penicillin, NSAIDs)** அல்லது இரத்த அழுத்தம்/நீரிழிவு நோய் உள்ளதா?`;
          stepLabel = 'ஒவ்வாமை & வரலாறு';
          allergyChips = ['ஒவ்வாமை எதுவும் இல்லை', 'பென்சிலின் ஒவ்வாமை', 'நீரிழிவு நோய்', 'இரத்த அழுத்தம்', 'ஆஸ்துமா'];
        } else if (lang === 'hindi') {
          replyText = `समस्या नोट: *"${trimmed}"*. 👍\n\nक्या कोई **दवा एलर्जी (Penicillin)** या बीपी/डायबिटीज की समस्या है?`;
          stepLabel = 'एलर्जी और इतिहास';
          allergyChips = ['कोई एलर्जी नहीं / स्वस्थ', 'पेनिसिलिन एलर्जी', 'मधुमेह (टाइप 2)', 'उच्च रक्तचाप', 'अस्थमा'];
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepIndicator: { current: 5, total: 5, label: stepLabel },
            chips: allergyChips
          }
        ]);
      } else if (currentStep === 'ALLERGIES') {
        currentData.allergies = trimmed;
        currentData.medicalHistory = trimmed.includes('Diabetic') || trimmed.includes('Hypertensive') || trimmed.includes('நீரிழிவு') ? trimmed : '';
        setPatientFormState(prev => ({ ...prev, active: true, step: 'CONFIRM', data: currentData }));

        let confirmText = `All clinical details gathered! 📋\n\nPlease review the patient profile below and click **Register Patient** to record them in the clinic database:`;
        if (lang === 'tanglish') {
          confirmText = `Ellam clinical details-um gather panniyachu doctor! 📋\n\nKeezha irukra patient profile review pannittu **Register Patient** click pannunga, database-la create aagidum:`;
        } else if (lang === 'tamil') {
          confirmText = `அனைத்து மருத்துவ விவரங்களும் பெறப்பட்டன! 📋\n\nகீழுள்ள நோயாளி விவரங்களை சரிபார்த்து **Register Patient** பொத்தானை அழுத்தி மருத்துவ பதிவேட்டில் சேர்க்கவும்:`;
        } else if (lang === 'hindi') {
          confirmText = `सभी क्लिनिकल विवरण एकत्रित कर लिए गए हैं! 📋\n\nकृपया नीचे दिए गए प्रोफाइल की समीक्षा करें और **Register Patient** पर क्लिक करें:`;
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: confirmText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientPreview: currentData
          }
        ]);
      }
    }, 400);
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

        const lang = patientFormState.language;
        let successMsg = `🎉 **Success!** Patient record has been permanently created with clinical ID **${res.patient.patientId}**.`;
        if (lang === 'tanglish') {
          successMsg = `🎉 **Super Doctor!** Patient **${res.patient.name}** record database-la create aayidichu with Clinical ID **${res.patient.patientId}**.`;
        } else if (lang === 'tamil') {
          successMsg = `🎉 **வெற்றி!** நோயாளி **${res.patient.name}** விவரம் மருத்துவ தரவுத்தளத்தில் ஐடி **${res.patient.patientId}** உடன் நிரந்தரமாக சேமிக்கப்பட்டது.`;
        } else if (lang === 'hindi') {
          successMsg = `🎉 **सफलता!** मरीज **${res.patient.name}** का रिकॉर्ड आईडी **${res.patient.patientId}** के साथ डेटाबेस में दर्ज हो गया है।`;
        }

        setPatientFormState({ active: false, step: null, language: 'english', data: {} });

        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: 'ai',
            text: successMsg,
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
    const lang = patientFormState.language;
    setPatientFormState({ active: false, step: null, language: 'english', data: {} });
    let cancelMsg = 'Patient registration cancelled. Let me know whenever you need anything else, Doctor!';
    if (lang === 'tanglish') cancelMsg = 'Patient registration cancel panniyachu doctor. Vera edhavadhu help venuma?';
    else if (lang === 'tamil') cancelMsg = 'நோயாளி பதிவு ரத்து செய்யப்பட்டது மருத்துவரே. வேறு ஏதேனும் உதவி வேண்டுமா?';

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'ai',
        text: cancelMsg,
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-semibold">
                    Mass LLM
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-300">
                  <Languages className="w-3 h-3 text-purple-400" />
                  <span>English • தமிழ் • Tanglish • हिंदी</span>
                </div>
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

                  {/* 1. PATIENT SEARCH RESULT CARD */}
                  {msg.intent === 'PATIENT_SEARCH_RESULT' && msg.data?.patient && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/30 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-sm shadow-xs">
                            {msg.data.patient.name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {msg.data.patient.name}
                            </div>
                            <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-semibold">
                              ID: {msg.data.patient.patientId} • Ph: {msg.data.patient.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                          Active Patient
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/50 p-2.5 rounded-xl border border-purple-500/15">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Demographics:</span>
                          <span className="font-medium">{msg.data.patient.age ? `${msg.data.patient.age} yrs` : 'Age N/A'} • {msg.data.patient.gender}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Past Visits:</span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">{msg.data.patient.visitsCount || 0} visits</span>
                        </div>
                        {msg.data.patient.lastVisit && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px]">Last Consultation Date:</span>
                            <span className="font-medium">{msg.data.patient.lastVisit}</span>
                          </div>
                        )}
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">Allergies & Medical Alerts:</span>
                          <span className={msg.data.patient.allergies && msg.data.patient.allergies !== 'None' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
                            {msg.data.patient.allergies || 'No known drug allergies'} {msg.data.patient.medicalHistory ? `• ${msg.data.patient.medicalHistory}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onOpenScheduleModal) onOpenScheduleModal(msg.data.patient);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-sm shadow-purple-600/30 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule Visit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNavigateToPatients) onNavigateToPatients(msg.data.patient.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-500/10 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Open File</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. INVENTORY SINGLE ITEM CARD */}
                  {msg.intent === 'INVENTORY_ITEM' && msg.data?.item && (
                    <div className={`mt-3 p-3.5 rounded-2xl border space-y-2.5 ${
                      msg.data.item.isLowStock
                        ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-purple-500" />
                            <span>{msg.data.item.name}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold">
                            {msg.data.item.category || 'Clinical Supply'}
                          </span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          msg.data.item.isLowStock
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {msg.data.item.isLowStock ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {msg.data.item.isLowStock ? 'LOW STOCK ALERT' : 'IN STOCK'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-purple-500/15">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Current Quantity:</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{msg.data.item.currentStock} {msg.data.item.unit}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Min. Reorder Threshold:</span>
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{msg.data.item.minThreshold} {msg.data.item.unit}</span>
                        </div>
                        {msg.data.item.supplier && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[10px]">Supplier:</span>
                            <span className="font-medium">{msg.data.item.supplier}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. INVENTORY LOW STOCK ALERTS LIST */}
                  {msg.intent === 'INVENTORY_ALERT' && msg.data?.items && msg.data.items.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Low Stock Materials ({msg.data.items.length})</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 font-semibold border border-amber-500/30">
                          Reorder Urgently
                        </span>
                      </div>
                      <div className="divide-y divide-amber-500/20">
                        {msg.data.items.map((it, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-[11px]">
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{it.name}</div>
                              <div className="text-[10px] text-slate-500">{it.category} • Supplier: {it.supplier || 'N/A'}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-rose-600 dark:text-rose-400">{it.currentStock} {it.unit}</span>
                              <span className="text-[10px] text-slate-400 block">Min: {it.minThreshold}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. EXPENSE RECORDED RECEIPT CARD */}
                  {msg.intent === 'EXPENSE_RECORDED' && msg.data?.expense && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-emerald-500" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-base">
                              ₹{Number(msg.data.expense.amount).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                              {msg.data.expense.category || 'General Expense'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.data.expense.expenseDate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white/40 dark:bg-slate-900/40 p-2 rounded-xl">
                        "{msg.data.expense.description}"
                      </p>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-emerald-500/20">
                        <span>Payment Mode: <strong className="text-slate-900 dark:text-white">{msg.data.expense.paymentMode || 'Cash'}</strong></span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="w-3 h-3" /> Saved to Ledger</span>
                      </div>
                    </div>
                  )}

                  {/* 5. TODAY QUEUE & SCHEDULE MINI BOARD */}
                  {msg.intent === 'TODAY_SCHEDULE' && msg.data?.stats && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span>Today's Live Queue</span>
                        </span>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          {msg.data.stats.totalToday} Scheduled Today
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/25">
                          <div className="font-bold text-sm text-amber-600 dark:text-amber-400">{msg.data.stats.waiting}</div>
                          <div className="text-slate-500 text-[9px] mt-0.5">Waiting</div>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/25">
                          <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{msg.data.stats.inChair}</div>
                          <div className="text-slate-500 text-[9px] mt-0.5">In Chair</div>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                          <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{msg.data.stats.completed}</div>
                          <div className="text-slate-500 text-[9px] mt-0.5">Completed</div>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/25">
                          <div className="font-bold text-sm text-purple-600 dark:text-purple-400">{msg.data.stats.upcoming}</div>
                          <div className="text-slate-500 text-[9px] mt-0.5">Upcoming</div>
                        </div>
                      </div>

                      {onNavigateToAppointments && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToAppointments();
                          }}
                          className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                        >
                          <span>View Full Appointment Schedule</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
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
