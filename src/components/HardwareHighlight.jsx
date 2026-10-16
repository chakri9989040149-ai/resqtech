import React, { useState } from 'react';
import { Shield, Anchor, Droplets } from 'lucide-react';

/**
 * ============================================================================
 * HARDWARE PROTECTION HIGHLIGHT COMPONENT
 * ============================================================================
 * Highlights the ruggedized physical enclosure and protective grid guard
 * of the SensaFlow municipal IoT drain sensors.
 * 
 * All copy and metadata are centralized in HARDWARE_SECTION_CONTENT below
 * for ease of editing and maintenance.
 * ============================================================================
 */

export const HARDWARE_SECTION_CONTENT = {
  badge: 'HARDWARE',
  title: 'Built to Survive the Drain',
  subtitle: 'Rugged, waterproof hardware protected by a strong grid guard, so sensors keep working where debris and floodwater are worst.',
  imagePath: 'images/sensor-hardware.jpg',
  fallbackImagePath: 'assets/images/drainage-sensor.jpg',
  imageAlt: 'SensaFlow rugged stormwater drain sensor enclosed in heavy-duty impact-resistant protective grid guard',
  cards: [
    {
      id: 'grid-guard',
      icon: Shield,
      title: 'Strong Grid Guard',
      description: 'A high-strength grid fence shields the sensor from floating waste and impact, so debris cannot hit or damage the device.'
    },
    {
      id: 'firm-mount',
      icon: Anchor,
      title: 'Stays Firmly in Place',
      description: 'The guard and mounting keep the device secure in its position, so readings stay accurate through heavy flow and storms.'
    },
    {
      id: 'waterproof-build',
      icon: Droplets,
      title: 'Waterproof, High-Quality Build',
      description: 'Built with high-quality, water-resistant materials designed for wet, dirty and harsh drain conditions.'
    }
  ],
  chips: [
    'Debris-resistant',
    'Waterproof design',
    'Durable materials'
  ]
  /*
   * ==========================================================================
   * NOTE: TECHNICAL SPECIFICATIONS PLACEHOLDER
   * ==========================================================================
   * Do NOT invent technical specifications, ratings (such as IP68), warranty
   * terms, certifications, or lifespan numbers.
   * If specific technical specifications or test laboratory certifications
   * are provided in the future, add them below:
   * 
   * technicalSpecs: [
   *   // Future specs to be supplied by client
   * ]
   * ==========================================================================
   */
};

