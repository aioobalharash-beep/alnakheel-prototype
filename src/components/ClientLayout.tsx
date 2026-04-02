import React from 'react';
import { Home, Calendar as CalendarIcon, LogIn, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { View, Mode } from '@/src/types';

interface ClientLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onModeToggle: () => void;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children, currentView, onViewChange, onModeToggle }) => {
  const navItems = [
    { id: 'sanctuary', label: 'Home', icon: Home },
    { id: 'booking', label: 'Bookings', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen bg-pearl-white flex flex-col">
      {/* Client Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-pearl-white/90 backdrop-blur-xl shadow-[0px_10px_30px_rgba(1,31,54,0.04)] px-6 h-16 flex items-center justify-between">
        <h1 className="font-headline text-xl font-bold text-primary-navy tracking-widest uppercase">Al-Nakheel</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={onModeToggle}
            className="p-2 rounded-full hover:bg-primary-navy/5 text-primary-navy/40 transition-colors"
            title="Switch to Admin Portal"
          >
            <ShieldCheck size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-primary-navy/5 text-primary-navy transition-colors">
            <LogIn size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-32">
        {children}
      </main>

      {/* Client Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-12 bg-pearl-white border-t border-primary-navy/5 shadow-[0px_-10px_40px_rgba(1,31,54,0.06)] rounded-t-[20px]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300",
              currentView === item.id || (currentView === 'confirmation' && item.id === 'booking')
                ? "text-secondary-gold font-bold scale-105" 
                : "text-primary-navy/40"
            )}
          >
            <item.icon size={24} fill={currentView === item.id ? "currentColor" : "none"} />
            <span className="text-[11px] font-medium tracking-wide mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
