/**
 * SensaFlow Coordinator Agent (src/agent/coordinator.js)
 * 
 * Autonomous, rule-based incident coordinator running client-side inside React.
 * Operates on a prioritized shared task queue using five parallel helpers:
 * 
 * 1. Sensor Watch: Detects primary sensor failures, activates backup transducers, and logs failover.
 * 2. Triage: Scores incidents by hydro threat, severity, and age; orders queue (flood alerts above blockages).
 * 3. Dispatcher: Auto-assigns nearest available rescue teams/workers, prevents double-booking, reallocates freed units.
 * 4. Communicator: Drafts citizen warnings, schedules preventive campaigns, queues LoRa packets during network outages.
 * 5. Maintenance & Reporter: Generates desilting tasks, marks tasks complete when clear, compiles live shift summaries.
 */

// Priority Scoring Weights
const SCORE_WEIGHTS = {
  INCIDENT_FLOOD_ALERT: 100,
  INCIDENT_SEVERE_BLOCKAGE: 75,
  INCIDENT_MODERATE_BLOCKAGE: 50,
  INCIDENT_SENSOR_FAILURE: 45,
  SEVERITY_CRITICAL: 35,
  SEVERITY_WARNING: 15,
  SEVERITY_NORMAL: 0
};

export const HELPER_NAMES = {
  SENSOR_WATCH: 'Sensor Watch',
  TRIAGE: 'Triage',
  DISPATCHER: 'Dispatcher',
  COMMUNICATOR: 'Communicator',
  MAINTENANCE_REPORTER: 'Maintenance & Reporter'
};

/**
 * Computes priority score for a given incident item
 */
export function calculateIncidentScore(item) {
  let score = 0;

  if (item.type === 'FLOOD_ALERT') {
    score += SCORE_WEIGHTS.INCIDENT_FLOOD_ALERT;
    if (item.severity === 'CRITICAL' || item.level === 'DANGER') score += SCORE_WEIGHTS.SEVERITY_CRITICAL;
    else if (item.severity === 'WARNING') score += SCORE_WEIGHTS.SEVERITY_WARNING;
  } else if (item.type === 'BLOCKAGE') {
    const pct = item.blockagePct || 0;
    if (pct >= 80) score += SCORE_WEIGHTS.INCIDENT_SEVERE_BLOCKAGE + SCORE_WEIGHTS.SEVERITY_CRITICAL;
    else if (pct >= 60) score += SCORE_WEIGHTS.INCIDENT_SEVERE_BLOCKAGE + SCORE_WEIGHTS.SEVERITY_WARNING;
    else score += SCORE_WEIGHTS.INCIDENT_MODERATE_BLOCKAGE;
  } else if (item.type === 'SENSOR_FAULT') {
    score += SCORE_WEIGHTS.INCIDENT_SENSOR_FAILURE + SCORE_WEIGHTS.SEVERITY_WARNING;
  }

  // Age factor: +1 per minute up to 20
  if (item.createdAt) {
    const ageMinutes = Math.floor((Date.now() - item.createdAt) / 60000);
    score += Math.min(20, Math.max(0, ageMinutes));
  }

  return score;
}

/**
 * HELPER 1: SENSOR WATCH
 * Scans drain telemetry nodes for primary sensor faults.
 */
