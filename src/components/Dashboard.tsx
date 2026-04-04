import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bed, Banknote, Star, ChevronLeft, ChevronRight, User, X, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

        {/* Right column: Next Check-In + Recent Activity */}
        <div className="space-y-4">
          {/* Next Check-In Widget */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const nextCheckIn = bookings
                .filter(b => b.status !== 'cancelled' && b.check_in >= todayStr)
                .sort((a, b) => a.check_in.localeCompare(b.check_in))[0];

              if (!nextCheckIn) {
                return (
                  <div className="bg-white rounded-2xl border border-primary-navy/5 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-secondary-gold" />
                      <h3 className="text-sm font-bold font-headline text-primary-navy uppercase tracking-wide">Next Check-In</h3>
                    </div>
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-primary-navy/5 mx-auto mb-3 flex items-center justify-center">
                        <User size={20} className="text-primary-navy/30" />
                      </div>
                      <p className="text-sm text-primary-navy/40 font-medium">No upcoming check-ins</p>
                    </div>
                  </div>
                );
              }

              const arrivalDate = new Date(nextCheckIn.check_in);
              const isConfirmed = nextCheckIn.status === 'confirmed' || nextCheckIn.status === 'checked-in';

              return (
                <div className="bg-white rounded-2xl border border-primary-navy/5 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-secondary-gold" />
                      <h3 className="text-sm font-bold font-headline text-primary-navy uppercase tracking-wide">Next Check-In</h3>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2.5 py-1 rounded-full",
                      isConfirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {nextCheckIn.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-navy/5 flex-shrink-0">
                      <img src={`https://i.pravatar.cc/150?u=${nextCheckIn.guest_name}`} alt={nextCheckIn.guest_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary-navy text-sm truncate">{nextCheckIn.guest_name}</p>
                      <p className="text-[11px] text-primary-navy/50 font-medium">
                        {arrivalDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' '}&bull;{' '}{nextCheckIn.property_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-secondary-gold text-lg font-headline">
                        {arrivalDate.toLocaleDateString('en-GB', { day: 'numeric' })}
                      </p>
                      <p className="text-[9px] uppercase font-bold text-primary-navy/40 tracking-wider">
                        {arrivalDate.toLocaleDateString('en-GB', { month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/guests?highlight=${encodeURIComponent(nextCheckIn.guest_name)}`)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-navy text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all"
                  >
                    View Details
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })()}
          </motion.section>

          {/* Recent Activity Widget */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            {(() => {
              // Most recently created booking (bookings are already sorted by created_at DESC from onSnapshot)
              const recentBooking = bookings.filter(b => b.status !== 'cancelled')[0];

              if (!recentBooking) {
                return (
                  <div className="bg-primary-navy rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={16} className="text-secondary-gold" />
                      <h3 className="text-sm font-bold font-headline text-white uppercase tracking-wide">Recent Activity</h3>
                    </div>
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center">
                        <Sparkles size={20} className="text-white/30" />
                      </div>
                      <p className="text-sm text-white/40 font-medium">No recent activity</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-primary-navy rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-secondary-gold" />
                      <h3 className="text-sm font-bold font-headline text-white uppercase tracking-wide">Recent Activity</h3>
                    </div>
                    <span className="bg-secondary-gold/20 text-secondary-gold px-2.5 py-1 rounded-full text-[9px] font-bold uppercase">New</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                      <img src={`https://i.pravatar.cc/150?u=${recentBooking.guest_name}`} alt={recentBooking.guest_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">New Booking from {recentBooking.guest_name}</p>
                      <p className="text-[11px] text-white/50 font-medium">
                        {recentBooking.property_name} &bull; {recentBooking.nights} night{recentBooking.nights > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Amount</span>
                    <span className="text-secondary-gold font-bold font-headline">OMR {recentBooking.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/guests?highlight=${encodeURIComponent(recentBooking.guest_name)}`)}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-secondary-gold text-primary-navy py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all"
                  >
                    View Details
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })()}
          </motion.section>
        </div>
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
        <div className="space-y-4">
          <div className="h-44 bg-primary-navy/5 rounded-2xl" />
          <div className="h-44 bg-primary-navy/10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
