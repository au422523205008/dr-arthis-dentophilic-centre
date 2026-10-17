import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, CheckCircle2 } from 'lucide-react';
import { siteData } from '../config/siteData';

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { testimonials, clinic } = siteData;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-b from-white via-purple-50/20 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Google Rating Badge */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white shadow-xs border border-purple-200 text-xs font-semibold text-slate-800 mb-4">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-bold text-slate-900">{clinic.rating.score} Stars</span>
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="text-purple-700 font-medium">({clinic.rating.reviewsCount}+ Google Reviews)</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Loved by Patients, Trusted by Families
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Read what real patients from Hosur say about their gentle, anxiety-free experiences with Dr. Arthi.
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="min-h-[290px] sm:min-h-[260px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.4 }}
                className="w-full bg-white rounded-3xl p-7 sm:p-10 border border-purple-100 shadow-xl shadow-purple-950/5 relative"
              >
                {/* Large Background Quote */}
                <Quote className="absolute top-6 right-8 w-16 h-16 text-purple-200/40 pointer-events-none -z-0" />

                <div className="relative z-10">
                  {/* Rating Stars & Treatment Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                      Treatment: {testimonials[currentIndex].treatment}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-slate-700 text-base sm:text-lg leading-relaxed italic mb-6">
                    "{testimonials[currentIndex].comment}"
                  </p>

                  {/* Reviewer Details */}
                  <div className="flex items-center justify-between pt-4 border-t border-purple-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-900 text-white font-bold text-base flex items-center justify-center shadow-sm">
                        {testimonials[currentIndex].name[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {testimonials[currentIndex].name}
                          </h4>
                          <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Verified Patient
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {testimonials[currentIndex].role} • {testimonials[currentIndex].date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center space-x-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx ? 'w-8 bg-purple-700' : 'w-2.5 bg-purple-200 hover:bg-purple-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-purple-200 transition-colors shadow-xs active:scale-95 cursor-pointer"
                aria-label="Previous Testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-purple-200 transition-colors shadow-xs active:scale-95 cursor-pointer"
                aria-label="Next Testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
