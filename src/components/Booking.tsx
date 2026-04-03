import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { BookingData } from '@/src/types';

const NIGHTLY_RATE = 120;
const SECURITY_DEPOSIT = 50;

interface BookingProps {
  onProceed: (data: BookingData) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Booking: React.FC<BookingProps> = ({ onProceed }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const stayTotal = nights * NIGHTLY_RATE;
  const grandTotal = stayTotal + (nights > 0 ? SECURITY_DEPOSIT : 0);

  const handleDayClick = (day: number) => {
    const clicked = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (clicked < todayStart) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(clicked);
      setCheckOut(null);
    } else {
      if (clicked <= checkIn) {
        setCheckIn(clicked);
        setCheckOut(null);
      } else {
        setCheckOut(clicked);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!checkIn || !checkOut) return false;
    const d = new Date(currentYear, currentMonth, day);
    return d > checkIn && d < checkOut;
  };

  const isCheckIn = (day: number) => {
    if (!checkIn) return false;
    const d = new Date(currentYear, currentMonth, day);
    return d.toDateString() === checkIn.toDateString();
  };

  const isCheckOut = (day: number) => {
    if (!checkOut) return false;
    const d = new Date(currentYear, currentMonth, day);
    return d.toDateString() === checkOut.toDateString();
  };

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayStart;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const canGoBack = currentYear > today.getFullYear() || currentMonth > today.getMonth();

  const canSubmit = checkIn && checkOut && nights > 0 && guestName.trim().length > 0 && phone.trim().length >= 4;

  const handleSubmit = () => {
    if (!canSubmit || !checkIn || !checkOut) return;
    setIsLoading(true);
    setTimeout(() => {
      onProceed({
        guestName: guestName.trim(),
        phone: phone.trim(),
        checkIn,
        checkOut,
        nights,
        nightlyRate: NIGHTLY_RATE,
        deposit: SECURITY_DEPOSIT,
        total: grandTotal,
      });
    }, 2200);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="p-6 space-y-10 max-w-lg mx-auto">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-pearl-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Loader2 size={48} className="text-secondary-gold" />
            </motion.div>
            <div className="text-center space-y-2">
              <p className="font-headline text-xl font-bold text-primary-navy">Processing Payment</p>
              <p className="text-primary-navy/50 text-sm">Securing your reservation via Thawani...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <h3 className="font-headline text-lg font-bold">{MONTH_NAMES[currentMonth]} {currentYear}</h3>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              disabled={!canGoBack}
              className={cn("p-1 rounded-full transition-colors", canGoBack ? "hover:bg-primary-navy/5" : "opacity-20 cursor-not-allowed")}
            >
              <ChevronLeft size={20} className="text-primary-navy" />
            </button>
            <button onClick={nextMonth} className="p-1 rounded-full hover:bg-primary-navy/5 transition-colors">
              <ChevronRight size={20} className="text-primary-navy" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-primary-navy/30 uppercase tracking-tighter mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center text-sm font-medium">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="py-2" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const past = isPast(day);
            const selected = isCheckIn(day) || isCheckOut(day);
            const range = isInRange(day);

            return (
              <div
                key={day}
                onClick={() => !past && handleDayClick(day)}
                className={cn(
                  "py-2 rounded-lg transition-all",
                  past && "text-primary-navy/15 cursor-not-allowed",
                  !past && !selected && !range && "cursor-pointer hover:bg-primary-navy/5",
                  selected && "bg-primary-navy text-white font-bold cursor-pointer",
                  range && "bg-primary-navy/10 text-primary-navy cursor-pointer"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Selection hint */}
        <div className="mt-6 text-center">
          {!checkIn && (
            <p className="text-xs text-primary-navy/40">Tap a date to select check-in</p>
          )}
          {checkIn && !checkOut && (
            <p className="text-xs text-primary-navy/40">
              Check-in: <span className="font-bold text-primary-navy">{formatDate(checkIn)}</span> — now tap your check-out date
            </p>
          )}
          {checkIn && checkOut && (
            <p className="text-xs text-primary-navy/40">
              <span className="font-bold text-primary-navy">{formatDate(checkIn)}</span> → <span className="font-bold text-primary-navy">{formatDate(checkOut)}</span> · {nights} night{nights !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </motion.div>

      {/* Pricing Summary */}
      <AnimatePresence>
        {nights > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#f4f4f0] p-6 rounded-[24px] space-y-4 overflow-hidden"
          >
            <div className="flex justify-between text-sm">
              <span className="text-primary-navy/60 font-medium">Nightly Rate</span>
              <span className="font-bold text-primary-navy">{NIGHTLY_RATE} OMR × {nights} night{nights !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-navy/60 font-medium">Security Deposit (OMR)</span>
              <span className="font-bold text-primary-navy">{SECURITY_DEPOSIT} OMR</span>
            </div>
            <div className="pt-4 border-t border-primary-navy/5 flex justify-between items-end">
              <div>
                <p className="text-xl font-bold font-headline">Total</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-secondary-gold font-headline">{grandTotal} OMR</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-primary-navy/40">Inclusive of all taxes</p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Form */}
      <section className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Full Name</label>
          <input
            type="text"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="e.g. Ahmed Al-Said"
            className="w-full bg-[#f4f4f0] border-none rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">WhatsApp Phone Number</label>
          <div className="flex gap-3">
            <div className="bg-[#f4f4f0] rounded-xl py-4 px-4 text-sm font-bold text-primary-navy/60">+968</div>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9 ]/g, ''))}
              placeholder="9000 0000"
              className="flex-1 bg-[#f4f4f0] border-none rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="space-y-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className={cn(
            "w-full py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary-navy/20 transition-all flex items-center justify-center gap-2",
            canSubmit
              ? "bg-primary-navy text-white active:scale-[0.98]"
              : "bg-primary-navy/20 text-primary-navy/40 cursor-not-allowed shadow-none"
          )}
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
