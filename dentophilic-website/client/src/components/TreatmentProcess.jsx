import { motion } from 'framer-motion';
import { CalendarCheck, ScanFace, Sparkles, Smile, ArrowRight } from 'lucide-react';
import { siteData } from '../config/siteData';

const stepIcons = [CalendarCheck, ScanFace, Sparkles, Smile];

export default function TreatmentProcess({ onOpenBooking }) {
  return (
    <section id="process" className="py-20 md:py-28 bg-gradient-to-b from-white via-purple-50/20 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Seamless Patient Journey
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            How It Works: 4 Simple Steps to Your Healthiest Smile
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            From seamless scheduling to pain-free clinical care, we have engineered your visit to be effortless,
            transparent, and soothing.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="relative">
          {/* Desktop Connecting Purple Gradient Line */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-purple-300 via-purple-500 to-indigo-400 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {siteData.treatmentProcess.map((item, idx) => {
              const StepIcon = stepIcons[idx] || Sparkles;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  className="bg-white rounded-3xl p-7 border border-purple-100 shadow-md hover:shadow-xl hover:border-purple-300 transition-all flex flex-col items-center text-center group"
                >
                  {/* Step Number Badge & Icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-purple-50 group-hover:bg-purple-700 text-purple-700 group-hover:text-purple-100 flex items-center justify-center transition-all duration-300 shadow-xs">
                      <StepIcon className="w-9 h-9" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 group-hover:bg-purple-900 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-md">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-900 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA trigger */}
        <div className="mt-14 text-center">
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center space-x-2 text-sm font-bold text-purple-800 hover:text-purple-950 bg-purple-50 hover:bg-purple-100/90 px-6 py-3 rounded-full border border-purple-200 transition-colors cursor-pointer"
          >
            <span>Ready to start step 1? Select your slot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
