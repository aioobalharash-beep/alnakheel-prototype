import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Bed, Banknote, Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  revenue: { total: number; trend: number };
  pendingBookings: number;
  occupancy: number;
  nextCheckIn: any;
  recentBookings: any[];
  userName: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get(user?.name || 'Curator')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const formatCurrency = (amount: number) =>
    `OMR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <p className="text-primary-navy/60 font-medium text-sm">Assalamu Alaikum, {data.userName}</p>
        <h2 className="text-3xl font-bold text-primary-navy">Evening Overview</h2>
      </motion.section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <span className="text-2xl font-bold font-headline">{formatCurrency(data.revenue.total)}</span>
            <span className={cn("text-xs font-bold", data.revenue.trend >= 0 ? "text-emerald-600" : "text-red-500")}>
              {data.revenue.trend >= 0 ? '+' : ''}{data.revenue.trend}%
            </span>
          </div>
          <p className="text-[10px] text-primary-navy/40 mt-2 font-medium">Last 30 days performance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-navy p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Pending Bookings</span>
            <Star className="text-secondary-gold" size={20} fill="currentColor" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold font-headline">{String(data.pendingBookings).padStart(2, '0')}</span>
            <span className="bg-secondary-gold/20 text-secondary-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase">Action Required</span>
          </div>
        </motion.div>

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
            <span className="text-2xl font-bold font-headline">{data.occupancy}%</span>
            <div className="flex-1 h-1.5 bg-primary-navy/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.occupancy}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-primary-navy"
              />
            </div>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Condensed Calendar */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-primary-navy/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-headline">October 2024</h3>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-primary-navy/5 rounded-full"><ChevronLeft size={20} /></button>
              <button className="p-1 hover:bg-primary-navy/5 rounded-full"><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <span key={d} className="font-bold text-primary-navy/40 uppercase mb-2">{d}</span>
            ))}
            {Array.from({ length: 14 }).map((_, i) => {
              const day = i + 1;
              const isToday = day === 4;
              const bookedDays = data.recentBookings.map(b => {
                const d = new Date(b.check_in).getDate();
                return d;
              });
              const isBooked = bookedDays.includes(day);
              return (
                <span
                  key={i}
                  className={cn(
                    "py-2 font-medium rounded-xl transition-colors",
                    isToday && "bg-secondary-gold text-white",
                    isBooked && !isToday && "bg-primary-navy text-white",
                    !isToday && !isBooked && "text-primary-navy/80"
                  )}
                >
                  {day}
                </span>
              );
            })}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-gold"></span>
              <span className="text-[10px] font-bold uppercase text-primary-navy/60">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-navy"></span>
              <span className="text-[10px] font-bold uppercase text-primary-navy/60">Booked</span>
            </div>
          </div>
        </motion.section>

        {/* Next Check-In */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold font-headline">Next Check-In</h3>
          {data.nextCheckIn ? (
            <div className="relative group overflow-hidden rounded-2xl h-56 shadow-lg">
              <img
                src="https://picsum.photos/seed/oman-villa/800/600"
                alt="Luxury villa"
                className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-primary-navy">{data.nextCheckIn.property_name}</h4>
                      <p className="text-xs text-primary-navy/60">Guest: {data.nextCheckIn.guest_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary-gold">{new Date(data.nextCheckIn.check_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                      <p className="text-[10px] uppercase font-bold text-primary-navy/40">Arrival</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-navy/10 flex items-center justify-center">
                        <User size={14} />
                      </div>
                    </div>
                    <button className="bg-primary-navy text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center text-primary-navy/40">
              <p className="text-sm">No upcoming check-ins</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-primary-navy/10 rounded w-48" />
        <div className="h-8 bg-primary-navy/10 rounded w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-primary-navy/5 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-72 bg-primary-navy/5 rounded-3xl" />
        <div className="h-56 bg-primary-navy/5 rounded-2xl" />
      </div>
    </div>
  );
}
