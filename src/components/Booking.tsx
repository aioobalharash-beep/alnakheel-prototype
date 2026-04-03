import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck, AlertCircle, ArrowLeft, Upload, CreditCard, Building2, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { propertiesApi, bookingsApi } from '../services/api';
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
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    propertiesApi.list()
      .then(properties => {
        if (properties.length > 0) setProperty(properties[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    if (clickedDate < today) return;

    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      setSelectedDates({ start: day, end: null });
    } else {
      if (day > selectedDates.start) {
        setSelectedDates({ ...selectedDates, end: day });
      } else {
        setSelectedDates({ start: day, end: selectedDates.start });
      }
    }
    setErrors(prev => ({ ...prev, dates: '' }));
  };

  const nights = selectedDates.start && selectedDates.end ? selectedDates.end - selectedDates.start : 0;
  const nightlyRate = property?.nightly_rate || 120;
  const securityDeposit = property?.security_deposit || 50;
  const total = (nightlyRate * nights) + securityDeposit;

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

    if (paymentMethod === 'bank_transfer' && !receiptImage) {
      newErrors.receipt = 'Please upload your bank transfer receipt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
      setErrors(prev => ({ ...prev, receipt: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!validate() || !property || !selectedDates.start || !selectedDates.end) return;

    setSubmitting(true);
    setSubmitError('');

    const checkIn = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.start).padStart(2, '0')}`;
    const checkOut = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDates.end).padStart(2, '0')}`;

    try {
      const result = await bookingsApi.create({
        property_id: property.id,
        property_name: property.name,
        guest_name: guestName.trim(),
        guest_phone: `+968${guestPhone.replace(/\s/g, '')}`,
        guest_email: guestEmail || undefined,
        check_in: checkIn,
        check_out: checkOut,
        nightly_rate: property.nightly_rate,
        security_deposit: property.security_deposit,
        payment_method: paymentMethod,
        receipt_image: paymentMethod === 'bank_transfer' ? receiptImage : undefined,
      });

      navigate('/confirmation', {
        state: {
          booking: result.booking,
          propertyName: result.property_name,
        },
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Booking failed. Please try again.');
    } finally {
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
            const isStart = selectedDates.start === day;
            const isEnd = selectedDates.end === day;
            const isSelected = isStart || isEnd;
            const isInRange = selectedDates.start && selectedDates.end && day > selectedDates.start && day < selectedDates.end;

            return (
              <div
                key={day}
                onClick={() => !isPast && handleDayClick(day)}
                className={cn(
                  "py-2 rounded-lg transition-all",
                  isPast ? "text-primary-navy/20 cursor-not-allowed" : "cursor-pointer hover:bg-primary-navy/5",
                  isSelected && "bg-primary-navy text-white font-bold",
                  isInRange && "bg-primary-navy/5 text-primary-navy"
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        {errors.dates && <p className="text-red-500 text-xs mt-4 font-medium">{errors.dates}</p>}

        {selectedDates.start && (
          <div className="mt-4 text-xs text-primary-navy/60 text-center">
            {selectedDates.end
              ? `${selectedDates.start} - ${selectedDates.end} ${monthName.split(' ')[0]} (${nights} night${nights > 1 ? 's' : ''})`
              : `Select check-out date`}
          </div>
        )}
      </motion.div>

      {/* Pricing Summary */}
      {nights > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-6 rounded-[24px] space-y-4"
        >
          <div className="flex justify-between text-sm">
            <span className="text-primary-navy/60 font-medium">Nightly Rate</span>
            <span className="font-bold text-primary-navy">{nightlyRate} OMR &times; {nights} night{nights > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-primary-navy/60 font-medium">Security Deposit (OMR)</span>
            <span className="font-bold text-primary-navy">{securityDeposit} OMR</span>
          </div>
          <div className="pt-4 border-t border-primary-navy/5 flex justify-between items-end">
            <div>
              <p className="text-xl font-bold font-headline">Total</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-secondary-gold font-headline">{total} OMR</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-primary-navy/40">Inclusive of all taxes</p>
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
      {nights > 0 && (
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
                  <p><span className="font-bold">Bank:</span> Bank Muscat</p>
                  <p><span className="font-bold">Account:</span> Al-Nakheel Luxury Properties LLC</p>
                  <p><span className="font-bold">IBAN:</span> OM12 0123 0000 0012 3456 789</p>
                  <p><span className="font-bold">Reference:</span> Your phone number</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-gold">Upload Transfer Receipt *</label>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                    receiptImage
                      ? "border-emerald-300 bg-emerald-50"
                      : errors.receipt ? "border-red-300 bg-red-50/50" : "border-primary-navy/20 bg-surface-container-low hover:border-primary-navy/40"
                  )}
                >
                  {receiptImage ? (
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
        <button
          onClick={handleSubmit}
          disabled={submitting || nights === 0}
          className="w-full bg-primary-navy text-white py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : paymentMethod === 'bank_transfer' ? (
            <>
              Submit Booking
              <span className="text-[10px] opacity-40 lowercase font-normal">(pending approval)</span>
            </>
          ) : (
            <>
              Proceed to Secure Payment
              <span className="text-[10px] opacity-40 lowercase font-normal">(via Thawani)</span>
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
    </div>
  );
};
