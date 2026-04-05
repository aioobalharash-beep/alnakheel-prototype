export interface PricingSettings {
  weekday_rate: number;   // Sun–Wed
  thursday_rate: number;
  friday_rate: number;
  saturday_rate: number;
  security_deposit: number; // Refundable — excluded from revenue/tax
  special_dates: { date: string; price: number }[];  // YYYY-MM-DD
  discount?: {
    enabled: boolean;
    type: 'percent' | 'flat';
    value: number;
    start_date: string;
    end_date: string;
  };
}

export interface PriceBreakdown {
  nights: number;
  weekday_nights: number;
  thursday_nights: number;
  friday_nights: number;
  saturday_nights: number;
  special_nights: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  per_night: { date: string; dayLabel: string; rate: number; isSpecial: boolean }[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function calculateTotalPrice(
  checkIn: string,
  checkOut: string,
  pricing: PricingSettings
): PriceBreakdown {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const specialMap = new Map(pricing.special_dates.map(s => [s.date, s.price]));

  const perNight: PriceBreakdown['per_night'] = [];
  let weekday = 0, thu = 0, fri = 0, sat = 0, special = 0;
  let subtotal = 0;

  const cursor = new Date(start);
  while (cursor < end) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dow = cursor.getDay(); // 0=Sun
    const dayLabel = DAY_LABELS[dow];

    let rate: number;
    let isSpecial = false;

    if (specialMap.has(dateStr)) {
      rate = specialMap.get(dateStr)!;
      isSpecial = true;
      special++;
    } else if (dow === 4) { // Thursday
      rate = pricing.thursday_rate;
      thu++;
    } else if (dow === 5) { // Friday
      rate = pricing.friday_rate;
      fri++;
    } else if (dow === 6) { // Saturday
      rate = pricing.saturday_rate;
      sat++;
    } else { // Sun–Wed
      rate = pricing.weekday_rate;
      weekday++;
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
    // Check if any night falls within discount range
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
    weekday_nights: weekday,
    thursday_nights: thu,
    friday_nights: fri,
    saturday_nights: sat,
    special_nights: special,
    subtotal,
    discount_amount: discountAmount,
    total: Math.max(0, subtotal - discountAmount),
    per_night: perNight,
  };
}

/** Build a human-readable breakdown string like "3 Nights (2 Weekdays, 1 Friday)" */
export function formatBreakdown(b: PriceBreakdown): string {
  const parts: string[] = [];
  if (b.weekday_nights > 0) parts.push(`${b.weekday_nights} Weekday${b.weekday_nights > 1 ? 's' : ''}`);
  if (b.thursday_nights > 0) parts.push(`${b.thursday_nights} Thu`);
  if (b.friday_nights > 0) parts.push(`${b.friday_nights} Fri`);
  if (b.saturday_nights > 0) parts.push(`${b.saturday_nights} Sat`);
  if (b.special_nights > 0) parts.push(`${b.special_nights} Special`);
  return `${b.nights} Night${b.nights > 1 ? 's' : ''} (${parts.join(', ')})`;
}
