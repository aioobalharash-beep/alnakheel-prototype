import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Banknote, ChevronRight as ChevronRightIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { transactionsApi } from '../services/api';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatTime } from '../services/pricingUtils';
import type { Transaction } from '../types';

interface RealtimeBooking {
  id: string;
  property_id: string;
  property_name: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  slot_name?: string;
  slot_start_time?: string;
  slot_end_time?: string;
}

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<RealtimeBooking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getMonth() === currentMonth && today.getFullYear() === currentYear ? today.getDate() : -1;

  // Real-time listener on bookings
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RealtimeBooking));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error('Bookings listener error:', error);
      setLoading(false);
    });

    transactionsApi.list(5).then(setTransactions).catch(console.error);

    return () => unsubscribe();
  }, []);

  // Build a map of day -> booking info for current month
  const getBookedDayMap = (): Map<number, { status: 'pending' | 'confirmed'; isDayUse: boolean }> => {
    const dayMap = new Map<number, { status: 'pending' | 'confirmed'; isDayUse: boolean }>();

    for (const b of bookings) {
      if (b.status === 'cancelled') continue;

      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      const bIsDayUse = b.check_in === b.check_out;

      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);

      if (checkOut < monthStart || checkIn > monthEnd) continue;

      const startDay = checkIn.getMonth() === currentMonth && checkIn.getFullYear() === currentYear
        ? checkIn.getDate() : 1;
      const endDay = checkOut.getMonth() === currentMonth && checkOut.getFullYear() === currentYear
        ? checkOut.getDate() : daysInMonth;

      for (let d = startDay; d <= endDay; d++) {
        const existing = dayMap.get(d);
        const statusVal = (b.status === 'confirmed' || b.status === 'checked-in') ? 'confirmed' as const : 'pending' as const;

        if (existing) {
          if (statusVal === 'confirmed') existing.status = 'confirmed';
          // If any booking on this day is NOT day-use, mark as full
          if (!bIsDayUse) existing.isDayUse = false;
        } else {
          dayMap.set(d, { status: statusVal, isDayUse: bIsDayUse });
        }
      }
    }
    return dayMap;
  };

  const bookedDayMap = getBookedDayMap();

  const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked-in').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_amount, 0);
  const upcomingArrivals = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 3);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <section className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-navy p-5 rounded-xl flex flex-col justify-between shadow-lg text-white h-32"
        >
          <CalendarIcon className="text-secondary-gold" size={24} />
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Confirmed</p>
            <p className="font-headline text-2xl font-bold">{confirmedCount}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-amber-50 p-5 rounded-xl flex flex-col justify-between shadow-sm border border-amber-200 h-32"
        >
          <CalendarIcon className="text-amber-600" size={24} />
          <div>
            <p className="text-amber-700/60 text-[10px] font-bold uppercase tracking-widest">Pending</p>
            <p className="text-amber-800 font-headline text-2xl font-bold">{pendingCount}</p>
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
            <p className="text-primary-navy font-headline text-2xl font-bold">
              {(totalRevenue / 1000).toFixed(1)}k <span className="text-xs">OMR</span>
            </p>
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
            <h2 className="font-headline text-xl font-bold text-primary-navy">{monthName}</h2>
            <p className="text-xs text-primary-navy/40 font-medium">{bookings.length} Total bookings</p>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-primary-navy/5 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-primary-navy/5 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[10px] font-bold text-primary-navy/40 uppercase tracking-tighter">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === todayDay;
            const entry = bookedDayMap.get(day);
            const bookingStatus = entry?.status;
            const isDayUseDay = entry?.isDayUse;

            return (
              <div
                key={day}
                className={cn(
                  "relative text-sm font-medium p-2 rounded-lg transition-all",
                  isToday && !bookingStatus && "bg-primary-navy text-white font-bold",
                  bookingStatus === 'confirmed' && !isDayUseDay && "text-white font-bold",
                  bookingStatus === 'confirmed' && isDayUseDay && "font-bold",
                  bookingStatus === 'pending' && "text-primary-navy font-bold",
                  !isToday && !bookingStatus && "text-primary-navy",
                )}
                style={
                  bookingStatus === 'confirmed' && !isDayUseDay ? { backgroundColor: '#2E7D32' } :
                  bookingStatus === 'confirmed' && isDayUseDay ? { backgroundColor: '#2E7D32', backgroundImage: 'linear-gradient(135deg, #2E7D32 50%, transparent 50%)', color: '#2E7D32' } :
                  bookingStatus === 'pending' ? { backgroundColor: '#FFD700' } :
                  undefined
                }
              >
                {day}
                {isDayUseDay && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary-gold text-primary-navy rounded-full text-[7px] font-bold flex items-center justify-center leading-none">D</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#2E7D32' }}></span>
            <span className="text-[10px] font-bold uppercase text-primary-navy/60">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#FFD700' }}></span>
            <span className="text-[10px] font-bold uppercase text-primary-navy/60">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative w-3 h-3 rounded bg-secondary-gold"><span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary-gold text-primary-navy rounded-full text-[5px] font-bold flex items-center justify-center leading-none">D</span></span>
            <span className="text-[10px] font-bold uppercase text-primary-navy/60">Day Use</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary-navy"></span>
            <span className="text-[10px] font-bold uppercase text-primary-navy/60">Today</span>
          </div>
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-headline text-lg font-bold text-primary-navy">Next Arrivals</h3>
          <button onClick={() => navigate('/admin/guests')} className="text-[10px] font-bold text-secondary-gold tracking-widest uppercase hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {upcomingArrivals.map((arrival, i) => (
            <motion.div
              key={arrival.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-4 flex items-center justify-between group active:bg-primary-navy/5 transition-colors border border-primary-navy/5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold text-sm text-primary-navy">{arrival.guest_name}</p>
                  <p className="text-xs text-primary-navy/40 font-medium">
                    {arrival.property_name} &bull; {arrival.slot_name
                      ? `${arrival.slot_name}: ${formatTime(arrival.slot_start_time!)} – ${formatTime(arrival.slot_end_time!)}`
                      : arrival.check_in === arrival.check_out
                        ? 'Day Use'
                        : `${new Date(arrival.check_in).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${new Date(arrival.check_out).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[10px] font-bold text-secondary-gold uppercase">
                    {new Date(arrival.check_in).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </p>
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                    arrival.status === 'confirmed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {arrival.status}
                  </span>
                </div>
                <ChevronRightIcon size={16} className="text-primary-navy/20" />
              </div>
            </motion.div>
          ))}
          {upcomingArrivals.length === 0 && (
            <p className="text-center text-sm text-primary-navy/40 py-8">No upcoming arrivals</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-primary-navy px-1">Recent Transactions</h3>
        <div className="bg-white rounded-xl overflow-hidden border border-primary-navy/5 shadow-sm">
          {transactions.slice(0, 4).map((tx, i) => (
            <div key={tx.id} className={cn("p-4 flex items-center justify-between", i < transactions.length - 1 && "border-b border-primary-navy/5")}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", tx.type === 'refund' ? "bg-red-50" : "bg-emerald-50")}>
                  {tx.type === 'refund' ? <ArrowDownLeft className="text-red-500" size={18} /> : <ArrowUpRight className="text-emerald-500" size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold">{tx.description}</p>
                  <p className="text-[10px] text-primary-navy/40 uppercase font-bold">{tx.date} &bull; ID #{tx.id.slice(0, 4)}</p>
                </div>
              </div>
              <p className={cn("text-sm font-bold", tx.amount < 0 ? "text-red-500" : "text-emerald-500")}>
                {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toFixed(2)} OMR
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-sm text-primary-navy/40 py-8">No transactions yet</p>
          )}
        </div>
      </section>

    </div>
  );
};
