import React from 'react';
import { motion } from 'motion/react';
import { Users, Ruler, CheckCircle2, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { View } from '@/src/types';

interface SanctuaryProps {
  onBookNow: () => void;
}

export const Sanctuary: React.FC<SanctuaryProps> = ({ onBookNow }) => {
  const images = [
    { 
      url: 'https://picsum.photos/seed/oman-bedroom-1/800/1000', 
      label: 'Master Suite: Serene Sands',
      desc: 'Luxurious master bedroom with white linen and desert views.'
    },
    { 
      url: 'https://picsum.photos/seed/oman-bedroom-2/800/1000', 
      label: 'Guest Wing: Golden Hour',
      desc: 'Modern guest bedroom with textured clay walls.'
    },
    { 
      url: 'https://picsum.photos/seed/oman-kitchen/800/1000', 
      label: 'Culinary Studio',
      desc: 'Ultra-modern kitchen with marble countertops.'
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Gallery */}
      <section className="px-6 mt-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase block mb-1">Estate Preview</span>
            <h2 className="font-headline text-3xl font-bold text-primary-navy">Al-Nakheel Sanctuary</h2>
          </div>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-4">
          {images.map((img, i) => (
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
          <p className="font-headline text-lg font-bold">12 Guests</p>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-primary-navy/5 shadow-sm">
          <Ruler className="text-secondary-gold mb-2" size={20} />
          <p className="text-[10px] text-primary-navy/50 font-bold uppercase tracking-wider mb-1">Area</p>
          <p className="font-headline text-lg font-bold">850 m²</p>
        </div>
      </section>

      {/* Description */}
      <section className="px-6">
        <h3 className="font-headline text-xl font-bold mb-4">Curated Excellence</h3>
        <p className="text-primary-navy/60 leading-relaxed text-sm">
          Nestled in the heart of the Omani landscape, Al-Nakheel offers an unparalleled blend of modern luxury and heritage-inspired architecture. Every corner of this estate has been curated to provide a seamless flow between indoor relaxation and outdoor majesty.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-y-4">
          {[
            'Concierge Service', 'Daily Maintenance', 
            'Private Parking', 'Secure Perimeter'
          ].map(item => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="text-secondary-gold" size={16} />
              <span className="text-xs font-bold text-primary-navy/80">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="w-full py-12 px-8 bg-white border-t border-primary-navy/5 flex flex-col items-center gap-6">
        <div className="text-secondary-gold font-bold font-headline text-xl">Al-Nakheel Sanctuary</div>
        <p className="text-xs text-center text-primary-navy/60 leading-relaxed max-w-xs">
          Exceptional luxury chalets curated for the modern traveler in the heart of Oman's desert landscape.
        </p>
        <div className="text-[10px] text-primary-navy/30 uppercase font-bold tracking-widest text-center">
          CR: 1234567 | Tourism License: TL-889
        </div>
        <div className="flex gap-6 items-center">
          <button className="text-xs text-primary-navy/60 underline font-bold">Terms of Stay</button>
          <button className="text-xs text-primary-navy/60 underline font-bold">About Us</button>
        </div>
        <div className="flex gap-8 mt-2">
          <button className="text-primary-navy/40 hover:text-secondary-gold transition-colors">
            <span className="material-symbols-outlined">camera</span>
          </button>
          <button className="text-primary-navy/40 hover:text-secondary-gold transition-colors">
            <MessageCircle size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-primary-navy/40 font-bold">
          © Al-Nakheel Luxury Chalet. 2024
        </p>
      </footer>

      {/* Floating Book Now */}
      <button 
        onClick={onBookNow}
        className="fixed bottom-[104px] right-[24px] z-[60] flex items-center gap-2 bg-secondary-gold text-primary-navy px-6 py-3.5 rounded-[20px] shadow-[0px_10px_25px_rgba(212,175,55,0.3)] hover:scale-105 transition-transform active:scale-95"
      >
        <CalendarIcon size={20} />
        <span className="font-bold text-sm tracking-wide">Book Now</span>
      </button>
    </div>
  );
};
