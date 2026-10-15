import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Waves,
  ShieldCheck,
  MapPin,
  Clock,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Droplets,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  AlertOctagon,
  LifeBuoy,
  Radio
} from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';

const BASE_PUBLIC_ALERTS = [
  {
    id: 'ALT-PUB-2026-091',
    zone: 'North Catchment & River Basin Weir A',
    severity: 'CRITICAL',
    title: 'Flash Inundation Warning — Lowland River Overflow',
    description: 'Sustained precipitation has caused River Basin Weir A to reach 3.8m (Warning Stage 3.5m). Residents within 200m of low-lying floodplains are advised to move to higher ground immediately.',
    issuedAt: '12 minutes ago',
    validUntil: 'Next 6 hours',
    status: 'ACTIVE EVACUATION ADVISORY',
    affectedWards: ['Ward 4 (Riverside)', 'Ward 9 (Weir Colony)', 'North Bridge Sector']
  },
  {
    id: 'ALT-PUB-2026-088',
    zone: 'South Industrial Corridor & Culvert C-8',
    severity: 'WARNING',
    title: 'Severe Waterlogging & Stormwater Backflow Alert',
    description: 'Acoustic blockage sensors indicate rapid urban runoff obstruction in Culvert C-8. Waterlogging up to 1.5 feet expected on Highway Junction 14 and Sub-arterial roads.',
    issuedAt: '45 minutes ago',
    validUntil: 'Next 4 hours',
    status: 'TRAFFIC DIVERSION IN EFFECT',
    affectedWards: ['Ward 14 (Industrial Area)', 'Highway Sector B']
  },
  {
    id: 'ALT-PUB-2026-079',
    zone: 'Eastern Siphon Retention Basin Sector',
    severity: 'MODERATE',
    title: 'Precautionary Inundation Advisory',
    description: 'Retention basin capacity currently at 68%. Controlled discharge gates scheduled for activation at 20:00 hrs. Fishermen and canal workers advised to vacate channel banks.',
    issuedAt: '2 hours ago',
    validUntil: 'Next 12 hours',
    status: 'MONITORING INTENSIFIED',
    affectedWards: ['Ward 21', 'Ward 22 (Canal Belt)']
  },
  {
    id: 'ALT-PUB-2026-071',
    zone: 'Central Metropolitan Commercial Ring',
    severity: 'NORMAL',
    title: 'Drainage Network Flowing Normally',
    description: 'Stormwater pumping stations operating under nominal load. All automated flood sluice gates cleared and functioning.',
    issuedAt: '3 hours ago',
    validUntil: 'Next 24 hours',
    status: 'NORMAL SURVEILLANCE',
    affectedWards: ['Central CBD', 'Underpass Hub 1 & 2']
  }
];