export function runSensorWatch({ drainNodes, actions, autonomyMode, existingProposals }) {
  const tasks = [];
  const proposals = [];

  (drainNodes || []).forEach(node => {
    const isPrimaryFailed = node.primarySensor?.status === 'FAILED';
    const isBackupActive = node.sensorHealth === 'BACKUP_ACTIVE' || node.backupSensor?.status === 'ACTIVE';

    if (isPrimaryFailed && !isBackupActive) {
      const taskId = `TASK-SW-${node.id}`;
      const reason = `${node.id} (${node.name || node.location}): primary ultrasonic sensor offline. Dual-sensor failover required.`;

      tasks.push({
        id: taskId,
        targetId: node.id,
        type: 'SENSOR_FAULT',
        title: `Sensor Failover: ${node.id}`,
        location: node.location,
        helper: HELPER_NAMES.SENSOR_WATCH,
        priorityScore: 90,
        status: autonomyMode === 'AUTO' ? 'RESOLVING' : 'WAITING_APPROVAL',
        plainReason: reason,
        createdAt: Date.now()
      });

      if (autonomyMode === 'AUTO') {
        actions.restorePrimarySensor(node.id, {
          reason: `Auto-failover engaged for ${node.id}: switched to hydrostatic pressure transducer backup.`,
          actor: 'Coordinator Agent',
          tag: 'Sensor Watch',
          isAgent: true
        });
      } else {
        const alreadyProposed = existingProposals.some(p => p.id === `PROP-SW-${node.id}`);
        if (!alreadyProposed) {
          proposals.push({
            id: `PROP-SW-${node.id}`,
            helper: HELPER_NAMES.SENSOR_WATCH,
            title: `Activate Backup Sensor on ${node.id}`,
            details: reason,
            actionType: 'RESTORE_SENSOR',
            payload: { nodeId: node.id },
            plainReason: `Primary sensor fault on ${node.id}: switch to hot-standby hydrostatic pressure transducer.`
          });
        }
      }
    }
  });

  return { tasks, proposals };
}

/**
 * HELPER 2: TRIAGE
 * Ingests all active incidents and sorts them descending by priority score.
 */
export function runTriage({ floodAlerts, drainNodes, sensorTasks }) {
  const queue = [];

  // Ingest active flood alerts
  (floodAlerts || []).forEach(alert => {
    if (alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED') {
      const isCritical = alert.severity === 'CRITICAL' || alert.level === 'DANGER';
      const score = calculateIncidentScore({ type: 'FLOOD_ALERT', severity: alert.severity, level: alert.level, createdAt: alert.timestamp });
      
      queue.push({
        id: `TRIAGE-${alert.id}`,
        targetId: alert.id,
        type: 'FLOOD_ALERT',
        title: alert.title || `Inundation Threat: ${alert.location}`,
        location: alert.location || alert.zone,
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        helper: HELPER_NAMES.DISPATCHER,
        priorityScore: score,
        status: alert.assignedTeamId ? 'IN_PROGRESS' : 'PENDING_DISPATCH',
        assignedTo: alert.assignedTeamName || null,
        plainReason: `Hydro inundation alert in ${alert.location || alert.zone} (Stage: ${alert.waterLevel || 'High'})`,
        createdAt: alert.timestamp || Date.now()
      });
    }
  });

  // Ingest high drain blockages
  (drainNodes || []).forEach(drain => {
    if ((drain.blockagePct >= 60 || drain.status === 'CRITICAL') && drain.operationalStatus !== 'CLEARED') {
      const score = calculateIncidentScore({ type: 'BLOCKAGE', blockagePct: drain.blockagePct, createdAt: Date.now() });

      queue.push({
        id: `TRIAGE-BLOCK-${drain.id}`,
        targetId: drain.id,
        type: 'BLOCKAGE',
        title: `Obstruction: ${drain.id} (${drain.blockagePct}% Blocked)`,
        location: drain.location,
        severity: drain.blockagePct >= 80 ? 'CRITICAL' : 'WARNING',
        helper: drain.assignedWorker ? HELPER_NAMES.MAINTENANCE_REPORTER : HELPER_NAMES.DISPATCHER,
        priorityScore: score,
        status: drain.assignedWorker ? 'IN_PROGRESS' : 'PENDING_DISPATCH',
        assignedTo: drain.assignedWorker || null,
        plainReason: `${drain.location} flow constricted at ${drain.blockagePct}%. Desilting required.`,
        createdAt: Date.now()
      });
    }
  });

  // Ingest sensor watch tasks
  sensorTasks.forEach(st => queue.push(st));

  // Sort queue strictly descending by score (Flood Alerts above Blockages)
  queue.sort((a, b) => b.priorityScore - a.priorityScore);

  return queue;
}

