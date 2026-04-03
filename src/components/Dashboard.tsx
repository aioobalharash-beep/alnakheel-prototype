import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Bed, Banknote, Star, ChevronLeft, ChevronRight, User, CalendarCheck, Phone, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { getBookings, StoredBooking } from '@/src/lib/firebase';

export const Dashboard: React.FC = () => {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookings()
      .then(setBookings)
      .catch((err) => console.error('Failed to load bookings:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <p className="text-primary-navy/60 font-medium text-sm">Assalamu Alaikum, Curator</p>
        <h2 className="text-3xl font-bold text-primary-navy">Evening Overview</h2>
      </motion.section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-secondary-gold"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-primary-navy/50 font-bold text-[10px] uppercase tracking-widest">Total Revenue</span>
            <Banknote className="text-secondary-gold" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-headline">OMR {totalRevenue.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-primary-navy/40 mt-2 font-medium">From {bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Confirmed Bookings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-navy p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Confirmed Bookings</span>
            <Star className="text-secondary-gold" size={20} fill="currentColor" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold font-headline">{String(confirmedCount).padStart(2, '0')}</span>
            {confirmedCount > 0 && (
              <span className="bg-secondary-gold/20 text-secondary-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase">Live</span>
            )}
          </div>
        </motion.div>

        {/* Occupancy */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container-high p-6 rounded-2xl"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-primary-navy/50 font-bold text-[10px] uppercase tracking-widest">Occupancy</span>
            <Bed className="text-primary-navy" size={20} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold font-headline">94%</span>
            <div className="flex-1 h-1.5 bg-primary-navy/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-primary-navy"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Live Bookings from Firebase */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold font-headline">Guest Bookings</h3>
            <p className="text-xs text-primary-navy/50">Live data from your database</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              getBookings().then(setBookings).finally(() => setLoading(false));
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-secondary-gold animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-primary-navy/5">
            <CalendarCheck size={40} className="text-primary-navy/15 mx-auto mb-4" />
            <p className="font-bold text-primary-navy/40">No bookings yet</p>
            <p className="text-xs text-primary-navy/30 mt-1">
              When a guest books through the app, their reservation will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-primary-navy/5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary-navy/5 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-primary-navy/50" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-primary-navy truncate">{booking.guestName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-primary-navy/50">
                        {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                      </span>
                      <span className="text-[10px] font-bold text-primary-navy/30">·</span>
                      <span className="text-[10px] font-bold text-primary-navy/40">
                        {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone size={10} className="text-primary-navy/30" />
                      <span className="text-[10px] text-primary-navy/40">+968 {booking.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold font-headline text-primary-navy">{booking.total} OMR</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    booking.status === 'confirmed'
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-primary-navy/5 text-primary-navy/40"
                  )}>
                    {booking.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
};
