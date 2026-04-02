import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BookingProps {
  onProceed: () => void;
}

export const Booking: React.FC<BookingProps> = ({ onProceed }) => {
  return (
    <div className="p-6 space-y-10 max-w-lg mx-auto">
      <section className="text-center space-y-2">
        <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase">Reservation</span>
        <h2 className="font-headline text-4xl font-bold text-primary-navy">Secure your retreat</h2>
        <p className="text-primary-navy/60 text-sm max-w-xs mx-auto">
          Select your preferred dates and provide your details to finalize your experience at Al-Nakheel.
        </p>
      </section>

      {/* Calendar Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-6 shadow-sm border border-primary-navy/5"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline text-lg font-bold">October 2024</h3>
          <div className="flex gap-4">
            <ChevronLeft size={20} className="text-primary-navy/40" />
            <ChevronRight size={20} className="text-primary-navy" />
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-primary-navy/30 uppercase tracking-tighter mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-medium">
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const isSelected = day === 13 || day === 14;
            const isRange = day === 11 || day === 12;
            
            return (
              <div 
                key={i} 
                className={cn(
                  "py-2 rounded-lg transition-all cursor-pointer",
                  isSelected && "bg-primary-navy text-white font-bold",
                  isRange && "bg-primary-navy/5 text-primary-navy"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Pricing Summary */}
      <section className="bg-surface-container-low p-6 rounded-[24px] space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-primary-navy/60 font-medium">Nightly Rate</span>
          <span className="font-bold text-primary-navy">120 OMR × 3 nights</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-primary-navy/60 font-medium">Security Deposit (OMR)</span>
          <span className="font-bold text-primary-navy">50 OMR</span>
        </div>
        <div className="pt-4 border-t border-primary-navy/5 flex justify-between items-end">
          <div>
            <p className="text-xl font-bold font-headline">Total</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-secondary-gold font-headline">410 OMR</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-primary-navy/40">Inclusive of all taxes</p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Full Name</label>
          <input 
            type="text" 
            placeholder="e.g. Ahmed Al-Said"
            className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">WhatsApp Phone Number</label>
          <div className="flex gap-3">
            <div className="bg-surface-container-low rounded-xl py-4 px-4 text-sm font-bold text-primary-navy/60">+968</div>
            <input 
              type="text" 
              placeholder="9000 0000"
              className="flex-1 bg-surface-container-low border-none rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="space-y-4 pt-4">
        <button 
          onClick={onProceed}
          className="w-full bg-primary-navy text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Proceed to Secure Payment
          <span className="text-[10px] opacity-40 lowercase font-normal">(via Thawani)</span>
        </button>
        <div className="flex items-center justify-center gap-2 text-primary-navy/30">
          <ShieldCheck size={14} />
          <p className="text-[9px] font-bold text-center uppercase tracking-wider max-w-[200px]">
            Your transaction is encrypted and secured by Thawani Gateway
          </p>
        </div>
      </div>
    </div>
  );
};
