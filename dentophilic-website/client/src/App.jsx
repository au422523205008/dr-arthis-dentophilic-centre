import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DoctorCard from './components/DoctorCard';
import Services from './components/Services';
import WhyChooseUs from './components/WhyChooseUs';
import TreatmentProcess from './components/TreatmentProcess';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import BookingSection from './components/BookingSection';
import BookingModal from './components/BookingModal';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [modalService, setModalService] = useState('');

  // Initialize Lenis smooth scroll
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsLoading(false);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // Fade out preloader
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const handleOpenBookingModal = (service = '') => {
    setModalService(service);
    setBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setBookingModalOpen(false);
    setModalService('');
  };

  return (
    <div className="min-h-screen bg-[#FAF5FF] text-slate-800 flex flex-col font-sans selection:bg-purple-700 selection:text-white">
      {/* Intro Preloader */}
      <Preloader isLoading={isLoading} />

      {/* Main Navigation with Sticky Glassmorphism */}
      <Navbar onOpenBooking={() => handleOpenBookingModal()} />

      <main className="flex-grow">
        {/* 1. Hero Section with Counters & Floatings */}
        <Hero onOpenBooking={() => handleOpenBookingModal()} />

        {/* 2. About Doctor Card with Circular Frame */}
        <DoctorCard onOpenBooking={() => handleOpenBookingModal()} />

        {/* 3. Services Grid (10 Treatments with Modals) */}
        <Services onSelectService={(svc) => handleOpenBookingModal(svc)} />

        {/* 4. Why Choose Us */}
        <WhyChooseUs onOpenBooking={() => handleOpenBookingModal()} />

        {/* 5. Treatment Process Timeline (Book -> Consult -> Treat -> Smile) */}
        <TreatmentProcess onOpenBooking={() => handleOpenBookingModal()} />

        {/* 6. Case Gallery / Transformations */}
        <Gallery />

        {/* 7. Testimonials Carousel with 4.9 Google Badge */}
        <Testimonials />

        {/* 8. Frequently Asked Questions */}
        <FAQ />

        {/* 9. Dedicated Appointment Booking Section */}
        <BookingSection initialService={modalService} />

        {/* 10. Contact Us & Embedded Google Map */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer onOpenBooking={() => handleOpenBookingModal()} />

      {/* Floating Actions (WhatsApp + Scroll To Top) */}
      <FloatingActions />

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={handleCloseBookingModal}
        initialService={modalService}
      />
    </div>
  );
}
