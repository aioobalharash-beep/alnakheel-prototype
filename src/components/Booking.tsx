import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck, AlertCircle, ArrowLeft, Upload, CreditCard, Building2, Check, FileText, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { propertiesApi, bookingsApi } from '../services/api';
import { sendWhatsAppInvoice } from './Invoices';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateTotalPrice, formatBreakdown, migratePricing, formatTime, getSlotRateForDay, type PricingSettings, type PriceBreakdown, type DayUseSlot } from '../services/pricingUtils';
import type { Property } from '../types';

export const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedDates, setSelectedDates] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [paymentMethod, setPaymentMethod] = useState<'thawani' | 'bank_transfer'>('thawani');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Booked dates from Firestore (real-time)
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  // Maintenance mode — blocks all bookings when admin toggles off
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Dynamic pricing from Firestore
  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null);

  // Dynamic bank details from Firestore
  const [bankDetails, setBankDetails] = useState({ bank_name: 'Bank Muscat', account_name: 'Al-Nakheel Luxury Properties LLC', iban: 'OM12 0123 0000 0012 3456 789', bankPhone: '' });

  // Day-use slots
  const [dayUseSlots, setDayUseSlots] = useState<DayUseSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DayUseSlot | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Map<string, string[]>>(new Map());

  // Thawani simulation state
  const [thawaniSimulating, setThawaniSimulating] = useState(false);

  // Terms of Stay
  const [termsOfStay, setTermsOfStay] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsNudge, setTermsNudge] = useState(false);

  useEffect(() => {
    propertiesApi.list()
      .then(properties => {
        if (properties.length > 0) setProperty(properties[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Real-time listener for existing bookings to prevent double-booking
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dates = new Set<string>();
      const slotMap = new Map<string, string[]>();

      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.status === 'cancelled') return;

        const bIsDayUse = data.check_in === data.check_out;

        if (bIsDayUse && data.slot_id) {
          // Slot-based day-use: only block that slot, not the whole day
          const existing = slotMap.get(data.check_in) || [];
          existing.push(data.slot_id);
          slotMap.set(data.check_in, existing);
        } else {
          // Overnight or non-slot day-use: block entire days
          const checkIn = new Date(data.check_in);
          const checkOut = new Date(data.check_out);
          const cursor = new Date(checkIn);
          while (cursor <= checkOut) {
            dates.add(cursor.toISOString().split('T')[0]);
            cursor.setDate(cursor.getDate() + 1);
          }
        }
      });
      setBookedDates(dates);
      setBookedSlots(slotMap);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for property availability status
  useEffect(() => {
    const ref = doc(db, 'settings', 'property_status');
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMaintenanceMode(snap.data().is_live === false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load dynamic pricing settings + bank details
  useEffect(() => {
    getDoc(doc(db, 'settings', 'property_details'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.pricing) {
            const migrated = migratePricing(data.pricing);
            setPricingSettings(migrated);
            if (migrated.day_use_slots?.length) setDayUseSlots(migrated.day_use_slots);
          }
          if (data.bank_name || data.account_name || data.iban) {
            setBankDetails(prev => ({
              bank_name: data.bank_name || prev.bank_name,
              account_name: data.account_name || prev.account_name,
              iban: data.iban || prev.iban,
              bankPhone: data.bankPhone || '',
            }));
          }
          if (data.termsOfStay) {
            setTermsOfStay(data.termsOfStay);
          }
        }
      })
      .catch(console.error);
  }, []);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDayBooked = (day: number): boolean => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (bookedDates.has(dateStr)) return true;
    // If slots exist and ALL are taken for this day, it's fully booked
    if (dayUseSlots.length > 0) {
      const takenSlots = bookedSlots.get(dateStr) || [];
      if (takenSlots.length >= dayUseSlots.length) return true;
    }
    return false;
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    if (clickedDate < today) return;
    if (isDayBooked(day)) return;
    setSelectedSlot(null);

    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      setSelectedDates({ start: day, end: null });
    } else if (day === selectedDates.start) {
      // Same day clicked twice → Day Use
      setSelectedDates({ start: day, end: day });
    } else {
      // Check if any day in the range is booked
      const rangeStart = Math.min(day, selectedDates.start);
      const rangeEnd = Math.max(day, selectedDates.start);
      let hasConflict = false;
      for (let d = rangeStart; d <= rangeEnd; d++) {
        if (isDayBooked(d)) { hasConflict = true; break; }
      }
      if (hasConflict) {
        setErrors(prev => ({ ...prev, dates: 'Selected range includes unavailable dates' }));
        setSelectedDates({ start: day, end: null });
        return;
      }

      if (day > selectedDates.start) {
        setSelectedDates({ ...selectedDates, end: day });
      } else {
        setSelectedDates({ start: day, end: selectedDates.start });
      }
    }
    setErrors(prev => ({ ...prev, dates: '' }));
  };

  const isDayUse = selectedDates.start !== null && selectedDates.end !== null && selectedDates.start === selectedDates.end;
  const nights = selectedDates.start && selectedDates.end ? selectedDates.end - selectedDates.start : 0;
  const securityDeposit = pricingSettings?.security_deposit ?? property?.security_deposit ?? 50;

  // Available slots for selected day-use date
  const availableSlots = isDayUse && selectedDates.start !== null
    ? dayUseSlots.filter(slot => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.start).padStart(2, '0')}`;
        const taken = bookedSlots.get(dateStr) || [];
        return !taken.includes(slot.id);
      })
    : [];

  // Dynamic pricing breakdown
  const priceBreakdown: PriceBreakdown | null = (() => {
    if (selectedDates.start === null || selectedDates.end === null) return null;
    if (!isDayUse && !nights) return null;
    // Wait for slot selection when slots are defined
    if (isDayUse && dayUseSlots.length > 0 && !selectedSlot) return null;
    const checkInStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.start).padStart(2, '0')}`;
    const checkOutStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.end).padStart(2, '0')}`;
    const fallbackRate = property?.nightly_rate || 120;
    const pricing: PricingSettings = pricingSettings || migratePricing({
      weekday_rate: fallbackRate,
      thursday_rate: fallbackRate,
      friday_rate: fallbackRate,
      saturday_rate: fallbackRate,
      day_use_rate: Math.round(fallbackRate * 0.6),
      special_dates: [],
    });
    return calculateTotalPrice(checkInStr, checkOutStr, pricing, selectedSlot?.id);
  })();

  const stayTotal = priceBreakdown?.total || 0;
  const depositAmount = Number(securityDeposit) || 0;
  const grandTotal = stayTotal + depositAmount;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!guestName.trim() || guestName.trim().length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)';
    }

    const phoneClean = guestPhone.replace(/\s/g, '');
    if (!phoneClean) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{8}$/.test(phoneClean)) {
      newErrors.phone = 'Please enter a valid 8-digit Omani phone number';
    }

    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!selectedDates.start || !selectedDates.end) {
      newErrors.dates = 'Please select check-in and check-out dates';
    }

    if (isDayUse && dayUseSlots.length > 0 && !selectedSlot) {
      newErrors.slot = 'Please select a time slot';
    }

    if (paymentMethod === 'bank_transfer' && !receiptFile) {
      newErrors.receipt = 'Please upload your bank transfer receipt';
    }

    if (termsOfStay && !termsAccepted) {
      newErrors.terms = 'Please accept the terms to proceed';
      setTermsNudge(true);
      setTimeout(() => setTermsNudge(false), 600);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptFileName(file.name);
    setErrors(prev => ({ ...prev, receipt: '' }));
  };

  // Upload to Cloudinary with progress tracking and auto-optimization
  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

      if (!cloudName) {
        reject(new Error('Cloudinary cloud name is not configured'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file as Blob);
      formData.append('upload_preset', 'receipts_preset');
      formData.append('folder', 'alnakheel-receipts');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.secure_url);
        } else {
          let errorDetail = 'Upload failed';
          try {
            const errRes = JSON.parse(xhr.responseText);
            errorDetail = errRes.error?.message || JSON.stringify(errRes);
            console.error('Cloudinary Error Details:', errRes);
          } catch {
            console.error('Cloudinary Error Details:', xhr.status, xhr.responseText);
          }
          reject(new Error(errorDetail));
        }
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        console.error('Cloudinary Error Details: Network error - request failed');
        reject(new Error('Network error — please check your connection'));
      };
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (!validate() || !property || selectedDates.start === null || selectedDates.end === null) return;

    setSubmitting(true);
    setSubmitError('');

    const checkIn = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.start).padStart(2, '0')}`;
    const checkOut = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.end).padStart(2, '0')}`;

    try {
      // Upload receipt to Cloudinary if bank transfer
      let receiptURL: string | undefined;
      if (paymentMethod === 'bank_transfer' && receiptFile) {
        try {
          receiptURL = await uploadToCloudinary(receiptFile);
        } catch (uploadErr: any) {
          console.error('Receipt upload failed:', uploadErr.message);
          setSubmitError(`Receipt upload failed: ${uploadErr.message}. Please try again.`);
          setSubmitting(false);
          return;
        }
      }

      // Thawani — simulate payment gateway for prototype demo
      if (paymentMethod === 'thawani') {
        setThawaniSimulating(true);

        // Simulate 2-second network delay (Thawani redirect)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Save booking to Firestore as paid
        const termsTimestamp = new Date().toISOString();
        const result = await bookingsApi.create({
          property_id: property.id,
          property_name: property.name,
          guest_name: guestName.trim(),
          guest_phone: `+968${guestPhone.replace(/\s/g, '')}`,
          guest_email: guestEmail || undefined,
          check_in: checkIn,
          check_out: checkOut,
          nightly_rate: priceBreakdown ? (isDayUse ? stayTotal : Math.round(stayTotal / nights)) : property.nightly_rate,
          security_deposit: depositAmount,
          stayTotal,
          depositAmount,
          grandTotal,
          payment_method: 'thawani',
          ...(selectedSlot ? {
            slot_id: selectedSlot.id,
            slot_name: selectedSlot.name,
            slot_start_time: selectedSlot.start_time,
            slot_end_time: selectedSlot.end_time,
          } : {}),
          ...(termsAccepted ? { termsAccepted: true, termsAcceptedAt: termsTimestamp } : {}),
        });

        setThawaniSimulating(false);

        sendWhatsAppInvoice({
          guest_name: guestName.trim(),
          guest_phone: `+968${guestPhone.replace(/\s/g, '')}`,
          id: result.booking.id,
        });

        navigate('/confirmation', {
          state: {
            booking: result.booking,
            propertyName: result.property_name,
          },
        });
        return;
      }

      // Bank transfer — save booking to Firestore
      const bankTermsTimestamp = new Date().toISOString();
      const result = await bookingsApi.create({
        property_id: property.id,
        property_name: property.name,
        guest_name: guestName.trim(),
        guest_phone: `+968${guestPhone.replace(/\s/g, '')}`,
        guest_email: guestEmail || undefined,
        check_in: checkIn,
        check_out: checkOut,
        nightly_rate: priceBreakdown ? (isDayUse ? stayTotal : Math.round(stayTotal / nights)) : property.nightly_rate,
        security_deposit: depositAmount,
        stayTotal,
        depositAmount,
        grandTotal,
        payment_method: paymentMethod,
        receiptURL,
        ...(selectedSlot ? {
          slot_id: selectedSlot.id,
          slot_name: selectedSlot.name,
          slot_start_time: selectedSlot.start_time,
          slot_end_time: selectedSlot.end_time,
        } : {}),
        ...(termsAccepted ? { termsAccepted: true, termsAcceptedAt: bankTermsTimestamp } : {}),
      });

      // Trigger WhatsApp invoice (will connect API next)
      sendWhatsAppInvoice({
        guest_name: guestName.trim(),
        guest_phone: `+968${guestPhone.replace(/\s/g, '')}`,
        id: result.booking.id,
      });

      navigate('/confirmation', {
        state: {
          booking: result.booking,
          propertyName: result.property_name,
        },
      });
    } catch (err: any) {
      console.error('Booking submission error:', err.response?.data || err.message || err);
      setSubmitError(err.message || 'Booking failed. Please try again.');
    } finally {
      setThawaniSimulating(false);
      setSubmitting(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDates({ start: null, end: null });
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDates({ start: null, end: null });
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="h-96 bg-primary-navy/5 rounded-xl" /></div>;

  return (
    <div className="p-6 space-y-10 max-w-lg mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-primary-navy/60 hover:text-primary-navy transition-colors text-sm font-medium"
      >
        <ArrowLeft size={18} />
        Back to Home
      </button>

      <section className="text-center space-y-2">
        <span className="text-secondary-gold font-bold tracking-widest text-[10px] uppercase">Reservation</span>
        <h2 className="font-headline text-4xl font-bold text-primary-navy">Secure your retreat</h2>
        <p className="text-primary-navy/60 text-sm max-w-xs mx-auto">
          Select your preferred dates and provide your details to finalize your experience at {property?.name || 'Al-Nakheel'}.
        </p>
      </section>

      {/* Maintenance Mode Banner */}
      {maintenanceMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-[20px] p-6 text-center space-y-2"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full mx-auto flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h3 className="font-headline font-bold text-red-700 text-lg">Bookings Temporarily Paused</h3>
          <p className="text-red-600/70 text-sm max-w-xs mx-auto">
            Our chalets are currently under maintenance. Please check back soon for availability.
          </p>
        </motion.div>
      )}

      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium"
        >
          <AlertCircle size={18} />
          {submitError}
        </motion.div>
      )}

      {/* Calendar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-6 shadow-sm border border-primary-navy/5"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline text-lg font-bold">{monthName}</h3>
          <div className="flex gap-4">
            <button onClick={prevMonth}><ChevronLeft size={20} className="text-primary-navy/40 hover:text-primary-navy" /></button>
            <button onClick={nextMonth}><ChevronRight size={20} className="text-primary-navy hover:text-primary-navy/60" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-primary-navy/30 uppercase tracking-tighter mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-medium">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(currentYear, currentMonth, day);
            const isPast = dateObj < today;
            const isBooked = isDayBooked(day);
            const isUnavailable = isPast || isBooked || maintenanceMode;
            const isStart = selectedDates.start === day;
            const isEnd = selectedDates.end === day;
            const isSelected = isStart || isEnd;
            const isInRange = selectedDates.start && selectedDates.end && day > selectedDates.start && day < selectedDates.end;

            return (
              <div
                key={day}
                onClick={() => !isUnavailable && handleDayClick(day)}
                className={cn(
                  "py-2 rounded-lg transition-all relative",
                  isUnavailable ? "cursor-not-allowed" : "cursor-pointer hover:bg-primary-navy/5",
                  isPast && !isBooked && "text-primary-navy/20",
                  isBooked && "bg-red-50 text-red-300 line-through",
                  isSelected && !isUnavailable && "bg-primary-navy text-white font-bold",
                  isInRange && !isUnavailable && "bg-primary-navy/5 text-primary-navy"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200"></span>
            <span className="text-[9px] font-bold uppercase text-primary-navy/40">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-primary-navy"></span>
            <span className="text-[9px] font-bold uppercase text-primary-navy/40">Selected</span>
          </div>
        </div>

        {errors.dates && <p className="text-red-500 text-xs mt-4 font-medium">{errors.dates}</p>}

        {selectedDates.start !== null && (
          <div className="mt-4 text-xs text-primary-navy/60 text-center">
            {selectedDates.end !== null
              ? isDayUse
                ? selectedSlot
                  ? `${selectedDates.start} ${monthName.split(' ')[0]} — ${selectedSlot.name} (${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)})`
                  : dayUseSlots.length > 0
                    ? `${selectedDates.start} ${monthName.split(' ')[0]} (Day Use — select a time slot below)`
                    : `${selectedDates.start} ${monthName.split(' ')[0]} (Day Use)`
                : `${selectedDates.start} - ${selectedDates.end} ${monthName.split(' ')[0]} (${nights} night${nights > 1 ? 's' : ''})`
              : `Tap again for Day Use, or select check-out date`}
          </div>
        )}
      </motion.div>

      {/* Day-Use Time Slot Selection */}
      {isDayUse && dayUseSlots.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Select Time Slot *</label>
          <div className="space-y-2">
            {availableSlots.map(slot => {
              const dow = new Date(currentYear, currentMonth, selectedDates.start!).getDay();
              const rate = getSlotRateForDay(dow, slot);
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => { setSelectedSlot(isSelected ? null : slot); setErrors(prev => ({ ...prev, slot: '' })); }}
                  className={cn(
                    "w-full p-4 rounded-[16px] border-2 transition-all text-left flex items-center justify-between",
                    isSelected
                      ? "border-primary-navy bg-primary-navy/5"
                      : "border-primary-navy/10 bg-white hover:border-primary-navy/20"
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-primary-navy">{slot.name}</p>
                    <p className="text-[10px] text-primary-navy/50 font-medium">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-secondary-gold font-headline">{rate} OMR</span>
                    {isSelected && (
                      <div className="w-5 h-5 bg-primary-navy rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {availableSlots.length === 0 && (
              <p className="text-center text-sm text-primary-navy/40 py-4">All time slots are booked for this date</p>
            )}
          </div>
          {errors.slot && <p className="text-red-500 text-xs font-medium">{errors.slot}</p>}
        </motion.section>
      )}

      {/* Pricing Summary */}
      {priceBreakdown && (isDayUse || nights > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-6 rounded-[24px] space-y-4"
        >
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-primary-navy/60 font-medium">{isDayUse ? 'Day Use' : 'Stay'}</span>
              {priceBreakdown.slotTime && (
                <p className="text-[10px] text-primary-navy/40 font-medium">{priceBreakdown.slotTime}</p>
              )}
            </div>
            <span className="font-bold text-primary-navy text-xs">{formatBreakdown(priceBreakdown)}</span>
          </div>

          {/* Per-night breakdown */}
          <div className="space-y-1.5 border-t border-primary-navy/5 pt-3">
            {priceBreakdown.per_night.map(n => (
              <div key={n.date} className="flex justify-between text-xs">
                <span className="text-primary-navy/50">
                  {new Date(n.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {n.isSpecial && <span className="ml-1 text-secondary-gold font-bold">(Special)</span>}
                </span>
                <span className="font-bold text-primary-navy">{n.rate} OMR</span>
              </div>
            ))}
          </div>

          {priceBreakdown.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span className="font-medium">Discount</span>
              <span className="font-bold">-{priceBreakdown.discount_amount} OMR</span>
            </div>
          )}

          <div className="pt-3 border-t border-primary-navy/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-primary-navy/60 font-medium">Stay Total</span>
              <span className="font-bold text-primary-navy">{stayTotal} OMR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-navy/60 font-medium">Refundable Deposit</span>
              <span className="font-bold text-primary-navy">{depositAmount} OMR</span>
            </div>
          </div>

          <div className="pt-4 border-t border-primary-navy/5 flex justify-between items-end">
            <div>
              <p className="text-xl font-bold font-headline">Grand Total</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-primary-navy/40 mt-0.5">Deposit refunded after checkout</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-gold font-headline">{grandTotal} OMR</p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Form */}
      <section className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Full Name *</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => { setGuestName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder="e.g. Ahmed Al-Said"
            className={cn(
              "w-full bg-surface-container-low border rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm",
              errors.name ? "border-red-300" : "border-transparent"
            )}
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">WhatsApp Phone Number *</label>
          <div className="flex gap-3">
            <div className="bg-surface-container-low rounded-xl py-4 px-4 text-sm font-bold text-primary-navy/60">+968</div>
            <input
              type="text"
              value={guestPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d\s]/g, '');
                setGuestPhone(val);
                setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="9000 0000"
              maxLength={9}
              className={cn(
                "flex-1 bg-surface-container-low border rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm",
                errors.phone ? "border-red-300" : "border-transparent"
              )}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Email (Optional)</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => { setGuestEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
            placeholder="you@example.com"
            className={cn(
              "w-full bg-surface-container-low border rounded-xl py-4 px-6 focus:ring-1 focus:ring-secondary-gold/50 placeholder:text-primary-navy/20 text-sm",
              errors.email ? "border-red-300" : "border-transparent"
            )}
          />
          {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email}</p>}
        </div>
      </section>

      {/* Payment Method Selection */}
      {(isDayUse || nights > 0) && (
        <section className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Payment Method *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('thawani')}
              className={cn(
                "relative p-5 rounded-[20px] border-2 transition-all text-left space-y-2",
                paymentMethod === 'thawani'
                  ? "border-primary-navy bg-primary-navy/5"
                  : "border-primary-navy/10 bg-white hover:border-primary-navy/20"
              )}
            >
              {paymentMethod === 'thawani' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary-navy rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <CreditCard size={22} className={paymentMethod === 'thawani' ? "text-primary-navy" : "text-primary-navy/40"} />
              <p className="text-sm font-bold text-primary-navy">Thawani</p>
              <p className="text-[10px] text-primary-navy/50 font-medium">Instant online payment</p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={cn(
                "relative p-5 rounded-[20px] border-2 transition-all text-left space-y-2",
                paymentMethod === 'bank_transfer'
                  ? "border-primary-navy bg-primary-navy/5"
                  : "border-primary-navy/10 bg-white hover:border-primary-navy/20"
              )}
            >
              {paymentMethod === 'bank_transfer' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary-navy rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <Building2 size={22} className={paymentMethod === 'bank_transfer' ? "text-primary-navy" : "text-primary-navy/40"} />
              <p className="text-sm font-bold text-primary-navy">Bank Transfer</p>
              <p className="text-[10px] text-primary-navy/50 font-medium">Upload receipt for approval</p>
            </button>
          </div>

          {/* Bank Transfer Details & Receipt Upload */}
          {paymentMethod === 'bank_transfer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-amber-800">Bank Transfer Details</p>
                <div className="text-xs text-amber-700 space-y-1">
                  <p><span className="font-bold">Bank:</span> {bankDetails.bank_name}</p>
                  <p><span className="font-bold">Account:</span> {bankDetails.account_name}</p>
                  <p><span className="font-bold">IBAN:</span> {bankDetails.iban}</p>
                  {bankDetails.bankPhone.trim() && (
                    <p><span className="font-bold">Mobile Transfer (WhatsApp/Bank App):</span> {bankDetails.bankPhone}</p>
                  )}
                  <p><span className="font-bold">Reference:</span> Your phone number</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Upload Transfer Receipt *</label>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    receiptFile
                      ? "border-emerald-300 bg-emerald-50"
                      : errors.receipt ? "border-red-300 bg-red-50/50" : "border-primary-navy/20 bg-surface-container-low hover:border-primary-navy/40"
                  )}
                >
                  {receiptFile ? (
                    <div className="text-center space-y-1">
                      <Check size={24} className="mx-auto text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-700">Receipt uploaded</p>
                      <p className="text-[10px] text-emerald-600">{receiptFileName}</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <Upload size={24} className="mx-auto text-primary-navy/30" />
                      <p className="text-xs font-bold text-primary-navy/50">Tap to upload receipt</p>
                      <p className="text-[10px] text-primary-navy/30">JPG, PNG or PDF</p>
                    </div>
                  )}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} />
                </label>
                {errors.receipt && <p className="text-red-500 text-xs font-medium">{errors.receipt}</p>}
              </div>
            </motion.div>
          )}
        </section>
      )}

      <div className="space-y-4 pt-4">
        {/* Terms of Stay Checkbox */}
        {termsOfStay && (isDayUse || nights > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={termsNudge ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0 }}
            transition={termsNudge ? { duration: 0.4 } : undefined}
            className={cn(
              "rounded-[16px] p-4 transition-colors",
              errors.terms ? "bg-red-50 border border-red-200" : "bg-surface-container-low border border-primary-navy/5"
            )}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setErrors(prev => ({ ...prev, terms: '' })); }}
                  className="sr-only"
                />
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  termsAccepted ? "bg-primary-navy border-primary-navy" : errors.terms ? "border-red-300 bg-red-50" : "border-primary-navy/20 bg-white"
                )}>
                  {termsAccepted && <Check size={12} className="text-white" />}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-primary-navy leading-relaxed">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                    className="text-secondary-gold font-bold underline underline-offset-2 hover:text-secondary-gold/80 transition-colors"
                  >
                    Terms of Stay
                  </button>
                </p>
                {errors.terms && (
                  <p className="text-red-500 text-[10px] font-bold">{errors.terms}</p>
                )}
              </div>
            </label>
          </motion.div>
        )}

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-navy/60">Uploading Receipt</span>
              <span className="text-xs font-bold text-secondary-gold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-primary-navy/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-secondary-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || (!isDayUse && nights === 0) || maintenanceMode || (!!termsOfStay && !termsAccepted)}
          className="w-full bg-primary-navy text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            thawaniSimulating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs normal-case tracking-normal font-medium">Redirecting to Thawani Secure Payment...</span>
              </div>
            ) : uploadProgress !== null ? (
              <span className="text-xs">Uploading Receipt...</span>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs normal-case tracking-normal font-medium">Processing...</span>
              </div>
            )
          ) : paymentMethod === 'bank_transfer' ? (
            <>
              Submit Booking
              <span className="text-[10px] opacity-40 lowercase font-normal">(pending approval)</span>
            </>
          ) : (
            <>
              Pay with Thawani
              <span className="text-[10px] opacity-40 lowercase font-normal">({grandTotal} OMR)</span>
            </>
          )}
        </button>
        <div className="flex items-center justify-center gap-2 text-primary-navy/30">
          <ShieldCheck size={14} />
          <p className="text-[9px] font-bold text-center uppercase tracking-wider max-w-[200px]">
            {paymentMethod === 'bank_transfer'
              ? 'Your booking will be confirmed once the admin approves your transfer'
              : 'Your transaction is encrypted and secured by Thawani Gateway'}
          </p>
        </div>
      </div>

      {/* Terms of Stay Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-[24px] rounded-t-[24px] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-primary-navy/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-navy flex items-center justify-center rounded-lg">
                    <FileText className="text-secondary-gold" size={20} />
                  </div>
                  <div>
                    <p className="font-headline text-sm font-bold text-primary-navy">Terms of Stay</p>
                    <p className="text-[10px] text-primary-navy/40 uppercase tracking-widest font-bold">Al-Nakheel Sanctuary</p>
                  </div>
                </div>
                <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-primary-navy/5 rounded-full transition-colors">
                  <X size={18} className="text-primary-navy/40" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="text-sm text-primary-navy/80 leading-relaxed whitespace-pre-wrap font-medium">
                  {termsOfStay}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-primary-navy/5 flex-shrink-0">
                <button
                  onClick={() => {
                    setTermsAccepted(true);
                    setErrors(prev => ({ ...prev, terms: '' }));
                    setShowTermsModal(false);
                  }}
                  className="w-full bg-primary-navy text-white py-4 rounded-[16px] font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  I Accept the Terms
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
