import React from 'react';
import { Shield, Sun, Moon, AlertOctagon, LogOut, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function HeaderNavbar({ currentView, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, isDemoMode } = useAuth();

  return (
    <header style={{
      width: '100%',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background-color var(--transition-normal), border-color var(--transition-normal)'
    }}>
      {/* Top Banner with single clear Demo Data indicator */}
      <div style={{
        background: 'var(--gov-blue-900)',
        color: '#FFFFFF',
        fontSize: '11px',
        padding: '5px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        letterSpacing: '0.02em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700 }}>SensaFlow</span>
          <span style={{ opacity: 0.6 }}>&bull;</span>
          <span style={{ opacity: 0.9 }}>Distributed Flood Warning &amp; Drainage Blockage Detection</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDemoMode && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#FCA5A5',
              padding: '1px 8px',
              borderRadius: '3px',
              fontWeight: 800,
              fontSize: '10px',
              letterSpacing: '0.05em'
            }}>
              DEMO DATA
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Brand logo & name */}
        <div
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Shield size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Sensa<span style={{ color: 'var(--water-cyan-600)' }}>Flow</span>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Sense Early. Alert Instantly. Rescue Faster.
            </div>
          </div>
        </div>

        {/* Center: Simplified Navigation (Command Dashboard & Public Alerts Feed only) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => onNavigate('login')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: currentView === 'login' ? 'var(--gov-blue-50)' : 'transparent',
                  color: currentView === 'login' ? 'var(--gov-blue-700)' : 'var(--text-secondary)',
                  border: currentView === 'login' ? '1px solid var(--gov-blue-100)' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                Employee Login
              </button>
              <button
                onClick={() => onNavigate('public-alerts')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: currentView === 'public-alerts' ? 'var(--water-cyan-50)' : 'transparent',
                  color: currentView === 'public-alerts' ? 'var(--water-cyan-600)' : 'var(--text-secondary)',
                  border: currentView === 'public-alerts' ? '1px solid var(--water-cyan-100)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <AlertOctagon size={15} color="var(--water-cyan-600)" />
                <span>Public Alerts Feed</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: currentView === 'dashboard' ? 'var(--gov-blue-50)' : 'transparent',
                  color: currentView === 'dashboard' ? 'var(--gov-blue-700)' : 'var(--text-secondary)',
                  border: currentView === 'dashboard' ? '1px solid var(--gov-blue-100)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LayoutDashboard size={15} />
                <span>Command Dashboard</span>
              </button>
              <button
                onClick={() => onNavigate('public-alerts')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: currentView === 'public-alerts' ? 'var(--water-cyan-50)' : 'transparent',
                  color: currentView === 'public-alerts' ? 'var(--water-cyan-600)' : 'var(--text-secondary)',
                  border: currentView === 'public-alerts' ? '1px solid var(--water-cyan-100)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertOctagon size={15} color="var(--water-cyan-600)" />
                <span>Public Alerts Feed</span>
              </button>
            </>
          )}
        </nav>

        {/* Right: User Status & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--gov-blue-700)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {(user?.name || 'D').charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.name || 'Demo Officer'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {user?.designation || 'Disaster Response Coordinator'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  color: 'var(--status-critical)',
                  marginLeft: '4px'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Currently ${theme} mode. Click to toggle.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {theme === 'light' ? (
              <>
                <Moon size={16} color="var(--gov-blue-700)" />
                <span style={{ display: 'inline-block' }}>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={16} color="#F59E0B" />
                <span style={{ display: 'inline-block' }}>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