/**
 * HELPER 3: DISPATCHER
 * Matches pending alerts and blockages to available teams without double-booking.
 */
export function runDispatcher({ queue, rescueTeams, drainNodes, floodAlerts, actions, autonomyMode, existingProposals }) {
  const proposals = [];
  const busyTeamIds = new Set(
    (rescueTeams || [])
      .filter(t => t.status === 'DISPATCHED' || t.status === 'ON SCENE')
      .map(t => t.id)
  );

  const pendingAlerts = queue.filter(item => item.type === 'FLOOD_ALERT' && item.status === 'PENDING_DISPATCH');

  pendingAlerts.forEach(item => {
    const alert = (floodAlerts || []).find(a => a.id === item.targetId);
    if (!alert) return;

    // Find free rescue team
    const freeTeams = (rescueTeams || []).filter(t => 
      !busyTeamIds.has(t.id) && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
    );

    if (freeTeams.length > 0) {
      // Pick best matching by zone or lowest workload
      const chosenTeam = freeTeams.find(t => 
        (alert.zone && t.zone && alert.zone.toLowerCase().includes(t.zone.toLowerCase()))
      ) || freeTeams[0];

      busyTeamIds.add(chosenTeam.id);

      const plainReason = `${chosenTeam.name} assigned to ${alert.location || alert.zone}: nearest free emergency response unit (workload: ${chosenTeam.workload || 0}).`;

      if (autonomyMode === 'AUTO') {
        actions.assignTeamToAlert(alert.id, chosenTeam.id, plainReason, 'Coordinator Agent');
      } else {
        const alreadyProposed = existingProposals.some(p => p.id === `PROP-DISP-${alert.id}`);
        if (!alreadyProposed) {
          proposals.push({
            id: `PROP-DISP-${alert.id}`,
            helper: HELPER_NAMES.DISPATCHER,
            title: `Dispatch ${chosenTeam.name}`,
            target: alert.title || alert.location,
            details: plainReason,
            actionType: 'ASSIGN_TEAM',
            payload: { alertId: alert.id, teamId: chosenTeam.id, reason: plainReason },
            plainReason
          });
        }
      }
    }
  });

  // Handle drain blockage worker assignments
  const pendingBlockages = queue.filter(item => item.type === 'BLOCKAGE' && item.status === 'PENDING_DISPATCH');
  pendingBlockages.forEach(item => {
    const drain = (drainNodes || []).find(d => d.id === item.targetId);
    if (!drain || drain.assignedWorker) return;

    const plainReason = `Assigned Municipal Vacuum Crew to ${drain.id}: desilting sediment accumulation (${drain.blockagePct}% restricted).`;

    if (autonomyMode === 'AUTO') {
      actions.assignWorkerToBlockage(drain.id, 'Rapid Desilting Crew 2', 'CREW-02', plainReason, 'Coordinator Agent');
    } else {
      const alreadyProposed = existingProposals.some(p => p.id === `PROP-WORKER-${drain.id}`);
      if (!alreadyProposed) {
        proposals.push({
          id: `PROP-WORKER-${drain.id}`,
          helper: HELPER_NAMES.DISPATCHER,
          title: `Assign Desilting Worker to ${drain.id}`,
          target: drain.location,
          details: plainReason,
          actionType: 'ASSIGN_WORKER',
          payload: { drainId: drain.id, workerName: 'Rapid Desilting Crew 2', workerId: 'CREW-02', reason: plainReason },
          plainReason
        });
      }
    }
  });

  return { proposals };
}

/**
 * HELPER 4: COMMUNICATOR
 * Prepares citizen warnings, schedules awareness campaigns, and queues LoRa packets.
 */
