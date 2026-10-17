import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  CalendarCheck
} from 'lucide-react';
import { siteData } from '../config/siteData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function BookingForm({ initialService = '', onBookingSuccess = null }) {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Female',
    service: initialService || siteData.services[0].title,
    date: '',
    timeSlot: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [serverError, setServerError] = useState('');

  // Update service if prop changes
  useEffect(() => {
    if (initialService) {
      setFormData((prev) => ({ ...prev, service: initialService }));
    }
  }, [initialService]);

  // Set default date to tomorrow (or Monday if tomorrow is Sunday)
  useEffect(() => {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    if (nextDay.getDay() === 0) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    const defaultDateStr = nextDay.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, date: defaultDateStr }));
  }, []);

  // Fetch booked slots whenever date changes
  useEffect(() => {
    if (!formData.date) return;

    let isMounted = true;
    const fetchAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/appointments/availability?date=${formData.date}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setBookedSlots(data.bookedSlots || []);
          if (data.bookedSlots?.includes(formData.timeSlot)) {
            setFormData((prev) => ({ ...prev, timeSlot: '' }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch slot availability:', err);
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [formData.date]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (minimum 2 characters).';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number (starts with 6, 7, 8, or 9).';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address or leave blank.';
    }

    if (!formData.service) {
      newErrors.service = 'Please select a treatment.';
    }

    if (!formData.date) {
      newErrors.date = 'Please pick an appointment date.';
    } else {
      const selected = new Date(`${formData.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.date = 'Appointment date cannot be in the past.';
      }
      if (selected.getDay() === 0) {
        newErrors.date = 'Clinic is closed on Sundays for routine care. Please choose Monday to Saturday.';
      }
    }

    if (!formData.timeSlot) {
      newErrors.timeSlot = 'Please select an available time slot chip.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || 'Unable to confirm booking. Please try again or call us.');
        setIsSubmitting(false);
        return;
      }

      setBookingConfirmation(result.appointment);
      if (onBookingSuccess) onBookingSuccess(result.appointment);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback
      }
    } catch (err) {
      setServerError('Network error connecting to booking server. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBookingConfirmation(null);
    setFormData((prev) => ({
      ...prev,
      name: '',
      phone: '',
      email: '',
      age: '',
      timeSlot: '',
      message: ''
    }));
    setErrors({});
    setServerError('');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Success Confirmation Screen
  if (bookingConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-200 shadow-2xl text-center"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse-glow">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 mb-3">
          Appointment Request Received
        </span>

        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Thank You, {bookingConfirmation.name}!
        </h3>

        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-6">
          Your dental consultation has been reserved. Our clinic coordinator will contact you shortly to confirm.
        </p>

        {/* Reference ID Card */}
        <div className="max-w-md mx-auto bg-purple-50/50 border border-purple-100 rounded-2xl p-5 text-left mb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <span className="text-xs font-semibold text-slate-500 uppercase">Booking Reference</span>
            <span className="font-mono font-bold text-purple-900 text-sm bg-purple-100/80 px-2.5 py-1 rounded-md border border-purple-200">
              {bookingConfirmation.referenceId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500 block">Service</span>
              <strong className="text-slate-800">{bookingConfirmation.service}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Scheduled Time</span>
              <strong className="text-slate-800">
                {bookingConfirmation.date} at {bookingConfirmation.timeSlot}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Patient Contact</span>
              <strong className="text-slate-800">+91 {bookingConfirmation.phone}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Clinic Location</span>
              <strong className="text-slate-800">PK Complex, Hosur</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/91${siteData.clinic.phoneRaw}?text=${encodeURIComponent(
              `Hello Dr. Arthi's Dentophilic Centre, I just booked an appointment! Reference: ${bookingConfirmation.referenceId} for ${bookingConfirmation.name} on ${bookingConfirmation.date} at ${bookingConfirmation.timeSlot}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Send Details on WhatsApp</span>
          </a>

          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-900 font-semibold text-sm transition-colors cursor-pointer"
          >
            Book Another Appointment
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Row 1: Full Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-purple-50/20 border ${
                errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-purple-200/80 focus:border-purple-600'
              } text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all`}
            />
          </div>
          {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Phone Number (10 Digits) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-purple-200/80 bg-purple-50 text-purple-900 text-xs font-semibold">
              +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="95971 26248"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              className={`w-full px-4 py-3 rounded-r-xl bg-purple-50/20 border ${
                errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-purple-200/80 focus:border-purple-600'
              } text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all`}
            />
          </div>
          {errors.phone && <p className="text-rose-600 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Row 2: Email & Age/Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-purple-50/20 border ${
                errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-purple-200/80 focus:border-purple-600'
              } text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all`}
            />
          </div>
          {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Age <span className="text-slate-400 font-normal lowercase">(yrs)</span>
          </label>
          <input
            type="number"
            min={1}
            max={110}
            placeholder="e.g. 28"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-purple-50/20 border border-purple-200/80 text-slate-800 text-sm focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Gender
          </label>
          <div className="flex rounded-xl bg-purple-50/50 p-1 border border-purple-200">
            {['Female', 'Male', 'Other'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFormData({ ...formData, gender: g })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  formData.gender === g
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:text-purple-950'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Service Selection */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Treatment / Service <span className="text-rose-500">*</span>
        </label>
        <select
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-purple-50/20 border border-purple-200/80 text-slate-800 text-sm focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium"
        >
          {siteData.services.map((svc) => (
            <option key={svc.id} value={svc.title}>
              {svc.title} ({svc.badge})
            </option>
          ))}
        </select>
      </div>

      {/* Row 4: Preferred Date */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Preferred Date <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-purple-700 font-medium">Mon - Sat (Closed Sundays)</span>
        </div>
        <div className="relative">
          <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            min={todayStr}
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={`w-full pl-10 pr-4 py-3 rounded-xl bg-purple-50/20 border ${
              errors.date ? 'border-rose-400 focus:ring-rose-200' : 'border-purple-200/80 focus:border-purple-600'
            } text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium`}
          />
        </div>
        {errors.date && <p className="text-rose-600 text-xs mt-1">{errors.date}</p>}
      </div>

      {/* Row 5: Time Slot Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Time Slot <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="flex items-center text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              <span className="w-2 h-2 rounded-full bg-purple-600 mr-1.5 animate-pulse" />
              {siteData.availableSlots.filter(s => !bookedSlots.includes(s)).length} Available
            </span>
          </div>
        </div>

        {isLoadingSlots ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            <span>Checking slot availability for {formData.date}...</span>
          </div>
        ) : (() => {
          const visibleSlots = siteData.availableSlots.filter((slot) => !bookedSlots.includes(slot));
          if (visibleSlots.length === 0) {
            return (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>All time slots for {formData.date} are fully booked. Please select another convenient date.</span>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {visibleSlots.map((slot) => {
                const isSelected = formData.timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, timeSlot: slot })}
                    className={`py-2.5 px-1 text-center rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-md shadow-purple-950/20 border border-purple-700 scale-102 ring-2 ring-purple-400/30'
                        : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-purple-200/70 hover:border-purple-300 shadow-xs'
                    }`}
                    title={`Select ${slot}`}
                  >
                    <span>{slot}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}
        {errors.timeSlot && <p className="text-rose-600 text-xs mt-1.5">{errors.timeSlot}</p>}
      </div>

      {/* Row 6: Symptoms / Message */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Symptoms / Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <textarea
            rows={2}
            placeholder="e.g. Sensitivity on cold liquids, routine cleaning, or chipped tooth..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-50/20 border border-purple-200/80 text-slate-800 text-sm focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 hover:from-purple-800 hover:to-indigo-950 text-white font-bold text-base shadow-lg shadow-purple-950/25 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer animate-pulse-glow"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-purple-200" />
            <span>Reserving Your Slot...</span>
          </>
        ) : (
          <>
            <CalendarCheck className="w-5 h-5 text-purple-200 group-hover:scale-110 transition-transform" />
            <span>Confirm Appointment Booking</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        🔒 Your personal details are confidential and never shared. No advance payment required online.
      </p>
    </form>
  );
}
