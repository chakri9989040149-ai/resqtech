/**
 * SensaFlow Multi-Agent Coordinator Engine [SIMULATED]
 * 
 * Five specialized rule-based agents operating cooperatively:
 * 1. Sentinel (Sensor Agent): Detects failures, flags rising water, manages sensor failover.
 * 2. Triage (Priority Agent): Multi-criteria priority scoring (severity, population, rainfall, age).
 * 3. Dispatch (Assignment Agent): Proximity matching, double-booking prevention, freed team re-allocation.
 * 4. Herald (Communication Agent): Public emergency alerts, preventive awareness campaigns, LoRa packet buffering.
 * 5. Steward (Maintenance Agent): Maintenance task lifecycle, clearance verification, shift operations reporting.
 * 
 * 6-Step Loop: PERCEIVE -> REASON -> PLAN -> ACT -> VERIFY -> REPORT
 * 
 * 100% Client-Side, No API Keys, No External AI calls.
 */

// 8 Pre-written Reasoning Templates (English)
export const REASONING_TEMPLATES = [
  {
    id: 'RSN-01',
    category: 'FLOOD_RISK',
    template: 'Flash inundation risk: Rapid water stage cresting in {zone} ({waterLevel}) exceeds safety threshold. High population density ({population} citizens) requires immediate rescue staging within {eta} minutes.'
  },
  {
    id: 'RSN-02',
    category: 'BLOCKAGE_CONGESTION',
    template: 'Arterial drainage constriction: {drainId} blockage index reached {blockagePct}% due to accumulated silt/debris. Stormwater flow restricted to {flowRate}, increasing backflow velocity.'
  },
  {
    id: 'RSN-03',
    category: 'SENSOR_FAILOVER',
    template: 'Sensor telemetry fault: Primary acoustic ultrasonic sensor at {drainId} failed or dropped offline. Autonomous failover activated redundant hydrostatic pressure sensor to maintain telemetry continuity.'
  },
  {
    id: 'RSN-04',
    category: 'LORA_OUTAGE',
    template: 'Cellular telemetry blackout: Cellular gateway severed in {zone}. SensaFlow autonomous comms switched to 868MHz LoRa mesh relay. Emergency broadcast packets buffered.'
  },
  {
    id: 'RSN-05',
    category: 'RESOURCE_ASSIGNMENT',
    template: 'Resource optimization: Selected {teamName} (Leader: {leader}) over alternatives due to proximity ({etaMinutes} min) and specialized {role} capability. Score: {score}.'
  },
  {
    id: 'RSN-06',
    category: 'CONFLICT_RESOLUTION',
    template: 'Resource contention: Both {incidentA} and {incidentB} requested {teamName}. Higher priority score ({scoreA} vs {scoreB}) allocated team to {incidentA}. Secondary resource queued.'
  },
  {
    id: 'RSN-07',
    category: 'PREVENTIVE_CAMPAIGN',
    template: 'Preventive mobilization: Forecast indicates sustained {rainfall} downpour in {zone}. Scheduled automated public awareness broadcast to {households} households ahead of peak flood crest.'
  },
  {
    id: 'RSN-08',
    category: 'MAINTENANCE_RESOLUTION',
    template: 'Post-clearance verification: Municipal crew {worker} cleared obstruction at {drainId}. Primary sensor confirms water level normalized to {waterLevel}. Maintenance task closed.'
  }
];