export default function HardwareHighlight({ className = '' }) {
  const [imageError, setImageError] = useState(false);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);

  // Determine image source with Vite public BASE_URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  const currentImageSrc = useFallbackSrc
    ? `${cleanBase}${HARDWARE_SECTION_CONTENT.fallbackImagePath}`
    : `${cleanBase}${HARDWARE_SECTION_CONTENT.imagePath}`;

  const handleImageError = () => {
    if (!useFallbackSrc) {
      // Try alternate asset path first
      setUseFallbackSrc(true);
    } else {
      // Fallback to crisp inline SVG illustration
      setImageError(true);
    }
  };

  return (
    <section
      aria-labelledby="hardware-protection-heading"
      className={`hardware-highlight-section ${className}`}
      style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '32px auto 24px auto',
        padding: '0 16px',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .hardware-highlight-card {
          animation: hardwareFadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
          border: 1px solid rgba(13, 148, 136, 0.22);
          box-shadow: 0 4px 20px -2px rgba(13, 148, 136, 0.08), var(--shadow-sm);
        }
        @keyframes hardwareFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hardware-highlight-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        .hardware-grid-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: center;
        }
        .hardware-image-col {
          order: 1;
        }
        .hardware-content-col {
          order: 2;
        }
        @media (min-width: 900px) {
          .hardware-grid-container {
            grid-template-columns: 5fr 6fr;
            gap: 36px;
          }
          .hardware-image-col {
            order: 2;
          }
          .hardware-content-col {
            order: 1;
          }
        }
        .hardware-chip-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          background: rgba(13, 148, 136, 0.08);
          color: var(--water-cyan-600);
          border: 1px solid rgba(13, 148, 136, 0.2);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .hardware-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          transition: border-color 0.2s ease, transform 0.15s ease;
        }
        .hardware-feature-row:hover {
          border-color: rgba(37, 99, 235, 0.3);
          transform: translateY(-1px);
        }
      `}</style>

      <div
        className="hardware-highlight-card"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative glow accents matching SensaFlow teal & blue palette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, rgba(37, 99, 235, 0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(13, 148, 136, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="hardware-grid-container" style={{ position: 'relative', zIndex: 1 }}>
          
          {/* ================================================================= */}
          {/* CONTENT COLUMN: Badge, Title, Subtitle, 3 Cards, Tag Chips       */}
          {/* ================================================================= */}
          <div className="hardware-content-col" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Header Area */}
            <div>
              {/* Small "HARDWARE" label badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#0D9488',
                    background: 'rgba(13, 148, 136, 0.12)',
                    border: '1px solid rgba(13, 148, 136, 0.28)',
                    borderRadius: '4px',
                    padding: '2px 8px'
                  }}
                >
                  {HARDWARE_SECTION_CONTENT.badge}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  &bull; Municipal IoT Sensor Infrastructure
                </span>
              </div>

              {/* Main Heading */}
              <h2
                id="hardware-protection-heading"
                style={{
                  fontSize: 'clamp(20px, 2.2vw, 26px)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px 0',
                  lineHeight: 1.25
                }}
              >
                {HARDWARE_SECTION_CONTENT.title}
              </h2>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                  maxWidth: '560px'
                }}
              >
                {HARDWARE_SECTION_CONTENT.subtitle}
              </p>
            </div>

            {/* Three Highlight Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {HARDWARE_SECTION_CONTENT.cards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div key={card.id} className="hardware-feature-row">
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(13, 148, 136, 0.12)',
                        border: '1px solid rgba(13, 148, 136, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComponent size={18} color="#0D9488" />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '0 0 2px 0'
                        }}
                      >
                        {card.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.45,
                          margin: 0
                        }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tag Chips Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
              {HARDWARE_SECTION_CONTENT.chips.map((chip, index) => (
                <span key={index} className="hardware-chip-pill">
                  {chip}
                </span>
              ))}
            </div>

          </div>

          {/* ================================================================= */}
          {/* IMAGE COLUMN: Hardware Photo with Aspect Ratio & Fallback SVG    */}
          {/* ================================================================= */}
          <div
            className="hardware-image-col"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md), 0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-secondary)',
              aspectRatio: '4 / 3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!imageError ? (
              <img
                src={currentImageSrc}
                alt={HARDWARE_SECTION_CONTENT.imageAlt}
                loading="lazy"
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              /* High-Quality Clean Fallback Illustration: Drain sensor behind protective mesh guard */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  position: 'relative'
                }}
                aria-label="Drain sensor hardware illustration behind protective steel grid guard"
              >
                <svg
                  width="140"
                  height="120"
                  viewBox="0 0 140 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginBottom: '12px' }}
                >
                  {/* Concrete Drain Well Wall */}
                  <rect x="10" y="10" width="120" height="100" rx="8" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" fill="#0B132B" />
                  
                  {/* Waterline Inundation Wave */}
                  <path d="M10 85 Q 40 75, 70 85 T 130 85 L 130 110 L 10 110 Z" fill="rgba(6, 182, 212, 0.2)" />
                  <path d="M10 85 Q 40 75, 70 85 T 130 85" stroke="#06B6D4" strokeWidth="1.5" />
                  
                  {/* Ultrasonic Sensor Enclosure Cylindrical Body */}
                  <rect x="52" y="24" width="36" height="42" rx="4" fill="#1E293B" stroke="#0D9488" strokeWidth="2" />
                  {/* Transducer / Radar Dome */}
                  <circle cx="70" cy="58" r="7" fill="#0D9488" />
                  <circle cx="70" cy="58" r="3" fill="#38BDF8" />
                  {/* Telemetry LED Indicator */}
                  <circle cx="70" cy="32" r="2.5" fill="#10B981" />
                  
                  {/* Heavy-Duty Outer Grid Guard Protective Mesh */}
                  <rect x="36" y="16" width="68" height="66" rx="6" stroke="#60A5FA" strokeWidth="2.5" fill="none" opacity="0.9" />
                  {/* Vertical Protective Grid Bars */}
                  <line x1="48" y1="16" x2="48" y2="82" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 3" />
                  <line x1="60" y1="16" x2="60" y2="82" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 3" />
                  <line x1="72" y1="16" x2="72" y2="82" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 3" />
                  <line x1="84" y1="16" x2="84" y2="82" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 3" />
                  <line x1="94" y1="16" x2="94" y2="82" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="1 3" />
                  {/* Horizontal Protective Grid Bars */}
                  <line x1="36" y1="30" x2="104" y2="30" stroke="#60A5FA" strokeWidth="1.5" />
                  <line x1="36" y1="46" x2="104" y2="46" stroke="#60A5FA" strokeWidth="1.5" />
                  <line x1="36" y1="62" x2="104" y2="62" stroke="#60A5FA" strokeWidth="1.5" />
                  
                  {/* Heavy Duty Mounting Brackets */}
                  <rect x="26" y="24" width="10" height="6" rx="1" fill="#475569" />
                  <rect x="104" y="24" width="10" height="6" rx="1" fill="#475569" />
                  <circle cx="31" cy="27" r="1.5" fill="#E2E8F0" />
                  <circle cx="109" cy="27" r="1.5" fill="#E2E8F0" />
                </svg>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.04em' }}>
                  PROTECTIVE GRID MESH GUARD
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                  SensaFlow Ultrasonic Drainage Transducer
                </div>
              </div>
            )}

            {/* Subtle Overlay Badge on image */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.78)',
                backdropFilter: 'blur(4px)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Shield size={12} color="#0D9488" />
              <span>Protective Enclosure</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
