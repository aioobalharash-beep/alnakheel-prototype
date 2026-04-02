/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
import { View, Mode } from './types';

export default function App() {
  const [mode, setMode] = useState<Mode>('client');
  const [currentView, setCurrentView] = useState<View>('sanctuary');

  const toggleMode = () => {
    if (mode === 'client') {
      setMode('admin');
      setCurrentView('dashboard');
    } else {
      setMode('client');
      setCurrentView('sanctuary');
    }
  };

  const renderAdminView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <Calendar />;
      case 'guests': return <Guests />;
      case 'invoices': return <Invoices />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  const renderClientView = () => {
    switch (currentView) {
      case 'sanctuary': 
        return <Sanctuary onBookNow={() => setCurrentView('booking')} />;
      case 'booking': 
        return <Booking onProceed={() => setCurrentView('confirmation')} />;
      case 'confirmation': 
        return <Confirmation onBack={() => setCurrentView('sanctuary')} />;
      default: 
        return <Sanctuary onBookNow={() => setCurrentView('booking')} />;
    }
  };

  if (mode === 'admin') {
    return (
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderAdminView()}
      </Layout>
    );
  }

  return (
    <ClientLayout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      onModeToggle={toggleMode}
    >
      {renderClientView()}
    </ClientLayout>
  );
}