// 6 Public Alert Message Templates (English)
export const PUBLIC_ALERT_TEMPLATES = [
  {
    id: 'MSG-01',
    zone: 'Zone E Lowlands',
    text: 'Heavy rain expected in Zone E Lowlands. Avoid low-lying roads and move valuables to higher ground.'
  },
  {
    id: 'MSG-02',
    zone: 'Zone A Riverside',
    text: 'EMERGENCY FLOOD WARNING: Flash flooding reported near Riverside Basin. SensaFlow rescue boats dispatched. Move to designated relief shelter immediately.'
  },
  {
    id: 'MSG-03',
    zone: 'Zone B Market Road',
    text: 'ROAD CLOSURE ADVISORY: Arterial underpass at Market Road submerged. Municipal desilting crews on scene. Please use alternate elevated routes.'
  },
  {
    id: 'MSG-04',
    zone: 'Zone C Temple Street',
    text: 'COMMUNITY ALERT: High stormwater blockage detected at Temple Street Siphon D-03. Drainage clearance underway. Do not dispose of debris in stormwater channels.'
  },
  {
    id: 'MSG-05',
    zone: 'Zone D Railway Colony',
    text: 'OFFLINE LORA BROADCAST: Cellular networks degraded in Railway Colony. Emergency relief camp open at Model High School. Medical assistance available.'
  },
  {
    id: 'MSG-06',
    zone: 'Zone F Hospital Road',
    text: 'ALL CLEAR NOTICE: Flood levels receded along Hospital Road. Drainage channels inspected and verified clear by SensaFlow Municipal Stewards.'
  }
];

// Fictional Population Data per Zone
export const ZONE_METADATA = {
  'Zone A Riverside': { population: 14200, riskMultiplier: 1.25, baseEta: 4 },
  'Zone B Market Road': { population: 18500, riskMultiplier: 1.35, baseEta: 5 },
  'Zone C Temple Street': { population: 12800, riskMultiplier: 1.10, baseEta: 6 },
  'Zone D Railway Colony': { population: 16400, riskMultiplier: 1.30, baseEta: 8 },
  'Zone E Lowlands': { population: 22100, riskMultiplier: 1.50, baseEta: 5 },
  'Zone F Hospital Road': { population: 9600, riskMultiplier: 1.40, baseEta: 7 }
};

// Agent Definitions
export const INITIAL_AGENTS = [
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Sensor Agent',
    description: 'Watches drain nodes, detects failed primary sensors, activates the backup, flags rising water.',
    status: 'Idle', // 'Idle' | 'Thinking' | 'Acting' | 'Waiting for approval'
    currentTask: 'Monitoring 6 drainage nodes across Zones A-F',
    completedToday: 18,
    confidence: 98,
    color: '#0D9488',
    icon: 'Radio'
  },
  {
    id: 'triage',
    name: 'Triage',
    role: 'Priority Agent',
    description: 'Scores incidents by severity, zone population, rainfall and age, then ranks the queue.',
    status: 'Idle',
    currentTask: 'Ranking queue: Flood alerts over municipal blockages',
    completedToday: 23,
    confidence: 95,
    color: '#D97706',
    icon: 'AlertTriangle'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    role: 'Assignment Agent',
    description: 'Matches the nearest available team or worker by type, blocks double booking, reassigns freed teams to waiting jobs.',
    status: 'Idle',
    currentTask: 'Evaluating proximity & specialized watercraft payload',
    completedToday: 15,
    confidence: 94,
    color: '#2563EB',
    icon: 'Users'
  },
  {
    id: 'herald',
    name: 'Herald',
    role: 'Communication Agent',
    description: 'Drafts public alerts, schedules awareness campaigns before a flood, queues messages over LoRa when the network is down.',
    status: 'Idle',
    currentTask: 'Drafting emergency cell broadcasts & LoRa fallback packets',
    completedToday: 19,
    confidence: 97,
    color: '#4F46E5',
    icon: 'Bell'
  },
  {
    id: 'steward',
    name: 'Steward',
    role: 'Maintenance Agent',
    description: 'Creates upkeep tasks, closes them when cleared, frees crews, and writes the shift summary.',
    status: 'Idle',
    currentTask: 'Tracking work orders, silt dredging & shift telemetry',
    completedToday: 26,
    confidence: 96,
    color: '#059669',
    icon: 'Wrench'
  }
];

/**
 * Calculate multi-criteria incident priority score (0 to 100)
 */
