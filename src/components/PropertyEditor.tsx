import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, X, Plus, Save, Check, Calendar, Tag, Percent, Landmark, Sun } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { migratePricing, type PricingSettings } from '../services/pricingUtils';

interface GalleryImage { url: string; label: string; }

interface PropertyDetails {
  name: string;
  capacity: number;
  area_sqm: number;
  nightly_rate: number;
  headline: string;
  description: string;
  features: string[];
  gallery: GalleryImage[];
  pricing: PricingSettings;
  bank_name: string;
  account_name: string;
  iban: string;
  bankPhone: string;
}

const DEFAULT_PRICING: PricingSettings = {
  sunday_rate: 120,
  monday_rate: 120,
  tuesday_rate: 120,
  wednesday_rate: 120,
  thursday_rate: 140,
  friday_rate: 180,
  saturday_rate: 150,
  day_use_rate: 70,
  security_deposit: 50,
  special_dates: [],
  discount: { enabled: false, type: 'percent', value: 10, start_date: '', end_date: '' },
};

const DEFAULT_DATA: PropertyDetails = {
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
  pricing: DEFAULT_PRICING,
  bank_name: 'Bank Muscat',
  account_name: 'Al-Nakheel Luxury Properties LLC',
  iban: 'OM12 0123 0000 0012 3456 789',
  bankPhone: '',
};

const inputClass = "w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none";