export function runCommunicator({ queue, floodAlerts, scheduledCampaigns, isOutageActive, loraQueue, actions, autonomyMode, existingProposals }) {
  const proposals = [];

  queue.forEach(item => {
    if (item.type === 'FLOOD_ALERT' && (item.severity === 'CRITICAL' || item.priorityScore >= 110)) {
      const alert = (floodAlerts || []).find(a => a.id === item.targetId);
      if (!alert) return;

      const zoneName = alert.zone || alert.location || 'Catchment Lowlands';

      // 1. Check if awareness campaign already scheduled for this zone
      const campaignExists = (scheduledCampaigns || []).some(c => 
        c.zone && c.zone.toLowerCase().includes(zoneName.toLowerCase())
      );

      if (!campaignExists) {
        const campaignTitle = `Emergency Inundation Route Advisory — ${zoneName}`;
        const plainReason = `Scheduled loudspeaker PA van & SMS awareness drive for ${zoneName}: proactive evacuation prep.`;

        if (autonomyMode === 'AUTO') {
          actions.scheduleAwarenessCampaign({
            zone: zoneName,
            title: campaignTitle,
            scheduledDate: 'Immediate Broadcast',
            targetHouseholds: 1500,
            channel: 'Loudspeaker PA Van & SMS Alert',
            linkedAlertId: alert.id
          });
          actions.addActivity('CAMPAIGN_AUTO_SCHEDULED', plainReason, 'Coordinator Agent', 'Communicator', true);
        } else {
          const alreadyProposed = existingProposals.some(p => p.id === `PROP-COMM-CAMP-${alert.id}`);
          if (!alreadyProposed) {
            proposals.push({
              id: `PROP-COMM-CAMP-${alert.id}`,
              helper: HELPER_NAMES.COMMUNICATOR,
              title: `Schedule Campaign: ${zoneName}`,
              target: zoneName,
              details: plainReason,
              actionType: 'SCHEDULE_CAMPAIGN',
              payload: {
                zone: zoneName,
                title: campaignTitle,
                scheduledDate: 'Immediate Broadcast',
                targetHouseholds: 1500,
                channel: 'Loudspeaker PA Van & SMS Alert',
                linkedAlertId: alert.id
              },
              plainReason
            });
          }
        }
      }

      // 2. If cellular network outage is active, ensure LoRa fallback packet is queued
      if (isOutageActive) {
        const loraQueued = (loraQueue || []).some(q => 
          (q.payload?.zone && q.payload.zone.includes(zoneName)) || (q.zone && q.zone.includes(zoneName))
        );

        if (!loraQueued) {
          const loraMsg = `EMERGENCY ALERT: High inundation in ${zoneName}. Evacuate ground levels. Frequency 866.5MHz.`;
          const plainReason = `Transmitted emergency packet via LoRa Sub-GHz mesh: cellular backhaul offline for ${zoneName}.`;

          if (autonomyMode === 'AUTO') {
            actions.queueLoRaAlert({ zone: zoneName, message: loraMsg });
            actions.addActivity('LORA_FALLBACK_DISPATCH', plainReason, 'Coordinator Agent', 'Communicator', true);
          } else {
            const alreadyProposed = existingProposals.some(p => p.id === `PROP-COMM-LORA-${alert.id}`);
            if (!alreadyProposed) {
              proposals.push({
                id: `PROP-COMM-LORA-${alert.id}`,
                helper: HELPER_NAMES.COMMUNICATOR,
                title: `Queue LoRa Emergency Broadcast: ${zoneName}`,
                target: zoneName,
                details: plainReason,
                actionType: 'QUEUE_LORA',
                payload: { zone: zoneName, message: loraMsg },
                plainReason
              });
            }
          }
        }
      }
    }
  });

  return { proposals };
}

/**
 * HELPER 5: MAINTENANCE & REPORTER
 * Creates upkeep tasks, clears resolved jobs, and compiles real-time shift summaries.
 */
