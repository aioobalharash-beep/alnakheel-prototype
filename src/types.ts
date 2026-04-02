export type Mode = 'admin' | 'client';

export type View = 
  | 'dashboard' | 'calendar' | 'guests' | 'invoices' | 'reports' // Admin Views
  | 'sanctuary' | 'booking' | 'payment' | 'confirmation' | 'terms'; // Client Views

export interface Guest {
  id: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: 'checked-in' | 'upcoming' | 'checking-out' | 'completed';
  avatar: string;
}

export interface Invoice {
  id: string;
  guestName: string;
  bookingRef: string;
  roomType: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  date: string;
}

export interface Transaction {
  id: string;
  type: 'refund' | 'payment';
  description: string;
  amount: number;
  date: string;
}
