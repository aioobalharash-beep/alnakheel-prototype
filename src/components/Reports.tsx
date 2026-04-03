import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bed,
  Banknote,
  TrendingUp,
  Star,
  Download,
  Calendar as CalendarIcon,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { reportsApi, testimonialsApi } from '../services/api';

interface ReportData {
  stats: {
    occupancyRate: number;
    avgNightlyRate: number;
    monthlyRevenue: number;
    guestSatisfaction: number;
  };
  occupancyByProperty: { name: string; percentage: number; bookings: number }[];
  revenueByMonth: { month: string; actual: number; forecast: number }[];
  reviews: { name: string; stay: string; text: string; rating: number }[];
}

interface FirestoreTestimonial {
  id?: string;
  guest_name: string;
  guest_phone: string;
  property_name: string;
  rating: number;
  text: string;
  stay_details: string;
  created_at: string;
}

export const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveTestimonials, setLiveTestimonials] = useState<FirestoreTestimonial[]>([]);

  useEffect(() => {
    Promise.all([
      reportsApi.get(),
      testimonialsApi.list(),
    ]).then(([reportData, testimonials]) => {
      setData(reportData);
      setLiveTestimonials(testimonials);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWhatsAppReply = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[\s+]/g, '');
    const message = encodeURIComponent(
      `Dear ${name},\n\nThank you for your wonderful review of Al-Nakheel! We truly appreciate your feedback and look forward to welcoming you again.\n\nWarm regards,\nAl-Nakheel Luxury Properties`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;
  if (!data) return null;

  const statCards = [
    { label: 'Occupancy Rate', value: `${data.stats.occupancyRate}%`, trend: '+4.2% vs LW', icon: Bed, color: 'bg-blue-50 text-blue-600' },
    { label: 'Avg Nightly Rate', value: `${data.stats.avgNightlyRate} OMR`, trend: '+12% vs LY', icon: Banknote, color: 'bg-amber-50 text-amber-600' },
    { label: 'Monthly Revenue', value: `${(data.stats.monthlyRevenue / 1000).toFixed(1)}k OMR`, trend: 'Stable', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Guest Satisfaction', value: `${data.stats.guestSatisfaction}/5.0`, trend: 'Excellent', icon: Star, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase font-lato">Performance Overview</p>
          <h3 className="text-4xl font-bold font-headline text-primary-navy">Executive Summary</h3>
          <p className="text-primary-navy/60 max-w-lg text-sm">Real-time performance metrics across the Al-Nakheel property portfolio for the current fiscal month.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white shadow-sm text-primary-navy font-bold text-xs uppercase tracking-wider hover:bg-primary-navy/5 transition-colors">
            <CalendarIcon size={16} />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-navy text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-primary-navy/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
                <stat.icon size={24} fill={stat.label === 'Guest Satisfaction' ? 'currentColor' : 'none'} />
              </div>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold">{stat.trend}</span>
            </div>
            <div>
              <p className="text-primary-navy/50 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-2xl font-bold font-headline text-primary-navy mt-1">{stat.value}</h4>
            </div>
            {stat.label === 'Occupancy Rate' && (
              <div className="w-full bg-primary-navy/5 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary-navy h-full rounded-full" style={{ width: `${data.stats.occupancyRate}%` }}></div>
              </div>
            )}
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-primary-navy/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h5 className="text-xl font-bold font-headline text-primary-navy">Revenue Forecast</h5>
              <p className="text-xs text-primary-navy/50 font-medium">Comparison between projected and actual earnings</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-navy"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-navy/60">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary-gold"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-navy/60">Forecast</span>
              </div>
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-4 pb-8 border-b border-primary-navy/10">
            {data.revenueByMonth.map((month, i) => {
              const maxVal = Math.max(...data.revenueByMonth.map(m => Math.max(m.actual, m.forecast)));
              const forecastHeight = (month.forecast / maxVal) * 220;
              const actualHeight = (month.actual / maxVal) * 220;
              return (
                <div key={month.month} className="group relative flex flex-col items-center gap-2 w-12">
                  <div className="w-full bg-secondary-gold/20 rounded-t-lg transition-all group-hover:bg-secondary-gold/30" style={{ height: `${forecastHeight}px` }}></div>
                  <div className="w-full bg-primary-navy rounded-t-lg absolute bottom-0 transition-all group-hover:scale-y-105 origin-bottom" style={{ height: `${actualHeight}px` }}></div>
                  <span className="text-[10px] font-bold text-primary-navy/40 absolute -bottom-8">{month.month}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary-navy rounded-2xl p-8 shadow-xl text-white flex flex-col justify-between"
        >
          <div>
            <h5 className="text-xl font-bold font-headline text-secondary-gold leading-tight">Occupancy by Property</h5>
            <p className="text-sm text-white/60 mt-2">Highest performing chalets this month.</p>
          </div>
          <div className="space-y-6 my-8">
            {data.occupancyByProperty.map(p => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span>{p.name}</span>
                  <span>{p.percentage}%</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="bg-secondary-gold h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
            View Detailed Log
          </button>
        </motion.div>
      </div>

      {/* Feedback Section — Live Testimonials from Firestore */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-2xl font-bold font-headline text-primary-navy">Customer Sentiment</h4>
          <span className="text-primary-navy/40 text-xs font-bold uppercase tracking-wider">
            {liveTestimonials.length > 0 ? `${liveTestimonials.length} live reviews` : `${data.reviews.length} reviews`}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(liveTestimonials.length > 0 ? liveTestimonials : data.reviews.map(r => ({ ...r, guest_name: r.name, guest_phone: '', property_name: '', stay_details: r.stay, created_at: '' }))).map((review, i) => (
            <motion.div
              key={review.guest_name + i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border-l-4 border-secondary-gold shadow-sm space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-navy/10 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${review.guest_name}`} alt={review.guest_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-bold truncate">{review.guest_name}</h6>
                  <p className="text-[10px] text-primary-navy/50 font-medium">
                    {review.property_name && `${review.property_name} \u2022 `}{review.stay_details}
                  </p>
                </div>
              </div>
              <p className="text-sm italic text-primary-navy/80 leading-relaxed">"{review.text}"</p>
              <div className="flex items-center justify-between">
                <div className="flex text-secondary-gold">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} fill={j < review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                {review.guest_phone && (
                  <button
                    onClick={() => handleWhatsAppReply(review.guest_phone, review.guest_name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle size={12} />
                    Reply
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
