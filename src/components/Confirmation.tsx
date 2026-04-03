import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, ChevronRight, Instagram, MessageCircle } from 'lucide-react';

export const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { booking?: any; propertyName?: string } | null;

  const booking = state?.booking;
  const propertyName = state?.propertyName || 'Al-Nakheel Sanctuary';

  // If no booking state, redirect to home
  if (!booking) {
    return (
      <div className="p-6 space-y-8 max-w-lg mx-auto text-center pt-20">
        <h2 className="font-headline text-2xl font-bold text-primary-navy">No booking found</h2>
        <p className="text-primary-navy/60 text-sm">It looks like you navigated here directly.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-navy text-white px-8 py-3 rounded-xl font-bold text-sm"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-primary-navy/5 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-secondary-gold/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="text-secondary-gold" size={40} />
        </div>

        <div className="space-y-2">
          <h2 className="font-headline text-3xl font-bold text-primary-navy leading-tight">
            Booking Confirmed for {propertyName}
          </h2>
          <p className="text-primary-navy/60 text-sm leading-relaxed">
            Your serene desert escape is ready. We have sent a detailed confirmation to your WhatsApp with your reservation details.
          </p>
        </div>

        <div className="aspect-video rounded-[24px] overflow-hidden bg-primary-navy/5 shadow-inner">
          <img
            src="https://picsum.photos/seed/oman-kitchen-2/800/600"
            alt="Property"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-3">
          <button className="w-full bg-secondary-gold text-primary-navy py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-secondary-gold/20 active:scale-[0.98] transition-all">
            <MapPin size={20} />
            Get Location Pin via WhatsApp
          </button>
          <button className="w-full bg-white border border-primary-navy/10 text-primary-navy py-4 rounded-[20px] font-bold text-sm active:scale-[0.98] transition-all">
            View Reservation Details
          </button>
        </div>

        <div className="pt-6 border-t border-primary-navy/5 grid grid-cols-2 gap-8">
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40 mb-1">Check-in</p>
            <p className="font-bold text-primary-navy">
              {new Date(booking.check_in).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40 mb-1">Duration</p>
            <p className="font-bold text-primary-navy">{booking.nights} Night{booking.nights > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-primary-navy/5">
          <div className="flex justify-between text-sm">
            <span className="text-primary-navy/60">Total Paid</span>
            <span className="font-bold text-secondary-gold font-headline text-lg">{booking.total_amount} OMR</span>
          </div>
          <p className="text-[10px] text-primary-navy/40 mt-1">Booking Ref: {booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </motion.div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center justify-center gap-2 text-secondary-gold font-bold text-sm mx-auto hover:underline"
      >
        <ChevronRight size={16} className="rotate-180" />
        Back to Explore
      </button>

      {/* Footer Branding */}
      <footer className="pt-12 text-center space-y-6">
        <h3 className="text-secondary-gold font-bold font-headline text-2xl">Al-Nakheel</h3>
        <p className="text-xs text-primary-navy/60 leading-relaxed max-w-xs mx-auto">
          A sanctuary of refined luxury in the heart of the desert. Al-Nakheel offers an unparalleled Omani experience blending heritage with elegance.
        </p>
        <div className="flex gap-6 items-center justify-center">
          <button className="text-xs text-secondary-gold underline font-bold">Terms of Stay</button>
          <button className="text-xs text-primary-navy/60 underline font-bold">About Us</button>
        </div>
        <div className="flex gap-8 justify-center">
          <Instagram size={20} className="text-primary-navy/40" />
          <MessageCircle size={20} className="text-primary-navy/40" />
        </div>
        <div className="text-[10px] text-primary-navy/30 font-bold uppercase tracking-widest">
          &copy; Al-Nakheel Luxury Chalet. CR: 1234567 | Tourism License: TL-889
        </div>
      </footer>
    </div>
  );
};
