import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, MoreVertical, Calendar as CalendarIcon, MessageSquare, Phone, CheckCircle2, UserPlus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { guestsApi } from '../services/api';
import type { Guest } from '../types';

export const Guests: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState({ checkedIn: 0, upcoming: 0, checkingOut: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const loadData = () => {
    const params: { status?: string; search?: string } = {};
    if (activeFilter !== 'all') params.status = activeFilter;
    if (searchQuery) params.search = searchQuery;

    Promise.all([
      guestsApi.list(params),
      guestsApi.stats(),
    ]).then(([guestData, statsData]) => {
      setGuests(guestData);
      setStats(statsData);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [activeFilter, searchQuery]);

  const handleStatusChange = async (guestId: string, newStatus: string) => {
    try {
      await guestsApi.update(guestId, { status: newStatus });
      loadData();
    } catch (err) {
      console.error('Failed to update guest:', err);
    }
  };

  const filters = [
    { id: 'all', label: 'All Guests' },
    { id: 'checked-in', label: 'Checked-in' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
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
            <span className="text-3xl font-headline font-bold text-primary-navy">{stats.checkedIn}</span>
            {stats.checkingOut > 0 && <span className="text-xs text-amber-600 font-bold mb-1">{stats.checkingOut} leaving</span>}
          </div>
        </div>
        <div className="bg-primary-navy p-5 rounded-xl shadow-lg">
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">Upcoming Arrivals</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-headline font-bold text-white">{String(stats.upcoming).padStart(2, '0')}</span>
            <span className="text-xs text-secondary-gold font-bold mb-1">New</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-navy/40" size={18} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-xl py-4 pl-12 pr-4 shadow-sm focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/30 text-sm transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95",
                activeFilter === filter.id ? "bg-primary-navy text-white" : "bg-white text-primary-navy/60 hover:bg-primary-navy/5 shadow-sm"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-primary-navy/5 rounded-xl" />)}
          </div>
        ) : guests.length === 0 ? (
          <p className="text-center text-sm text-primary-navy/40 py-12">No guests found</p>
        ) : (
          guests.map((guest, i) => (
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
                    <img src={guest.avatar || `https://i.pravatar.cc/150?u=${guest.id}`} alt={guest.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                  {new Date(guest.check_in).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - {new Date(guest.check_out).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter",
                  guest.status === 'checked-in' && "bg-emerald-50 text-emerald-700",
                  guest.status === 'upcoming' && "bg-amber-50 text-amber-700",
                  guest.status === 'checking-out' && "bg-blue-50 text-blue-700",
                  guest.status === 'completed' && "bg-gray-50 text-gray-600",
                )}>
                  {guest.status.replace('-', ' ')}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-primary-navy/5">
                {guest.status === 'checked-in' && (
                  <>
                    <button className="flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest active:scale-[0.98] transition-all bg-primary-navy text-white">
                      Service Request
                    </button>
                    <button
                      onClick={() => handleStatusChange(guest.id, 'checking-out')}
                      className="px-4 py-2.5 rounded-lg bg-primary-navy/5 text-primary-navy active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </>
                )}
                {guest.status === 'upcoming' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(guest.id, 'checked-in')}
                      className="flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest active:scale-[0.98] transition-all bg-primary-navy text-white"
                    >
                      Check In
                    </button>
                    <button className="px-4 py-2.5 rounded-lg bg-primary-navy/5 text-primary-navy active:scale-[0.98] transition-all">
                      <Phone size={16} />
                    </button>
                  </>
                )}
                {guest.status === 'checking-out' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(guest.id, 'completed')}
                      className="flex-1 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-widest active:scale-[0.98] transition-all border border-primary-navy text-primary-navy"
                    >
                      Complete Checkout
                    </button>
                    <button className="px-4 py-2.5 rounded-lg bg-primary-navy/5 text-primary-navy active:scale-[0.98] transition-all">
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}
                {guest.status === 'completed' && (
                  <div className="flex-1 py-2.5 text-center text-[10px] uppercase font-bold tracking-widest text-primary-navy/40">
                    Stay Completed
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </section>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-secondary-gold text-primary-navy rounded-full shadow-lg shadow-secondary-gold/20 flex items-center justify-center active:scale-95 transition-all z-40">
        <UserPlus size={24} />
      </button>
    </div>
  );
};
