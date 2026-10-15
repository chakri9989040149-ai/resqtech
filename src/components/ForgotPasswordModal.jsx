import React, { useState } from 'react';
import { X, KeyRound, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [employeeId, setEmployeeId] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleClose = () => {
    setSubmitted(false);
    setEmployeeId('');
    setOfficialEmail('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        width: '100%',
        maxWidth: '500px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-medium)',
        overflow: 'hidden'
      }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--gov-blue-50)',
              color: 'var(--gov-blue-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--gov-blue-100)'
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 id="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                Department Password Recovery
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Government Portal Access Recovery Protocol
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'var(--status-normal-bg)',
                color: 'var(--status-normal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '1px solid var(--status-normal-border)'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Reset Request Dispatched
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                A secure departmental credential authorization link has been forwarded to the registered nodal IT coordinator for <strong>{officialEmail || employeeId}</strong>.
              </p>
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong>Demonstration Note:</strong> In this evaluation environment, you can use the standard demo password: <code style={{ color: 'var(--gov-blue-600)', fontWeight: 700 }}>Demo@GovGuard2026</code> to sign in immediately.
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  background: 'var(--gov-blue-700)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{
                background: 'var(--gov-blue-50)',
                border: '1px solid var(--gov-blue-100)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px'
              }}>
                <ShieldAlert size={20} color="var(--gov-blue-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'var(--gov-blue-900)', lineHeight: 1.5 }}>
                  Password resets require validation against your state/district department registry. Passwords cannot be sent via unencrypted civilian SMS.
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Government Employee / Officer ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-NDMA-1042"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Registered Official Government Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="officer@disaster-dept.gov.in"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--gov-blue-700)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? 'Submitting to Nodal Authority...' : 'Request Official Reset'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
