import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Bookings ──

export interface FirestoreBooking {
  id?: string;
  property_id: string;
  property_name: string;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  check_in: string;
  check_out: string;
  nights: number;
  nightly_rate: number;
  security_deposit: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: 'thawani' | 'bank_transfer' | 'walk_in';
  receipt_image?: string;
  created_at: string;
}

const bookingsCol = () => collection(db, 'bookings');
const guestsCol = () => collection(db, 'guests');
const transactionsCol = () => collection(db, 'transactions');
const testimonialsCol = () => collection(db, 'testimonials');
const notificationsCol = () => collection(db, 'notifications');

export const firestoreBookings = {
  async create(data: {
    property_id: string;
    property_name: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    check_in: string;
    check_out: string;
    nightly_rate: number;
    security_deposit: number;
    payment_method: 'thawani' | 'bank_transfer' | 'walk_in';
    receipt_image?: string;
  }): Promise<FirestoreBooking> {
    const checkIn = new Date(data.check_in);
    const checkOut = new Date(data.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const total = (data.nightly_rate * nights) + data.security_deposit;

    const isBankTransfer = data.payment_method === 'bank_transfer';
    const isWalkIn = data.payment_method === 'walk_in';

    const booking: Omit<FirestoreBooking, 'id'> = {
      property_id: data.property_id,
      property_name: data.property_name,
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      guest_email: data.guest_email || '',
      check_in: data.check_in,
      check_out: data.check_out,
      nights,
      nightly_rate: data.nightly_rate,
      security_deposit: data.security_deposit,
      total_amount: total,
      status: isBankTransfer ? 'pending' : 'confirmed',
      payment_status: isBankTransfer ? 'pending' : (isWalkIn ? 'pending' : 'paid'),
      payment_method: data.payment_method,
      receipt_image: data.receipt_image || '',
      created_at: new Date().toISOString(),
    };

    const docRef = await addDoc(bookingsCol(), booking);

    // Also create a guest record
    await addDoc(guestsCol(), {
      name: data.guest_name,
      phone: data.guest_phone,
      email: data.guest_email || '',
      check_in: data.check_in,
      check_out: data.check_out,
      status: 'upcoming',
      property_id: data.property_id,
      property_name: data.property_name,
      booking_id: docRef.id,
      created_at: new Date().toISOString(),
    });

    // Create a transaction record (only for non-bank-transfer)
    if (!isBankTransfer) {
      await addDoc(transactionsCol(), {
        type: 'payment',
        description: `Booking Payment - ${data.property_name}`,
        amount: total,
        booking_id: docRef.id,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      });
    }

    // Create notification for admin
    await addDoc(notificationsCol(), {
      type: isBankTransfer ? 'pending_payment' : 'new_booking',
      title: isBankTransfer ? 'Bank Transfer Pending' : 'New Booking',
      message: `${data.guest_name} booked ${data.property_name} (${nights} nights)`,
      booking_id: docRef.id,
      read: false,
      created_at: new Date().toISOString(),
    });

    return { ...booking, id: docRef.id };
  },

  async list(): Promise<FirestoreBooking[]> {
    const q = query(bookingsCol(), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBooking));
  },

  async get(id: string): Promise<FirestoreBooking | null> {
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirestoreBooking;
  },

  async updateStatus(id: string, status: string) {
    const ref = doc(db, 'bookings', id);
    await updateDoc(ref, { status });
  },

  async approvePayment(id: string) {
    const ref = doc(db, 'bookings', id);
    await updateDoc(ref, { status: 'confirmed', payment_status: 'paid' });

    const booking = await this.get(id);
    if (booking) {
      await addDoc(transactionsCol(), {
        type: 'payment',
        description: `Bank Transfer Approved - ${booking.property_name}`,
        amount: booking.total_amount,
        booking_id: id,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      });
    }
  },
};

// ── Guests ──

export const firestoreGuests = {
  async create(data: {
    name: string;
    phone: string;
    email?: string;
    check_in: string;
    check_out: string;
    property_id: string;
    property_name: string;
  }) {
    const docRef = await addDoc(guestsCol(), {
      ...data,
      email: data.email || '',
      status: 'upcoming',
      booking_id: '',
      created_at: new Date().toISOString(),
    });
    return { id: docRef.id, ...data, status: 'upcoming' };
  },

  async list(filters?: { status?: string; search?: string }) {
    let q = query(guestsCol(), orderBy('created_at', 'desc'));

    if (filters?.status && filters.status !== 'all') {
      q = query(guestsCol(), where('status', '==', filters.status), orderBy('created_at', 'desc'));
    }

    const snap = await getDocs(q);
    let guests = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      guests = guests.filter((g: any) =>
        g.name?.toLowerCase().includes(s) || g.phone?.includes(s)
      );
    }

    return guests;
  },

  async stats() {
    const snap = await getDocs(guestsCol());
    const all = snap.docs.map(d => d.data());
    return {
      checkedIn: all.filter(g => g.status === 'checked-in').length,
      upcoming: all.filter(g => g.status === 'upcoming').length,
      checkingOut: all.filter(g => g.status === 'checking-out').length,
      completed: all.filter(g => g.status === 'completed').length,
      total: all.length,
    };
  },

  async updateStatus(id: string, status: string) {
    const ref = doc(db, 'guests', id);
    await updateDoc(ref, { status });
  },
};

// ── Transactions ──

export const firestoreTransactions = {
  async list(limit = 20) {
    const q = query(transactionsCol(), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
  },
};

// ── Testimonials ──

export interface Testimonial {
  id?: string;
  guest_name: string;
  guest_phone: string;
  property_name: string;
  rating: number;
  text: string;
  stay_details: string;
  created_at: string;
}

export const firestoreTestimonials = {
  async create(data: Omit<Testimonial, 'id' | 'created_at'>) {
    const docRef = await addDoc(testimonialsCol(), {
      ...data,
      created_at: new Date().toISOString(),
    });
    return { id: docRef.id, ...data, created_at: new Date().toISOString() };
  },

  async list(): Promise<Testimonial[]> {
    const q = query(testimonialsCol(), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
  },
};

// ── Notifications ──

export interface Notification {
  id?: string;
  type: 'new_booking' | 'pending_payment';
  title: string;
  message: string;
  booking_id: string;
  read: boolean;
  created_at: string;
}

export const firestoreNotifications = {
  async list(): Promise<Notification[]> {
    const q = query(notificationsCol(), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
  },

  async markRead(id: string) {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { read: true });
  },

  async markAllRead() {
    const snap = await getDocs(query(notificationsCol(), where('read', '==', false)));
    const updates = snap.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
    await Promise.all(updates);
  },
};
