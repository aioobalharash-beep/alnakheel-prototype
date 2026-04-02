import React from 'react';
import { motion } from 'motion/react';
import { Search, MoreVertical, Calendar as CalendarIcon, MessageSquare, Phone, CheckCircle2, UserPlus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Guest } from '@/src/types';

export const Guests: React.FC = () => {
  const guests: Guest[] = [
    { id: '1', name: 'Ahmed Al-Bakri', phone: '+968 9123 4567', checkIn: 'Oct 14', checkOut: 'Oct 18', status: 'checked-in', avatar: 'https://i.pravatar.cc/150?u=ahmed' },
    { id: '2', name: 'Sarah Henderson', phone: '+968 9788 1234', checkIn: 'Oct 20', checkOut: 'Oct 22', status: 'upcoming', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: '3', name: 'Marcus Vane', phone: '+968 9345 6789', checkIn: 'Oct 14', checkOut: 'Oct 16', status: 'checking-out', avatar: 'https://i.pravatar.cc/150?u=marcus' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <section>
        <h2 className="font-headline text-2xl font-bold text-primary-navy mb-1">Guest Management</h2>
        <p className="text-primary-navy/50 text-sm font-medium">Curating hospitality for Al-Nakheel</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-primary-navy/5 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-primary-navy/50 font-bold mb-2">Checked-in Today</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-headline font-bold text-primary-navy">12</span>
            <span className="text-xs text-emerald-600 font-bold mb-1">+2</span>
          </div>
        </div>
        <div className="bg-primary-navy p-5 rounded-xl shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">Upcoming Arrivals</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-headline font-bold text-white">08</span>
            <span className="text-xs text-secondary-gold font-bold mb-1">New</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-navy/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            className="w-full bg-white border-none rounded-xl py-4 pl-12 pr-4 shadow-sm focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/30 text-sm transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All Guests', 'Checked-in', 'Upcoming', 'Completed'].map((filter, i) => (
            <button 
              key={filter}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95",
                i === 0 ? "bg-primary-navy text-white" : "bg-white text-primary-navy/60 hover:bg-primary-navy/5 shadow-sm"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {guests.map((guest, i) => (
          <motion.div 
            key={guest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-xl shadow-sm border border-primary-navy/5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-navy/5">
                  <img src={guest.avatar} alt={guest.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-primary-navy">{guest.name}</h3>
                  <p className="text-xs text-primary-navy/50 font-medium">{guest.phone}</p>
                </div>
              </div>
              <button className="p-1 text-primary-navy/40 hover:bg-primary-navy/5 rounded-lg transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-primary-navy">
                <CalendarIcon size={14} className="text-secondary-gold" />
                {guest.checkIn} - {guest.checkOut}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter",
                guest.status === 'checked-in' && "bg-emerald-50 text-emerald-700",
                guest.status === 'upcoming' && "bg-amber-50 text-amber-700",
                guest.status === 'checking-out' && "bg-blue-50 text-blue-700",
              )}>
                {guest.status.replace('-', ' ')}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-primary-navy/5">
              <button className={cn(
                "flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest active:scale-[0.98] transition-all",
                guest.status === 'checking-out' 
                  ? "border border-primary-navy text-primary-navy" 
                  : "bg-primary-navy text-white"
              )}>
                {guest.status === 'checked-in' && 'Service Request'}
                {guest.status === 'upcoming' && 'Prepare Room'}
                {guest.status === 'checking-out' && 'Final Bill'}
              </button>
              <button className="px-4 py-2.5 rounded-lg bg-primary-navy/5 text-primary-navy active:scale-[0.98] transition-all">
                {guest.status === 'checked-in' && <MessageSquare size={16} />}
                {guest.status === 'upcoming' && <Phone size={16} />}
                {guest.status === 'checking-out' && <CheckCircle2 size={16} />}
              </button>
            </div>
          </motion.div>
        ))}
      </section>

      {/* FAB */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-secondary-gold text-primary-navy rounded-full shadow-lg shadow-secondary-gold/20 flex items-center justify-center active:scale-95 transition-all z-40">
        <UserPlus size={24} />
      </button>
    </div>
  );
};
