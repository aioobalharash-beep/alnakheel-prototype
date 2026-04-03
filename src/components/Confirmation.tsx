import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, ChevronRight, Instagram, MessageCircle } from 'lucide-react';
import { BookingData } from '@/src/types';

interface ConfirmationProps {
  bookingData: BookingData | null;
  onBack: () => void;
}

const OWNER_PHONE = '96891234567';

export const Confirmation: React.FC<ConfirmationProps> = ({ bookingData, onBack }) => {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const checkInStr = bookingData ? formatDate(bookingData.checkIn) : 'N/A';
  const checkOutStr = bookingData ? formatDate(bookingData.checkOut) : 'N/A';
  const nights = bookingData?.nights ?? 0;
  const guestName = bookingData?.guestName ?? 'Guest';

  const whatsappMessage = encodeURIComponent(
    `New booking for ${guestName} on ${checkInStr} – ${checkOutStr} (${nights} night${nights !== 1 ? 's' : ''}). Please send the location pin!`
  );
  const whatsappUrl = `https://wa.me/${OWNER_PHONE}?text=${whatsappMessage}`;

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-primary-navy/5 text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 bg-secondary-gold/10 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="text-secondary-gold" size={40} />
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-headline text-3xl font-bold text-primary-navy leading-tight">
            Booking Confirmed for Al-Nakheel Chalet
          </h2>
          <p className="text-primary-navy/60 text-sm leading-relaxed">
            Your serene desert escape is ready. We have sent a detailed confirmation email with your reservation details.
          </p>
        </div>

        <div className="aspect-video rounded-[24px] overflow-hidden bg-primary-navy/5 shadow-inner">
          <img
            src="https://picsum.photos/seed/oman-kitchen-2/800/600"
            alt="Kitchen"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-secondary-gold text-primary-navy py-4 rounded-[20px] font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-secondary-gold/20 active:scale-[0.98] transition-all"
          >
            <MapPin size={20} />
            Get Location Pin via WhatsApp
          </a>
          <button className="w-full bg-white border border-primary-navy/10 text-primary-navy py-4 rounded-[20px] font-bold text-sm active:scale-[0.98] transition-all">
            View Reservation Details
          </button>
        </div>

        <div className="pt-6 border-t border-primary-navy/5 grid grid-cols-2 gap-8">
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40 mb-1">Check-in</p>
            <p className="font-bold text-primary-navy">{checkInStr}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40 mb-1">Duration</p>
            <p className="font-bold text-primary-navy">{nights} Night{nights !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {bookingData && (
          <div className="pt-4 border-t border-primary-navy/5">
            <div className="flex justify-between text-sm">
              <span className="text-primary-navy/50">Guest</span>
              <span className="font-bold text-primary-navy">{guestName}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-primary-navy/50">Total Paid</span>
              <span className="font-bold text-secondary-gold">{bookingData.total} OMR</span>
            </div>
          </div>
        )}
      </motion.div>

      <button
        onClick={onBack}
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
          © Al-Nakheel Luxury Chalet. CR: 1234567 | Tourism License: TL-889
        </div>
      </footer>
    </div>
  );
};
