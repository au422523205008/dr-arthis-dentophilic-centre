import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageCircle, Sparkles } from 'lucide-react';
import { siteData } from '../config/siteData';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleWhatsAppHelp = () => {
    const encoded = encodeURIComponent('Hello Dr. Arthi, I have a question regarding dental treatment at Dentophilic Centre.');
    window.open(`https://wa.me/91${siteData.clinic.phoneRaw}?text=${encoded}`, '_blank');
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Got Questions?
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Clear, honest answers about your treatment options, appointment procedures, and pain management.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {siteData.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-purple-300 bg-purple-50/30 shadow-md shadow-purple-950/5'
                    : 'border-slate-200 bg-white hover:border-purple-200'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-slate-900 flex items-center">
                    <span className="text-purple-700 font-sans text-sm mr-3 font-semibold">Q{idx + 1}.</span>
                    {faq.q}
                  </span>
                  <div
                    className={`p-1.5 rounded-full transition-transform duration-300 shrink-0 ${
                      isOpen ? 'bg-purple-700 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-purple-100/60 mt-1">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Help Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">Have a question not listed here?</h4>
              <p className="text-xs sm:text-sm text-slate-500">Dr. Arthi and our care team are happy to assist.</p>
            </div>
          </div>

          <button
            onClick={handleWhatsAppHelp}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-xs sm:text-sm transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Ask Us Directly</span>
          </button>
        </div>
      </div>
    </section>
  );
}
