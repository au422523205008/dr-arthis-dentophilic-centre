import { motion } from 'framer-motion';
import { Cpu, ShieldAlert, Feather, IndianRupee, UserCheck, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { siteData } from '../config/siteData';

const iconMap = {
  Cpu,
  ShieldAlert,
  Feather,
  IndianRupee,
  UserCheck,
  Clock
};

export default function WhyChooseUs({ onOpenBooking }) {
  return (
    <section id="why-us" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> The Dentophilic Difference
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Why Patients Across Hosur Trust Dr. Arthi's Care
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            We hold ourselves to uncompromising clinical standards, creating a calm, transparent environment where you
            always come first.
          </p>
        </div>

        {/* 6 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteData.whyUs.map((feature, idx) => {
            const Icon = iconMap[feature.icon] || Sparkles;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-purple-50/30 border border-purple-100 hover:border-purple-300 hover:bg-white shadow-sm hover:shadow-xl hover:shadow-purple-950/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100/70 group-hover:bg-purple-700 text-purple-800 group-hover:text-purple-100 flex items-center justify-center mb-6 transition-colors duration-300 shadow-xs">
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="font-serif text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-900 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Real Clinic Operatory Showcase */}
        <div className="mt-16 sm:mt-20 p-6 sm:p-10 lg:p-12 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-purple-100/40 border border-purple-200/90 shadow-xl shadow-purple-950/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Real Operatory Image with Feature Callouts */}
            <div className="lg:col-span-7 relative group">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-purple-950/15">
                <img
                  src="/clinic-interior.jpg"
                  alt="Dr. Arthi's Dentophilic Centre Operatory in Hosur"
                  className="w-full h-80 sm:h-96 md:h-[420px] object-cover group-hover:scale-102 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/25" />

                {/* Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 backdrop-blur-md text-purple-200 text-xs font-bold border border-purple-400/40 shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    Actual Clinic Operatory • Hosur
                  </span>
                </div>

                {/* Floating highlight badges on the image */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 font-semibold shadow-md border border-purple-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                    Ergonomic Purple Dental Chair
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 font-semibold shadow-md border border-purple-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    Rotary Endo Delivery Console
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 font-semibold shadow-md border border-purple-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Class-B Autoclave Sterilized
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Details */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200 self-start">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-700" /> Modern Facility
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Step Inside Our Modern Treatment Operatory
              </h3>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                We believe a calming clinical atmosphere transforms your dental experience. Our clinic at <strong>PK Complex, Hosur</strong> is designed specifically with gentle lavender and purple tones, whisper-quiet equipment, and hospital-grade sterilization.
              </p>

              <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Zero-Strain Ergonomic Comfort</strong>
                    Contoured cushioning and head support so you can rest comfortably throughout your treatment.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Rotary & Apex-Locator Precision</strong>
                    Enables painless single-sitting root canals and precision crown preparations with minimal chair time.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Rigorous 6-Step Sterilization</strong>
                    Every instrument is ultrasonic-cleaned, pouched, and autoclaved to international CDC guidelines.
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={onOpenBooking}
                  className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm shadow-md shadow-purple-950/20 active:scale-95 transition-all cursor-pointer"
                >
                  Schedule Your Visit
                </button>
                <a
                  href="#contact"
                  className="text-xs sm:text-sm font-semibold text-purple-800 hover:text-purple-950 hover:underline"
                >
                  View Location & Directions →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Commitment Banner in Royal Purple & Deep Indigo */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-purple-950/20 border border-purple-800/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_center,rgba(192,132,252,0.25)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/70 px-3 py-1 rounded-full border border-purple-700/50 inline-block mb-3">
                100% Patient Satisfaction Protocol
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                Experience Fear-Free Dentistry With Genuine Empathy
              </h3>
              <p className="mt-2 text-purple-100/80 text-sm sm:text-base leading-relaxed">
                Whether it's your first dental visit in years or an urgent toothache, Dr. Arthi and our caring team will
                guide you through every step with gentle care and clear pricing.
              </p>
            </div>

            <button
              onClick={onOpenBooking}
              className="shrink-0 px-8 py-4 rounded-2xl bg-purple-400 hover:bg-purple-300 text-purple-950 font-bold text-sm sm:text-base shadow-lg shadow-purple-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse-glow"
            >
              Book Your Consultation Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
