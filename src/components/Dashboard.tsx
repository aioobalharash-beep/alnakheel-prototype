import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Bed, Banknote, Star, ChevronLeft, ChevronRight, User, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface DashboardData {
  revenue: { total: number; trend: number };
  pendingBookings: number;
  occupancy: number;
  nextCheckIn: any;
  recentBookings: any[];
  userName: string;
}

interface RealtimeBooking {
  id: string;
  property_name: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  status: string;
  payment_status: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time bookings from Firestore (same source as Calendar page)
  const [bookings, setBookings] = useState<RealtimeBooking[]>([]);

  // Calendar widget state
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    dashboardApi.get(user?.name || 'Curator')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Single source of truth: onSnapshot on 'bookings' collection
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RealtimeBooking)));
    });
    return () => unsubscribe();
  }, []);

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const monthName = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getMonth() === calMonth && today.getFullYear() === calYear ? today.getDate() : -1;

  // Same color logic as Calendar page: build day → status map
  const getBookedDayMap = (): Map<number, { status: 'pending' | 'confirmed'; bookings: RealtimeBooking[] }> => {
    const dayMap = new Map<number, { status: 'pending' | 'confirmed'; bookings: RealtimeBooking[] }>();

    for (const b of bookings) {
      if (b.status === 'cancelled') continue;

      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      const monthStart = new Date(calYear, calMonth, 1);
      const monthEnd = new Date(calYear, calMonth + 1, 0);

      if (checkOut < monthStart || checkIn > monthEnd) continue;

      const startDay = checkIn.getMonth() === calMonth && checkIn.getFullYear() === calYear ? checkIn.getDate() : 1;
      const endDay = checkOut.getMonth() === calMonth && checkOut.getFullYear() === calYear ? checkOut.getDate() : daysInMonth;

      for (let d = startDay; d <= endDay; d++) {
        const existing = dayMap.get(d);
        const statusVal = (b.status === 'confirmed' || b.status === 'checked-in') ? 'confirmed' : 'pending';

        if (existing) {
          existing.bookings.push(b);
          if (statusVal === 'confirmed') existing.status = 'confirmed';
        } else {
          dayMap.set(d, { status: statusVal as 'pending' | 'confirmed', bookings: [b] });
        }
      }
    }
    return dayMap;
  };

  const bookedDayMap = getBookedDayMap();

  // Get bookings for the selected day
  const selectedDayBookings = selectedDay ? bookedDayMap.get(selectedDay)?.bookings || [] : [];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
    setSelectedDay(null);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const formatCurrency = (amount: number) =>
    `OMR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Recompute stats from real-time bookings
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

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
            <span className="text-3xl font-bold font-headline">{String(pendingCount).padStart(2, '0')}</span>
            {pendingCount > 0 && (
              <span className="bg-secondary-gold/20 text-secondary-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase">Action Required</span>
            )}
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
        {/* Real-time Calendar Widget — same onSnapshot source as Calendar page */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-primary-navy/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-headline">{monthName}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1 hover:bg-primary-navy/5 rounded-full"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-primary-navy/5 rounded-full"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d} className="font-bold text-primary-navy/40 uppercase mb-2 text-[10px]">{d}</span>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <span key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === todayDay;
              const dayInfo = bookedDayMap.get(day);
              const hasBooking = !!dayInfo;
              const isSelected = selectedDay === day;

              return (
                <span
                  key={day}
                  onClick={() => hasBooking && setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    "py-1.5 font-medium rounded-lg transition-all text-xs relative",
                    hasBooking ? "cursor-pointer hover:opacity-80" : "",
                    isToday && !hasBooking && "bg-primary-navy text-white font-bold",
                    !isToday && !hasBooking && "text-primary-navy/80",
                    isSelected && "ring-2 ring-primary-navy ring-offset-1",
                  )}
                  style={
                    hasBooking && dayInfo.status === 'confirmed' ? { backgroundColor: '#2E7D32', color: '#fff' } :
                    hasBooking && dayInfo.status === 'pending' ? { backgroundColor: '#FFD700', color: '#1a1a1a' } :
                    undefined
                  }
                >
                  {day}
                </span>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#2E7D32' }}></span>
              <span className="text-[10px] font-bold uppercase text-primary-navy/60">Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#FFD700' }}></span>
              <span className="text-[10px] font-bold uppercase text-primary-navy/60">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-primary-navy"></span>
              <span className="text-[10px] font-bold uppercase text-primary-navy/60">Today</span>
            </div>
          </div>

          {/* Day Detail Popup — shows guest info when a date is clicked */}
          {selectedDay && selectedDayBookings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-surface-container-low rounded-xl p-4 space-y-3 border border-primary-navy/5"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-primary-navy">
                  {selectedDay} {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long' })} — {selectedDayBookings.length} booking{selectedDayBookings.length > 1 ? 's' : ''}
                </p>
                <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-primary-navy/5 rounded-full">
                  <X size={14} className="text-primary-navy/40" />
                </button>
              </div>
              {selectedDayBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-t border-primary-navy/5 first:border-t-0 first:pt-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-navy/5 flex-shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${b.guest_name}`} alt={b.guest_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-navy truncate">{b.guest_name}</p>
                    <p className="text-[10px] text-primary-navy/50 font-medium">
                      {b.property_name} &bull; {b.nights} night{b.nights > 1 ? 's' : ''} &bull; {b.total_amount} OMR
                    </p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0",
                    (b.status === 'confirmed' || b.status === 'checked-in') ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {b.status}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
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
