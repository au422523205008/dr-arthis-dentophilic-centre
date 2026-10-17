import { Phone, Mail, MapPin, Clock, ExternalLink, MessageCircle, Sparkles } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { siteData } from '../config/siteData';

export default function ContactSection() {
  const { clinic } = siteData;

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(
      `Hello Dr. Arthi, I would like to get directions or enquire about treatments at Dentophilic Centre.`
    );
    window.open(`https://wa.me/91${clinic.phoneRaw}?text=${encoded}`, '_blank');
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-gradient-to-b from-purple-950 via-slate-950 to-indigo-950 text-white relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-aurora" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-900/80 text-purple-200 border border-purple-700/60 mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-300" /> Visit Our Hosur Clinic
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            We Look Forward to Welcoming You
          </h2>
          <p className="mt-4 text-purple-200/80 text-base sm:text-lg leading-relaxed">
            Conveniently situated in Muneeshwar Nagar along the ESI Ring Road with easy parking and elevator access.
          </p>
        </div>

        {/* Content Grid: Contact Details & Embedded Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Phone Card */}
            <a
              href={`tel:${clinic.phoneRaw}`}
              className="p-6 rounded-3xl bg-purple-900/40 border border-purple-800/60 hover:bg-purple-900/70 hover:border-purple-400 transition-all flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-800 group-hover:bg-purple-700 text-purple-200 flex items-center justify-center shrink-0 transition-colors shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Direct Reception Call
                </span>
                <span className="font-bold text-lg sm:text-xl text-white block group-hover:text-purple-200 transition-colors">
                  {clinic.phoneDisplay}
                </span>
                <span className="text-xs text-purple-300/70">Click to call immediately</span>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${clinic.email}`}
              className="p-6 rounded-3xl bg-purple-900/40 border border-purple-800/60 hover:bg-purple-900/70 hover:border-purple-400 transition-all flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-800 group-hover:bg-purple-700 text-purple-200 flex items-center justify-center shrink-0 transition-colors shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Email Inquiries
                </span>
                <span className="font-semibold text-base sm:text-lg text-white block group-hover:text-purple-200 transition-colors break-all">
                  {clinic.email}
                </span>
                <span className="text-xs text-purple-300/70">Click to compose email</span>
              </div>
            </a>

            {/* Address Card */}
            <div className="p-6 rounded-3xl bg-purple-900/40 border border-purple-800/60 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-800 text-purple-200 flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Clinic Location
                </span>
                <p className="font-medium text-sm sm:text-base text-white leading-relaxed">
                  {clinic.address.full}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={clinic.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-950 bg-purple-300 hover:bg-purple-200 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleWhatsApp}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-purple-800 hover:bg-purple-700 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border border-purple-600/50"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <a
                    href={clinic.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Working Hours Summary */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-900/80 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950 text-purple-300 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Consultation Timings
                </span>
                <div className="space-y-1.5 text-xs sm:text-sm text-purple-200/90">
                  <div className="flex justify-between border-b border-purple-950 pb-1">
                    <span className="text-slate-400">Monday – Saturday</span>
                    <span className="font-semibold text-right">10:00 AM – 1:30 PM &amp; 5:00 PM – 8:30 PM</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-400">Sunday</span>
                    <span className="font-semibold text-amber-300">By Prior Appointment Only</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Google Maps Embed with Overlay */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-purple-800/60 shadow-2xl relative min-h-[420px] bg-slate-900 flex flex-col">
            <iframe
              title="Dr. Arthi's Dentophilic Centre Location"
              src="https://maps.google.com/maps?q=Pk+Complex+Muneeshwar+Nagar+Esi+Ring+Road+Hosur+Tamil+Nadu+635109&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              className="w-full h-full min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Map Footer Bar */}
            <div className="bg-slate-950/95 backdrop-blur-md px-6 py-4 border-t border-purple-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-purple-200">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>1st Floor, Pk Complex, Muneeshwar Nagar, Hosur</span>
              </div>
              <a
                href={clinic.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-950 bg-purple-300 hover:bg-purple-200 px-4 py-2 rounded-xl transition-all shrink-0"
              >
                <span>Navigate via GPS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
