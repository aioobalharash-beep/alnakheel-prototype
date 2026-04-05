import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, X, Plus, Save, Check, Image as ImageIcon, GripVertical } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface GalleryImage {
  url: string;
  label: string;
}

interface PropertyDetails {
  name: string;
  capacity: number;
  area_sqm: number;
  nightly_rate: number;
  headline: string;
  description: string;
  features: string[];
  gallery: GalleryImage[];
}

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
};

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

  // Load from Firestore
  useEffect(() => {
    getDoc(doc(db, 'settings', 'property_details'))
      .then(snap => {
        if (snap.exists()) {
          setForm({ ...DEFAULT_DATA, ...snap.data() as PropertyDetails });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Save to Firestore
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

      const formData = new FormData();
      formData.append('file', file as Blob);
      formData.append('upload_preset', 'receipts_preset');
      formData.append('folder', 'alnakheel-property');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => { setUploadProgress(null); reject(new Error('Upload failed')); };
      xhr.send(formData);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({
        ...prev,
        gallery: [...prev.gallery, { url, label: newLabel || `Image ${prev.gallery.length + 1}` }],
      }));
      setNewLabel('');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && !form.features.includes(trimmed)) {
      setForm(prev => ({ ...prev, features: [...prev.features, trimmed] }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-primary-navy/50 hover:text-primary-navy transition-colors text-xs font-bold uppercase tracking-wider mb-3"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase">Property Management</span>
          <h1 className="font-headline text-2xl font-bold text-primary-navy mt-1">Edit Property</h1>
        </div>
      </div>

      {/* Media Gallery */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Media Gallery</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.gallery.map((img, i) => (
            <div key={i} className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-primary-navy/5">
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <button
                  onClick={() => removeImage(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full shadow-lg"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs font-bold truncate">{img.label}</p>
              </div>
            </div>
          ))}

          {/* Upload area */}
          <label className="aspect-[4/5] rounded-xl border-2 border-dashed border-primary-navy/15 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-secondary-gold/50 hover:bg-secondary-gold/[0.02] transition-all">
            {uploading ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-navy/20 border-t-secondary-gold rounded-full animate-spin mx-auto mb-2" />
                {uploadProgress !== null && (
                  <p className="text-[10px] font-bold text-primary-navy/40">{uploadProgress}%</p>
                )}
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
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label for next upload (optional)"
            className="flex-1 bg-pearl-white border border-primary-navy/10 rounded-xl py-2.5 px-4 text-xs placeholder:text-primary-navy/25 focus:ring-1 focus:ring-secondary-gold/50 outline-none"
          />
        </div>
      </section>

      {/* Details */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Property Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Property Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Capacity (Guests)</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
              className="w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Area (m²)</label>
            <input
              type="number"
              value={form.area_sqm}
              onChange={(e) => setForm(prev => ({ ...prev, area_sqm: parseInt(e.target.value) || 0 }))}
              className="w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Nightly Rate (OMR)</label>
          <input
            type="number"
            value={form.nightly_rate}
            onChange={(e) => setForm(prev => ({ ...prev, nightly_rate: parseInt(e.target.value) || 0 }))}
            className="w-full sm:w-48 bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none"
          />
        </div>
      </section>

      {/* Description */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Description</h3>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Section Headline</label>
          <input
            type="text"
            value={form.headline}
            onChange={(e) => setForm(prev => ({ ...prev, headline: e.target.value }))}
            placeholder="e.g. Curated Excellence"
            className="w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm font-medium focus:ring-1 focus:ring-secondary-gold/50 outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Summary Text</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full bg-pearl-white border border-primary-navy/10 rounded-xl py-3 px-4 text-sm leading-relaxed resize-none focus:ring-1 focus:ring-secondary-gold/50 outline-none"
          />
        </div>
      </section>

      {/* Features */}
      <section className="bg-white rounded-[20px] p-6 border border-primary-navy/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-primary-navy uppercase tracking-wide">Features</h3>

        <div className="flex flex-wrap gap-2">
          {form.features.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 bg-pearl-white border border-primary-navy/10 rounded-full px-3 py-1.5 text-xs font-bold text-primary-navy"
            >
              {f}
              <button onClick={() => removeFeature(i)} className="text-primary-navy/30 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
            placeholder="Add a feature (e.g. Pool, WiFi)"
            className="flex-1 bg-pearl-white border border-primary-navy/10 rounded-xl py-2.5 px-4 text-xs placeholder:text-primary-navy/25 focus:ring-1 focus:ring-secondary-gold/50 outline-none"
          />
          <button
            onClick={addFeature}
            disabled={!newFeature.trim()}
            className="px-4 py-2.5 bg-primary-navy/5 rounded-xl text-primary-navy/60 hover:bg-primary-navy/10 transition-colors disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 text-emerald-600 text-sm font-bold"
            >
              <Check size={16} />
              Changes saved
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-navy text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-primary-navy/20"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