export function calculateIncidentScore(incident) {
  let score = 0;

  // 1. Base Type
  if (incident.type === 'FLOOD' || incident.type === 'FLOOD_ALERT') {
    score += 45;
  } else if (incident.type === 'BLOCKAGE') {
    score += 25;
  } else if (incident.type === 'SENSOR_FAULT') {
    score += 30;
  } else if (incident.type === 'NETWORK_OUTAGE') {
    score += 35;
  } else {
    score += 20;
  }

  // 2. Severity
  if (incident.severity === 'CRITICAL') {
    score += 30;
  } else if (incident.severity === 'WARNING') {
    score += 18;
  } else {
    score += 8;
  }

  // 3. Zone Population & Risk
  const zoneMeta = ZONE_METADATA[incident.zone] || { population: 10000, riskMultiplier: 1.0 };
  const popFactor = Math.min(15, Math.floor((zoneMeta.population / 22000) * 15));
  score += popFactor;

  // 4. Rainfall factor
  const rain = parseFloat(incident.rainfall || 40);
  if (rain > 50) score += 10;
  else if (rain > 35) score += 5;

  return Math.min(99, Math.max(10, Math.round(score)));
}

/**
 * Generate plan candidate options with scores
 */
export function evaluateResourceOptions(incident, availableTeams, availableWorkers) {
  const options = [];

  if (incident.type === 'FLOOD' || incident.type === 'FLOOD_ALERT') {
    // Rescue Teams
    const rescueTeams = (availableTeams || []).filter(t => t.type === 'RESCUE' || t.type === 'MEDICAL' || t.type === 'EVACUATION');
    rescueTeams.forEach(team => {
      const isFree = team.status === 'AVAILABLE';
      let score = isFree ? 0.70 : 0.20;
      
      // Proximity bonus
      const teamZone = team.zone || '';
      const incidentZone = incident.zone || '';
      const isSameZone = teamZone.toLowerCase().includes(incidentZone.toLowerCase().split(' ')[0]) || incidentZone.toLowerCase().includes(teamZone.toLowerCase().split(' ')[0]);
      if (isSameZone) score += 0.22;
      
      // Role match
      if (team.role.toLowerCase().includes('flood') || team.role.toLowerCase().includes('water')) score += 0.08;

      options.push({
        id: team.id,
        name: team.name,
        role: team.role,
        leader: team.leader || 'Unit Commander',
        type: 'TEAM',
        etaMinutes: isSameZone ? 4 : (team.etaMinutes || 9),
        score: Math.min(0.99, Number(score.toFixed(2))),
        isAvailable: isFree
      });
    });
  } else {
    // Cleaning Crew Workers
    const workers = (availableWorkers || availableTeams || []).filter(w => w.type === 'CLEANING' || w.leadWorker);
    workers.forEach(w => {
      const isFree = w.status === 'AVAILABLE';
      let score = isFree ? 0.72 : 0.25;

      const workerZone = w.zone || '';
      const incidentZone = incident.zone || '';
      const isSameZone = workerZone.toLowerCase().includes(incidentZone.toLowerCase().split(' ')[0]);
      if (isSameZone) score += 0.20;

      options.push({
        id: w.id,
        name: w.leadWorker || w.name,
        role: w.role || 'Municipal Drainage Clearance',
        leader: w.leadWorker || w.name,
        type: 'WORKER',
        etaMinutes: isSameZone ? 5 : 12,
        score: Math.min(0.99, Number(score.toFixed(2))),
        isAvailable: isFree
      });
    });
  }

  // Sort highest score first
  return options.sort((a, b) => b.score - a.score);
}

/**
 * Generate simulated answers for the Agent Chat Box
 */
