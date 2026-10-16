import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Radio,
  AlertTriangle,
  Users,
  Bell,
  Wrench,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  Send,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Edit2,
  Undo2,
  Activity,
  Layers,
  Terminal,
  Cpu
} from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';
import {
  INITIAL_AGENTS,
  REASONING_TEMPLATES,
  PUBLIC_ALERT_TEMPLATES,
  ZONE_METADATA,
  calculateIncidentScore,
  evaluateResourceOptions,
  answerAgentQuestion
} from '../agent/multiAgentCoordinator';

export default function MultiAgentCoordinatorPanel() {
  const {
    floodAlerts = [],
    drainNodes = [],
    rescueTeams = [],
    reliefCamps = [],
    riskZones = [],
    loraQueue = [],
    activityLog = [],
    assignTeamToAlert,
    assignWorkerToBlockage,
    restorePrimarySensor,
    addActivity,
    resetDemoData,
    preEvacuateShelter,
    dispatchInspectionCrew,
    animateDrainClearing,
    scheduleAwarenessCampaign,
    cycleTeamStatus,
    triggerHeavyRainSurgeScenario,
    triggerSensorFailureScenario,
    triggerNetworkOutageScenario,
    triggerMultiIncidentStormScenario,
    undoAgentAction
  } = useFloodGuard();

  // Agent Autonomy & Engine State
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [autonomyMode, setAutonomyMode] = useState('AUTO'); // 'AUTO' | 'APPROVE_FIRST'
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullScreenView, setIsFullScreenView] = useState(false);

  // Five Agents State
  const [agents, setAgents] = useState(INITIAL_AGENTS);

  // Parallel Workflow Board State
  // Incidents in steps: 'PERCEIVE' | 'REASON' | 'PLAN' | 'ACT' | 'VERIFY' | 'DONE'
  const [workflowItems, setWorkflowItems] = useState([]);
  const [proposedActions, setProposedActions] = useState([]);
  const [agentMessages, setAgentMessages] = useState([
    { id: 'm-1', from: 'Sentinel', to: 'Triage', text: 'Telemetry baseline initialized across D-01..D-06.', time: 'System Boot' },
    { id: 'm-2', from: 'Triage', to: 'Dispatch', text: 'Queue scoring rules loaded: Flood alerts prioritized.', time: 'System Boot' }
  ]);

  // "Why did the agent do this?" Trace Modal
  const [selectedTrace, setSelectedTrace] = useState(null);

  // 10-Second Undo State
  const [undoableAction, setUndoableAction] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(10);
  const undoTimerRef = useRef(null);

  // Inline Edit State for Proposed Actions
  const [editingActionId, setEditingActionId] = useState(null);
  const [editForm, setEditForm] = useState({ targetId: '', notes: '' });

  // Simulated Agent Chat Box State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'c-init',
      sender: 'agent',
      text: 'Hello, I am the SensaFlow Multi-Agent Assistant [SIMULATED]. Ask me anything about live drainage risks, team availability, or operational shift metrics.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Performance / Stats Counter
  const [stats, setStats] = useState({
    incidentsHandled: 42,
    avgResponseTime: '1.2s'
  });

  // Track already processed incidents to prevent redundant loops
  const processedKeysRef = useRef(new Set());

  // ---------------------------------------------------------------------------
  // Helper: Append Inter-Agent Message
  // ---------------------------------------------------------------------------
  const pushAgentMessage = useCallback((from, to, text) => {
    setAgentMessages(prev => [
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        from,
        to,
        text,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ].slice(0, 30));
  }, []);

  // ---------------------------------------------------------------------------
  // Helper: Update Agent Status
  // ---------------------------------------------------------------------------
  const setAgentActivity = useCallback((agentId, status, currentTask = null) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          status,
          currentTask: currentTask || a.currentTask,
          completedToday: status === 'Idle' ? a.completedToday + 1 : a.completedToday
        };
      }
      return a;
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // 10-Second Undo Countdown Timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (undoableAction) {
      setUndoCountdown(10);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      undoTimerRef.current = setInterval(() => {
        setUndoCountdown(c => {
          if (c <= 1) {
            clearInterval(undoTimerRef.current);
            setUndoableAction(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    };
  }, [undoableAction]);

  const handleTriggerUndo = () => {
    if (undoableAction) {
      if (undoAgentAction) undoAgentAction(undoableAction);
      setUndoableAction(null);
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    }
  };

  // ---------------------------------------------------------------------------
  // Detect Unhandled Incidents & Ingest into Workflow Queue
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isAgentActive) return;

    const detectedIncidents = [];

    // 1. Unhandled Flood Alerts
    (floodAlerts || []).forEach(alert => {
      if ((alert.status === 'NEW' || !alert.assignedTeamId) && alert.status !== 'RESOLVED') {
        const key = `alert-${alert.id}-${alert.waterLevel}`;
        if (!processedKeysRef.current.has(key)) {
          detectedIncidents.push({
            id: alert.id,
            uniqueKey: key,
            type: 'FLOOD',
            title: alert.title || `Flash Inundation Warning — ${alert.zone}`,
            zone: alert.zone || 'Zone E Lowlands',
            severity: alert.severity || 'CRITICAL',
            waterLevel: alert.waterLevel || '3.40 m',
            rainfall: alert.rainfall || '52 mm/hr',
            drainNodeId: alert.drainNodeId || 'D-05',
            step: 'PERCEIVE',
            assignedTeamId: null,
            targetRef: alert
          });
        }
      }
    });

    // 2. Unhandled High Blockage Drains (>70% and unassigned)
    (drainNodes || []).forEach(node => {
      if (
        (node.blockagePct >= 70 || (node.blockageIndex && node.blockageIndex >= 0.70)) &&
        !node.assignedWorker &&
        node.operationalStatus !== 'CREW_DISPATCHED' &&
        node.operationalStatus !== 'UNDER_MAINTENANCE'
      ) {
        const key = `drain-${node.id}-${node.blockagePct}`;
        if (!processedKeysRef.current.has(key)) {
          detectedIncidents.push({
            id: `INC-BLK-${node.id}`,
            uniqueKey: key,
            type: 'BLOCKAGE',
            title: `Arterial Obstruction — ${node.name}`,
            zone: node.zone || 'Zone B Market Road',
            severity: node.blockagePct > 80 ? 'CRITICAL' : 'WARNING',
            waterLevel: node.waterLevel || '2.80 m',
            rainfall: node.rainfall || '42 mm/hr',
            blockagePct: node.blockagePct,
            flowRate: node.flowRate || '0.5 m/s',
            drainNodeId: node.id,
            step: 'PERCEIVE',
            assignedWorker: null,
            targetRef: node
          });
        }
      }
    });

    // 3. Failed Primary Sensors
    (drainNodes || []).forEach(node => {
      if (node.sensorHealth === 'PRIMARY_FAILED' || node.primarySensor?.status === 'FAILED') {
        const key = `sensor-${node.id}-failed`;
        if (!processedKeysRef.current.has(key)) {
          detectedIncidents.push({
            id: `INC-SNS-${node.id}`,
            uniqueKey: key,
            type: 'SENSOR_FAULT',
            title: `Primary Sensor Telemetry Fault — ${node.name}`,
            zone: node.zone || 'Zone C Temple Street',
            severity: 'WARNING',
            drainNodeId: node.id,
            step: 'PERCEIVE',
            targetRef: node
          });
        }
      }
    });

    // Ingest new incidents into Workflow Board
    if (detectedIncidents.length > 0) {
      detectedIncidents.forEach(inc => {
        processedKeysRef.current.add(inc.uniqueKey);
      });
      setWorkflowItems(prev => [...prev, ...detectedIncidents]);
    }
  }, [floodAlerts, drainNodes, isAgentActive]);

  // ---------------------------------------------------------------------------
  // The Visible 6-Step Loop Execution Timer (PERCEIVE -> REASON -> PLAN -> ACT -> VERIFY -> DONE)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isAgentActive) return;

    const timer = setInterval(() => {
      setWorkflowItems(prevItems => {
        if (prevItems.length === 0) return prevItems;

        // Process first active item that is not waiting for manual approval
        const activeIdx = prevItems.findIndex(item => item.step !== 'DONE' && !item.isWaitingApproval);
        if (activeIdx === -1) return prevItems;

        const currentItem = { ...prevItems[activeIdx] };

        // STEP 1: PERCEIVE -> REASON
        if (currentItem.step === 'PERCEIVE') {
          setAgentActivity('sentinel', 'Acting', `Detected ${currentItem.type} at ${currentItem.drainNodeId} (${currentItem.zone})`);
          pushAgentMessage('Sentinel', 'Triage', `Node ${currentItem.drainNodeId} ${currentItem.type} telemetry ingested: Level ${currentItem.waterLevel || 'N/A'}`);

          currentItem.perceiveData = {
            drainId: currentItem.drainNodeId,
            zone: currentItem.zone,
            waterLevel: currentItem.waterLevel || 'Nominal',
            blockagePct: currentItem.blockagePct || 'N/A',
            timestamp: new Date().toLocaleTimeString()
          };

          currentItem.step = 'REASON';
          return [
            ...prevItems.slice(0, activeIdx),
            currentItem,
            ...prevItems.slice(activeIdx + 1)
          ];
        }

        // STEP 2: REASON -> PLAN
        if (currentItem.step === 'REASON') {
          setAgentActivity('sentinel', 'Idle');
          setAgentActivity('triage', 'Thinking', `Scoring risk priority for ${currentItem.zone}`);

          const priorityScore = calculateIncidentScore(currentItem);
          let reasonText = '';

          if (currentItem.type === 'FLOOD') {
            reasonText = `Flash inundation risk: Rapid water stage cresting in ${currentItem.zone} (${currentItem.waterLevel}) exceeds safety threshold. High population density requires immediate rescue staging.`;
          } else if (currentItem.type === 'BLOCKAGE') {
            reasonText = `Arterial drainage constriction: ${currentItem.drainNodeId} blockage reached ${currentItem.blockagePct}% due to accumulated silt/debris. Stormwater flow restricted to ${currentItem.flowRate || '0.5 m/s'}.`;
          } else if (currentItem.type === 'SENSOR_FAULT') {
            reasonText = `Sensor telemetry fault: Primary acoustic ultrasonic sensor at ${currentItem.drainNodeId} failed. Autonomous failover to submerged hydrostatic pressure sensor needed.`;
          } else {
            reasonText = `Operational anomaly detected at ${currentItem.zone}. Automated response planned.`;
          }

          currentItem.priorityScore = priorityScore;
          currentItem.reasonText = reasonText;
          pushAgentMessage('Triage', 'Dispatch', `Priority Score: ${priorityScore} calculated for ${currentItem.zone}. Options evaluated.`);

          currentItem.step = 'PLAN';
          return [
            ...prevItems.slice(0, activeIdx),
            currentItem,
            ...prevItems.slice(activeIdx + 1)
          ];
        }

        // STEP 3: PLAN -> ACT (or Waiting Approval)
        if (currentItem.step === 'PLAN') {
          setAgentActivity('triage', 'Idle');
          setAgentActivity('dispatch', 'Thinking', `Evaluating resource options for ${currentItem.zone}`);

          const options = evaluateResourceOptions(currentItem, rescueTeams, rescueTeams);
          const topOption = options.find(o => o.isAvailable) || options[0];

          currentItem.candidateOptions = options;
          currentItem.chosenOption = topOption;
          currentItem.confidenceScore = topOption?.score ? Math.round(topOption.score * 100) : 94;

          // Check for Contention / Conflict Handling
          const competingIncident = prevItems.find(
            other => other.id !== currentItem.id &&
            other.chosenOption?.id === topOption?.id &&
            other.step !== 'DONE'
          );

          if (competingIncident) {
            currentItem.conflictNote = `Contention resolved: ${currentItem.title} (Priority ${currentItem.priorityScore}) allocated ${topOption.name} over ${competingIncident.title} (Priority ${competingIncident.priorityScore || 50}).`;
            pushAgentMessage('Dispatch', 'Herald', currentItem.conflictNote);
          }

          // If in "Approve First" mode, pause and request user confirmation
          if (autonomyMode === 'APPROVE_FIRST') {
            currentItem.isWaitingApproval = true;
            setAgentActivity('dispatch', 'Waiting for approval', `Awaiting approval for ${topOption?.name}`);
            setProposedActions(prev => [...prev, currentItem]);
            pushAgentMessage('Dispatch', 'Operator', `Action proposed for ${currentItem.title}. Waiting for officer authorization.`);

            return [
              ...prevItems.slice(0, activeIdx),
              currentItem,
              ...prevItems.slice(activeIdx + 1)
            ];
          }

          // In AUTO mode: advance to ACT
          currentItem.step = 'ACT';
          return [
            ...prevItems.slice(0, activeIdx),
            currentItem,
            ...prevItems.slice(activeIdx + 1)
          ];
        }

        // STEP 4: ACT -> VERIFY
        if (currentItem.step === 'ACT') {
          setAgentActivity('dispatch', 'Acting', `Dispatching ${currentItem.chosenOption?.name || 'unit'}`);
          setAgentActivity('herald', 'Acting', `Broadcasting emergency alerts for ${currentItem.zone}`);

          // FLOOD WORKFLOW (Part 2)
          if (currentItem.type === 'FLOOD' && currentItem.chosenOption?.id) {
            // 1. Herald pre-evacuates shelters and sends alert
            const targetZone = riskZones.find(z => currentItem.zone?.includes(z.name) || z.name?.includes(currentItem.zone)) || riskZones[0];
            const targetCamp = reliefCamps.find(c => c.status === 'ACTIVE') || reliefCamps[0];
            if (targetZone && targetCamp && preEvacuateShelter) {
              preEvacuateShelter(targetZone.id, targetCamp.id);
            }

            // 2. Dispatch stages and sends rescue team
            assignTeamToAlert(currentItem.id, currentItem.chosenOption.id);
            pushAgentMessage('Dispatch', 'Herald', `Rescue team ${currentItem.chosenOption.name} staged and dispatched to ${currentItem.zone} (ETA ${currentItem.chosenOption.etaMinutes || 4}m)`);
            pushAgentMessage('Herald', 'Citizens', `PUBLIC FLOOD ALERT: Rapid inundation warning in ${currentItem.zone}. Evacuate to ${targetCamp?.name || 'shelter'}.`);

            // 3. Status moves Dispatched (with ETA) -> On Scene -> Returning -> Available
            const teamId = currentItem.chosenOption.id;
            setTimeout(() => {
              if (cycleTeamStatus) cycleTeamStatus(teamId, 'ON SCENE');
              pushAgentMessage('Dispatch', 'Sentinel', `${currentItem.chosenOption.name} is now ON SCENE at ${currentItem.zone}`);
            }, 3000);
            setTimeout(() => {
              if (cycleTeamStatus) cycleTeamStatus(teamId, 'RETURNING');
              pushAgentMessage('Dispatch', 'Steward', `${currentItem.chosenOption.name} completed extraction. RETURNING to base.`);
            }, 6500);
            setTimeout(() => {
              if (cycleTeamStatus) cycleTeamStatus(teamId, 'AVAILABLE');
              pushAgentMessage('Steward', 'Dispatch', `${currentItem.chosenOption.name} returned to base and is now AVAILABLE.`);
            }, 10000);

          // DRAINAGE WORKFLOW (Part 2)
          } else if (currentItem.type === 'BLOCKAGE') {
            // 1. Dispatch sends an Inspection Crew first (shown as "Inspection Crew Dispatched" tag on zone card)
            const targetZone = riskZones.find(z => currentItem.drainNodeId?.includes(z.id.replace('ZONE-', '')) || (currentItem.zone && currentItem.zone.includes(z.name))) || riskZones[0];
            if (targetZone && dispatchInspectionCrew) {
              dispatchInspectionCrew(targetZone.id);
            }
            pushAgentMessage('Dispatch', 'Sentinel', `Inspection Crew Dispatched to ${currentItem.drainNodeId} to evaluate trash rack debris.`);

            // 2. Dispatch sends matched cleaning crew
            assignWorkerToBlockage(currentItem.drainNodeId, currentItem.chosenOption?.id);
            pushAgentMessage('Dispatch', 'Steward', `Matched ${currentItem.chosenOption?.name || 'Drainage Crew'} deployed with ${currentItem.chosenOption?.equipment || 'specialized equipment'}.`);

          } else if (currentItem.type === 'SENSOR_FAULT') {
            restorePrimarySensor(currentItem.drainNodeId);
            pushAgentMessage('Sentinel', 'Steward', `Backup sensor verified active on ${currentItem.drainNodeId}.`);
          }

          currentItem.actTimestamp = new Date().toLocaleTimeString();
          currentItem.step = 'VERIFY';

          // Set 10-Second Undoable Action
          setUndoableAction({
            teamId: currentItem.chosenOption?.id,
            teamName: currentItem.chosenOption?.name,
            alertId: currentItem.type === 'FLOOD' ? currentItem.id : null,
            drainId: currentItem.drainNodeId,
            description: `${currentItem.chosenOption?.name || 'Resource'} deployed to ${currentItem.zone}`
          });

          return [
            ...prevItems.slice(0, activeIdx),
            currentItem,
            ...prevItems.slice(activeIdx + 1)
          ];
        }

        // STEP 5: VERIFY -> DONE
        if (currentItem.step === 'VERIFY') {
          setAgentActivity('steward', 'Acting', 'Verifying clearance & synchronizing store state');

          // DRAINAGE WORKFLOW: Blockage % drops after clearing (87% -> 40% -> 10%)
          if (currentItem.type === 'BLOCKAGE' && animateDrainClearing) {
            animateDrainClearing(currentItem.drainNodeId);
            pushAgentMessage('Steward', 'Sentinel', `VERIFY: ${currentItem.drainNodeId} blockage clearing verified (87% -> 40% -> 10%). Risk badge normalized.`);
          }

          // FLOOD WORKFLOW: Herald schedules follow-up awareness campaign
          if (currentItem.type === 'FLOOD' && scheduleAwarenessCampaign) {
            scheduleAwarenessCampaign({
              zone: currentItem.zone,
              title: `Post-Storm Citizen Drainage Hygiene & Readiness Drive`,
              scheduledDate: 'Tomorrow, 09:30 AM',
              targetHouseholds: 1800,
              linkedAlertId: currentItem.id,
              channel: 'Mobile PA Van & SMS Alert'
            });
            pushAgentMessage('Herald', 'Steward', `Follow-up awareness campaign scheduled for ${currentItem.zone}.`);
          }

          pushAgentMessage('Steward', 'Dispatch', `Verification complete: Store counters and tab states synchronized.`);

          currentItem.verifyData = {
            status: 'VERIFIED_ACTIVE',
            resourceAssigned: currentItem.chosenOption?.name || 'Assigned',
            timestamp: new Date().toLocaleTimeString()
          };

          // STEP 6: REPORT to Activity Log
          const plainReason = `${currentItem.chosenOption?.name || 'Unit'} assigned to ${currentItem.zone}: ${currentItem.reasonText || 'Optimal rule match'}`;
          addActivity(
            currentItem.type === 'FLOOD' ? 'RESCUE_DISPATCHED' : 'BLOCKAGE_ASSIGNED',
            plainReason,
            'Coordinator Agent',
            '[SIMULATED]',
            true
          );

          currentItem.step = 'DONE';
          currentItem.completedAt = new Date().toLocaleTimeString();

          setAgentActivity('dispatch', 'Idle');
          setAgentActivity('herald', 'Idle');
          setAgentActivity('steward', 'Idle');

          setStats(s => ({
            ...s,
            incidentsHandled: s.incidentsHandled + 1
          }));

          return [
            ...prevItems.slice(0, activeIdx),
            currentItem,
            ...prevItems.slice(activeIdx + 1)
          ];
        }

        return prevItems;
      });
    }, 900); // 900ms visible delay between steps

    return () => clearInterval(timer);
  }, [
    isAgentActive,
    autonomyMode,
    rescueTeams,
    riskZones,
    reliefCamps,
    assignTeamToAlert,
    assignWorkerToBlockage,
    restorePrimarySensor,
    addActivity,
    setAgentActivity,
    pushAgentMessage,
    preEvacuateShelter,
    dispatchInspectionCrew,
    animateDrainClearing,
    scheduleAwarenessCampaign,
    cycleTeamStatus
  ]);

  // ---------------------------------------------------------------------------
  // Approve / Reject / Edit Handlers for Proposed Actions (Approve First Mode)
  // ---------------------------------------------------------------------------
  const handleApproveAction = (actionItem) => {
    setProposedActions(prev => prev.filter(a => a.id !== actionItem.id));
    setWorkflowItems(prev => prev.map(item => {
      if (item.id === actionItem.id) {
        return {
          ...item,
          isWaitingApproval: false,
          step: 'ACT'
        };
      }
      return item;
    }));
    pushAgentMessage('Operator', 'Dispatch', `Action approved for ${actionItem.title}. Resuming execution.`);
  };

  const handleRejectAction = (actionItem) => {
    setProposedActions(prev => prev.filter(a => a.id !== actionItem.id));
    setWorkflowItems(prev => prev.filter(item => item.id !== actionItem.id));
    addActivity('AGENT_PROPOSAL_REJECTED', `Operator rejected agent proposed assignment for ${actionItem.title}.`, 'Operator', '[MANUAL]', false);
    pushAgentMessage('Operator', 'Dispatch', `Action rejected by operator for ${actionItem.title}.`);
  };

  const handleOpenEdit = (actionItem) => {
    setEditingActionId(actionItem.id);
    setEditForm({
      targetId: actionItem.chosenOption?.id || '',
      notes: actionItem.reasonText || ''
    });
  };

  const handleSaveEditAndApprove = (actionItem) => {
    const selectedTeam = rescueTeams.find(t => t.id === editForm.targetId);
    setProposedActions(prev => prev.filter(a => a.id !== actionItem.id));
    setWorkflowItems(prev => prev.map(item => {
      if (item.id === actionItem.id) {
        return {
          ...item,
          isWaitingApproval: false,
          chosenOption: selectedTeam ? {
            id: selectedTeam.id,
            name: selectedTeam.name,
            role: selectedTeam.role,
            leader: selectedTeam.leader || 'Leader'
          } : item.chosenOption,
          reasonText: editForm.notes || item.reasonText,
          step: 'ACT'
        };
      }
      return item;
    }));
    setEditingActionId(null);
    pushAgentMessage('Operator', 'Dispatch', `Action modified by operator and approved for ${actionItem.title}.`);
  };

  // ---------------------------------------------------------------------------
  // Simulated Agent Chat Box Send Handler
  // ---------------------------------------------------------------------------
  const handleSendChat = (presetQuestion = null) => {
    const query = presetQuestion || chatInput.trim();
    if (!query) return;

    const userMsg = { id: `u-${Date.now()}`, sender: 'user', text: query };
    setChatMessages(prev => [...prev, userMsg]);
    if (!presetQuestion) setChatInput('');

    setTimeout(() => {
      const answer = answerAgentQuestion(query, {
        drainNodes,
        floodAlerts,
        rescueTeams,
        loraQueue,
        activityLog
      });
      const agentMsg = { id: `a-${Date.now()}`, sender: 'agent', text: answer };
      setChatMessages(prev => [...prev, agentMsg]);
    }, 400);
  };

  // ---------------------------------------------------------------------------
  // Computed Status Counters
  // ---------------------------------------------------------------------------
  const tasksInProgress = useMemo(() => {
    return workflowItems.filter(i => i.step !== 'DONE' && !i.isWaitingApproval).length;
  }, [workflowItems]);

  const waitingApprovalCount = useMemo(() => {
    return proposedActions.length;
  }, [proposedActions]);

  const completedTodayCount = useMemo(() => {
    return workflowItems.filter(i => i.step === 'DONE').length + 18;
  }, [workflowItems]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* -----------------------------------------------------------------------
          TOP HEADER STRIP
      ----------------------------------------------------------------------- */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
          color: '#F8FAFC',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Left: Brand & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0D9488 0%, #2563EB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(13, 148, 136, 0.4)'
            }}
          >
            <Cpu size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.02em', color: '#FFFFFF' }}>
                SensaFlow Multi-Agent Coordinator
              </span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}
              >
                SIMULATED AI AGENT
              </span>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '9px',
                  fontWeight: 800
                }}
              >
                [SIMULATED]
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Autonomous 5-Agent Cooperative Engine &bull; Rule-based decision loop &bull; DEMO DATA
            </div>
          </div>
        </div>

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Active / Paused Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isAgentActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${isAgentActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: isAgentActive ? '#34D399' : '#F87171'
            }}
          >
            <div
              className={isAgentActive ? 'agent-pulse-badge' : ''}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isAgentActive ? '#10B981' : '#EF4444'
              }}
            />
            {isAgentActive ? 'ACTIVE' : 'PAUSED'}
          </div>

          {/* Autonomy Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '2px',
              fontSize: '11px'
            }}
          >
            <button
              type="button"
              onClick={() => setAutonomyMode('AUTO')}
              style={{
                background: autonomyMode === 'AUTO' ? '#0D9488' : 'transparent',
                color: autonomyMode === 'AUTO' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setAutonomyMode('APPROVE_FIRST')}
              style={{
                background: autonomyMode === 'APPROVE_FIRST' ? '#7C3AED' : 'transparent',
                color: autonomyMode === 'APPROVE_FIRST' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Approve first
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#F8FAFC',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          MAIN EXPANDED BODY
      ----------------------------------------------------------------------- */}
      {isExpanded && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 10-Second Undo Banner (When Action Executed) */}
          {undoableAction && (
            <div
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid #3B82F6',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF' }}>
                <Clock size={16} />
                <span>
                  <strong>Agent Action Executed:</strong> {undoableAction.description}
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>
                  ({undoCountdown}s remaining to revert)
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerUndo}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Undo2 size={13} />
                <span>Undo Action</span>
              </button>
            </div>
          )}

          {/* -------------------------------------------------------------------
              PART 1: THE 5 AGENT CARDS
          ------------------------------------------------------------------- */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Cooperative Agent Swarm Status
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px'
              }}
            >
              {agents.map(ag => {
                let dotColor = '#94A3B8';
                if (ag.status === 'Thinking') dotColor = '#F59E0B';
                if (ag.status === 'Acting') dotColor = '#10B981';
                if (ag.status === 'Waiting for approval') dotColor = '#8B5CF6';

                return (
                  <div
                    key={ag.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: ag.status !== 'Idle' ? `0 0 6px ${dotColor}` : 'none'
                          }}
                        />
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{ag.name}</strong>
                      </div>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: ag.color,
                          background: `${ag.color}15`,
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}
                      >
                        {ag.role}
                      </span>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', minHeight: '26px', lineHeight: 1.3 }}>
                      {ag.currentTask}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '6px', color: 'var(--text-muted)' }}>
                      <span>Done Today: <strong>{ag.completedToday}</strong></span>
                      <span>Conf: <strong>{ag.confidence}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------------------
              COUNT STATS STRIP
          ------------------------------------------------------------------- */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              padding: '10px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tasks In Progress</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{tasksInProgress}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Waiting for Approval</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: waitingApprovalCount > 0 ? '#D97706' : 'var(--text-primary)' }}>
                {waitingApprovalCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Completed Today</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{completedTodayCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Simulated Latency</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0D9488' }}>{stats.avgResponseTime}</div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              PROPOSED ACTIONS (WAITING FOR APPROVAL LIST IN APPROVE-FIRST MODE)
          ------------------------------------------------------------------- */}
          {proposedActions.length > 0 && (
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#7C3AED' }}>
                  ⚠️ PROPOSED ACTIONS AWAITING OPERATOR APPROVAL ({proposedActions.length})
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Approve First Autonomy Mode Active
                </span>
              </div>

              {proposedActions.map(action => (
                <div
                  key={action.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      {action.title} &bull; <span style={{ color: '#2563EB' }}>{action.zone}</span>
                    </strong>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0D9488', background: 'rgba(13, 148, 136, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      Confidence: {action.confidenceScore}%
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <strong>Reasoning:</strong> {action.reasonText}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                    <strong>Planned Action:</strong> Assign {action.chosenOption?.name} ({action.chosenOption?.role})
                  </div>

                  {/* Inline Edit Form */}
                  {editingActionId === action.id ? (
                    <div style={{ marginTop: '6px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700 }}>Select Override Team / Worker:</label>
                      <select
                        value={editForm.targetId}
                        onChange={(e) => setEditForm({ ...editForm, targetId: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}
                      >
                        {rescueTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.status} - {t.zone})</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEditAndApprove(action)}
                          style={{ background: '#10B981', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Save & Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingActionId(null)}
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleApproveAction(action)}
                        style={{
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectAction(action)}
                        style={{
                          background: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(action)}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* -------------------------------------------------------------------
              PART 3: THE LIVE AGENT WORKFLOW BOARD
          ------------------------------------------------------------------- */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Parallel Agent Workflow Board (6-Step Visible Engine)
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Perceive &bull; Reason &bull; Plan &bull; Act &bull; Verify &bull; Done
              </span>
            </div>

            {workflowItems.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}
              >
                🌱 <strong>No active incidents.</strong> Agents Sentinel, Triage, Dispatch, Herald, and Steward are on standby. Telemetry across all 6 drainage nodes is nominal.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, minmax(130px, 1fr))',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px'
                }}
              >
                {['PERCEIVE', 'REASON', 'PLAN', 'ACT', 'VERIFY', 'DONE'].map(col => {
                  const colItems = workflowItems.filter(item => item.step === col);

                  return (
                    <div
                      key={col}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '8px',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'var(--text-muted)',
                          paddingBottom: '4px',
                          borderBottom: '1px solid var(--border-light)',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{col}</span>
                        <span style={{ opacity: 0.7 }}>({colItems.length})</span>
                      </div>

                      {colItems.map(item => (
                        <div
                          key={item.id}
                          className="agent-queue-item"
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '10px', color: item.type === 'FLOOD' ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            {item.zone}
                          </div>

                          {col === 'DONE' && (
                            <button
                              type="button"
                              onClick={() => setSelectedTrace(item)}
                              style={{
                                marginTop: '4px',
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: '#2563EB',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 5px',
                                fontSize: '9px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              Why did agent do this? &rarr;
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------------
              INTER-AGENT MESSAGE FEED
          ------------------------------------------------------------------- */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              📡 Inter-Agent Communication Bus (Live Message Feed)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
              {agentMessages.slice(0, 5).map(m => (
                <div key={m.id} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.time}</span>
                  <strong style={{ color: '#0D9488' }}>{m.from}</strong>
                  <ArrowRight size={10} color="#94A3B8" />
                  <strong style={{ color: '#2563EB' }}>{m.to}:</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------------------------
              PRESET SCENARIOS & SYSTEM CONTROLS
          ------------------------------------------------------------------- */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Preset Demonstration Scenarios & Controls
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {/* Scenario 1 */}
              <button
                type="button"
                onClick={triggerHeavyRainSurgeScenario}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                🌧️ Heavy Rain Surge
              </button>

              {/* Scenario 2 */}
              <button
                type="button"
                onClick={triggerSensorFailureScenario}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                ⚠️ Sensor Failure
              </button>

              {/* Scenario 3 */}
              <button
                type="button"
                onClick={triggerNetworkOutageScenario}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                📶 Network Outage
              </button>

              {/* Scenario 4 */}
              <button
                type="button"
                onClick={triggerMultiIncidentStormScenario}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                  border: '1px solid #DC2626',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  color: '#DC2626'
                }}
              >
                ⚡ Multi-Incident Storm
              </button>

              {/* Pause/Resume */}
              <button
                type="button"
                onClick={() => setIsAgentActive(!isAgentActive)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isAgentActive ? <Pause size={12} /> : <Play size={12} />}
                <span>{isAgentActive ? 'Pause Agent' : 'Resume Agent'}</span>
              </button>

              {/* Reset */}
              <button
                type="button"
                onClick={resetDemoData}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Store</span>
              </button>

              {/* Chat Toggle */}
              <button
                type="button"
                onClick={() => setChatOpen(!chatOpen)}
                style={{
                  background: chatOpen ? '#2563EB' : 'var(--bg-secondary)',
                  color: chatOpen ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: 'auto'
                }}
              >
                <MessageSquare size={12} />
                <span>Simulated Agent Chat</span>
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              SIMULATED AGENT CHAT BOX
          ------------------------------------------------------------------- */}
          {chatOpen && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#2563EB" />
                  <strong style={{ fontSize: '12px' }}>SensaFlow Agent Q&A Assistant</strong>
                  <span style={{ fontSize: '9px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                    SIMULATED RULE-BASED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '6px 0'
                }}
              >
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.sender === 'user' ? '#2563EB' : 'var(--bg-card)',
                      color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      maxWidth: '85%',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Preset Question Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  'What is the highest risk now?',
                  'Which teams are free?',
                  'Summarize this shift'
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendChat(q)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '12px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#2563EB'
                    }}
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>

              {/* Input Row */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Ask the simulated coordinator..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSendChat()}
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* -----------------------------------------------------------------------
          "WHY DID THE AGENT DO THIS?" TRACE MODAL
      ----------------------------------------------------------------------- */}
      {selectedTrace && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedTrace(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                  Perceive-to-Report Trace Audit
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedTrace.title} &bull; Zone: {selectedTrace.zone}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrace(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              {/* Step 1: Perceive */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#0D9488' }}>1. PERCEIVE (Sentinel Sensor Agent):</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  Detected {selectedTrace.type} at {selectedTrace.drainNodeId}. Water level: {selectedTrace.waterLevel || 'Normal'}, Blockage: {selectedTrace.blockagePct || 'N/A'}%.
                </div>
              </div>

              {/* Step 2: Reason */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#D97706' }}>2. REASON (Triage Priority Agent):</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  {selectedTrace.reasonText}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#D97706' }}>
                  Calculated Priority Score: <strong>{selectedTrace.priorityScore || 85} / 100</strong>
                </div>
              </div>

              {/* Step 3: Plan */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#2563EB' }}>3. PLAN (Triage & Dispatch Agents):</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  Evaluated candidate resources:
                </div>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {(selectedTrace.candidateOptions || []).slice(0, 3).map((opt, idx) => (
                    <li key={idx} style={{ fontSize: '11px' }}>
                      {opt.name} ({opt.role}) &bull; Score: <strong>{opt.score}</strong> &bull; ETA: {opt.etaMinutes}m
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step 4: Act */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#4F46E5' }}>4. ACT (Dispatch & Herald Agents):</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  Assigned <strong>{selectedTrace.chosenOption?.name}</strong>. Public advisory and preventive campaign drafted for {selectedTrace.zone}.
                </div>
              </div>

              {/* Step 5: Verify */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#059669' }}>5. VERIFY (Steward Maintenance Agent):</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  Store state verified. Target status updated, double-booking check passed, counts across all 6 tabs synchronized.
                </div>
              </div>

              {/* Step 6: Report */}
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#7C3AED' }}>6. REPORT:</strong>
                <div style={{ marginTop: '3px', color: 'var(--text-primary)' }}>
                  Transaction logged to Activity Log with <strong>🤖 AGENT</strong> badge. Completed at {selectedTrace.completedAt || 'Just now'}.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedTrace(null)}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Audit Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
