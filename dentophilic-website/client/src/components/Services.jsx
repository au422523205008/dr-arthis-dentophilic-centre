import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Sparkles,
  Smile,
  Activity,
  ShieldCheck,
  Layers,
  Palette,
  HeartHandshake,
  Cpu,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Calendar
} from 'lucide-react';
import { siteData } from '../config/siteData';

const iconMap = {
  Stethoscope,
  Sparkles,
  Smile,
  Activity,
  ShieldCheck,
  Layers,
  Palette,
  HeartHandshake,
  Cpu,
  Award
};

export default function Services({ onSelectService }) {
  const [activeModalService, setActiveModalService] = useState(null);

  const handleBookService = (serviceTitle) => {
    setActiveModalService(null);
    onSelectService(serviceTitle);
  };

  return (
    <section id="services" className="py-20 md:py-28 bg-gradient-to-b from-white via-purple-50/25 to-white relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Comprehensive Care
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Specialized Dental Treatments for Every Smile
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            From routine preventative exams to advanced full-mouth restorations, every treatment is delivered with
            gentle precision, digital imaging, and patient comfort.
          </p>
        </div>

        {/* 10 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {siteData.services.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Sparkles;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative bg-white rounded-3xl p-7 border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-950/10 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top accent highlight */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 group-hover:bg-purple-700 text-purple-700 group-hover:text-purple-100 flex items-center justify-center transition-all duration-300 shadow-xs">
                      <IconComponent className="w-7 h-7 transition-transform group-hover:scale-110" />
                    </div>

                    {/* Badge */}
                    <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 group-hover:bg-purple-50 group-hover:text-purple-800 transition-colors">
                      {service.badge}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-1">
                    {service.subtitle}
                  </span>

                  <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-purple-900 transition-colors mb-3 leading-snug">
                    {service.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed mb-5">
                    {service.shortDesc}
                  </p>

                  {/* Highlights pills */}
                  <div className="space-y-1.5 mb-6">
                    {service.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 mr-2 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-purple-50 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveModalService(service)}
                    className="text-xs font-semibold text-slate-700 hover:text-purple-800 flex items-center group/btn py-1 cursor-pointer"
                  >
                    <span>Procedure Details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-purple-400 group-hover/btn:translate-x-1 group-hover/btn:text-purple-700 transition-all" />
                  </button>

                  <button
                    onClick={() => handleBookService(service.title)}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-700 text-purple-800 hover:text-white transition-all active:scale-95 shadow-2xs cursor-pointer"
                  >
                    Book This
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Service Detailed Modal */}
      <AnimatePresence>
        {activeModalService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalService(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-200 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4 border-b border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-700 text-purple-100 flex items-center justify-center shadow-md">
                    {(() => {
                      const Icon = iconMap[activeModalService.icon] || Sparkles;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      {activeModalService.subtitle}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                      {activeModalService.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalService(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {activeModalService.image && (
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-purple-200">
                    <img
                      src={activeModalService.image}
                      alt={activeModalService.title}
                      className="w-full h-52 sm:h-64 object-cover object-top"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-3.5 text-white flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        Authentic Clinical Outcome • Dr. Arthi's Dentophilic Centre
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    About This Procedure
                  </h4>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                    {activeModalService.fullDesc}
                  </p>
                </div>

                <div className="bg-purple-50/80 rounded-2xl p-4 sm:p-5 border border-purple-100">
                  <div className="flex items-center space-x-2 text-purple-950 font-bold text-sm mb-3">
                    <Clock className="w-4 h-4 text-purple-700" />
                    <span>Estimated Duration: {activeModalService.duration}</span>
                  </div>

                  <h5 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Key Clinical Benefits:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeModalService.benefits.map((b, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  onClick={() => setActiveModalService(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleBookService(activeModalService.title)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-sm shadow-md shadow-purple-950/15 flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-purple-200" />
                  <span>Book Appointment for This Service</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
