import React, { useState } from 'react';
import { Shield, Waves, Cpu, AlertTriangle, Layers, WifiOff, RefreshCw, Eye } from 'lucide-react';
import GisMiniMap from './GisMiniMap';

export default function LeftMonitoringIdentity() {
  const [activeImage, setActiveImage] = useState('control-room'); // 'control-room' or 'drainage-sensor'

  return (
    <div style={{
      position: 'relative',
      height: '100%',
      minHeight: '680px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '36px 40px',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--border-medium)',
      background: '#0B132B'
    }}>
      {/* Background High-Resolution Photography */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(/assets/images/${activeImage === 'control-room' ? 'control-room.jpg' : 'drainage-sensor.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.4s ease-in-out',
        zIndex: 1
      }} />

      {/* Deep Navy Refined Gradient Overlay for superior contrast and readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(175deg, rgba(11, 25, 44, 0.92) 0%, rgba(13, 27, 62, 0.88) 45%, rgba(6, 12, 28, 0.96) 100%)',
        zIndex: 2
      }} />

      {/* Atmospheric Subtle Grid Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        zIndex: 2,
        pointerEvents: 'none'
      }} />

      {/* CONTENT (Z-INDEX 3) */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Brand & Authority Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1E40AF, #0284C7)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)'
            }}>
              <Shield size={26} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Sensa<span style={{ color: '#38BDF8' }}>Flow</span>
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#93C5FD',
                  background: 'rgba(30, 58, 138, 0.7)',
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  PROTOTYPE
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', letterSpacing: '0.02em' }}>
                Distributed Flood Warning &amp; Drainage Blockage Detection
              </div>
            </div>
          </div>

          {/* Image switcher pill (allows toggle between Control Room & Culvert IoT sensor views) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '3px'
          }}>
            <button
              onClick={() => setActiveImage('control-room')}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                background: activeImage === 'control-room' ? '#1D4ED8' : 'transparent',
                color: activeImage === 'control-room' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s'
              }}
            >
              Control Room
            </button>
            <button
              onClick={() => setActiveImage('drainage-sensor')}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                background: activeImage === 'drainage-sensor' ? '#1D4ED8' : 'transparent',
                color: activeImage === 'drainage-sensor' ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.2s'
              }}
            >
              IoT Culvert
            </button>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div style={{ marginTop: '10px' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 2.5vw, 32px)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#FFFFFF',
            letterSpacing: '-0.02em'
          }}>
            Intelligent Flood &amp; Drainage Monitoring
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#CBD5E1',
            marginTop: '8px',
            maxWidth: '540px',
            lineHeight: 1.55
          }}>
            AI-powered early warning. Smarter decisions. Safer communities.
            Distributed sensor networks delivering real-time hydrodynamic modeling and blockage alerts to field engineers.
          </p>
        </div>

        {/* Small monitoring indicators with clearly labelled DEMO data */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '6px'
        }}>
          {/* Indicator 1: Water Level Monitoring */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8' }}>
                <Waves size={16} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Water Level
                </span>
              </div>
              <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                DEMO
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>3.42 m</span>
              <span style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 600 }}>Moderate Surge</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Ultrasonic telemetry at Basin Weir #WZ-04
            </div>
          </div>

          {/* Indicator 2: Drainage Blockage Detection */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F87171' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Drainage Blockage
                </span>
              </div>
              <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                DEMO
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#F87171', fontFamily: 'var(--font-mono)' }}>87%</span>
              <span style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 600 }}>Debris Alert</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Culvert Line C-8 Acoustic AI Resonance
            </div>
          </div>

          {/* Indicator 3: AI-Based Risk Assessment */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(147, 197, 253, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93C5FD' }}>
                <Cpu size={16} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Risk Inundation
                </span>
              </div>
              <span style={{ fontSize: '9px', background: 'rgba(147, 197, 253, 0.2)', color: '#93C5FD', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                DEMO
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>94.2%</span>
              <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 600 }}>+90 Min Window</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Predictive Runoff Convolution Model
            </div>
          </div>

          {/* Indicator 4: Offline-Ready Edge Intelligence */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ADE80' }}>
                <Layers size={16} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Edge Intelligence
                </span>
              </div>
              <span style={{ fontSize: '9px', background: 'rgba(74, 222, 128, 0.2)', color: '#86EFAC', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                DEMO
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#4ADE80', fontFamily: 'var(--font-mono)' }}>LoRa Mesh</span>
              <span style={{ fontSize: '11px', color: '#86EFAC', fontWeight: 600 }}>18ms Edge Infer</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Zero cloud dependency failover ready
            </div>
          </div>
        </div>

        {/* Small illustrative map showing fictional monitoring nodes and risk markers */}
        <div style={{ marginTop: '4px' }}>
          <GisMiniMap />
        </div>
      </div>

      {/* FOOTER BAR: Subtle network-connectivity indicator that does not pretend to show real connectivity */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#38BDF8',
            boxShadow: '0 0 8px #38BDF8'
          }} />
          <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
            Network Telemetry: <strong style={{ color: '#E2E8F0' }}>Simulated Testbed Feed (14 Nodes Online)</strong>
          </span>
        </div>

        <div style={{
          fontSize: '11px',
          color: '#64748B',
          background: 'rgba(0,0,0,0.4)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          Simulated testbed feed &bull; Hackathon prototype
        </div>
      </div>
    </div>
  );
}
