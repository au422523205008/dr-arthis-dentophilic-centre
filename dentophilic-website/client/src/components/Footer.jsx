import { ShieldCheck, Heart, ArrowUp } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { siteData } from '../config/siteData';

export default function Footer({ onOpenBooking }) {
  const { clinic, doctor } = siteData;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-purple-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-purple-950/60">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-purple-800/80 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/clinic-logo.jpg"
                  alt="Dr. Arthi's Dentophilic Centre Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-lg font-bold text-white block">Dr. Arthi's</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 px-1.5 py-0.5 rounded-full border border-amber-600/50">Grim to Grin</span>
                </div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  Dentophilic Centre
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              Modern dental care in Hosur led by {doctor.name}, {doctor.qualification}. Dedicated to painless treatments,
              gentle dentistry, and lifelong oral wellness.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>TNDC Regd. No: {doctor.tndcRegNo}</span>
              </div>

              <a
                href={clinic.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-purple-900/80 hover:from-purple-800 hover:to-pink-700 border border-pink-500/40 text-pink-200 hover:text-white text-xs font-semibold transition-all group shadow-sm"
              >
                <InstagramIcon className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-serif text-base font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {['Home', 'About Doctor', 'Services', 'Why Us', 'Treatment Process', 'Case Gallery', 'Testimonials', 'FAQ'].map((link) => {
                const slug = link.toLowerCase().replace(/\s+/g, '-');
                return (
                  <li key={link}>
                    <a
                      href={`#${slug === 'about-doctor' ? 'about' : slug === 'case-gallery' ? 'gallery' : slug}`}
                      className="text-slate-400 hover:text-purple-300 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Col 3: Treatments */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-serif text-base font-bold mb-4">Popular Treatments</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>Painless Single-Sitting Root Canal</li>
              <li>Dental Implants &amp; Zirconia Crowns</li>
              <li>Teeth Whitening &amp; Laser Polishing</li>
              <li>Clear Aligners &amp; Invisible Braces</li>
              <li>Pediatric Dental Care for Kids</li>
              <li>Ultrasonic Scaling &amp; Gum Therapy</li>
            </ul>
          </div>

          {/* Col 4: Working Hours & Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-serif text-base font-bold mb-4">Clinic Hours</h4>
            <div className="space-y-3 text-xs sm:text-sm">
              {clinic.hours.map((h, i) => (
                <div key={i} className="pb-2 border-b border-purple-950">
                  <span className="font-semibold text-purple-300 block mb-0.5">{h.days}</span>
                  <div className="text-slate-400">
                    <p>{h.morning}</p>
                    <p>{h.evening}</p>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  onClick={onOpenBooking}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-semibold text-xs text-center transition-colors shadow-sm cursor-pointer"
                >
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>

          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              Made with <Heart className="w-3.5 h-3.5 text-purple-400 mx-1 fill-purple-400" /> for Healthy Smiles in Hosur
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 hover:bg-purple-950 text-slate-400 hover:text-purple-200 transition-colors cursor-pointer"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
