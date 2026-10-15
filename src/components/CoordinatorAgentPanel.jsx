import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Check,
  X,
  FileText
} from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';
import {
  runSensorWatch,
  runTriage,
  runDispatcher,
  runCommunicator,
  runMaintenanceAndReporter,
  generateShiftSummary,
  HELPER_NAMES
} from '../agent/coordinator';

export default function CoordinatorAgentPanel() {
  const {
    floodAlerts,
    drainNodes,
    rescueTeams,
    reliefCamps,
    maintenanceTasks,
    scheduledCampaigns,
    isOutageActive,
    loraQueue,
    activityLog,
    assignTeamToAlert,
    assignWorkerToBlockage,
    restorePrimarySensor,
    scheduleAwarenessCampaign,
    queueLoRaAlert,
    createMaintenanceTask,
    completeMaintenanceTask,
    simulateMultipleIncidents,
    addActivity,
    showToast
  } = useFloodGuard();

  // Agent State
  const [agentStatus, setAgentStatus] = useState('ACTIVE'); // 'ACTIVE' | 'PAUSED'
  const [autonomyMode, setAutonomyMode] = useState('AUTO'); // 'AUTO' | 'APPROVE_FIRST'
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);

  // Agent Shared Task Queue & Proposed Actions
  const [taskQueue, setTaskQueue] = useState([]);
  const [proposedActions, setProposedActions] = useState([]);
  const [completedCount, setCompletedCount] = useState(3);
  const [lastCycleTime, setLastCycleTime] = useState(() => new Date().toLocaleTimeString());

  // Bundle store actions for helpers
  const actionsRef = useRef({});
  actionsRef.current = {
    assignTeamToAlert,
    assignWorkerToBlockage,
    restorePrimarySensor,
    scheduleAwarenessCampaign,
    queueLoRaAlert,
    createMaintenanceTask,
    completeMaintenanceTask,
    addActivity,
    showToast
  };

  // Execution cycle of the 5 parallel helpers
  const runAgentCycle = useCallback(() => {
    if (agentStatus === 'PAUSED') return;

    setLastCycleTime(new Date().toLocaleTimeString());

    // 1. Helper: Sensor Watch
    const sensorWatchResult = runSensorWatch({
      drainNodes,
      actions: actionsRef.current,
      autonomyMode,
      existingProposals: proposedActions
    });

    // 2. Helper: Triage
    const triagedQueue = runTriage({
      floodAlerts,
      drainNodes,
      sensorTasks: sensorWatchResult.tasks
    });

    // 3. Helper: Dispatcher
    const dispatcherResult = runDispatcher({
      queue: triagedQueue,
      rescueTeams,
      drainNodes,
      floodAlerts,
      actions: actionsRef.current,
      autonomyMode,
      existingProposals: proposedActions
    });

    // 4. Helper: Communicator
    const communicatorResult = runCommunicator({
      queue: triagedQueue,
      floodAlerts,
      scheduledCampaigns,
      isOutageActive,
      loraQueue,
      actions: actionsRef.current,
      autonomyMode,
      existingProposals: proposedActions
    });

    // 5. Helper: Maintenance & Reporter
    const maintenanceResult = runMaintenanceAndReporter({
      drainNodes,
      maintenanceTasks,
      actions: actionsRef.current,
      autonomyMode,
      existingProposals: proposedActions
    });

    // Update Live Task Queue
    setTaskQueue(triagedQueue);

    // If in APPROVE_FIRST mode, aggregate new proposals
    if (autonomyMode === 'APPROVE_FIRST') {
      const allNewProposals = [
        ...sensorWatchResult.proposals,
        ...dispatcherResult.proposals,
        ...communicatorResult.proposals,
        ...maintenanceResult.proposals
      ];

      if (allNewProposals.length > 0) {
        setProposedActions(prev => {
          const map = new Map();
          prev.forEach(p => map.set(p.id, p));
          allNewProposals.forEach(p => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
    } else {
      // In AUTO mode, proposals are executed immediately
      setProposedActions([]);
    }
  }, [
    agentStatus,
    autonomyMode,
    drainNodes,
    floodAlerts,
    rescueTeams,
    maintenanceTasks,
    scheduledCampaigns,
    isOutageActive,
    loraQueue,
    proposedActions
  ]);

  // Run on timer (every 4 seconds) and on state changes
  useEffect(() => {
    runAgentCycle();
    const interval = setInterval(runAgentCycle, 4000);
    return () => clearInterval(interval);
  }, [runAgentCycle]);

  // Handle Approve Proposed Action
  const handleApproveAction = (proposal) => {
    const { actionType, payload, plainReason, helper } = proposal;
    const actions = actionsRef.current;

    if (actionType === 'ASSIGN_TEAM') {
      actions.assignTeamToAlert(payload.alertId, payload.teamId, plainReason, 'Coordinator Agent');
    } else if (actionType === 'ASSIGN_WORKER') {
      actions.assignWorkerToBlockage(payload.drainId, payload.workerName, payload.workerId, plainReason, 'Coordinator Agent');
    } else if (actionType === 'RESTORE_SENSOR') {
      actions.restorePrimarySensor(payload.nodeId, { reason: plainReason, actor: 'Coordinator Agent', tag: 'Sensor Watch', isAgent: true });
    } else if (actionType === 'SCHEDULE_CAMPAIGN') {
      actions.scheduleAwarenessCampaign(payload);
      actions.addActivity('CAMPAIGN_APPROVED', plainReason, 'Coordinator Agent', 'Communicator', true);
    } else if (actionType === 'QUEUE_LORA') {
      actions.queueLoRaAlert(payload);
      actions.addActivity('LORA_PACKET_APPROVED', plainReason, 'Coordinator Agent', 'Communicator', true);
    } else if (actionType === 'CREATE_TASK') {
      actions.createMaintenanceTask(payload);
    }

    setProposedActions(prev => prev.filter(p => p.id !== proposal.id));
    setCompletedCount(c => c + 1);
    actions.showToast(`Approved agent action: ${proposal.title}`);
  };

  // Handle Reject Proposed Action
  const handleRejectAction = (proposalId) => {
    setProposedActions(prev => prev.filter(p => p.id !== proposalId));
    actionsRef.current.showToast('Dismissed proposed agent action.', 'info');
  };

  // Compute live counts
  const tasksInProgressCount = taskQueue.filter(t => t.status === 'IN_PROGRESS' || t.status === 'RESOLVING').length;
  const waitingApprovalCount = proposedActions.length;
  const shiftSummary = generateShiftSummary({ floodAlerts, drainNodes, rescueTeams, maintenanceTasks, activityLog, loraQueue });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderLeft: `5px solid ${agentStatus === 'ACTIVE' ? '#9333EA' : '#F59E0B'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7E22CE 0%, #9333EA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(147, 51, 234, 0.3)'
          }}>
            <Bot size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                SensaFlow Coordinator Agent
              </h2>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '3px',
                background: agentStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: agentStatus === 'ACTIVE' ? '#10B981' : '#F59E0B',
                border: `1px solid ${agentStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: agentStatus === 'ACTIVE' ? '#10B981' : '#F59E0B'
                }} className={agentStatus === 'ACTIVE' ? 'agent-pulse' : ''} />
                {agentStatus}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                [SIMULATED]
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              5 Parallel Helpers active: Sensor Watch &bull; Triage &bull; Dispatcher &bull; Communicator &bull; Maintenance &bull; Cycle: {lastCycleTime}
            </div>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Autonomy Switch */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px'
          }}>
            <button
              type="button"
              onClick={() => {
                setAutonomyMode('AUTO');
                showToast('Coordinator Agent set to Auto (Autonomous Mode)');
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                background: autonomyMode === 'AUTO' ? '#9333EA' : 'transparent',
                color: autonomyMode === 'AUTO' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Agent automatically dispatches teams, triggers failovers, and schedules campaigns"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => {
                setAutonomyMode('APPROVE_FIRST');
                showToast('Coordinator Agent set to Approve First (Supervised Mode)');
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                background: autonomyMode === 'APPROVE_FIRST' ? '#9333EA' : 'transparent',
                color: autonomyMode === 'APPROVE_FIRST' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Agent drafts recommendations and waits for officer approval"
            >
              Approve first {waitingApprovalCount > 0 ? `(${waitingApprovalCount})` : ''}
            </button>
          </div>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => {
              const nextStatus = agentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
              setAgentStatus(nextStatus);
              showToast(`Coordinator Agent ${nextStatus === 'ACTIVE' ? 'Resumed' : 'Paused'}`);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {agentStatus === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
            <span>{agentStatus === 'ACTIVE' ? 'Pause Agent' : 'Resume Agent'}</span>
          </button>

          {/* Simulate Multiple Incidents Demo Button */}
          <button
            type="button"
            onClick={simulateMultipleIncidents}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#EF4444',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Triggers blockage, sensor failure, and flood alert concurrently"
          >
            <Sparkles size={12} />
            <span>Simulate Multiple Incidents</span>
          </button>

          {/* Reset Agent State */}
          <button
            type="button"
            onClick={() => {
              setProposedActions([]);
              setCompletedCount(0);
              showToast('Agent task queue & proposal buffer reset');
            }}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Reset Agent Queue"
          >
            <RotateCcw size={13} />
          </button>

          {/* Expand / Collapse Chevron */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              color: 'var(--gov-blue-700)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>{isExpanded ? 'Collapse' : 'Inspect Queue'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* COMPACT KPI COUNT CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px'
      }}>
        {/* Card 1: Tasks in progress */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tasks In Progress
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
              {tasksInProgressCount}
            </div>
          </div>
          <Layers size={18} color="var(--gov-blue-700)" opacity={0.7} />
        </div>

        {/* Card 2: Completed Today */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Completed Today
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              {completedCount}
            </div>
          </div>
          <CheckCircle2 size={18} color="#10B981" opacity={0.7} />
        </div>

        {/* Card 3: Waiting for Approval */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Waiting For Approval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: waitingApprovalCount > 0 ? '#9333EA' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {waitingApprovalCount}
            </div>
          </div>
          <Clock size={18} color={waitingApprovalCount > 0 ? '#9333EA' : 'var(--text-muted)'} opacity={0.7} />
        </div>

        {/* Card 4: Helper Status */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Helpers Online
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              5 / 5 Operational
            </div>
          </div>
          <Sparkles size={18} color="#10B981" opacity={0.7} />
        </div>
      </div>

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          
          {/* SECTION: PROPOSED ACTIONS (WHEN IN APPROVE FIRST MODE) */}
          {autonomyMode === 'APPROVE_FIRST' && proposedActions.length > 0 && (
            <div style={{
              background: 'rgba(147, 51, 234, 0.05)',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#9333EA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>Agent Actions Pending Officer Approval ({proposedActions.length})</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Click Approve to execute or Reject to cancel
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {proposedActions.map(proposal => (
                  <div
                    key={proposal.id}
                    className="agent-queue-item"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: 'rgba(147, 51, 234, 0.15)',
                          color: '#9333EA'
                        }}>
                          {proposal.helper}
                        </span>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {proposal.title}
                        </strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {proposal.plainReason}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleRejectAction(proposal.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveAction(proposal)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: '#10B981',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIVE MULTI-TASKING TASK QUEUE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Incident Coordination Queue ({taskQueue.length} Active Items)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Ordered by Hydro Threat Score (Flood Alerts &gt; Blockages)
              </span>
            </div>

            {taskQueue.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '11px' }}>
                All clear. No active flood alerts or high blockages requiring intervention.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                {taskQueue.map(item => {
                  const isFlood = item.type === 'FLOOD_ALERT';
                  const isCritical = item.severity === 'CRITICAL';

                  return (
                    <div
                      key={item.id}
                      className="agent-queue-item"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderLeft: `4px solid ${isCritical ? '#EF4444' : isFlood ? '#3B82F6' : '#F59E0B'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isCritical ? '#EF4444' : '#3B82F6'
                          }}>
                            {item.severity} &bull; Score {item.priorityScore}
                          </span>
                          <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                            {item.title}
                          </strong>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.location} &bull; {item.plainReason}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(147, 51, 234, 0.12)',
                          color: '#9333EA',
                          border: '1px solid rgba(147, 51, 234, 0.3)'
                        }}>
                          {item.helper}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.status === 'IN_PROGRESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: item.status === 'IN_PROGRESS' ? '#10B981' : '#F59E0B'
                        }}>
                          {item.status} {item.assignedTo ? `(${item.assignedTo})` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5 HELPER TELEMETRY STRIP */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
            fontSize: '10px',
            background: 'var(--bg-secondary)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>1. Sensor Watch: </span>
              <strong style={{ color: '#10B981' }}>Dual-Sensor Hot-Standby Active</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>2. Triage: </span>
              <strong style={{ color: '#3B82F6' }}>Hydraulic Threat Sorting</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>3. Dispatcher: </span>
              <strong style={{ color: '#9333EA' }}>Proximity &amp; Zero Double-Booking</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>4. Communicator: </span>
              <strong style={{ color: isOutageActive ? '#EF4444' : '#10B981' }}>
                {isOutageActive ? 'LoRa Sub-GHz Fallback' : 'Multi-Channel Online'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>5. Maintenance: </span>
              <strong style={{ color: 'var(--text-primary)' }}>Upkeep Registry Synced</strong>
            </div>
          </div>

          {/* SHIFT SUMMARY REPORT TOGGLE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsShiftReportOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="var(--gov-blue-700)" />
                <span>Shift Operations Summary Report</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--gov-blue-700)' }}>
                {isShiftReportOpen ? 'Hide Report ▲' : 'View Report ▼'}
              </span>
            </button>

            {isShiftReportOpen && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: '11px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
                lineHeight: 1.5
              }}>
                <div><strong>Shift Timestamp:</strong> {shiftSummary.timestamp}</div>
                <div><strong>Active Emergencies:</strong> {shiftSummary.activeIncidents}</div>
                <div><strong>Teams Mobilized:</strong> {shiftSummary.teamsMobilized}</div>
                <div><strong>Upkeep Tasks:</strong> {shiftSummary.maintenanceUnderway}</div>
                <div><strong>Agent Dispatches:</strong> {shiftSummary.agentActionsTotal}</div>
                <div><strong>LoRa Fallbacks:</strong> {shiftSummary.loraFallbackTransmissions}</div>
                <div style={{ gridColumn: '1 / -1', color: '#10B981', fontWeight: 700 }}>
                  System Readiness Index: {shiftSummary.readinessRating}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
