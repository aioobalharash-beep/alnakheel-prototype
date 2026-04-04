import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, MoreVertical, Calendar as CalendarIcon, MessageSquare, Phone, CheckCircle2, UserPlus, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { guestsApi, propertiesApi } from '../services/api';
import type { Guest, Property } from '../types';

export const Guests: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightName = searchParams.get('highlight');
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState({ checkedIn: 0, upcoming: 0, checkingOut: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', check_in: '', check_out: '', property_id: '', property_name: '' });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addSubmitting, setAddSubmitting] = useState(false);

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

  useEffect(() => {
    propertiesApi.list().then(setProperties).catch(console.error);
  }, []);

  // Scroll to highlighted guest when data loads
  useEffect(() => {
    if (!loading && highlightName && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear the highlight param after 3 seconds so the ring fades
      const timer = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, highlightName, guests]);

  const handleAddGuest = async () => {
    const errs: Record<string, string> = {};
    if (!addForm.name.trim()) errs.name = 'Name is required';
    if (!addForm.phone.trim()) errs.phone = 'Phone is required';
    if (!addForm.check_in) errs.check_in = 'Check-in date is required';
    if (!addForm.check_out) errs.check_out = 'Check-out date is required';
    if (!addForm.property_id) errs.property_id = 'Property is required';
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAddSubmitting(true);
    try {
      await guestsApi.create({
        name: addForm.name.trim(),
        phone: `+968${addForm.phone.replace(/\s/g, '')}`,
        email: addForm.email || undefined,
        check_in: addForm.check_in,
        check_out: addForm.check_out,
        property_id: addForm.property_id,
        property_name: addForm.property_name,
      });
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '', check_in: '', check_out: '', property_id: '', property_name: '' });
      loadData();
    } catch (err) {
      console.error('Failed to add guest:', err);
    } finally {
      setAddSubmitting(false);
    }
  };

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
          guests.map((guest, i) => {
            const isHighlighted = highlightName && guest.name.toLowerCase() === highlightName.toLowerCase();
            return (
            <motion.div
              key={guest.id}
              ref={isHighlighted ? highlightedRef : undefined}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "bg-white p-5 rounded-xl shadow-sm border space-y-4 transition-all duration-500",
                isHighlighted ? "border-secondary-gold ring-2 ring-secondary-gold/40 shadow-lg" : "border-primary-navy/5"
              )}
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
          );})
        )}
      </section>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-secondary-gold text-primary-navy rounded-full shadow-lg shadow-secondary-gold/20 flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <UserPlus size={24} />
      </button>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[24px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-primary-navy/5">
              <div>
                <h3 className="font-headline text-lg font-bold text-primary-navy">Add Walk-in Guest</h3>
                <p className="text-xs text-primary-navy/50 font-medium">Manual guest entry for walk-in bookings</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-primary-navy/5 rounded-full">
                <X size={20} className="text-primary-navy/40" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Full Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ahmed Al-Said"
                  className={cn("w-full bg-surface-container-low border rounded-xl py-3 px-4 text-sm placeholder:text-primary-navy/20", addErrors.name ? "border-red-300" : "border-transparent")}
                />
                {addErrors.name && <p className="text-red-500 text-xs">{addErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Phone *</label>
                <div className="flex gap-2">
                  <div className="bg-surface-container-low rounded-xl py-3 px-3 text-sm font-bold text-primary-navy/60">+968</div>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm(p => ({ ...p, phone: e.target.value.replace(/[^\d\s]/g, '') }))}
                    placeholder="9000 0000"
                    maxLength={9}
                    className={cn("flex-1 bg-surface-container-low border rounded-xl py-3 px-4 text-sm placeholder:text-primary-navy/20", addErrors.phone ? "border-red-300" : "border-transparent")}
                  />
                </div>
                {addErrors.phone && <p className="text-red-500 text-xs">{addErrors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Email (Optional)</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="guest@email.com"
                  className="w-full bg-surface-container-low border border-transparent rounded-xl py-3 px-4 text-sm placeholder:text-primary-navy/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Property *</label>
                <select
                  value={addForm.property_id}
                  onChange={(e) => {
                    const prop = properties.find(p => p.id === e.target.value);
                    setAddForm(p => ({ ...p, property_id: e.target.value, property_name: prop?.name || '' }));
                  }}
                  className={cn("w-full bg-surface-container-low border rounded-xl py-3 px-4 text-sm", addErrors.property_id ? "border-red-300" : "border-transparent")}
                >
                  <option value="">Select property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {addErrors.property_id && <p className="text-red-500 text-xs">{addErrors.property_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Check-in *</label>
                  <input
                    type="date"
                    value={addForm.check_in}
                    onChange={(e) => setAddForm(p => ({ ...p, check_in: e.target.value }))}
                    className={cn("w-full bg-surface-container-low border rounded-xl py-3 px-4 text-sm", addErrors.check_in ? "border-red-300" : "border-transparent")}
                  />
                  {addErrors.check_in && <p className="text-red-500 text-xs">{addErrors.check_in}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Check-out *</label>
                  <input
                    type="date"
                    value={addForm.check_out}
                    onChange={(e) => setAddForm(p => ({ ...p, check_out: e.target.value }))}
                    className={cn("w-full bg-surface-container-low border rounded-xl py-3 px-4 text-sm", addErrors.check_out ? "border-red-300" : "border-transparent")}
                  />
                  {addErrors.check_out && <p className="text-red-500 text-xs">{addErrors.check_out}</p>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-primary-navy/5 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border border-primary-navy/20 font-bold text-xs uppercase tracking-widest text-primary-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGuest}
                disabled={addSubmitting}
                className="flex-1 py-3 rounded-xl bg-primary-navy text-white font-bold text-xs uppercase tracking-widest shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={14} />
                    Add Guest
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
