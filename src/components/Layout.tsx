import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  ReceiptText, 
  BarChart3,
  Menu,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { View } from '@/src/types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'guests', label: 'Guests', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: ReceiptText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-primary-navy text-white h-screen sticky top-0 py-8 px-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tighter uppercase">Al-Nakheel</h1>
          <p className="text-[10px] font-lato uppercase tracking-widest text-white/50 font-bold">Management Portal</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-lato uppercase text-xs font-bold tracking-wider",
                currentView === item.id 
                  ? "bg-white/10 text-secondary-gold border-r-4 border-secondary-gold translate-x-1" 
                  : "text-white/60 hover:bg-white/5 hover:text-secondary-gold"
              )}
            >
              <item.icon size={18} fill={currentView === item.id ? "currentColor" : "none"} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto space-y-4 pt-6 border-t border-white/10">
          <button className="flex items-center gap-3 text-white/60 text-xs font-bold uppercase tracking-wider hover:text-secondary-gold transition-colors">
            <span className="material-symbols-outlined text-sm">settings</span>
            Settings
          </button>
          <button className="flex items-center gap-3 text-white/60 text-xs font-bold uppercase tracking-wider hover:text-secondary-gold transition-colors">
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-pearl-white/80 backdrop-blur-xl border-b border-primary-navy/5 h-16 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-full hover:bg-primary-navy/5">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold tracking-[0.15em] uppercase font-headline md:hidden">Al-Nakheel</h2>
            <h2 className="hidden md:block text-xl font-bold font-headline capitalize">{currentView}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-primary-navy/5 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary-gold rounded-full border-2 border-pearl-white"></span>
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-primary-navy/10">
              <div className="text-right">
                <p className="text-xs font-bold">Ahmed Al-Said</p>
                <p className="text-[10px] text-primary-navy/50 uppercase font-bold">Curator</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-navy/10 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Bottom Nav for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe bg-pearl-white/90 backdrop-blur-xl border-t border-secondary-gold/10 shadow-[0_-4px_30px_rgba(1,31,54,0.05)] rounded-t-[20px]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300",
                currentView === item.id 
                  ? "text-secondary-gold scale-105" 
                  : "text-primary-navy/40"
              )}
            >
              <item.icon size={20} fill={currentView === item.id ? "currentColor" : "none"} />
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
