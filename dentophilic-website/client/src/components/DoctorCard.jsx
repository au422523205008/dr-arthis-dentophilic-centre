import { motion } from 'framer-motion';
import { Award, CheckCircle2, Calendar, MessageSquare, Sparkles, GraduationCap, Heart } from 'lucide-react';
import { siteData } from '../config/siteData';

export default function DoctorCard({ onOpenBooking }) {
  const { doctor } = siteData;

  const handleWhatsAppChat = () => {
    const encoded = encodeURIComponent(
      `Hello Dr. Arthi Mukeshkannan, I would like to schedule a dental consultation at Dentophilic Centre, Hosur.`
    );
    window.open(`https://wa.me/91${siteData.clinic.phoneRaw}?text=${encoded}`, '_blank');
  };

  return (
    <section id="about" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Meet Our Chief Dentist
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Compassionate Care Guided by Over a Decade of Clinical Excellence
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Personalized treatment plans tailored to your smile, comfort, and long-term oral health.
          </p>
        </div>

        {/* Doctor Showcase Card */}
        <div className="relative max-w-5xl mx-auto bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 rounded-3xl p-6 sm:p-10 lg:p-14 border border-purple-100/90 shadow-2xl shadow-purple-950/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left: Doctor Photo with Purple Ring & Dark Inner Border */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer animate-float-slow">
                {/* Outer Purple/Lavender Glowing Ring */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2.5 bg-gradient-to-tr from-purple-400 via-indigo-300 to-purple-200 shadow-2xl shadow-purple-950/20 animate-pulse-glow">
                  {/* Dark Inner Border Frame */}
                  <div className="w-full h-full rounded-full p-1.5 bg-slate-950 overflow-hidden shadow-inner relative">
                    <img
                      src={doctor.photo}
                      alt={doctor.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Badge Overlay */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-4 py-1.5 rounded-full shadow-lg border border-purple-400/40 flex items-center space-x-1.5 whitespace-nowrap">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-purple-200">
                    {doctor.badge}
                  </span>
                </div>
              </div>

              {/* TNDC Registration Pill */}
              <div className="mt-8 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-purple-100/80 text-purple-950 border border-purple-200 text-xs font-semibold">
                <GraduationCap className="w-4 h-4 text-purple-700" />
                <span>TNDC Regd. No: {doctor.tndcRegNo}</span>
              </div>

              <div className="mt-2 text-xs text-slate-500 font-medium">
                Tamil Nadu Dental Council Registered
              </div>

              {/* Official Clinic Logo Seal Badge */}
              <div className="mt-5 p-3 rounded-2xl bg-white/95 border border-purple-200/90 shadow-md flex items-center space-x-3 max-w-[270px] text-left group hover:border-purple-300 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-purple-200 shadow-xs shrink-0 flex items-center justify-center">
                  <img
                    src="/clinic-logo.jpg"
                    alt="Dr. Arthi's Dentophilic Centre Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-900 block truncate leading-tight">
                    Dr. Arthi's Dentophilic Centre
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider block">
                    Grim to Grin • Hosur
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Credentials, Bio, Checklist & Action */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div>
                <span className="text-xs font-bold tracking-wider text-purple-800 uppercase bg-purple-100/80 px-3 py-1 rounded-md border border-purple-200/80 inline-block mb-3">
                  Lead Dental Surgeon
                </span>

                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                  {doctor.name}
                </h3>

                <p className="mt-1 text-purple-900 font-semibold text-base sm:text-lg flex items-center">
                  <span>{doctor.qualification}</span>
                  <span className="mx-2 text-purple-300">•</span>
                  <span>{doctor.title}</span>
                </p>

                <p className="mt-5 text-slate-600 text-base leading-relaxed">
                  {doctor.bio}
                </p>
              </div>

              {/* Clinical Competencies Checklist */}
              <div className="mt-6 pt-6 border-t border-purple-100">
                <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase mb-4">
                  Clinical Expertise & Standards
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctor.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 pt-6 border-t border-purple-100 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={onOpenBooking}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-sm shadow-lg shadow-purple-950/15 hover:shadow-purple-950/25 active:scale-95 transition-all group cursor-pointer"
                >
                  <Calendar className="w-4 h-4 mr-2 text-purple-200 group-hover:scale-110 transition-transform" />
                  <span>Book Consultation With Dr. Arthi</span>
                </button>

                <button
                  onClick={handleWhatsAppChat}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-semibold text-sm border border-purple-200 hover:border-purple-300 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Heartwarming Patient Connection Story Block */}
        <div className="mt-12 max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-purple-100/60 via-white to-pink-50/60 p-6 sm:p-8 lg:p-10 border border-purple-200/90 shadow-xl shadow-purple-950/5 flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          <div className="w-full sm:w-64 md:w-72 h-64 sm:h-80 rounded-2xl overflow-hidden shrink-0 shadow-xl border-4 border-white relative group">
            <img
              src="/cases/dr-arthi-pediatric-patient.png"
              alt="Dr. Arthi with young patient holding handmade card"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold text-center">
              Hosur Clinic • Real Patient Moment
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3 border border-rose-200">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" /> Pure Patient Trust
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
              "I ❤️ You Doctor" — Gentle Dental Care Children Love
            </h3>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Dental anxiety is never innate—it is learned through rough experiences. At Dr. Arthi's Dentophilic Centre, our warm, reassuring approach transforms dental visits into joyful milestones. When our little patients take the time to draw stars, teeth, and heartfelt thank-you notes, we know our patient-first promise has succeeded.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-purple-950">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Zero-trauma pediatric techniques
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Gentle local anesthesia & empathy
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Trusted by 5,000+ Hosur families
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
