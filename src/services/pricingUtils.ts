export interface PricingSettings {
  sunday_rate: number;
  monday_rate: number;
  tuesday_rate: number;
  wednesday_rate: number;
  thursday_rate: number;
  friday_rate: number;
  saturday_rate: number;
  day_use_rate: number;         // Same-day "Day Use" price (e.g. 12 PM – 10 PM)
  security_deposit: number;     // Refundable — excluded from revenue/tax
  special_dates: { date: string; price: number }[];  // YYYY-MM-DD
  discount?: {
    enabled: boolean;
    type: 'percent' | 'flat';
    value: number;
    start_date: string;
    end_date: string;
  };
  // Legacy compat — ignored if individual days are set
  weekday_rate?: number;
}

export interface PriceBreakdown {
  nights: number;
  isDayUse: boolean;
  subtotal: number;
  discount_amount: number;
  total: number;
  per_night: { date: string; dayLabel: string; rate: number; isSpecial: boolean }[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Get the nightly rate for a given day-of-week (0=Sun … 6=Sat) */
function getRateForDay(dow: number, pricing: PricingSettings): number {
  switch (dow) {
    case 0: return pricing.sunday_rate;
    case 1: return pricing.monday_rate;
    case 2: return pricing.tuesday_rate;
    case 3: return pricing.wednesday_rate;
    case 4: return pricing.thursday_rate;
    case 5: return pricing.friday_rate;
    case 6: return pricing.saturday_rate;
    default: return pricing.sunday_rate;
  }
}

/** Get all 7 nightly rates as an array */
export function getAllRates(pricing: PricingSettings): number[] {
  return [
    pricing.sunday_rate, pricing.monday_rate, pricing.tuesday_rate,
    pricing.wednesday_rate, pricing.thursday_rate, pricing.friday_rate,
    pricing.saturday_rate,
  ];
}

export function calculateTotalPrice(
  checkIn: string,
  checkOut: string,
  pricing: PricingSettings
): PriceBreakdown {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const specialMap = new Map(pricing.special_dates.map(s => [s.date, s.price]));

  // Day Use: check-in === check-out
  const isDayUse = checkIn === checkOut;
  if (isDayUse) {
    const dateStr = start.toISOString().split('T')[0];
    const dow = start.getDay();
    const dayLabel = DAY_LABELS[dow];
    let rate = pricing.day_use_rate || 0;
    const isSpecial = specialMap.has(dateStr);
    if (isSpecial) rate = specialMap.get(dateStr)!;

    // Apply discount
    let discountAmount = 0;
    if (pricing.discount?.enabled && pricing.discount.start_date && pricing.discount.end_date) {
      if (dateStr >= pricing.discount.start_date && dateStr <= pricing.discount.end_date) {
        if (pricing.discount.type === 'percent') {
          discountAmount = Math.round(rate * (pricing.discount.value / 100) * 100) / 100;
        } else {
          discountAmount = pricing.discount.value;
        }
      }
    }

    return {
      nights: 0,
      isDayUse: true,
      subtotal: rate,
      discount_amount: discountAmount,
      total: Math.max(0, rate - discountAmount),
      per_night: [{ date: dateStr, dayLabel, rate, isSpecial }],
    };
  }

  // Multi-night stay
  const perNight: PriceBreakdown['per_night'] = [];
  let subtotal = 0;

  const cursor = new Date(start);
  while (cursor < end) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dow = cursor.getDay();
    const dayLabel = DAY_LABELS[dow];

    let rate: number;
    let isSpecial = false;

    if (specialMap.has(dateStr)) {
      rate = specialMap.get(dateStr)!;
      isSpecial = true;
    } else {
      rate = getRateForDay(dow, pricing);
    }

    subtotal += rate;
    perNight.push({ date: dateStr, dayLabel, rate, isSpecial });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Apply discount if active and dates overlap
  let discountAmount = 0;
  if (pricing.discount?.enabled && pricing.discount.start_date && pricing.discount.end_date) {
    const discStart = pricing.discount.start_date;
    const discEnd = pricing.discount.end_date;
    const overlapping = perNight.filter(n => n.date >= discStart && n.date <= discEnd);
    if (overlapping.length > 0) {
      if (pricing.discount.type === 'percent') {
        discountAmount = Math.round(subtotal * (pricing.discount.value / 100) * 100) / 100;
      } else {
        discountAmount = pricing.discount.value;
      }
    }
  }

  return {
    nights: perNight.length,
    isDayUse: false,
    subtotal,
    discount_amount: discountAmount,
    total: Math.max(0, subtotal - discountAmount),
    per_night: perNight,
  };
}

/** Build a human-readable breakdown string */
export function formatBreakdown(b: PriceBreakdown): string {
  if (b.isDayUse) return 'Day Use';
  return `${b.nights} Night${b.nights > 1 ? 's' : ''}`;
}

/** Migrate legacy 4-rate pricing to 7-day format */
export function migratePricing(raw: any): PricingSettings {
  // If already has sunday_rate, it's the new format
  if (raw.sunday_rate !== undefined) return raw as PricingSettings;

  // Migrate from legacy weekday_rate / thursday / friday / saturday
  const weekday = raw.weekday_rate || 120;
  return {
    sunday_rate: weekday,
    monday_rate: weekday,
    tuesday_rate: weekday,
    wednesday_rate: weekday,
    thursday_rate: raw.thursday_rate || weekday,
    friday_rate: raw.friday_rate || weekday,
    saturday_rate: raw.saturday_rate || weekday,
    day_use_rate: raw.day_use_rate || Math.round(weekday * 0.6),
    security_deposit: raw.security_deposit || 50,
    special_dates: raw.special_dates || [],
    discount: raw.discount,
  };
}
