import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FloodGuardProvider } from './context/FloodGuardStore';
import HeaderNavbar from './components/HeaderNavbar';
import LeftMonitoringIdentity from './components/LeftMonitoringIdentity';
import LoginForm from './components/LoginForm';
import PublicAlertsPage from './pages/PublicAlertsPage';
import DashboardPage from './pages/DashboardPage';
import { ShieldCheck } from 'lucide-react';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    // If returning user is authenticated, start on dashboard, else start on login
    return 'login';
  });

  // When authentication status changes, sync view appropriately
  useEffect(() => {
    if (isAuthenticated && currentView === 'login') {
      setCurrentView('dashboard');
    } else if (!isAuthenticated && currentView === 'dashboard') {
      setCurrentView('login');
    }
  }, [isAuthenticated, currentView]);

  const handleNavigate = (view) => {
    if (view === 'dashboard' && !isAuthenticated) {
      setCurrentView('login');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background-color var(--transition-normal), color var(--transition-normal)'
    }}>
      {/* Top Government Navigation Bar */}
      <HeaderNavbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main style={{ flex: '1 0 auto' }}>
        {/* VIEW 1: LOGIN (TWO-COLUMN GOV PORTAL) */}
        {currentView === 'login' && (
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '32px 24px',
            minHeight: 'calc(100vh - 120px)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
              gap: '32px',
              width: '100%',
              alignItems: 'stretch'
            }}>
              {/* LEFT COLUMN: Government Flood Monitoring Identity (55-60% feel on desktop) */}
              <div style={{ flex: '1 1 58%', minWidth: '320px' }}>
                <LeftMonitoringIdentity />
              </div>

              {/* RIGHT COLUMN: Secure Government Employee Login Form */}
              <div style={{
                flex: '1 1 42%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '320px'
              }}>
                <LoginForm
                  onNavigateToPublicAlerts={() => handleNavigate('public-alerts')}
                  onSuccess={() => handleNavigate('dashboard')}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PUBLIC FLOOD ALERTS (NO AUTH REQUIRED) */}
        {currentView === 'public-alerts' && (
          <PublicAlertsPage onBackToLogin={() => handleNavigate('login')} />
        )}

        {/* VIEW 3: PROTECTED DASHBOARD */}
        {currentView === 'dashboard' && (
          <DashboardPage onLogout={() => handleNavigate('login')} />
        )}
      </main>

      {/* Official Government Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-light)',
        color: 'var(--text-muted)',
        fontSize: '12px',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--gov-blue-700)" />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                SensaFlow &bull; National Disaster Management &amp; Drainage Early Warning Network
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleNavigate('public-alerts')}
                style={{
                  fontSize: '12px',
                  color: 'var(--water-cyan-600)',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Public Alerts Feed
              </button>
              <button
                onClick={() => handleNavigate('login')}
                style={{
                  fontSize: '12px',
                  color: 'var(--gov-blue-700)',
                  fontWeight: 600
                }}
              >
                Employee Portal
              </button>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '11px'
          }}>
            <div>
              SensaFlow &bull; Distributed Flood Warning and Drainage Blockage Detection
            </div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>
              Hackathon Prototype &bull; Simulated Demonstration Data
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FloodGuardProvider>
          <MainApp />
        </FloodGuardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
