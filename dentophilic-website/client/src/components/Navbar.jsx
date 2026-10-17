import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Clock, MapPin, Calendar, Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { siteData } from '../config/siteData';

export default function Navbar({ onOpenBooking }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'Treatment', href: '#process' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Reviews', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' }
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar (Purple Gradient) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-purple-700 via-purple-400 to-indigo-400 transition-all duration-150 ease-out shadow-xs"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300">
        {/* Top Info Bar (Desktop) */}
        <div
          className={`bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-purple-950/80 transition-all duration-300 ${
            isScrolled ? 'hidden' : 'hidden md:block'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1.5 text-purple-300">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>1st Floor, Pk Complex, ESI Ring Road, Hosur</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Mon-Sat: 10:00 AM - 1:30 PM & 5:00 PM - 8:30 PM</span>
              </span>
            </div>
            <div className="flex items-center space-x-5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800/50">
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> 4.9★ Google Rated Clinic
              </span>
              <a
                href={`tel:${siteData.clinic.phoneRaw}`}
                className="flex items-center space-x-1.5 text-white hover:text-purple-300 font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                <span>Call: {siteData.clinic.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Sticky Navbar */}
        <nav
          className={`transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-purple-950/5 border-b border-purple-100 py-3'
              : 'bg-white/75 backdrop-blur-sm py-4 border-b border-purple-100/40'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="flex items-center space-x-3 group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1 border border-purple-200/80 shadow-md shadow-purple-950/5 group-hover:scale-105 group-hover:border-purple-400 transition-all flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/clinic-logo.jpg"
                  alt="Dr. Arthi's Dentophilic Centre Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight group-hover:text-purple-800 transition-colors">
                    Dr. Arthi's
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/60 font-sans tracking-normal">
                    Grim to Grin
                  </span>
                </div>
                <span className="block text-[11px] sm:text-xs font-semibold tracking-wider text-purple-700 uppercase -mt-0.5">
                  Dentophilic Centre
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                </a>
              ))}
            </div>

            {/* CTA & Mobile Hamburger */}
            <div className="flex items-center space-x-3">
              <a
                href={`tel:${siteData.clinic.phoneRaw}`}
                className="hidden sm:inline-flex lg:hidden items-center justify-center p-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                aria-label="Call clinic"
              >
                <Phone className="w-5 h-5" />
              </a>

              <button
                onClick={onOpenBooking}
                className="relative inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 rounded-xl shadow-md shadow-purple-950/15 hover:shadow-lg hover:shadow-purple-950/25 active:scale-95 transition-all group overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-200" />
                  <span>Book Appointment</span>
                </span>
              </button>

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Animated Slide-in Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between p-6 overflow-y-auto lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white p-1 border border-purple-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      <img src="/clinic-logo.jpg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-slate-900 text-base">Dr. Arthi's</span>
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Grim to Grin</span>
                      </div>
                      <span className="block text-[10px] font-semibold text-purple-700 uppercase">Dentophilic Centre</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-6 flex flex-col space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl text-base font-medium text-slate-800 hover:text-purple-700 hover:bg-purple-50 transition-all"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-purple-300" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-purple-100 space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md shadow-purple-950/20 active:scale-95 transition-all"
                >
                  <Calendar className="w-4 h-4 text-purple-200" />
                  <span>Book Appointment Now</span>
                </button>

                <a
                  href={`tel:${siteData.clinic.phoneRaw}`}
                  className="w-full py-3 px-4 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 font-semibold text-sm flex items-center justify-center space-x-2 transition-all border border-purple-200"
                >
                  <Phone className="w-4 h-4 text-purple-700" />
                  <span>Call {siteData.clinic.phoneDisplay}</span>
                </a>

                <div className="text-center pt-2 text-xs text-slate-500">
                  <p>Pk Complex, ESI Ring Road, Hosur</p>
                  <p className="text-purple-700 font-medium mt-0.5">Google Rating 4.9 ★ (50+ Reviews)</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