export function answerAgentQuestion(question, store) {
  const q = question.toLowerCase();
  const { drainNodes = [], floodAlerts = [], rescueTeams = [], loraQueue = [], activityLog = [] } = store;

  if (q.includes('risk') || q.includes('highest') || q.includes('danger')) {
    const criticalAlert = floodAlerts.find(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
    const blockedDrain = drainNodes.find(d => (d.blockagePct || 0) > 75);

    if (criticalAlert) {
      return `[SIMULATED AI AGENT RESPONSE]
Highest Operational Risk: Critical Flash Inundation at ${criticalAlert.zone}. Water level reading: ${criticalAlert.waterLevel}.
Assigned Team: ${criticalAlert.assignedTeamName || 'Dispatching pending'}.
Recommendation: Maintain rescue boat staging and verify citizen notification broadcast status.`;
    } else if (blockedDrain) {
      return `[SIMULATED AI AGENT RESPONSE]
Highest Operational Risk: Severe silt & debris obstruction at ${blockedDrain.name} (${blockedDrain.zone}) at ${blockedDrain.blockagePct}% blockage index.
Flow rate restricted to ${blockedDrain.flowRate}.
Recommendation: Ensure high-velocity suction dredging crew is on site before upstream rainfall crests.`;
    }
    return `[SIMULATED AI AGENT RESPONSE]
All 6 zones are currently within safe thresholds. Drain node water levels average 1.8m with normal telemetry link quality. No immediate emergency threats detected.`;
  }

  if (q.includes('team') || q.includes('free') || q.includes('available') || q.includes('crew')) {
    const freeRescue = rescueTeams.filter(t => t.type !== 'CLEANING' && t.status === 'AVAILABLE');
    const freeCleaning = rescueTeams.filter(t => t.type === 'CLEANING' && t.status === 'AVAILABLE');

    return `[SIMULATED AI AGENT RESPONSE]
Resource Availability Status:
• Free Rescue Teams (${freeRescue.length}): ${freeRescue.map(t => `${t.name} (${t.zone})`).join(', ') || 'None (all active)'}
• Free Cleaning Crews (${freeCleaning.length}): ${freeCleaning.map(c => `${c.leadWorker || c.name} (${c.zone})`).join(', ') || 'All deployed'}
All units are monitored for double-booking prevention.`;
  }

  if (q.includes('shift') || q.includes('summary') || q.includes('report') || q.includes('stats')) {
    const activeAlerts = floodAlerts.filter(a => a.status !== 'RESOLVED').length;
    const resolvedAlerts = floodAlerts.filter(a => a.status === 'RESOLVED').length;
    const failedSensors = drainNodes.filter(d => d.sensorHealth !== 'PRIMARY_ACTIVE').length;
    const pendingLoRa = loraQueue.length;

    return `[SIMULATED AI AGENT RESPONSE]
OPERATIONAL SHIFT SUMMARY [SIMULATED]:
• Active Flood Emergencies: ${activeAlerts}
• Resolved Incidents: ${resolvedAlerts}
• Sensor Redundancy Failovers: ${failedSensors} active on backup sensors
• LoRa Mesh Relay Buffer: ${pendingLoRa} emergency packets queued
• System Status: All 5 SensaFlow agents active with 96% mean confidence.`;
  }

  if (q.includes('sensor') || q.includes('telemetry') || q.includes('node')) {
    const failed = drainNodes.filter(d => d.sensorHealth !== 'PRIMARY_ACTIVE');
    return `[SIMULATED AI AGENT RESPONSE]
Sentinel Sensor Agent Report:
6 total drain monitoring nodes active. ${failed.length === 0 ? 'All primary ultrasonic sensors are operating normally.' : `${failed.length} node(s) operating on redundant backup sensor: ${failed.map(f => f.name).join(', ')}.`}`;
  }

  // Fallback template
  return `[SIMULATED AI AGENT RESPONSE]
Query processed by SensaFlow Coordinator. Currently tracking 6 IoT drain nodes (D-01 to D-06), 5 specialized rescue teams, and 6 municipal cleaning workers across Zones A-F. All actions are logged with auditable Perceive-to-Report traces.`;
}
