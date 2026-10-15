import React from 'react';
import { Radio, AlertTriangle, CheckCircle2, Wrench, Shield, Droplets, MapPin, Activity } from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';

export default function GisMiniMap({ maintenanceDrains = [] }) {
  const {
    drainNodes,
    selectedMapNodeId,
    setSelectedMapNodeId,
    simulateSensorFailure,
    restorePrimarySensor,
    markDrainCleared
  } = useFloodGuard();

  const selectedNode = (drainNodes || []).find(n => n.id === selectedMapNodeId) || drainNodes?.[0];

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      color: '#F8FAFC',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} color="#38BDF8" style={{ animation: 'pulse-ring 2s infinite' }} />
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#93C5FD' }}>
              Hydrological GIS Radar &bull; IoT Sensing Grid
            </span>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              {drainNodes?.length || 6} Municipal Nodes Online &bull; Unified Telemetry Bus
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '10px',
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#38BDF8',
          padding: '2px 8px',
          borderRadius: '999px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700
        }}>
          [SIMULATED FEED]
        </span>
      </div>

      {/* SVG Canvas Map */}
      <div style={{
        position: 'relative',
        height: '210px',
        borderRadius: 'var(--radius-sm)',
        background: 'radial-gradient(ellipse at center, #0B192C 0%, #060B16 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Radar concentric grid lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <defs>
            <pattern id="radar-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radar-grid)" />

          {/* Simulated River Vector Path */}
          <path d="M 0 50 Q 80 80, 160 55 T 320 110 T 450 70" fill="none" stroke="rgba(14, 165, 233, 0.35)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 0 50 Q 80 80, 160 55 T 320 110 T 450 70" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="6 4" />

          {/* Drainage channels interconnects */}
          <line x1="20%" y1="25%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="85%" y1="30%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="62%" y1="42%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="28%" y1="35%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="78%" y1="65%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <line x1="45%" y1="72%" x2="52%" y2="52%" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="2" strokeDasharray="3 3" />

          {/* LoRa Gateway Range Circles */}
          <circle cx="52%" cy="52%" r="48" fill="rgba(56, 189, 248, 0.04)" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="52%" cy="52%" r="92" fill="rgba(14, 165, 233, 0.02)" stroke="#0284C7" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

          {/* Dynamic Link Lines to each Node from Gateway */}
          {(drainNodes || []).map(node => {
            const isSelected = selectedNode?.id === node.id;
            let linkColor = '#22C55E';
            if (node.status === 'CRITICAL' || node.blockagePct >= 60) linkColor = '#EF4444';
            else if (node.status === 'WARNING') linkColor = '#F59E0B';

            return (
              <line
                key={`link-${node.id}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2="52%"
                y2="52%"
                stroke={isSelected ? '#38BDF8' : linkColor}
                strokeWidth={isSelected ? '2' : '1.2'}
                strokeDasharray={isSelected ? 'none' : '3 3'}
                opacity={isSelected ? 0.9 : 0.5}
              />
            );
          })}
        </svg>

        {/* Central LoRa Gateway Hub Marker */}
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
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284C7, #0F766E)',
            border: '2px solid #38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.8)'
          }}>
            <Radio size={12} color="#FFFFFF" />
          </div>
          <span style={{
            fontSize: '8px',
            fontWeight: 800,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #38BDF8',
            color: '#38BDF8',
            padding: '1px 4px',
            borderRadius: '3px',
            marginTop: '2px',
            whiteSpace: 'nowrap'
          }}>
            GW-HYD-01 (LoRa Central)
          </span>
        </div>

        {/* Nodes Placed on SVG Canvas from Unified Store */}
        {(drainNodes || []).map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isCritical = node.status === 'CRITICAL' || node.blockagePct >= 60;
          const isWarning = node.status === 'WARNING';
          const isFailover = node.sensorHealth === 'BACKUP_ACTIVE';

          let pinColor = '#22C55E';
          if (isCritical) pinColor = '#EF4444';
          else if (isWarning) pinColor = '#F59E0B';

          return (
            <button
              key={node.id}
              onClick={() => setSelectedMapNodeId(node.id)}
              aria-label={`Monitoring Node ${node.id} ${node.name}`}
              style={{
                position: 'absolute',
                top: `${node.y}%`,
                left: `${node.x}%`,
                transform: 'translate(-50%, -50%)',
                background: 'none',
                border: 'none',
                padding: '6px',
                cursor: 'pointer',
                zIndex: isSelected ? 12 : 3
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Pulsing ring if Selected or Critical */}
                {(isSelected || isCritical) && (
                  <span style={{
                    position: 'absolute',
                    width: isSelected ? '28px' : '22px',
                    height: isSelected ? '28px' : '22px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.35)',
                    animation: 'pulse-ring 1.8s infinite'
                  }} />
                )}

                {/* Node pin */}
                <div style={{
                  width: isSelected ? '16px' : '12px',
                  height: isSelected ? '16px' : '12px',
                  borderRadius: '50%',
                  backgroundColor: pinColor,
                  border: isSelected ? '3px solid #38BDF8' : '2px solid #FFFFFF',
                  boxShadow: `0 0 ${isSelected ? '14px #38BDF8' : '8px ' + pinColor}`
                }} />

                {/* Label badge */}
                <span style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: isSelected ? '#38BDF8' : '#CBD5E1',
                  background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0.75)',
                  border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {node.id.replace('NODE-', '')} {isFailover ? '⚡' : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Rich Node Details Inspector Card */}
      {selectedNode && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderLeft: `5px solid ${selectedNode.status === 'CRITICAL' ? '#EF4444' : selectedNode.status === 'WARNING' ? '#F59E0B' : '#10B981'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#F8FAFC' }}>
                  {selectedNode.id}: {selectedNode.name}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: selectedNode.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: selectedNode.status === 'CRITICAL' ? '#EF4444' : '#10B981'
                }}>
                  {selectedNode.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                {selectedNode.location} &bull; Zone: {selectedNode.zone}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>WATER DEPTH</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.waterLevel}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>BLOCKAGE INDEX</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: selectedNode.blockagePct >= 50 ? '#EF4444' : '#F59E0B', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.blockagePct}%
                </div>
              </div>
            </div>
          </div>

          {/* Sensor State & Assigned Team Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            fontSize: '11px'
          }}>
            {/* Primary Sensor */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '10px' }}>
                <span>PRIMARY SENSOR</span>
                <span style={{
                  fontWeight: 800,
                  color: selectedNode.primarySensor?.status === 'FAILED' ? '#EF4444' : '#10B981'
                }}>
                  {selectedNode.primarySensor?.status || 'ACTIVE'}
                </span>
              </div>
              <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                {selectedNode.primarySensor?.name}
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                Reading: {selectedNode.primarySensor?.reading || selectedNode.waterLevel}
              </div>
            </div>

            {/* Backup Sensor & Failover State */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '10px' }}>
                <span>BACKUP SENSOR</span>
                <span style={{
                  fontWeight: 800,
                  color: selectedNode.sensorHealth === 'BACKUP_ACTIVE' ? '#38BDF8' : '#64748B'
                }}>
                  {selectedNode.backupSensor?.status || 'STANDBY'}
                </span>
              </div>
              <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                {selectedNode.backupSensor?.name}
              </div>
              <div style={{ fontSize: '10px', color: selectedNode.sensorHealth === 'BACKUP_ACTIVE' ? '#38BDF8' : '#64748B', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.sensorHealth === 'BACKUP_ACTIVE' ? '⚡ Dual-Sensor Failover Active' : 'Standby Hot-Spare'}
              </div>
            </div>

            {/* Assigned Cleaning Team */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)', gridColumn: '1 / -1' }}>
              <div style={{ color: '#94A3B8', fontSize: '10px' }}>ASSIGNED RESPONSE UNIT</div>
              <div style={{ fontWeight: 700, color: selectedNode.assignedWorker ? '#38BDF8' : '#F59E0B', marginTop: '2px' }}>
                {selectedNode.assignedWorker ? (
                  <span>🚜 {selectedNode.assignedWorker}</span>
                ) : (
                  <span>⚠️ No cleaning worker assigned yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedNode.primarySensor?.status !== 'FAILED' ? (
              <button
                type="button"
                onClick={() => simulateSensorFailure(selectedNode.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Simulate Primary Sensor Failure
              </button>
            ) : (
              <button
                type="button"
                onClick={() => restorePrimarySensor(selectedNode.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Restore Primary Sensor
              </button>
            )}

            {selectedNode.blockagePct >= 25 && selectedNode.operationalStatus !== 'CLEARED' && (
              <button
                type="button"
                onClick={() => markDrainCleared(selectedNode.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Mark Blockage Cleared
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
