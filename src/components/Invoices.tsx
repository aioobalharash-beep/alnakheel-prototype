import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Hourglass, FileText, Receipt, Maximize, Download, Send } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Invoices: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Summary Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:col-span-2 bg-primary-navy p-6 rounded-[20px] text-white flex flex-col justify-between h-40 shadow-xl shadow-primary-navy/20"
        >
          <div>
            <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Total Outstanding</p>
            <h2 className="font-headline text-3xl mt-2">OMR 12,450.00</h2>
          </div>
          <div className="flex items-center gap-2 text-secondary-gold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-bold">+4.2% from last month</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-[20px] flex flex-col gap-3 shadow-sm border border-primary-navy/5"
        >
          <CheckCircle2 className="text-secondary-gold" size={24} />
          <div>
            <p className="text-primary-navy/50 text-[10px] uppercase tracking-wider font-bold">Invoice Health</p>
            <p className="text-xl font-headline text-primary-navy mt-1">94.2%</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-[20px] flex flex-col gap-3 shadow-sm border border-primary-navy/5"
        >
          <Hourglass className="text-primary-navy/60" size={24} />
          <div>
            <p className="text-primary-navy/50 text-[10px] uppercase tracking-wider font-bold">Awaiting Action</p>
            <p className="text-xl font-headline text-primary-navy mt-1">18 Items</p>
          </div>
        </motion.div>
      </section>

      {/* Pending Invoices */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="font-headline text-xl text-primary-navy font-bold">Pending Invoices</h3>
            <p className="text-primary-navy/50 text-xs font-medium">Awaiting VAT compliance processing</p>
          </div>
          <button className="text-secondary-gold text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Ahmed Al-Said', ref: '#NK-8829', type: 'Deluxe Villa', amount: '840.00', color: 'border-secondary-gold' },
            { name: 'Salma bin Rashid', ref: '#NK-9012', type: 'Ocean Suite', amount: '1,220.50', color: 'border-primary-navy/20' },
          ].map((inv, i) => (
            <motion.div 
              key={inv.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn("bg-white p-6 rounded-[20px] border-l-4 shadow-sm space-y-4", inv.color)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-primary-navy">{inv.name}</h4>
                  <p className="text-primary-navy/50 text-xs font-medium">Booking {inv.ref} • {inv.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-lg text-primary-navy font-bold">OMR {inv.amount}</p>
                </div>
              </div>
              <button className="w-full bg-primary-navy py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform">
                <FileText size={14} />
                Generate VAT-Compliant Invoice
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Preview */}
      <section className="space-y-4">
        <h3 className="font-headline text-xl text-primary-navy font-bold px-1">Active Preview</h3>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] overflow-hidden shadow-2xl shadow-primary-navy/5 border border-primary-navy/5"
        >
          <div className="bg-surface-container-low p-6 border-b border-primary-navy/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-navy flex items-center justify-center rounded-lg">
                <Receipt className="text-secondary-gold" size={20} />
              </div>
              <div>
                <p className="font-headline text-sm font-bold">Tax Invoice #INV-2024-001</p>
                <p className="text-[10px] text-primary-navy/50 uppercase tracking-widest font-bold">Digital Draft</p>
              </div>
            </div>
            <button className="p-2 hover:bg-primary-navy/5 rounded-full"><Maximize size={20} className="text-primary-navy/40" /></button>
          </div>
          
          <div className="p-8 space-y-8 font-body text-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-bold text-primary-navy text-base uppercase tracking-tight">AL-NAKHEEL LUXURY PROPERTIES</p>
                <p className="text-xs text-primary-navy/50 font-medium">Tax ID: 1009283746</p>
                <p className="text-xs text-primary-navy/50 font-medium">Muscat, Sultanate of Oman</p>
              </div>
              <div className="text-right text-[10px] uppercase font-bold tracking-widest text-secondary-gold bg-secondary-gold/10 px-2 py-1 rounded">
                VAT COMPLIANT
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-6 border-y border-primary-navy/5">
              <div>
                <p className="text-[10px] text-primary-navy/40 uppercase font-bold mb-1 tracking-wider">Billed To</p>
                <p className="font-bold text-primary-navy">Khalid Al-Harthy</p>
                <p className="text-xs text-primary-navy/50 font-medium">Muscat Hills, Block 4</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-primary-navy/40 uppercase font-bold mb-1 tracking-wider">Issue Date</p>
                <p className="font-bold text-primary-navy">24 Oct 2023</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-primary-navy/40 border-b border-primary-navy/5">
                  <th className="text-left py-3 font-bold">Description</th>
                  <th className="text-right py-3 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="text-primary-navy">
                <tr>
                  <td className="py-4 font-medium">Stay Charges - Royal Suite (3 Nights)</td>
                  <td className="text-right font-headline font-bold">OMR 1,200.00</td>
                </tr>
                <tr>
                  <td className="py-4 font-medium">Private Chef Services</td>
                  <td className="text-right font-headline font-bold">OMR 150.00</td>
                </tr>
                <tr className="border-t border-primary-navy/5">
                  <td className="pt-6 pb-2 text-[10px] uppercase font-bold text-primary-navy/40">Subtotal</td>
                  <td className="pt-6 pb-2 text-right font-headline font-bold">OMR 1,350.00</td>
                </tr>
                <tr>
                  <td className="py-1 text-[10px] uppercase font-bold text-primary-navy/40">VAT (5%)</td>
                  <td className="py-1 text-right font-headline font-bold">OMR 67.50</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-base">Grand Total</td>
                  <td className="py-4 text-right font-headline text-xl text-secondary-gold font-bold">OMR 1,417.50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-surface-container-high flex gap-3">
            <button className="flex-1 border border-primary-navy/20 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-primary-navy hover:bg-white transition-colors">
              Download PDF
            </button>
            <button className="flex-1 bg-primary-navy py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white shadow-lg shadow-primary-navy/20 flex items-center justify-center gap-2">
              <Send size={14} />
              Approve & Send
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