export default function PublicAlertsPage({ onBackToLogin }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { broadcastHistory } = useFloodGuard();

  const combinedAlerts = useMemo(() => {
    const liveItems = (broadcastHistory || []).map(b => ({
      id: b.id,
      zone: b.area,
      severity: b.level === 'DANGER' ? 'CRITICAL' : b.level === 'WARNING' ? 'WARNING' : b.level === 'WATCH' ? 'MODERATE' : 'NORMAL',
      title: `${b.level} Citizen Broadcast: ${b.area}`,
      description: b.message,
      issuedAt: b.sentAt || 'Recently',
      validUntil: 'Live Municipal Warning',
      status: b.level === 'DANGER' ? 'EMERGENCY CITIZEN ALERT' : 'MUNICIPAL BROADCAST',
      affectedWards: [b.area],
      isLiveDispatched: true
    }));
    return [...liveItems, ...BASE_PUBLIC_ALERTS];
  }, [broadcastHistory]);

  const filteredAlerts = combinedAlerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'ALL' || alert.severity === filterSeverity;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBackToLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--gov-blue-700)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Employee Login</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          background: 'var(--water-cyan-50)',
          color: 'var(--water-cyan-600)',
          border: '1px solid var(--water-cyan-100)',
          padding: '6px 14px',
          borderRadius: '999px',
          fontWeight: 600
        }}>
          <LifeBuoy size={15} />
          <span>Public Citizen Disaster Information Portal &bull; Live Early Warning Bulletin</span>
        </div>
      </div>

      {/* Hero Banner for Public Page */}
      <div style={{
        background: 'linear-gradient(135deg, var(--gov-blue-900) 0%, var(--gov-blue-700) 100%)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              Citizen Public Safety Feed
            </span>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              Auto-refreshed every 2 minutes
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            Active Flood Advisories &amp; Drainage Waterlogging Bulletin
          </h1>
          <p style={{ fontSize: '15px', color: '#E0E7FF', marginTop: '10px', lineHeight: 1.6 }}>
            Issued by the State &amp; District Disaster Management Authorities. Continuous AI IoT telemetry from river gauges, stormwater siphons, and municipal retention basins.
          </p>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="#93C5FD" />
              <span style={{ fontSize: '13px' }}>
                State Disaster Control Room: <strong>1070</strong> (Toll Free)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="#93C5FD" />
              <span style={{ fontSize: '13px' }}>
                District Flood Cell: <strong>1077</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="#93C5FD" />
              <span style={{ fontSize: '13px' }}>
                National Emergency: <strong>112</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demonstration notice */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0 }} />
        <div>
          <strong>Demonstration Environment Notice:</strong> The alerts displayed on this public view are simulated sample bulletins generated by the FloodGuard AI hydrodynamic testbed. In case of actual weather emergencies, consult your local district collectorate and official meteorological warnings.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by zone, affected ward, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'MODERATE', 'NORMAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: '999px',
                border: '1px solid',
                borderColor: filterSeverity === sev ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                background: filterSeverity === sev ? 'var(--gov-blue-700)' : 'var(--bg-primary)',
                color: filterSeverity === sev ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)'
          }}>
            <CheckCircle size={36} color="var(--status-normal)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No alerts matching the selected criteria</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              All drainage and flood channels in this filter are currently operating within safe limits.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            let badgeBg = 'var(--status-normal-bg)';
            let badgeColor = 'var(--status-normal)';
            let badgeBorder = 'var(--status-normal-border)';
            let IconComponent = CheckCircle;

            if (alert.severity === 'CRITICAL') {
              badgeBg = 'var(--status-critical-bg)';
              badgeColor = 'var(--status-critical)';
              badgeBorder = 'var(--status-critical-border)';
              IconComponent = AlertOctagon;
            } else if (alert.severity === 'WARNING') {
              badgeBg = 'var(--status-warning-bg)';
              badgeColor = 'var(--status-warning)';
              badgeBorder = 'var(--status-warning-border)';
              IconComponent = AlertTriangle;
            } else if (alert.severity === 'MODERATE') {
              badgeBg = 'var(--water-cyan-50)';
              badgeColor = 'var(--water-cyan-600)';
              badgeBorder = 'var(--water-cyan-100)';
              IconComponent = Waves;
            }

            return (
              <div
                key={alert.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderLeft: `5px solid ${badgeColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '4px',
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`
                    }}>
                      <IconComponent size={14} />
                      <span>{alert.severity}</span>
                    </div>

                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {alert.zone}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>Issued: {alert.issuedAt}</span>
                    </div>
                    <span>&bull;</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{alert.id}</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {alert.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {alert.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Affected Sectors:</span>
                    {alert.affectedWards.map(ward => (
                      <span
                        key={ward}
                        style={{
                          background: 'var(--bg-tertiary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontWeight: 500
                        }}
                      >
                        {ward}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    fontWeight: 700,
                    color: badgeColor,
                    letterSpacing: '0.03em'
                  }}>
                    {alert.status}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Safety Guidelines for Citizens */}
      <div style={{
        marginTop: '16px',
        padding: '24px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
          General Monsoon &amp; Flood Preparedness Protocol
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-blue-700)', marginBottom: '4px' }}>
              1. Avoid Waterlogged Underpasses
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Do not drive or walk through flooded culverts and underpasses. Moving water just 6 inches deep can knock an adult off balance.
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-blue-700)', marginBottom: '4px' }}>
              2. Electrical &amp; Substation Hazards
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Stay away from fallen power cables and street transformers during drainage backflows. Report open junctions to 112 immediately.
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-blue-700)', marginBottom: '4px' }}>
              3. Keep Emergency Kits Accessible
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Maintain battery power banks, drinking water canisters, torches, waterproof document pouches, and prescribed medicines in elevated spaces.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
