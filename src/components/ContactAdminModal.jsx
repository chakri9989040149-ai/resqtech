import React from 'react';
import { X, Headphones, Phone, Mail, Building2, ShieldCheck, Clock } from 'lucide-react';

export default function ContactAdminModal({ isOpen, onClose }) {
  if (!isOpen) return null;

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
        maxWidth: '520px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-medium)',
        overflow: 'hidden'
      }} role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
        
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
              <Headphones size={20} />
            </div>
            <div>
              <h3 id="contact-modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                Department IT &amp; Security Support
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Authorized Personnel Disaster Tech Helpdesk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={18} color="var(--gov-blue-600)" />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                National Flood Forecasting &amp; Early Warning Division
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Central Monitoring Station, Ministry of Jal Shakti &amp; Disaster Management Framework, New Delhi 110003
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gov-blue-600)', marginBottom: '4px' }}>
                <Phone size={14} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>24x7 NOC Hotline</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                1800-11-2026 / 1070
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Toll-free emergency line
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gov-blue-600)', marginBottom: '4px' }}>
                <Mail size={14} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>IT Operations</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                helpdesk@sensaflow.gov.in
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                PGP Encrypted email
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)'
          }}>
            <Clock size={15} color="var(--water-cyan-600)" />
            <span>Nodal Support Desk Response SLA: &lt; 15 minutes for critical incidents</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--gov-blue-800)',
            background: 'var(--gov-blue-50)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gov-blue-100)'
          }}>
            <ShieldCheck size={16} />
            <span>Personnel requesting access must be verified by their District Collector or SDMA Nodal Officer.</span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gov-blue-700)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              marginTop: '8px'
            }}
          >
            Close Support Window
          </button>
        </div>
      </div>
    </div>
  );
}
