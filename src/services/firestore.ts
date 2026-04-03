import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  Timestamp,
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
  created_at: string;
}

const bookingsCol = () => collection(db, 'bookings');
const guestsCol = () => collection(db, 'guests');
const transactionsCol = () => collection(db, 'transactions');

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
  }): Promise<FirestoreBooking> {
    const checkIn = new Date(data.check_in);
    const checkOut = new Date(data.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const total = (data.nightly_rate * nights) + data.security_deposit;

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
      status: 'confirmed',
      payment_status: 'paid',
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

    // Create a transaction record
    await addDoc(transactionsCol(), {
      type: 'payment',
      description: `Booking Payment - ${data.property_name}`,
      amount: total,
      booking_id: docRef.id,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });

    return { ...booking, id: docRef.id };
  },

  async list(): Promise<FirestoreBooking[]> {
    const q = query(bookingsCol(), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBooking));
  },

  async updateStatus(id: string, status: string) {
    const ref = doc(db, 'bookings', id);
    await updateDoc(ref, { status });
  },
};

// ── Guests ──

export const firestoreGuests = {
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
