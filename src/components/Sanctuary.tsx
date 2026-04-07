import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Ruler, CheckCircle2, Calendar as CalendarIcon, Instagram, MessageCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

interface PricingSettings {
  weekday_rate: number;
  thursday_rate: number;
  friday_rate: number;
  saturday_rate: number;
  special_dates?: { date: string; price: number }[];
  discount?: { enabled: boolean; type: 'percent' | 'flat'; value: number; start_date: string; end_date: string };
}

interface PropertyDetails {
  name: string;
  capacity: number;
  area_sqm: number;
  nightly_rate: number;
  headline: string;
  description: string;
  features: string[];
  gallery: { url: string; label: string }[];
  pricing?: PricingSettings;
}

const DEFAULTS: PropertyDetails = {
  name: 'Al-Nakheel Sanctuary',
  capacity: 12,
  area_sqm: 850,
  nightly_rate: 120,
  headline: 'Curated Excellence',
  description: 'Nestled in the heart of the Omani landscape, Al-Nakheel offers an unparalleled blend of modern luxury and heritage-inspired architecture. Every corner of this estate has been curated to provide a seamless flow between indoor relaxation and outdoor majesty.',
  features: ['Concierge Service', 'Daily Maintenance', 'Private Parking', 'Secure Perimeter'],
  gallery: [
    { url: 'https://picsum.photos/seed/oman-bedroom-1/800/1000', label: 'Master Suite: Serene Sands' },
    { url: 'https://picsum.photos/seed/oman-bedroom-2/800/1000', label: 'Guest Wing: Golden Hour' },
    { url: 'https://picsum.photos/seed/oman-kitchen/800/1000', label: 'Culinary Studio' },
  ],
};

export const Sanctuary: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PropertyDetails>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'property_details'),
      (snap) => {
        if (snap.exists()) {
          setData({ ...DEFAULTS, ...snap.data() as PropertyDetails });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Property details listener error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        <div className="px-6 mt-8 space-y-4">
          <div className="h-4 bg-primary-navy/5 rounded w-32" />
          <div className="h-8 bg-primary-navy/5 rounded w-64" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-none w-[85vw] md:w-[600px] aspect-[4/5] md:aspect-video rounded-[20px] bg-primary-navy/5" />
            ))}
          </div>
        </div>
        <div className="px-6 grid grid-cols-2 gap-4">
          <div className="h-24 bg-primary-navy/5 rounded-[20px]" />
          <div className="h-24 bg-primary-navy/5 rounded-[20px]" />
        </div>
        <div className="px-6 space-y-3">
          <div className="h-6 bg-primary-navy/5 rounded w-48" />
          <div className="h-4 bg-primary-navy/5 rounded w-full" />
          <div className="h-4 bg-primary-navy/5 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Gallery */}
      <section className="px-6 mt-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase block mb-1">Estate Preview</span>
            <h2 className="font-headline text-3xl font-bold text-primary-navy">{data.name}</h2>
          </div>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-4">
          {data.gallery.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-none w-[85vw] md:w-[600px] snap-center"
            >
              <div className="aspect-[4/5] md:aspect-video rounded-[20px] overflow-hidden bg-primary-navy/5 shadow-sm">
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="mt-3 font-bold text-primary-navy/80 text-sm px-1">{img.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-primary-navy/5 shadow-sm">
          <Users className="text-secondary-gold mb-2" size={20} />
          <p className="text-[10px] text-primary-navy/50 font-bold uppercase tracking-wider mb-1">Capacity</p>
          <p className="font-headline text-lg font-bold">{data.capacity} Guests</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-primary-navy/5 shadow-sm">
          <Ruler className="text-secondary-gold mb-2" size={20} />
          <p className="text-[10px] text-primary-navy/50 font-bold uppercase tracking-wider mb-1">Area</p>
          <p className="font-headline text-lg font-bold">{data.area_sqm} m&sup2;</p>
        </div>
      </section>

      {/* Description */}
      <section className="px-6">
        <h3 className="font-headline text-xl font-bold mb-4">{data.headline}</h3>
        <p className="text-primary-navy/60 leading-relaxed text-sm">{data.description}</p>
        <div className="mt-4 text-sm text-primary-navy/60">
          <span className="font-bold text-secondary-gold">From {(() => {
            const p = data.pricing;
            if (!p) return data.nightly_rate;
            const baseRates = [p.weekday_rate, p.thursday_rate, p.friday_rate, p.saturday_rate];
            const specialPrices = (p.special_dates || []).map(s => s.price);
            const allRates = [...baseRates, ...specialPrices].filter(r => r > 0);
            let minRate = Math.min(...allRates);
            if (p.discount?.enabled && p.discount.value > 0) {
              if (p.discount.type === 'percent') {
                minRate = Math.round(minRate * (1 - p.discount.value / 100));
              } else {
                minRate = Math.max(0, minRate - p.discount.value);
              }
            }
            return minRate;
          })()} OMR</span> per night
        </div>
        {data.features.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-y-4">
            {data.features.map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="text-secondary-gold" size={16} />
                <span className="text-xs font-bold text-primary-navy/80">{item}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Info */}
      <footer className="w-full py-12 px-8 bg-white border-t border-primary-navy/5 flex flex-col items-center gap-6">
        <div className="text-secondary-gold font-bold font-headline text-xl">{data.name}</div>
        <p className="text-xs text-center text-primary-navy/60 leading-relaxed max-w-xs">
          Exceptional luxury chalets curated for the modern traveler in the heart of Oman's desert landscape.
        </p>
        <div className="text-[10px] text-primary-navy/30 uppercase font-bold tracking-widest text-center">
          CR: 1234567 | Tourism License: TL-889
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate('/terms')} className="text-xs text-primary-navy/60 underline font-bold">Terms of Stay</button>
          <button onClick={() => navigate('/about')} className="text-xs text-primary-navy/60 underline font-bold">About Us</button>
        </div>
        <div className="flex gap-8 mt-2">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary-navy/40 hover:text-secondary-gold transition-colors">
            <Instagram size={20} />
          </a>
          <a href="https://wa.me/96891000001" target="_blank" rel="noopener noreferrer" className="text-primary-navy/40 hover:text-secondary-gold transition-colors">
            <MessageCircle size={20} />
          </a>
        </div>
        <p className="text-[10px] text-center text-primary-navy/40 font-bold">
          &copy; Al-Nakheel Luxury Chalet. 2024
        </p>
      </footer>

      {/* Floating Book Now */}
      <button
        onClick={() => navigate('/booking')}
        className="fixed bottom-[104px] right-[24px] z-[60] flex items-center gap-2 bg-secondary-gold text-primary-navy px-6 py-3.5 rounded-[20px] shadow-[0px_10px_25px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform active:scale-95"
      >
        <CalendarIcon size={20} />
        <span className="font-bold text-sm tracking-wide">Book Now</span>
      </button>
    </div>
  );
};