export function runMaintenanceAndReporter({ drainNodes, maintenanceTasks, actions, autonomyMode, existingProposals }) {
  const proposals = [];

  // 1. Create maintenance tasks for drains >= 60% with no existing task
  (drainNodes || []).forEach(drain => {
    if (drain.blockagePct >= 60 && drain.operationalStatus !== 'CLEARED') {
      const taskExists = (maintenanceTasks || []).some(t => 
        t.drainId === drain.id && t.status !== 'DONE'
      );

      if (!taskExists) {
        const plainReason = `Created urgent desilting upkeep task for ${drain.id}: silt accumulation at ${drain.blockagePct}%.`;

        if (autonomyMode === 'AUTO') {
          actions.createMaintenanceTask({
            drainId: drain.id,
            title: `Emergency Desilting & Trash Rack Clear — ${drain.id}`,
            location: drain.location,
            type: 'Mechanical Desilting',
            priority: drain.blockagePct >= 80 ? 'CRITICAL' : 'HIGH',
            assignedWorker: drain.assignedWorker || 'Unassigned',
            assignedWorkerId: drain.assignedWorkerId || null,
            preRainTag: true,
            notes: `Auto-generated by SensaFlow Coordinator Agent. Restriction index: ${drain.blockagePct}%.`
          });
        } else {
          const alreadyProposed = existingProposals.some(p => p.id === `PROP-MAINT-${drain.id}`);
          if (!alreadyProposed) {
            proposals.push({
              id: `PROP-MAINT-${drain.id}`,
              helper: HELPER_NAMES.MAINTENANCE_REPORTER,
              title: `Create Upkeep Task for ${drain.id}`,
              target: drain.location,
              details: plainReason,
              actionType: 'CREATE_TASK',
              payload: {
                drainId: drain.id,
                title: `Emergency Desilting & Trash Rack Clear — ${drain.id}`,
                location: drain.location,
                type: 'Mechanical Desilting',
                priority: drain.blockagePct >= 80 ? 'CRITICAL' : 'HIGH',
                assignedWorker: drain.assignedWorker || 'Unassigned',
                assignedWorkerId: drain.assignedWorkerId || null,
                preRainTag: true
              },
              plainReason
            });
          }
        }
      }
    }
  });

  // 2. Auto-close tasks if drain is already clear
  (maintenanceTasks || []).forEach(task => {
    if (task.status !== 'DONE' && task.drainId) {
      const drain = (drainNodes || []).find(d => d.id === task.drainId);
      if (drain && (drain.blockagePct < 25 || drain.operationalStatus === 'CLEARED')) {
        const plainReason = `Auto-closed maintenance task ${task.id}: drainage clearance verified at ${drain.id}.`;
        if (autonomyMode === 'AUTO') {
          actions.completeMaintenanceTask(task.id);
        }
      }
    }
  });

  return { proposals };
}

/**
 * Compiles a real-time shift report summary
 */
export function generateShiftSummary({ floodAlerts, drainNodes, rescueTeams, maintenanceTasks, activityLog, loraQueue }) {
  const activeAlerts = (floodAlerts || []).filter(a => a.status === 'NEW' || a.status === 'ASSIGNED' || a.status === 'ACTIVE').length;
  const severeBlockages = (drainNodes || []).filter(d => d.blockagePct >= 60).length;
  const dispatchedTeams = (rescueTeams || []).filter(t => t.status === 'DISPATCHED' || t.status === 'ON SCENE').length;
  const openTasks = (maintenanceTasks || []).filter(t => t.status !== 'DONE').length;
  const agentActionsCount = (activityLog || []).filter(a => a.isAgent || a.actor === 'Coordinator Agent').length;
  const loraCount = (loraQueue || []).length;

  return {
    timestamp: new Date().toLocaleTimeString(),
    activeIncidents: activeAlerts + severeBlockages,
    teamsMobilized: dispatchedTeams,
    maintenanceUnderway: openTasks,
    agentActionsTotal: agentActionsCount,
    loraFallbackTransmissions: loraCount,
    readinessRating: activeAlerts === 0 && severeBlockages === 0 ? '100% (Optimal Readiness)' : '92% (Incident Mobilization Active)'
  };
}
