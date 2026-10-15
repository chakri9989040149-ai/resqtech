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
  Minus,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Users,
  Check,
  AlertCircle
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
    selectedMapNodeId,
    setSelectedMapNodeId,
    assignTeamToAlert,
    assignWorkerToBlockage,
    reassignUnit,
    markTeamOnScene,
    markAlertResolved,
    markDrainCleared,
    simulateSensorFailure,
    restorePrimarySensor,
    simulateBlockageSpike,
    openReliefCamp,
    closeReliefCamp,
    updateCampOccupancy,
    requestCampSupplies,
    triggerSendAlertForArea
  } = useFloodGuard();

  // Manual assignment dropdown toggles
  const [assigningAlertId, setAssigningAlertId] = useState(null);
  const [selectedTeamForAlert, setSelectedTeamForAlert] = useState('');

  const [assigningBlockageId, setAssigningBlockageId] = useState(null);
  const [selectedCrewForBlockage, setSelectedCrewForBlockage] = useState('');

  const [reassigningTarget, setReassigningTarget] = useState(null); // { id, type }
  const [reassignSelectedTeam, setReassignSelectedTeam] = useState('');

  // Camp logistics modal
  const [selectedCampToOpen, setSelectedCampToOpen] = useState('');
  const [newCampName, setNewCampName] = useState('');
  const [newCampCapacity, setNewCampCapacity] = useState(600);
  const [newCampWard, setNewCampWard] = useState('Ward 4 (Riverside)');
  const [isCreatingNewCamp, setIsCreatingNewCamp] = useState(false);

  if (!activeDrawer) return null;

  // Filter lists
  const availableRescueTeams = rescueTeams.filter(t => (t.type === 'RESCUE' || !t.type) && (t.status === 'AVAILABLE' || t.status === 'STANDBY'));
  const availableCleaningCrews = rescueTeams.filter(t => t.type === 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY'));
  const blockedDrains = drainNodes.filter(d => d.blockagePct >= 25 && d.operationalStatus !== 'CLEARED');

  const handleManualAlertAssign = (alertId) => {
    if (!selectedTeamForAlert) {
      // Auto-assign nearest available
      assignTeamToAlert(alertId, null);
    } else {
      assignTeamToAlert(alertId, selectedTeamForAlert);
    }
    setAssigningAlertId(null);
    setSelectedTeamForAlert('');
  };

  const handleManualBlockageAssign = (drainId) => {
    if (!selectedCrewForBlockage) {
      // Auto-assign nearest available
      assignWorkerToBlockage(drainId, null);
    } else {
      assignWorkerToBlockage(drainId, selectedCrewForBlockage);
    }
    setAssigningBlockageId(null);
    setSelectedCrewForBlockage('');
  };

  const handleReassignSubmit = () => {
    if (!reassigningTarget || !reassignSelectedTeam) return;
    reassignUnit(reassigningTarget.id, reassignSelectedTeam, reassigningTarget.type);
    setReassigningTarget(null);
    setReassignSelectedTeam('');
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
    setIsCreatingNewCamp(false);
    setSelectedCampToOpen('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-heading"
        style={{
          width: '100%',
          maxWidth: '580px',
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
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                [SIMULATED DATA]
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interactive Operational Panel</span>
            </div>
            <h3 id="drawer-heading" style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0' }}>
              {activeDrawer === 'alerts' && 'Active Flood Alerts & Rapid Dispatch'}
              {activeDrawer === 'blockages' && 'Suspected Silt & Debris Blockages'}
              {activeDrawer === 'nodes' && 'Drain Telemetry & Dual-Sensor Failover'}
              {activeDrawer === 'teams' && 'Emergency Units & Desilting Crews'}
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* DRAWER BODY */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

          {/* =========================================================================
              DRAWER 1: ACTIVE FLOOD ALERTS
             ========================================================================= */}
          {activeDrawer === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Directly assign emergency teams, view real-time inundation severity, or mark resolved.
              </div>

              {floodAlerts.filter(a => a.status !== 'RESOLVED').length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-normal)',
                  fontWeight: 600,
                  fontSize: '13px'
                }}>
                  ✓ No active flood alerts! All inundation conditions have been resolved.
                </div>
              ) : (
                floodAlerts.map(alert => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isAssigned = alert.status === 'ASSIGNED';
                  const isResolved = alert.status === 'RESOLVED';
                  const isAssigningThis = assigningAlertId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-medium)'}`,
                        borderLeft: `5px solid ${isResolved ? '#10B981' : isCritical ? '#EF4444' : '#F59E0B'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        opacity: isResolved ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {alert.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--gov-blue-700)" />
                            <span>{alert.zone} &bull; Water: <strong>{alert.waterLevel}</strong> &bull; Rain: {alert.rainfall}</span>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: isResolved ? '#10B981' : isCritical ? '#EF4444' : '#F59E0B',
                          background: isResolved ? 'rgba(16, 185, 129, 0.12)' : isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {alert.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {alert.riskReason}
                      </div>

                      {/* Assigned Team Chip & On Scene indicator */}
                      {alert.assignedTeamId && (
                        <div style={{
                          fontSize: '11px',
                          color: '#10B981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={13} color="#10B981" />
                            <span>Team Assigned: <strong>{alert.assignedTeamName || alert.assignedTeamId}</strong></span>
                          </div>
                          <span style={{ fontSize: '10px', opacity: 0.8 }}>{alert.assignedAt || 'Dispatched'}</span>
                        </div>
                      )}

                      {/* Manual Assignment Dropdown inline */}
                      {isAssigningThis && (
                        <div style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-blue-700)' }}>
                            Choose an Available Rescue Team (or Auto-Match Nearest):
                          </div>
                          <select
                            value={selectedTeamForAlert}
                            onChange={(e) => setSelectedTeamForAlert(e.target.value)}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              fontSize: '12px'
                            }}
                          >
                            <option value="">⚡ Auto-Match Nearest Available Team</option>
                            {availableRescueTeams.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.zone}) &bull; {t.personnel} Personnel, {t.boats} Boats
                              </option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setAssigningAlertId(null)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-medium)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualAlertAssign(alert.id)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'var(--gov-blue-700)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Assignment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Strip */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-light)'
                      }}>
                        {/* Assign Team Button */}
                        {!isAssigned && !isResolved && (
                          <button
                            type="button"
                            onClick={() => setAssigningAlertId(alert.id)}
                            style={{
                              padding: '7px 10px',
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
                            <span>Assign Team</span>
                          </button>
                        )}

                        {/* Reassign Team Button if already assigned */}
                        {isAssigned && !isResolved && (
                          <button
                            type="button"
                            onClick={() => setAssigningAlertId(alert.id)}
                            style={{
                              padding: '7px 10px',
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
                            <RefreshCw size={12} />
                            <span>Reassign Team</span>
                          </button>
                        )}

                        {/* Highlight on Map */}
                        <button
                          type="button"
                          onClick={() => {
                            if (alert.drainNodeId) setSelectedMapNodeId(alert.drainNodeId);
                            onClose();
                            if (onSwitchTab) onSwitchTab('overview');
                          }}
                          style={{
                            padding: '7px 10px',
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
                          <MapPin size={12} color="var(--gov-blue-700)" />
                          <span>View on Map</span>
                        </button>

                        {/* Send Citizen Alert */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerSendAlertForArea(alert.zone, alert.severity);
                            onClose();
                            if (onSwitchTab) onSwitchTab('alerts');
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.08)',
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

                        {/* Mark Resolved */}
                        {!isResolved ? (
                          <button
                            type="button"
                            onClick={() => markAlertResolved(alert.id)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              DRAWER 2: SUSPECTED BLOCKAGES
             ========================================================================= */}
          {activeDrawer === 'blockages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Drainage channels currently restricted with severe silt and trash accumulation. Assign cleaning crews or mark cleared.
              </div>

              {blockedDrains.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-normal)',
                  fontWeight: 600,
                  fontSize: '13px'
                }}>
                  ✓ All suspected stormwater blockages have been cleared! Channels operating at nominal capacity.
                </div>
              ) : (
                blockedDrains.map(drain => {
                  const isAssigningThis = assigningBlockageId === drain.id;
                  const isCritical = drain.blockagePct >= 60;

                  return (
                    <div
                      key={drain.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-medium)',
                        borderLeft: `5px solid ${isCritical ? '#EF4444' : '#F59E0B'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {drain.id}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-muted)'
                            }}>
                              {drain.zone}
                            </span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                            {drain.location}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isCritical ? '#EF4444' : '#F59E0B',
                          background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {drain.blockagePct}% Blocked
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {drain.reason}
                      </div>

                      {/* Assigned Worker Info */}
                      {drain.assignedWorker ? (
                        <div style={{
                          fontSize: '11px',
                          color: '#3B82F6',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wrench size={13} color="#3B82F6" />
                            <span>Assigned Worker: <strong>{drain.assignedWorker}</strong></span>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6' }}>In Transit / On Site</span>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '11px',
                          color: '#F59E0B',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertCircle size={13} />
                          <span>No cleaning worker assigned yet. Blockage restricting channel!</span>
                        </div>
                      )}

                      {/* Manual Assignment Dropdown inline */}
                      {isAssigningThis && (
                        <div style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-blue-700)' }}>
                            Choose an Available Desilting Crew (or Auto-Match Nearest):
                          </div>
                          <select
                            value={selectedCrewForBlockage}
                            onChange={(e) => setSelectedCrewForBlockage(e.target.value)}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              fontSize: '12px'
                            }}
                          >
                            <option value="">⚡ Auto-Match Nearest Cleaning Crew</option>
                            {availableCleaningCrews.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.leadWorker}) &bull; {c.zone}
                              </option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setAssigningBlockageId(null)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-medium)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualBlockageAssign(drain.id)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'var(--gov-blue-700)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Assignment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions strip */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-light)'
                      }}>
                        {/* Assign / Reassign Worker Button */}
                        <button
                          type="button"
                          onClick={() => setAssigningBlockageId(drain.id)}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '4px',
                            background: drain.assignedWorker ? 'var(--bg-primary)' : 'var(--gov-blue-700)',
                            color: drain.assignedWorker ? 'var(--text-primary)' : '#FFFFFF',
                            border: drain.assignedWorker ? '1px solid var(--border-medium)' : 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Wrench size={12} />
                          <span>{drain.assignedWorker ? 'Reassign Worker' : 'Assign Worker'}</span>
                        </button>

                        {/* View on Map */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMapNodeId(drain.id);
                            onClose();
                            if (onSwitchTab) onSwitchTab('overview');
                          }}
                          style={{
                            padding: '7px 10px',
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
                          <MapPin size={12} color="var(--gov-blue-700)" />
                          <span>Highlight on Map</span>
                        </button>

                        {/* Mark Cleared Button */}
                        <button
                          type="button"
                          onClick={() => markDrainCleared(drain.id)}
                          style={{
                            padding: '7px 10px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Mark Cleared</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =========================================================================
              DRAWER 3: DRAIN TELEMETRY & DUAL-SENSOR FAILOVER
             ========================================================================= */}
          {activeDrawer === 'nodes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--gov-blue-700)' }}>Dual-Sensor Automatic Failover:</strong> Each node carries a Primary Ultrasonic Sensor and a Submerged Pressure Transducer. If a primary fails, the backup activates automatically and the node stays online.
              </div>

              {drainNodes.map(node => {
                const isFailoverActive = node.sensorHealth === 'BACKUP_ACTIVE';
                const isPrimaryFailed = node.primarySensor?.status === 'FAILED';
                const isSelectedOnMap = selectedMapNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${isSelectedOnMap ? 'var(--gov-blue-700)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isSelectedOnMap ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
                            {node.id}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: node.operationalStatus === 'BLOCKED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: node.operationalStatus === 'BLOCKED' ? '#EF4444' : '#10B981',
                            textTransform: 'uppercase'
                          }}>
                            {node.operationalStatus === 'BLOCKED' ? 'Blocked' : 'Online'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {node.location}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {node.waterLevel}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Blockage: {node.blockagePct}%
                        </div>
                      </div>
                    </div>

                    {/* DUAL SENSOR TELEMETRY CARDS */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: 'var(--bg-primary)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)'
                    }}>
                      {/* Primary Sensor Card */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>PRIMARY SENSOR</span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isPrimaryFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isPrimaryFailed ? '#EF4444' : '#10B981'
                          }}>
                            {node.primarySensor?.status || 'ACTIVE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {node.primarySensor?.name || 'Ultrasonic Sensor'}
                        </div>
                        <div style={{ fontSize: '10px', color: isPrimaryFailed ? '#EF4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {node.primarySensor?.reading || node.waterLevel}
                        </div>
                      </div>

                      {/* Backup Sensor Card */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>BACKUP SENSOR</span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isFailoverActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: isFailoverActive ? '#3B82F6' : 'var(--text-muted)'
                          }}>
                            {node.backupSensor?.status || 'STANDBY'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {node.backupSensor?.name || 'Pressure Transducer'}
                        </div>
                        <div style={{ fontSize: '10px', color: isFailoverActive ? '#3B82F6' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {isFailoverActive ? (node.backupSensor?.reading || node.waterLevel) : 'Standby Hot-Spare'}
                        </div>
                      </div>
                    </div>

                    {/* Sensor Failover Simulation Action */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {!isPrimaryFailed ? (
                        <button
                          type="button"
                          onClick={() => simulateSensorFailure(node.id)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Simulate Primary Failure
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restorePrimarySensor(node.id)}
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
                          Restore Primary Sensor
                        </button>
                      )}

                      {/* Trigger Blockage Spike Demo Button */}
                      <button
                        type="button"
                        onClick={() => simulateBlockageSpike(node.id, 88)}
                        style={{
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
                        Simulate Blockage Spike
                      </button>

                      {/* Highlight on Map */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMapNodeId(node.id);
                          onClose();
                          if (onSwitchTab) onSwitchTab('overview');
                        }}
                        style={{
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
                        Select on Map
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              DRAWER 4: RESCUE TEAMS & CLEANING CREWS
             ========================================================================= */}
          {activeDrawer === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Active emergency response teams and municipal cleaning crews with real-time status and task assignment.
              </div>

              {rescueTeams.map(team => {
                const isDispatched = team.status === 'DISPATCHED';
                const isOnScene = team.status === 'ON SCENE';
                const isAvailable = team.status === 'AVAILABLE' || team.status === 'STANDBY';
                const isCleaningCrew = team.type === 'CLEANING';

                return (
                  <div
                    key={team.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderLeft: `5px solid ${isOnScene ? '#10B981' : isDispatched ? '#3B82F6' : '#94A3B8'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isCleaningCrew ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isCleaningCrew ? '#F59E0B' : '#3B82F6'
                          }}>
                            {isCleaningCrew ? 'DESILTING CREW' : 'RESCUE UNIT'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {team.id}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {team.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {team.role} &bull; Base: {team.zone}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isOnScene ? '#10B981' : isDispatched ? '#3B82F6' : 'var(--text-muted)',
                        background: isOnScene ? 'rgba(16, 185, 129, 0.12)' : isDispatched ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-tertiary)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {team.status}
                      </span>
                    </div>

                    {/* Personnel & Assets */}
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {team.leadWorker && <div>Lead: <strong>{team.leadWorker}</strong></div>}
                      <div>Personnel: <strong>{team.personnel} Staff</strong> {team.boats ? `&bull; ${team.boats} Inflatable Boats` : ''} {team.equipment ? `&bull; ${team.equipment}` : ''}</div>
                    </div>

                    {/* Current Task / Target */}
                    {team.target ? (
                      <div style={{
                        fontSize: '11px',
                        color: isOnScene ? '#10B981' : '#3B82F6',
                        background: isOnScene ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>Current Target: <strong>{team.target}</strong></span>
                        <span style={{ fontSize: '10px' }}>{isOnScene ? 'On Scene' : `ETA ${team.etaMinutes || 10}m`}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No active task assigned. Unit is on standby and ready for dispatch.
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-light)'
                    }}>
                      {isDispatched && (
                        <button
                          type="button"
                          onClick={() => markTeamOnScene(team.id)}
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
                          Mark On Scene
                        </button>
                      )}

                      {(isDispatched || isOnScene) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (team.assignedTargetId) {
                              if (team.type === 'CLEANING') markDrainCleared(team.assignedTargetId);
                              else markAlertResolved(team.assignedTargetId);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-medium)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Task Resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              DRAWER 5: RELIEF CAMPS OPERATING
             ========================================================================= */}
          {activeDrawer === 'camps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Government pre-evacuation centers and emergency shelters with live capacity and food/water provisions.
              </div>

              {reliefCamps.map(camp => {
                const isActive = camp.status === 'ACTIVE';
                const occupancyPct = Math.round(((camp.occupancy || 0) / (camp.capacity || 1)) * 100);

                return (
                  <div
                    key={camp.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderLeft: `5px solid ${isActive ? 'var(--water-cyan-600)' : '#94A3B8'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {camp.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {camp.ward}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isActive ? 'var(--water-cyan-600)' : 'var(--text-muted)',
                        background: isActive ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-tertiary)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {camp.status}
                      </span>
                    </div>

                    {/* Capacity & Occupancy with Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Shelter Occupancy:</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {camp.occupancy} / {camp.capacity} Citizens ({occupancyPct}%)
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        width: '100%',
                        borderRadius: '4px',
                        background: 'var(--bg-tertiary)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, occupancyPct)}%`,
                          background: occupancyPct > 85 ? '#EF4444' : occupancyPct > 60 ? '#F59E0B' : 'var(--water-cyan-600)',
                          borderRadius: '4px',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>

                    {/* Stock Logistics */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-primary)',
                      padding: '8px 10px',
                      borderRadius: '4px'
                    }}>
                      <div>Food Ration: <strong>{camp.foodDays} Days</strong></div>
                      <div>Potable Water: <strong>{camp.waterDays} Days</strong></div>
                      <div>Medical: <strong style={{ color: '#10B981' }}>{camp.medicalStatus}</strong></div>
                    </div>

                    {/* Controls Strip */}
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-light)'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateCampOccupancy(camp.id, 50)}
                        disabled={!isActive || camp.occupancy >= camp.capacity}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        +50 Evacuees
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCampOccupancy(camp.id, -50)}
                        disabled={!isActive || camp.occupancy <= 0}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        -50 Discharged
                      </button>

                      <button
                        type="button"
                        onClick={() => requestCampSupplies(camp.id, { food: 3, water: 2 })}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'rgba(14, 165, 233, 0.1)',
                          color: 'var(--water-cyan-600)',
                          border: '1px solid rgba(14, 165, 233, 0.3)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Dispatch Supplies
                      </button>

                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => closeReliefCamp(camp.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-light)',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReliefCamp({ id: camp.id })}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            background: 'var(--gov-blue-700)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              DRAWER 6: GLOBAL ACTIVITY LOG
             ========================================================================= */}
          {activeDrawer === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Auditable transaction journal recording team assignments, sensor failover events, broadcasts, and clearances.
              </div>

              {activityLog.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No activities recorded in current session.
                </div>
              ) : (
                activityLog.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-blue-700)' }}>
                        {item.action}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {item.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      {item.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {(item.isAgent || item.actor === 'Coordinator Agent') && (
                        <span style={{
                          background: 'rgba(124, 58, 237, 0.12)',
                          color: '#7C3AED',
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.04em'
                        }}>
                          🤖 Agent
                        </span>
                      )}
                      <span>Logged by: {item.actor} &bull; <span style={{ color: '#3B82F6' }}>{item.tag}</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
