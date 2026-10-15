import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  LifeBuoy,
  Building,
  CheckCircle2,
  Send,
  Wrench,
  Activity,
  Radio,
  Clock,
  Shield,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Users
} from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';

export default function OverviewCardDrawer({ onClose, onSwitchTab }) {
  const {
    activeDrawer,
    floodAlerts,
    drainNodes,
    rescueTeams,
    reliefCamps,
    activityLog,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    dispatchRescueTeam,
    recallRescueTeam,
    reassignRescueTeam,
    addTeamEquipment,
    openReliefCamp,
    closeReliefCamp,
    updateCampOccupancy,
    requestCampSupplies,
    dispatchInspectionCrew,
    markDrainCleared,
    markDrainUnderMaintenance,
    requestDrainRecheck,
    triggerSendAlertForArea
  } = useFloodGuard();

  // Inline modal/action states
  const [selectedAlertForDispatch, setSelectedAlertForDispatch] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [dispatchEta, setDispatchEta] = useState(12);

  const [selectedAlertForCamp, setSelectedAlertForCamp] = useState(null);
  const [selectedCampToOpen, setSelectedCampToOpen] = useState('');
  const [newCampName, setNewCampName] = useState('');
  const [newCampCapacity, setNewCampCapacity] = useState(600);
  const [newCampWard, setNewCampWard] = useState('Ward 4 (Riverside)');
  const [isCreatingNewCamp, setIsCreatingNewCamp] = useState(false);

  if (!activeDrawer) return null;

  const availableTeams = rescueTeams.filter(t => t.status === 'AVAILABLE' || t.status === 'STANDBY');
  const suspectedDrains = drainNodes.filter(d => d.blockagePct >= 25 && d.operationalStatus !== 'CLEARED');

  const handleConfirmTeamDispatch = () => {
    if (!selectedTeamId || !selectedAlertForDispatch) return;
    dispatchRescueTeam(selectedTeamId, selectedAlertForDispatch.zone, dispatchEta, selectedAlertForDispatch.id);
    setSelectedAlertForDispatch(null);
    setSelectedTeamId('');
  };

  const handleConfirmOpenCamp = () => {
    if (isCreatingNewCamp) {
      if (!newCampName) return;
      openReliefCamp({
        name: newCampName,
        ward: newCampWard,
        capacity: newCampCapacity
      });
    } else {
      if (!selectedCampToOpen) return;
      openReliefCamp({ id: selectedCampToOpen });
    }
    setSelectedAlertForCamp(null);
    setIsCreatingNewCamp(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          color: 'var(--text-primary)',
          boxSizing: 'border-box'
        }}
      >
        {/* DRAWER HEADER */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#3B82F6',
                background: 'rgba(59, 130, 246, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                [SIMULATED DATA]
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interactive Operational Panel</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0' }}>
              {activeDrawer === 'alerts' && 'Active Flood Alerts & Rapid Dispatch'}
              {activeDrawer === 'blockages' && 'Suspected Silt & Debris Blockages'}
              {activeDrawer === 'nodes' && 'Drain Telemetry Nodes Health'}
              {activeDrawer === 'teams' && 'Rescue Team Deployment Management'}
              {activeDrawer === 'camps' && 'Relief Shelter Operations & Logistics'}
              {activeDrawer === 'activity' && 'Global Incident Audit & Activity Log'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* DRAWER BODY CONTENT */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

          {/* =========================================================================
              DRAWER 1: ACTIVE FLOOD ALERTS
             ========================================================================= */}
          {activeDrawer === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Directly dispatch field teams, open relief centers, or trigger citizen warnings for each inundation alert.
              </div>

              {floodAlerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-medium)'}`,
                      borderLeft: `5px solid ${isCritical ? '#EF4444' : '#F59E0B'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--gov-blue-700)" />
                          <span>{alert.zone} &bull; {alert.waterLevel}</span>
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isCritical ? '#EF4444' : '#F59E0B',
                        background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {alert.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {alert.riskReason}
                    </div>

                    {/* Assigned Team Chip */}
                    {alert.assignedTeamId && (
                      <div style={{
                        fontSize: '11px',
                        color: '#10B981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle2 size={13} />
                        <span>Team Assigned: <strong>{alert.assignedTeamId}</strong> (En Route / On Scene)</span>
                      </div>
                    )}

                    {/* Action Buttons Strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '6px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-light)'
                    }} role="group" aria-label={`Actions for alert ${alert.id}`}>
                      {/* Dispatch Rescue Team */}
                      <button
                        type="button"
                        aria-label={`Dispatch rescue team for ${alert.zone}`}
                        onClick={() => setSelectedAlertForDispatch(alert)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'var(--gov-blue-700)',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <LifeBuoy size={12} />
                        <span>Dispatch Team</span>
                      </button>

                      {/* Open Relief Camp */}
                      <button
                        type="button"
                        aria-label={`Open relief camp for ${alert.zone}`}
                        onClick={() => setSelectedAlertForCamp(alert)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Building size={12} color="var(--water-cyan-600)" />
                        <span>Open Shelter</span>
                      </button>

                      {/* Send Citizen Alert */}
                      <button
                        type="button"
                        aria-label={`Send citizen flood alert for ${alert.zone}`}
                        onClick={() => {
                          triggerSendAlertForArea(alert.zone, alert.severity);
                          onClose();
                          if (onSwitchTab) onSwitchTab('alerts');
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Send size={12} />
                        <span>Send SMS Alert</span>
                      </button>

                      {/* Acknowledge / Resolve */}
                      {alert.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          aria-label={`Acknowledge alert ${alert.id}`}
                          onClick={() => acknowledgeAlert(alert.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-light)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Mark alert ${alert.id} resolved`}
                          onClick={() => resolveAlert(alert.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              DRAWER 2: SUSPECTED BLOCKAGES
             ========================================================================= */}
          {activeDrawer === 'blockages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Drainage channels currently restricted with severe silt and trash accumulation.
              </div>

              {suspectedDrains.length === 0 ? (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: '#10B981',
                  fontWeight: 600,
                  fontSize: '13px'
                }}>
                  ✓ All suspected stormwater blockages have been cleared! Channels operating normally.
                </div>
              ) : (
                suspectedDrains.map(drain => (
                  <div
                    key={drain.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderLeft: '5px solid #F59E0B',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{drain.id}</span>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{drain.location}</div>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: drain.blockagePct >= 60 ? '#EF4444' : '#F59E0B',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {drain.blockagePct}% Blocked
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {drain.reason}
                    </div>

                    {drain.operationalStatus === 'CREW_DISPATCHED' && (
                      <div style={{
                        fontSize: '11px',
                        color: '#3B82F6',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        🚜 Inspection &amp; Desilting Crew Dispatched to Site
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-light)'
                    }} role="group" aria-label={`Actions for drainage channel ${drain.id}`}>
                      {/* Dispatch Crew */}
                      <button
                        type="button"
                        aria-label={`Dispatch inspection crew for ${drain.id}`}
                        onClick={() => dispatchInspectionCrew(drain.id)}
                        disabled={drain.operationalStatus === 'CREW_DISPATCHED'}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: drain.operationalStatus === 'CREW_DISPATCHED' ? 'var(--bg-tertiary)' : 'var(--gov-blue-700)',
                          color: drain.operationalStatus === 'CREW_DISPATCHED' ? 'var(--text-muted)' : '#FFFFFF',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: drain.operationalStatus === 'CREW_DISPATCHED' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {drain.operationalStatus === 'CREW_DISPATCHED' ? 'Crew On Site' : 'Dispatch Crew'}
                      </button>

                      {/* Schedule Maintenance */}
                      <button
                        type="button"
                        aria-label={`Schedule maintenance for ${drain.id}`}
                        onClick={() => {
                          onClose();
                          if (onSwitchTab) onSwitchTab('maintenance');
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Schedule Upkeep
                      </button>

                      {/* Mark Cleared */}
                      <button
                        type="button"
                        aria-label={`Mark blockage cleared on ${drain.id}`}
                        onClick={() => markDrainCleared(drain.id)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark Cleared
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* =========================================================================
              DRAWER 3: DRAIN TELEMETRY NODES
             ========================================================================= */}
          {activeDrawer === 'nodes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Field IoT sensing nodes transmitting acoustic blockage and water stage depth.
              </div>

              {drainNodes.map(node => (
                <div
                  key={node.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{node.id}</span>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{node.location}</div>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: node.status === 'CRITICAL' ? '#EF4444' : node.status === 'WARNING' ? '#F59E0B' : '#10B981',
                      background: node.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {node.operationalStatus === 'UNDER_MAINTENANCE' ? 'UNDER MAINTENANCE' : node.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '6px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Water Stage: </span>
                      <strong>{node.waterLevel}</strong>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '6px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Blockage: </span>
                      <strong style={{ color: node.blockagePct >= 60 ? '#EF4444' : 'inherit' }}>{node.blockagePct}%</strong>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '6px', borderRadius: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Battery: </span>
                      <strong>{node.battery}%</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                    <button
                      type="button"
                      aria-label={`Ping node ${node.id}`}
                      onClick={() => requestDrainRecheck(node.id)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={11} />
                      <span>Ping Diagnostic</span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Mark node ${node.id} under maintenance`}
                      onClick={() => markDrainUnderMaintenance(node.id)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#F59E0B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Wrench size={11} />
                      <span>Flag Maintenance</span>
                    </button>

                    <button
                      type="button"
                      aria-label={`View node ${node.id} in drain monitoring`}
                      onClick={() => {
                        onClose();
                        if (onSwitchTab) onSwitchTab('drain-monitoring');
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: 'var(--gov-blue-700)',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View in Tab 2
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              DRAWER 4: RESCUE TEAMS
             ========================================================================= */}
          {activeDrawer === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Field disaster mobilization crews, boats and emergency ambulances.
              </div>

              {rescueTeams.map(team => (
                <div
                  key={team.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{team.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zone: {team.zone}</div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: team.status === 'ON SCENE' ? '#EF4444' : team.status === 'DISPATCHED' ? '#3B82F6' : '#10B981',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {team.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Personnel: <strong>{team.personnel}</strong> &bull; Boats: <strong>{team.boats}</strong> &bull; Ambulances: <strong>{team.ambulances}</strong>
                    {team.target && (
                      <div style={{ color: 'var(--gov-blue-700)', fontWeight: 600, marginTop: '2px' }}>
                        Active Mission: {team.target} {team.etaMinutes > 0 && `(ETA ${team.etaMinutes}m)`}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                    {team.status === 'DISPATCHED' || team.status === 'ON SCENE' ? (
                      <button
                        type="button"
                        aria-label={`Recall team ${team.id}`}
                        onClick={() => recallRescueTeam(team.id)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Recall Team
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Dispatch team ${team.id} to emergency zone`}
                        onClick={() => {
                          const criticalAlert = floodAlerts.find(a => a.status === 'ACTIVE');
                          dispatchRescueTeam(team.id, criticalAlert ? criticalAlert.zone : 'Critical Lowlands');
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'var(--gov-blue-700)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Dispatch Now
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label={`Reassign team ${team.id}`}
                      onClick={() => reassignRescueTeam(team.id, 'Ward 14 (Industrial Corridor)')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      Reassign Zone
                    </button>

                    <button
                      type="button"
                      aria-label={`Add equipment to team ${team.id}`}
                      onClick={() => addTeamEquipment(team.id, { personnel: 2, boats: 1 })}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--gov-blue-700)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Equipment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              DRAWER 5: RELIEF CAMPS
             ========================================================================= */}
          {activeDrawer === 'camps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Designated high-ground relief centers &amp; supply stockpiles.
                </span>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewCamp(!isCreatingNewCamp)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'var(--gov-blue-700)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={12} />
                  <span>New Shelter</span>
                </button>
              </div>

              {isCreatingNewCamp && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--gov-blue-700)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <strong style={{ fontSize: '12px' }}>Register New Emergency Shelter:</strong>
                  <input
                    type="text"
                    placeholder="Shelter Name (e.g. St. Joseph Hall)"
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Ward / Area"
                      value={newCampWard}
                      onChange={(e) => setNewCampWard(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={newCampCapacity}
                      onChange={(e) => setNewCampCapacity(e.target.value)}
                      style={{
                        width: '90px',
                        padding: '6px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmOpenCamp}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      background: '#10B981',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Confirm &amp; Open Shelter
                  </button>
                </div>
              )}

              {reliefCamps.map(camp => (
                <div
                  key={camp.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{camp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ward: {camp.ward}</div>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: camp.status === 'ACTIVE' ? '#10B981' : '#F59E0B',
                      background: camp.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {camp.status}
                    </span>
                  </div>

                  {/* Occupancy bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Occupancy</span>
                      <strong>{camp.occupancy} / {camp.capacity} Citizens ({Math.round((camp.occupancy / camp.capacity) * 100)}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(camp.occupancy / camp.capacity) * 100}%`, height: '100%', background: 'var(--gov-blue-700)' }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Rations: <strong>{camp.foodDays} Days</strong> &bull; Clean Water: <strong>{camp.waterDays} Days</strong> &bull; Medical: <strong>{camp.medicalStatus}</strong>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                    {camp.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        aria-label={`Close shelter ${camp.name}`}
                        onClick={() => closeReliefCamp(camp.id)}
                        style={{
                          padding: '5px 8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Open shelter ${camp.name}`}
                        onClick={() => openReliefCamp({ id: camp.id })}
                        style={{
                          padding: '5px 8px',
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Activate
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label={`Add 50 citizens to ${camp.name}`}
                      onClick={() => updateCampOccupancy(camp.id, 50)}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      +50 Evacuees
                    </button>

                    <button
                      type="button"
                      aria-label={`Reduce 50 citizens from ${camp.name}`}
                      onClick={() => updateCampOccupancy(camp.id, -50)}
                      disabled={camp.occupancy <= 0}
                      style={{
                        padding: '5px 8px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        cursor: camp.occupancy <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      -50
                    </button>

                    <button
                      type="button"
                      aria-label={`Request supplies for ${camp.name}`}
                      onClick={() => requestCampSupplies(camp.id, { food: 3, water: 3 })}
                      style={{
                        padding: '5px 8px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--gov-blue-700)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Supplies
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              DRAWER 6: GLOBAL ACTIVITY LOG
             ========================================================================= */}
          {activeDrawer === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Auditable chronological event log of all disaster management commands and dispatches.
              </div>

              {activityLog.map(act => (
                <div
                  key={act.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--gov-blue-700)' }}>{act.action}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{act.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{act.details}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                    <span>By: {act.actor}</span>
                    <span style={{ color: '#3B82F6', fontWeight: 700 }}>{act.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* INLINE MODAL: DISPATCH RESCUE TEAM DIALOG */}
        {selectedAlertForDispatch && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Authorize Emergency Rescue Deployment
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Deploying rescue crew to: <strong>{selectedAlertForDispatch.zone}</strong>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Select Available Rescue Unit:
                </label>
                {availableTeams.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
                    ⚠️ No teams currently available in standby. Please recall an active team first.
                  </div>
                ) : (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    <option value="">Select a team...</option>
                    {availableTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.personnel} Personnel, {t.boats} Boats) &bull; {t.zone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Target Arrival ETA (Minutes):
                </label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={dispatchEta}
                  onChange={(e) => setDispatchEta(parseInt(e.target.value, 10) || 10)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAlertForDispatch(null)}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmTeamDispatch}
                  disabled={!selectedTeamId}
                  style={{
                    padding: '8px 16px',
                    background: selectedTeamId ? 'var(--gov-blue-700)' : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: selectedTeamId ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: selectedTeamId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INLINE MODAL: OPEN RELIEF SHELTER DIALOG */}
        {selectedAlertForCamp && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Activate Relief Shelter for Evacuees
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target Catchment Zone: <strong>{selectedAlertForCamp.zone}</strong>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Select Existing Camp to Activate:
                </label>
                <select
                  value={selectedCampToOpen}
                  onChange={(e) => setSelectedCampToOpen(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                >
                  <option value="">Select a shelter...</option>
                  {reliefCamps.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ward}) &bull; Capacity: {c.capacity} [{c.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAlertForCamp(null)}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmOpenCamp}
                  disabled={!selectedCampToOpen}
                  style={{
                    padding: '8px 16px',
                    background: selectedCampToOpen ? '#10B981' : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: selectedCampToOpen ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: selectedCampToOpen ? 'pointer' : 'not-allowed'
                  }}
                >
                  Confirm &amp; Open
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
