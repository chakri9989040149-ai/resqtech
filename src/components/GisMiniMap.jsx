import React, { useState } from 'react';
import { Radio } from 'lucide-react';

const NODES = [
  {
    id: 'WZ-04',
    name: 'River Basin Weir North',
    x: 28,
    y: 35,
    status: 'warning',
    waterLevel: '3.4m',
    threshold: '4.0m',
    blockage: '12%',
    type: 'Ultrasonic Depth'
  },
  {
    id: 'C-08',
    name: 'Urban Culvert Line C-8',
    x: 62,
    y: 42,
    status: 'critical',
    waterLevel: '2.8m',
    threshold: '2.5m',
    blockage: '87%',
    type: 'Acoustic AI Blockage'
  },
  {
    id: 'SB-12',
    name: 'Siphon Retention Basin',
    x: 45,
    y: 72,
    status: 'normal',
    waterLevel: '1.2m',
    threshold: '3.0m',
    blockage: '4%',
    type: 'Pressure Transducer'
  },
  {
    id: 'P-03',
    name: 'CBD Underpass Sump',
    x: 78,
    y: 65,
    status: 'warning',
    waterLevel: '1.9m',
    threshold: '2.2m',
    blockage: '42%',
    type: 'IoT Optical Flow'
  }
];

export default function GisMiniMap({ maintenanceDrains = [] }) {
  const [selectedNode, setSelectedNode] = useState(NODES[1]); // C-08 selected by default

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px',
      color: '#F8FAFC',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} color="#38BDF8" style={{ animation: 'pulse-ring 2s infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#93C5FD' }}>
            GIS Telemetry Radar — Fictional Grid
          </span>
        </div>
        <span style={{
          fontSize: '11px',
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#38BDF8',
          padding: '2px 8px',
          borderRadius: '999px',
          fontFamily: 'var(--font-mono)'
        }}>
          DEMO FEED
        </span>
      </div>

      {/* SVG Canvas Map */}
      <div style={{ position: 'relative', height: '170px', borderRadius: 'var(--radius-sm)', background: 'radial-gradient(ellipse at center, #0B192C 0%, #060B16 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
        {/* Radar concentric grid lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Simulated River Vector Path */}
          <path d="M 0 50 Q 80 80, 160 55 T 320 110 T 450 70" fill="none" stroke="rgba(14, 165, 233, 0.35)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 0 50 Q 80 80, 160 55 T 320 110 T 450 70" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* Drainage channels */}
          <line x1="220" y1="0" x2="210" y2="170" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="100" y1="170" x2="160" y2="55" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="2" strokeDasharray="3 3" />

          {/* LoRa Gateway Coverage Circles (Centered at 52%, 52%) */}
          <circle cx="52%" cy="52%" r="42" fill="rgba(56, 189, 248, 0.05)" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          <circle cx="52%" cy="52%" r="78" fill="rgba(14, 165, 233, 0.02)" stroke="#0284C7" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          
          {/* Connection Lines from each Node to the Central LoRa Gateway */}
          {NODES.map(node => {
            let linkColor = '#22C55E'; // Excellent/Good
            let strokeDash = 'none';
            if (node.id === 'C-08') {
              linkColor = '#38BDF8'; // Active LoRa Link
              strokeDash = '2 2';
            } else if (node.status === 'critical') {
              linkColor = '#EF4444';
              strokeDash = '3 3';
            }
            return (
              <line
                key={`link-${node.id}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2="52%"
                y2="52%"
                stroke={linkColor}
                strokeWidth="1.2"
                strokeDasharray={strokeDash}
                opacity="0.65"
              />
            );
          })}
        </svg>

        {/* Central LoRa Gateway Marker */}
        <div style={{
          position: 'absolute',
          top: '52%',
          left: '52%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284C7, #0F766E)',
            border: '2px solid #38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.8)'
          }}>
            <Radio size={10} color="#FFFFFF" />
          </div>
          <span style={{
            fontSize: '8px',
            fontWeight: 800,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #38BDF8',
            color: '#38BDF8',
            padding: '1px 3px',
            borderRadius: '2px',
            marginTop: '2px',
            whiteSpace: 'nowrap'
          }}>
            GW-HYD-01 (LoRa)
          </span>
        </div>

        {/* Nodes placed on map */}
        {NODES.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const mDrain = maintenanceDrains.find(d => d.id.includes(node.id));
          const mStatus = mDrain?.status || (node.status === 'critical' ? 'OVERDUE' : node.status === 'warning' ? 'DUE SOON' : 'OK');

          let markerColor = '#22C55E';
          if (mStatus === 'OVERDUE') markerColor = '#EF4444';
          else if (mStatus === 'DUE SOON') markerColor = '#F59E0B';

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              aria-label={`Monitoring Node ${node.name} maintenance status ${mStatus}`}
              style={{
                position: 'absolute',
                top: `${node.y}%`,
                left: `${node.x}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                zIndex: isSelected ? 10 : 2
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Pulsing ring for OVERDUE / DUE SOON */}
                {mStatus === 'OVERDUE' && (
                  <span style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.35)',
                    animation: 'pulse-ring 1.8s infinite'
                  }} />
                )}
                {mStatus === 'DUE SOON' && (
                  <span style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.25)'
                  }} />
                )}

                {/* Node pin */}
                <div style={{
                  width: isSelected ? '14px' : '10px',
                  height: isSelected ? '14px' : '10px',
                  borderRadius: '50%',
                  backgroundColor: markerColor,
                  border: '2px solid #FFFFFF',
                  boxShadow: `0 0 10px ${markerColor}`
                }} />

                {/* Node label */}
                <span style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: isSelected ? '#38BDF8' : '#CBD5E1',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {node.id}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Node Info Inspector Card */}
      {selectedNode && (() => {
        const mDrain = maintenanceDrains.find(d => d.id.includes(selectedNode.id));
        const mStatus = mDrain?.status || (selectedNode.status === 'critical' ? 'OVERDUE' : selectedNode.status === 'warning' ? 'DUE SOON' : 'OK');
        const statusBorderColor = mStatus === 'OVERDUE' ? '#EF4444' : mStatus === 'DUE SOON' ? '#F59E0B' : '#22C55E';

        return (
          <div style={{
            marginTop: '10px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderLeft: `4px solid ${statusBorderColor}`
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC' }}>
                  {selectedNode.id}: {selectedNode.name}
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: `${statusBorderColor}25`,
                  color: statusBorderColor,
                  border: `1px solid ${statusBorderColor}50`
                }}>
                  Maintenance: {mStatus}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
                Water: <strong style={{ color: '#E0F2FE' }}>{selectedNode.waterLevel}</strong> &bull; Next Upkeep: <strong style={{ color: '#CBD5E1' }}>{mDrain?.nextScheduled || '2026-10-20'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>Blockage</div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: (mDrain?.blockagePct || 50) > 60 ? '#F87171' : '#FBBF24',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {mDrain ? `${mDrain.blockagePct}%` : selectedNode.blockage}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>Waste Load</div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#38BDF8',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {mDrain ? `${mDrain.wastePct}%` : '24%'}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
