import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Hourglass, FileText, Receipt, Maximize, Send, Download, MessageCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { invoicesApi } from '../services/api';
import { downloadInvoicePDF, shareInvoiceViaWhatsApp } from '../services/pdf';
import type { Invoice } from '../types';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({ outstanding: 0, healthRate: 0, awaitingAction: 0 });
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    Promise.all([
      invoicesApi.list(),
      invoicesApi.stats(),
    ]).then(([invoiceData, statsData]) => {
      setInvoices(invoiceData);
      setStats(statsData);
      // Load the first paid+vat_compliant invoice for preview
      const vatInvoice = invoiceData.find((inv: Invoice) => inv.vat_compliant);
      if (vatInvoice) {
        invoicesApi.get(vatInvoice.id).then(setPreviewInvoice);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateVAT = async (invoiceId: string) => {
    try {
      const updated = await invoicesApi.update(invoiceId, { vat_compliant: true });
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, vat_compliant: true } : inv));
      setPreviewInvoice(updated);
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    try {
      await invoicesApi.update(invoiceId, { status: 'paid' });
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'paid' } : inv));
    } catch (err) {
      console.error('Failed to approve invoice:', err);
    }
  };

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;

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
            <h2 className="font-headline text-3xl mt-2">OMR {stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="flex items-center gap-2 text-secondary-gold">
            <span className="text-xs font-bold">{pendingInvoices.length} invoices pending</span>
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
            <p className="text-xl font-headline text-primary-navy mt-1">{stats.healthRate}%</p>
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
            <p className="text-xl font-headline text-primary-navy mt-1">{stats.awaitingAction} Items</p>
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
          {pendingInvoices.slice(0, 4).map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "bg-white p-6 rounded-[20px] border-l-4 shadow-sm space-y-4",
                i === 0 ? "border-secondary-gold" : "border-primary-navy/20"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-primary-navy">{inv.guest_name}</h4>
                  <p className="text-primary-navy/50 text-xs font-medium">Booking {inv.booking_ref} &bull; {inv.room_type}</p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-lg text-primary-navy font-bold">OMR {inv.total_amount.toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    inv.status === 'overdue' ? "text-red-500" : "text-amber-500"
                  )}>{inv.status}</span>
                </div>
              </div>
              <button
                onClick={() => handleGenerateVAT(inv.id)}
                className="w-full bg-primary-navy py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform"
              >
                <FileText size={14} />
                {inv.vat_compliant ? 'VAT Compliant' : 'Generate VAT-Compliant Invoice'}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Preview */}
      {previewInvoice && (
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
                  <p className="font-headline text-sm font-bold">Tax Invoice #{previewInvoice.id.slice(0, 8).toUpperCase()}</p>
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
                  <p className="font-bold text-primary-navy">{previewInvoice.guest_name}</p>
                  <p className="text-xs text-primary-navy/50 font-medium">{previewInvoice.room_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-primary-navy/40 uppercase font-bold mb-1 tracking-wider">Issue Date</p>
                  <p className="font-bold text-primary-navy">{new Date(previewInvoice.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                  {previewInvoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-4 font-medium">{item.description}</td>
                      <td className="text-right font-headline font-bold">OMR {item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-primary-navy/5">
                    <td className="pt-6 pb-2 text-[10px] uppercase font-bold text-primary-navy/40">Subtotal</td>
                    <td className="pt-6 pb-2 text-right font-headline font-bold">OMR {previewInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-[10px] uppercase font-bold text-primary-navy/40">VAT (5%)</td>
                    <td className="py-1 text-right font-headline font-bold">OMR {previewInvoice.vat_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-base">Grand Total</td>
                    <td className="py-4 text-right font-headline text-xl text-secondary-gold font-bold">OMR {previewInvoice.total_amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-surface-container-high space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => previewInvoice && downloadInvoicePDF(previewInvoice)}
                  className="flex-1 border border-primary-navy/20 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-primary-navy hover:bg-white transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowWhatsApp(!showWhatsApp)}
                  className="flex-1 border border-emerald-300 bg-emerald-50 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} />
                  Share via WhatsApp
                </button>
              </div>

              {showWhatsApp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-2"
                >
                  <div className="bg-white rounded-xl py-3 px-3 text-sm font-bold text-primary-navy/60 border border-primary-navy/10">+968</div>
                  <input
                    type="text"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Guest phone number"
                    maxLength={8}
                    className="flex-1 bg-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm placeholder:text-primary-navy/30"
                  />
                  <button
                    onClick={() => {
                      if (previewInvoice && whatsAppPhone.length === 8) {
                        shareInvoiceViaWhatsApp(previewInvoice, `968${whatsAppPhone}`);
                      }
                    }}
                    disabled={whatsAppPhone.length !== 8}
                    className="px-5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                  >
                    Send
                  </button>
                </motion.div>
              )}

              <button
                onClick={() => previewInvoice && handleApprove(previewInvoice.id)}
                className="w-full bg-primary-navy py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white shadow-lg shadow-primary-navy/20 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Approve & Send
              </button>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
};
