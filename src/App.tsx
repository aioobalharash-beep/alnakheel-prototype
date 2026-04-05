import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ClientLayout } from './components/ClientLayout';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { Guests } from './components/Guests';
import { Invoices } from './components/Invoices';
import { Reports } from './components/Reports';
import { Sanctuary } from './components/Sanctuary';
import { Booking } from './components/Booking';
import { Confirmation } from './components/Confirmation';
import { Login } from './components/Login';
import { Testimonials } from './components/Testimonials';
import { Terms } from './components/Terms';
import { About } from './components/About';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-pearl-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold font-headline text-primary-navy">Al-Nakheel</h1>
        <div className="w-8 h-8 border-2 border-primary-navy/20 border-t-secondary-gold rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public / Client Routes */}
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<Sanctuary />} />
        <Route path="booking" element={<Booking />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="confirmation" element={<Confirmation />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="guests" element={<Guests />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
