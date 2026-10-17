import { Sparkles, Phone, ShieldCheck, Clock, MapPin } from 'lucide-react';
import BookingForm from './BookingForm';
import { siteData } from '../config/siteData';

export default function BookingSection({ initialService, onBookingSuccess }) {
  return (
    <section id="book-appointment" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-purple-100/40 to-transparent blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Clinic Value & Direct Assistance */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Instant Reservation
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Book Your Consultation with Dr. Arthi
            </h2>

            <p className="mt-4 text-slate-600 text-base leading-relaxed">
              Select your preferred treatment, date, and time slot. Our team will promptly review your request and confirm
              your visit with zero hassle.
            </p>

            {/* Quick Benefits */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-2xl bg-purple-50/30 border border-purple-100">
                <Clock className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Zero Wait Policy</h4>
                  <p className="text-xs text-slate-500">Scheduled appointments minimize clinic waiting room times.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-2xl bg-purple-50/30 border border-purple-100">
                <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hospital-Grade Sterilization</h4>
                  <p className="text-xs text-slate-500">Every instrument is sealed and autoclaved to Class-B standard.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-2xl bg-purple-50/30 border border-purple-100">
                <MapPin className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Convenient Hosur Location</h4>
                  <p className="text-xs text-slate-500">1st Floor, Pk Complex, ESI Ring Road, with easy parking.</p>
                </div>
              </div>
            </div>

            {/* Emergency Hotline Box in Royal Purple */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-purple-950 to-indigo-950 text-white shadow-xl shadow-purple-950/20 border border-purple-800/40">
              <span className="text-xs font-bold uppercase text-purple-300 block mb-1">
                Facing Severe Dental Pain?
              </span>
              <p className="text-xs text-purple-200/80 mb-3">
                Call our direct reception line for immediate assistance or same-day emergency slot allocation.
              </p>
              <a
                href={`tel:${siteData.clinic.phoneRaw}`}
                className="inline-flex items-center space-x-2 text-sm font-bold text-white bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-xl transition-colors border border-purple-600/50"
              >
                <Phone className="w-4 h-4 text-purple-300" />
                <span>Call {siteData.clinic.phoneDisplay}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-purple-200 shadow-2xl shadow-purple-950/5">
            <div className="mb-6 pb-4 border-b border-purple-100">
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Patient Appointment Form
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill in your details below to lock in your preferred appointment.
              </p>
            </div>

            <BookingForm initialService={initialService} onBookingSuccess={onBookingSuccess} />
          </div>

        </div>
      </div>
    </section>
  );
}
