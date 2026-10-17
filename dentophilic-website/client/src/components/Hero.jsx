import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Phone, Star, ShieldCheck, Heart, Sparkles, Award, ArrowUpRight } from 'lucide-react';
import { siteData } from '../config/siteData';

function AnimatedCounter({ value, suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    const duration = 2000;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easeProgress * value;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue)}
      <span className="text-purple-700 font-sans">{suffix}</span>
    </span>
  );
}

export default function Hero({ onOpenBooking }) {
  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-purple-100/50 via-purple-50/30 to-white">
      {/* Background Ambient Aurora Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[450px] bg-gradient-to-tr from-purple-300/30 via-indigo-200/30 to-pink-200/20 blur-3xl pointer-events-none -z-10 animate-aurora" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-5 w-80 h-80 bg-indigo-300/15 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Floating Decorative CSS Animated Badges */}
      <div className="hidden lg:flex absolute top-36 left-12 items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-purple-950/5 border border-purple-200/80 text-xs font-semibold text-purple-900 animate-float-slow">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
          <Sparkles className="w-4 h-4" />
        </div>
        <span>Painless Rotary Tech</span>
      </div>

      <div className="hidden lg:flex absolute top-48 right-16 items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-purple-950/5 border border-purple-200/80 text-xs font-semibold text-slate-800 animate-float-reverse">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span>100% Class-B Autoclaved</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Clinic Crest Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-purple-200 shadow-md mb-4 text-xs font-semibold text-purple-950"
          >
            <img
              src="/clinic-logo.jpg"
              alt="Dr. Arthi's Dentophilic Centre"
              className="w-6 h-6 rounded-full object-contain p-0.5 border border-purple-300 bg-white"
            />
            <span className="tracking-wide">Dr. Arthi's Dentophilic Centre</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-purple-700 font-medium hidden sm:inline">Grim to Grin • Hosur</span>
          </motion.div>
          <br className="hidden sm:inline" />

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-50/90 border border-purple-200 text-purple-900 text-xs sm:text-sm font-semibold mb-6 shadow-xs"
          >
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
              ))}
            </div>
            <span className="text-purple-300">|</span>
            <span className="text-purple-950 font-bold">4.9 Google Rating</span>
            <span className="hidden sm:inline text-purple-700 font-normal">(50+ Verified Reviews)</span>
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping ml-1" />
          </motion.div>

          {/* Main Headline with Shimmer Text Accent */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.12]"
          >
            Crafting Confident Smiles with{' '}
            <span className="relative inline-block shimmer-text font-serif">
              Gentle, Modern
              <span className="absolute -bottom-1 left-0 right-0 h-2 bg-purple-200/60 -z-10 rounded-full" />
            </span>{' '}
            Dentistry
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Experience compassionate, zero-fear dental care at Hosur's premier clinic. Led by{' '}
            <strong className="text-purple-950 font-semibold">Dr. Arthi Mukeshkannan, B.D.S</strong>, we combine
            gentle hands with advanced rotary technology for truly painless treatments.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0"
          >
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 hover:from-purple-800 hover:to-indigo-950 text-white font-semibold text-base shadow-xl shadow-purple-950/25 hover:shadow-2xl hover:shadow-purple-950/35 hover:-translate-y-0.5 active:translate-y-0 transition-all group animate-pulse-glow cursor-pointer"
            >
              <Calendar className="w-5 h-5 mr-2.5 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Book Appointment</span>
              <ArrowUpRight className="w-4 h-4 ml-2 text-purple-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <a
              href={`tel:${siteData.clinic.phoneRaw}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white hover:bg-purple-50/60 text-slate-800 hover:text-purple-900 font-semibold text-base border border-purple-200/80 hover:border-purple-400 shadow-sm transition-all"
            >
              <Phone className="w-5 h-5 mr-2.5 text-purple-700" />
              <span>Call: {siteData.clinic.phoneDisplay}</span>
            </a>
          </motion.div>

          {/* Micro assurances */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500"
          >
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 text-purple-700 mr-1.5" /> No Long Waiting Times
            </span>
            <span className="flex items-center">
              <Heart className="w-4 h-4 text-rose-500 mr-1.5" /> Gentle Anesthesia Technique
            </span>
            <span className="flex items-center">
              <Award className="w-4 h-4 text-amber-500 mr-1.5" /> TNDC Registered Dental Surgeon
            </span>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {siteData.stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 backdrop-blur-md border border-purple-100/80 shadow-xl shadow-purple-950/[0.03] hover:shadow-2xl hover:shadow-purple-950/[0.08] hover:border-purple-300 transition-all text-center group"
            >
              <div className="mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals || 0} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">{stat.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{stat.sublabel}</p>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