export const PropertyEditor: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyDetails>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // Special date form
  const [specialDate, setSpecialDate] = useState('');
  const [specialPrice, setSpecialPrice] = useState('');

  // Helpers to update pricing sub-object
  const setPricing = (patch: Partial<PricingSettings>) =>
    setForm(prev => ({ ...prev, pricing: { ...prev.pricing, ...patch } }));

  const setDiscount = (patch: Partial<NonNullable<PricingSettings['discount']>>) =>
    setForm(prev => ({
      ...prev,
      pricing: { ...prev.pricing, discount: { ...prev.pricing.discount!, ...patch } },
    }));

  useEffect(() => {
    getDoc(doc(db, 'settings', 'property_details'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data() as Partial<PropertyDetails>;
          setForm({
            ...DEFAULT_DATA,
            ...data,
            pricing: { ...DEFAULT_PRICING, ...migratePricing(data.pricing || {}) },
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'property_details'), form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  // Cloudinary upload
  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) { reject(new Error('Cloudinary not configured')); return; }
      const fd = new FormData();
      fd.append('file', file as Blob);
      fd.append('upload_preset', 'receipts_preset');
      fd.append('folder', 'alnakheel-property');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).secure_url);
        else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => { setUploadProgress(null); reject(new Error('Upload failed')); };
      xhr.send(fd);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, gallery: [...prev.gallery, { url, label: newLabel || `Image ${prev.gallery.length + 1}` }] }));
      setNewLabel('');
    } catch (err) { console.error('Upload error:', err); }
    finally { setUploading(false); }
    e.target.value = '';
  };

  const removeImage = (i: number) => setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, j) => j !== i) }));

  const addFeature = () => {
    const t = newFeature.trim();
    if (t && !form.features.includes(t)) { setForm(prev => ({ ...prev, features: [...prev.features, t] })); setNewFeature(''); }
  };
  const removeFeature = (i: number) => setForm(prev => ({ ...prev, features: prev.features.filter((_, j) => j !== i) }));

  const addSpecialDate = () => {
    if (!specialDate || !specialPrice) return;
    const price = parseFloat(specialPrice);
    if (isNaN(price) || price <= 0) return;
    setPricing({ special_dates: [...form.pricing.special_dates.filter(s => s.date !== specialDate), { date: specialDate, price }] });
    setSpecialDate('');
    setSpecialPrice('');
  };

  const removeSpecialDate = (date: string) =>
    setPricing({ special_dates: form.pricing.special_dates.filter(s => s.date !== date) });

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-primary-navy/50 hover:text-primary-navy transition-colors text-xs font-bold uppercase tracking-wider mb-3">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase">Property Management</span>
        <h1 className="font-headline text-2xl font-bold text-primary-navy mt-1">Edit Property</h1>
      </div>

      {/* Media Gallery */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Media Gallery</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.gallery.map((img, i) => (
            <div key={i} className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-primary-navy/5">
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <button onClick={() => removeImage(i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full shadow-lg"><X size={14} className="text-red-500" /></button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs font-bold truncate">{img.label}</p>
              </div>
            </div>
          ))}
          <label className="aspect-[4/5] rounded-xl border-2 border-dashed border-primary-navy/15 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-secondary-gold/50 hover:bg-secondary-gold/[0.02] transition-all">
            {uploading ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-navy/20 border-t-secondary-gold rounded-full animate-spin mx-auto mb-2" />
                {uploadProgress !== null && <p className="text-[10px] font-bold text-primary-navy/40">{uploadProgress}%</p>}
              </div>
            ) : (
              <>
                <Upload size={20} className="text-primary-navy/25" />
                <span className="text-[10px] font-bold text-primary-navy/30 uppercase tracking-wider">Add Image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label for next upload (optional)" className="flex-1 bg-pearl-white border border-primary-navy/10 rounded-xl py-2.5 px-4 text-xs placeholder:text-primary-navy/25 focus:ring-1 focus:ring-secondary-gold/50 outline-none" />
        </div>
      </section>

      {/* Property Details */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Property Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Property Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Capacity (Guests)</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Area (m²)</label>
            <input type="number" value={form.area_sqm} onChange={(e) => setForm(prev => ({ ...prev, area_sqm: parseInt(e.target.value) || 0 }))} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Dynamic Pricing — Day-of-Week Rates */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-secondary-gold" />
          <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Dynamic Pricing</h3>
        </div>

        <p className="text-[10px] text-primary-navy/40 font-medium mb-1">
          Set the nightly rate for each day of the week. Each night is charged based on the check-in day.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {([
            ['sunday_rate', 'Sun'],
            ['monday_rate', 'Mon'],
            ['tuesday_rate', 'Tue'],
            ['wednesday_rate', 'Wed'],
            ['thursday_rate', 'Thu'],
            ['friday_rate', 'Fri'],
            ['saturday_rate', 'Sat'],
          ] as [keyof PricingSettings, string][]).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">{label} (OMR)</label>
              <input type="number" value={form.pricing[key] as number} onChange={(e) => setPricing({ [key]: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
          ))}
        </div>

        {/* Day Use Rate */}
        <div className="pt-4 border-t border-primary-navy/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold flex items-center gap-1.5">
                <Sun size={12} /> Day Use Rate (OMR)
              </label>
              <input type="number" value={form.pricing.day_use_rate} onChange={(e) => setPricing({ day_use_rate: parseInt(e.target.value) || 0 })} className={inputClass} />
              <p className="text-[10px] text-primary-navy/40 font-medium">Applied when check-in and check-out are on the same date (e.g. 12 PM – 10 PM).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Security Deposit — Refundable (OMR)</label>
              <input type="number" value={form.pricing.security_deposit} onChange={(e) => setPricing({ security_deposit: parseInt(e.target.value) || 0 })} className={inputClass} />
              <p className="text-[10px] text-primary-navy/40 font-medium">Collected at booking, refunded after checkout. Excluded from revenue/tax.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Date Overrides */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-secondary-gold" />
          <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Holiday / Special Date Overrides</h3>
        </div>

        {form.pricing.special_dates.length > 0 && (
          <div className="space-y-2">
            {form.pricing.special_dates
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(s => (
              <div key={s.date} className="flex items-center justify-between bg-pearl-white rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary-navy">
                    {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-secondary-gold font-headline">{s.price} OMR</span>
                  <button onClick={() => removeSpecialDate(s.date)} className="text-primary-navy/20 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">Date</label>
            <input type="date" value={specialDate} onChange={(e) => setSpecialDate(e.target.value)} className={inputClass} />
          </div>
          <div className="w-32 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">Price (OMR)</label>
            <input type="number" value={specialPrice} onChange={(e) => setSpecialPrice(e.target.value)} placeholder="250" className={inputClass} />
          </div>
          <button
            onClick={addSpecialDate}
            disabled={!specialDate || !specialPrice}
            className="px-4 py-3 bg-primary-navy/5 rounded-xl text-primary-navy/60 hover:bg-primary-navy/10 transition-colors disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* Discount Rules */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent size={16} className="text-secondary-gold" />
            <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Discount Rules</h3>
          </div>
          <button
            onClick={() => setDiscount({ enabled: !form.pricing.discount?.enabled })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              form.pricing.discount?.enabled ? "bg-secondary-gold" : "bg-primary-navy/15"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
              form.pricing.discount?.enabled ? "translate-x-6" : "translate-x-0.5"
            )} />
          </button>
        </div>

        {form.pricing.discount?.enabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscount({ type: 'percent' })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      form.pricing.discount.type === 'percent' ? "bg-primary-navy text-white" : "bg-pearl-white text-primary-navy/50 border border-primary-navy/10"
                    )}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => setDiscount({ type: 'flat' })}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      form.pricing.discount.type === 'flat' ? "bg-primary-navy text-white" : "bg-pearl-white text-primary-navy/50 border border-primary-navy/10"
                    )}
                  >
                    Flat (OMR)
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">
                  {form.pricing.discount.type === 'percent' ? 'Discount (%)' : 'Discount (OMR)'}
                </label>
                <input
                  type="number"
                  value={form.pricing.discount.value}
                  onChange={(e) => setDiscount({ value: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">Start Date</label>
                <input type="date" value={form.pricing.discount.start_date} onChange={(e) => setDiscount({ start_date: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/40">End Date</label>
                <input type="date" value={form.pricing.discount.end_date} onChange={(e) => setDiscount({ end_date: e.target.value })} className={inputClass} />
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Bank Transfer Details */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-secondary-gold" />
          <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Bank Transfer Details</h3>
        </div>
        <p className="text-[10px] text-primary-navy/40 font-medium">
          These details are shown to guests who choose bank transfer as their payment method.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Bank Name</label>
            <input type="text" value={form.bank_name} onChange={(e) => setForm(prev => ({ ...prev, bank_name: e.target.value }))} placeholder="e.g. Bank Muscat" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Account Name</label>
            <input type="text" value={form.account_name} onChange={(e) => setForm(prev => ({ ...prev, account_name: e.target.value }))} placeholder="e.g. Al-Nakheel LLC" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">IBAN / Account Number</label>
            <input type="text" value={form.iban} onChange={(e) => setForm(prev => ({ ...prev, iban: e.target.value }))} placeholder="e.g. OM12 0123 ..." className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Phone Number (for Mobile Transfer)</label>
            <input type="text" value={form.bankPhone} onChange={(e) => setForm(prev => ({ ...prev, bankPhone: e.target.value }))} placeholder="e.g. +968 9000 0000" className={inputClass} />
            <p className="text-[10px] text-primary-navy/40 font-medium">Shown to guests for WhatsApp/bank app transfers. Leave blank to hide.</p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Description</h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Section Headline</label>
          <input type="text" value={form.headline} onChange={(e) => setForm(prev => ({ ...prev, headline: e.target.value }))} placeholder="e.g. Curated Excellence" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Summary Text</label>
          <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className={cn(inputClass, "leading-relaxed resize-none")} />
        </div>
      </section>

      {/* Features */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Features</h3>
        <div className="flex flex-wrap gap-2">
          {form.features.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-pearl-white border border-primary-navy/10 rounded-full px-3 py-1.5 text-xs font-bold text-primary-navy">
              {f}
              <button onClick={() => removeFeature(i)} className="text-primary-navy/30 hover:text-red-500 transition-colors"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFeature()} placeholder="Add a feature (e.g. Pool, WiFi)" className="flex-1 bg-pearl-white border border-primary-navy/10 rounded-xl py-2.5 px-4 text-xs placeholder:text-primary-navy/25 focus:ring-1 focus:ring-secondary-gold/50 outline-none" />
          <button onClick={addFeature} disabled={!newFeature.trim()} className="px-4 py-2.5 bg-primary-navy/5 rounded-xl text-primary-navy/60 hover:bg-primary-navy/10 transition-colors disabled:opacity-30">
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end gap-3 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
              <Check size={16} /> Changes saved
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary-navy text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-primary-navy/20">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
