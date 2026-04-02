import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Banknote, User, ChevronRight as ChevronRightIcon, PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Calendar: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <section className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-navy p-5 rounded-xl flex flex-col justify-between shadow-lg text-white h-32"
        >
          <CalendarIcon className="text-secondary-gold" size={24} />
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Confirmed</p>
            <p className="font-headline text-2xl font-bold">24</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl flex flex-col justify-between shadow-sm border border-primary-navy/5 h-32"
        >
          <Banknote className="text-primary-navy" size={24} />
          <div>
            <p className="text-primary-navy/40 text-[10px] font-bold uppercase tracking-widest">Revenue</p>
            <p className="text-primary-navy font-headline text-2xl font-bold">4.2k <span className="text-xs">OMR</span></p>
          </div>
        </motion.div>
      </section>

      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-primary-navy/5"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-headline text-xl font-bold text-primary-navy">October 2024</h2>
            <p className="text-xs text-primary-navy/40 font-medium">12 Bookings this month</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-primary-navy/5 transition-colors"><ChevronLeft size={20} /></button>
            <button className="p-2 rounded-full hover:bg-primary-navy/5 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[10px] font-bold text-primary-navy/40 uppercase tracking-tighter">{d}</div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 1; // Simplified offset
            const isToday = day === 10;
            const hasEvent = day === 3 || day === 15;
            const isRange = day >= 8 && day <= 9;
            
            if (day < 1 || day > 31) return <div key={i} className="text-sm font-medium text-primary-navy/10 p-2">{day < 1 ? 30 + day : day - 31}</div>;
            
            return (
              <div 
                key={i} 
                className={cn(
                  "relative text-sm font-medium p-2 transition-all cursor-pointer",
                  isToday ? "text-white bg-primary-navy rounded-lg font-bold" : "text-primary-navy",
                  isRange && "bg-primary-navy/5 rounded-lg"
                )}
              >
                {day}
                {hasEvent && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary-gold rounded-full"></div>}
              </div>
            );
          })}
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-headline text-lg font-bold text-primary-navy">Next Arrivals</h3>
          <button className="text-[10px] font-bold text-secondary-gold tracking-widest uppercase hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Nasser Al-Harthy', detail: 'Chalet 4 • Oct 10 - Oct 12', time: '2PM', img: 'https://i.pravatar.cc/150?u=nasser' },
            { name: 'Sara Williams', detail: 'Luxury Suite • Oct 15 - Oct 20', time: '11AM', img: 'https://i.pravatar.cc/150?u=sara' },
          ].map((arrival, i) => (
            <motion.div 
              key={arrival.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-4 flex items-center justify-between group active:bg-primary-navy/5 transition-colors border border-primary-navy/5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-navy/5">
                  <img src={arrival.img} alt={arrival.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary-navy">{arrival.name}</p>
                  <p className="text-xs text-primary-navy/40 font-medium">{arrival.detail}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <p className="text-[10px] font-bold text-secondary-gold uppercase">{arrival.time}</p>
                <ChevronRightIcon size={16} className="text-primary-navy/20" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-primary-navy px-1">Recent Transactions</h3>
        <div className="bg-white rounded-xl overflow-hidden border border-primary-navy/5 shadow-sm">
          <div className="p-4 flex items-center justify-between border-b border-primary-navy/5">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg">
                <ArrowDownLeft className="text-red-500" size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Booking Refund</p>
                <p className="text-[10px] text-primary-navy/40 uppercase font-bold">Oct 08 • ID #9921</p>
              </div>
            </div>
            <p className="text-sm font-bold text-red-500">-45.00 OMR</p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <ArrowUpRight className="text-emerald-500" size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Stay Payment</p>
                <p className="text-[10px] text-primary-navy/40 uppercase font-bold">Oct 07 • ID #9918</p>
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-500">+320.00 OMR</p>
          </div>
        </div>
      </section>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary-navy text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40">
        <PlusCircle size={24} />
      </button>
    </div>
  );
};
