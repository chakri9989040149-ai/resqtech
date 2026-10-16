/**
 * SensaFlow Multi-Agent Coordinator Engine [SIMULATED]
 * 
 * Five specialized rule-based agents operating cooperatively:
 * 1. Sentinel (Sensor Agent): Watches zones and drain nodes (blockage %, water level, sensor state),
 *    triggers failover to the backup sensor, flags critical zones (blockage above 60% plus heavy rain forecast).
 * 2. Triage (Priority Agent): Ranks incidents by blockage %, rainfall, ward type
 *    (industrial, commercial, metro corridor, riverside), and age.
 * 3. Dispatch (Assignment Agent): Matches the right team type, nearest ward, availability.
 *    Blocks double booking, reassigns freed teams to waiting jobs.
 * 4. Herald (Communication Agent): Drafts public alerts, pre-evacuation notices and awareness campaigns,
 *    queues messages over LoRa when the network is down.
 * 5. Steward (Maintenance Agent): Creates and closes maintenance tasks, frees teams, writes the shift summary.
 * 
 * 6-Step Loop: PERCEIVE -> REASON -> PLAN -> ACT -> VERIFY -> REPORT
 * 
 * 100% Client-Side Rule-Based System, No Backend, No API Keys, No External AI calls.
 */

// 8 Reasoning Templates (English)
export const REASONING_TEMPLATES = [
  {
    id: 'RSN-01',
    category: 'FLOOD_RISK',
    template: 'Flash inundation risk: Rapid water stage cresting in {zone} ({waterLevel}) exceeds safety threshold. Ward type ({wardType}) and rainfall rate ({rainfall}) requires immediate shelter pre-evacuation and rescue team staging within {eta} minutes.'
  },
  {
    id: 'RSN-02',
    category: 'BLOCKAGE_CONGESTION',
    template: 'Arterial drainage constriction: {drainId} blockage reached {blockagePct}% due to accumulated silt/debris. Stormwater flow restricted to {flowRate}. Dispatching inspection crew first, followed by specialized mechanical clearance unit.'
  },
  {
    id: 'RSN-03',
    category: 'SENSOR_FAILOVER',
    template: 'Sensor telemetry fault: Primary acoustic ultrasonic sensor at {drainId} failed. Autonomous failover activated redundant hydrostatic pressure sensor to maintain telemetry continuity without node downtime.'
  },
  {
    id: 'RSN-04',
    category: 'LORA_OUTAGE',
    template: 'Cellular network blackout: Cellular gateway severed in {zone}. SensaFlow autonomous comms switched to sub-GHz LoRa mesh radio relay. Emergency citizen alert packets buffered.'
  },
  {
    id: 'RSN-05',
    category: 'RESOURCE_ASSIGNMENT',
    template: 'Resource optimization: Selected {teamName} (Specialty: {specialty}) over alternatives due to nearest ward proximity ({etaMinutes} min) and equipment payload ({equipment}).'
  },
  {
    id: 'RSN-06',
    category: 'CONFLICT_RESOLUTION',
    template: 'Resource contention: Both {incidentA} and {incidentB} requested {teamName}. Higher priority score ({scoreA} vs {scoreB}) allocated team to {incidentA}. Secondary resource queued with reason logged.'
  },
  {
    id: 'RSN-07',
    category: 'PREVENTIVE_CAMPAIGN',
    template: 'Preventive mobilization: Imminent {rainfall} downpour in {zone}. Herald scheduled public awareness broadcast and shelter readiness check ahead of peak runoff crest.'
  },
  {
    id: 'RSN-08',
    category: 'MAINTENANCE_RESOLUTION',
    template: 'Post-clearance verification: Drainage crew {worker} cleared obstruction at {drainId}. Blockage reduced from {initialPct}% to {clearedPct}%. Zone risk badge updated to Normal. Maintenance task closed.'
  }
];

// Public Alert Message Templates with Canonical Zones
export const PUBLIC_ALERT_TEMPLATES = [
  {
    id: 'MSG-01',
    zone: 'Urban Culvert Line C-8 (Ward 14)',
    text: 'URGENT FLOOD ALERT: Silt obstruction causing severe culvert backflow in Ward 14 Industrial Basin. Low-lying facilities move equipment and personnel to elevated platforms. Helpline 1070.'
  },
  {
    id: 'MSG-02',
    zone: 'River Basin Weir Gate (Ward 4)',
    text: 'EMERGENCY EVACUATION ADVISORY: Lowland river weir cresting safe capacity. SensaFlow rescue boats dispatched. Pre-evacuate to Community Center Shelter Ward 4 immediately.'
  },
  {
    id: 'MSG-03',
    zone: 'Market Road Arterial Storm Drain (Ward 9)',
    text: 'STORM DRAINAGE WARNING: High market debris accumulation restricting arterial drain flow. Avoid commercial underpass lanes. High-pressure vacuum units on scene.'
  },
  {
    id: 'MSG-04',
    zone: 'Central Underpass Pumping Sump (Ward 11)',
    text: 'UNDERPASS FLOOD ADVISORY: Dual submersible pumps operating at peak volume. Avoid low-lying underpass roads. Follow civic detour signage.'
  },
  {
    id: 'MSG-05',
    zone: 'Metro Rail Viaduct Storm Trench (Ward 4)',
    text: 'METRO CORRIDOR ADVISORY: Viaduct trench backflow clearing in progress. Submersible dewatering pumps deployed. Caution advised along viaduct access roads.'
  },
  {
    id: 'MSG-06',
    zone: 'All Sectors (Emergency LoRa Broadcast)',
    text: 'OFFLINE LORA BROADCAST: Cellular networks degraded. Emergency shelters open at Model High School and Community Center. Medical Response Cell active.'
  }
];

// Zone Metadata with Ward Types and Canonical Names
export const ZONE_METADATA = {
  'Urban Culvert Line C-8 (Ward 14)': { population: 18400, wardType: 'industrial', riskMultiplier: 1.45, baseEta: 5 },
  'Ward 14 (Industrial Area)': { population: 18400, wardType: 'industrial', riskMultiplier: 1.45, baseEta: 5 },
  'Urban Culvert Line C-8': { population: 18400, wardType: 'industrial', riskMultiplier: 1.45, baseEta: 5 },
  
  'Central Underpass Pumping Sump (Ward 11)': { population: 14200, wardType: 'metro corridor', riskMultiplier: 1.25, baseEta: 6 },
  'Ward 11 (Market Road Catchment)': { population: 14200, wardType: 'metro corridor', riskMultiplier: 1.25, baseEta: 6 },
  'Central Underpass Pumping Sump': { population: 14200, wardType: 'metro corridor', riskMultiplier: 1.25, baseEta: 6 },
  
  'Market Road Arterial Storm Drain (Ward 9)': { population: 22100, wardType: 'commercial', riskMultiplier: 1.35, baseEta: 4 },
  'Ward 9 (Commercial Sector)': { population: 22100, wardType: 'commercial', riskMultiplier: 1.35, baseEta: 4 },
  'Market Road Arterial Storm Drain': { population: 22100, wardType: 'commercial', riskMultiplier: 1.35, baseEta: 4 },
  
  'Metro Rail Viaduct Storm Trench (Ward 4)': { population: 16500, wardType: 'metro corridor', riskMultiplier: 1.30, baseEta: 5 },
  'Ward 4 (Metro Corridor)': { population: 16500, wardType: 'metro corridor', riskMultiplier: 1.30, baseEta: 5 },
  'Metro Rail Viaduct Storm Trench': { population: 16500, wardType: 'metro corridor', riskMultiplier: 1.30, baseEta: 5 },
  
  'River Basin Weir Gate (Ward 4)': { population: 19800, wardType: 'riverside', riskMultiplier: 1.50, baseEta: 4 },
  'Ward 4 (Riverside)': { population: 19800, wardType: 'riverside', riskMultiplier: 1.50, baseEta: 4 }
};

// Initial Agent Definitions (Part 1)
export const INITIAL_AGENTS = [
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Sensor Agent',
    description: 'Watches zones and drain nodes (blockage %, water level, sensor state), triggers failover to backup sensor, flags critical zones (blockage above 60% plus heavy rain forecast).',
    status: 'Idle', // 'Idle' | 'Thinking' | 'Acting' | 'Waiting for approval'
    currentTask: 'Monitoring 6 IoT nodes & rainfall threshold across municipal wards',
    completedToday: 24,
    confidence: 99,
    color: '#0D9488',
    icon: 'Radio'
  },
  {
    id: 'triage',
    name: 'Triage',
    role: 'Priority Agent',
    description: 'Ranks incidents by blockage %, rainfall, ward type (industrial, commercial, metro corridor, riverside), and age.',
    status: 'Idle',
    currentTask: 'Ranking incident queue: High-blockage industrial culverts & flash inundations first',
    completedToday: 31,
    confidence: 96,
    color: '#D97706',
    icon: 'AlertTriangle'
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    role: 'Assignment Agent',
    description: 'Matches the right team type, nearest ward, availability. Blocks double-booking and assigns freed teams.',
    status: 'Idle',
    currentTask: 'Tracking 4 rescue units and 3 municipal drainage crews for proximity and equipment matching',
    completedToday: 19,
    confidence: 95,
    color: '#2563EB',
    icon: 'Users'
  },
  {
    id: 'herald',
    name: 'Herald',
    role: 'Communication Agent',
    description: 'Drafts public alerts, pre-evacuation notices and awareness campaigns, queues messages over LoRa when the network is down.',
    status: 'Idle',
    currentTask: 'Buffering multi-lingual cell broadcasts and sub-GHz LoRa packets',
    completedToday: 22,
    confidence: 98,
    color: '#4F46E5',
    icon: 'Bell'
  },
  {
    id: 'steward',
    name: 'Steward',
    role: 'Maintenance Agent',
    description: 'Creates and closes maintenance tasks, frees teams, writes the shift summary.',
    status: 'Idle',
    currentTask: 'Verifying drainage clearing milestones (87% -> 40% -> 10%) & operational shift logs',
    completedToday: 28,
    confidence: 97,
    color: '#059669',
    icon: 'Wrench'
  }
];

/**
 * Calculate multi-criteria incident priority score (0 to 100)
 * Evaluates: blockage %, rainfall, ward type (industrial, commercial, metro corridor, riverside), and age.
 */
export function calculateIncidentScore(incident) {
  let score = 0;

  // 1. Incident Type Base
  if (incident.type === 'FLOOD' || incident.type === 'FLOOD_ALERT') {
    score += 40;
  } else if (incident.type === 'BLOCKAGE') {
    score += 26;
  } else if (incident.type === 'SENSOR_FAULT') {
    score += 28;
  } else if (incident.type === 'NETWORK_OUTAGE') {
    score += 32;
  } else {
    score += 20;
  }

  // 2. Severity Factor
  if (incident.severity === 'CRITICAL') {
    score += 25;
  } else if (incident.severity === 'WARNING') {
    score += 15;
  } else {
    score += 6;
  }

  // 3. Blockage % Factor (if applicable)
  const blockage = parseFloat(incident.blockagePct || 0);
  if (blockage >= 80) score += 18;
  else if (blockage >= 60) score += 12;
  else if (blockage >= 40) score += 6;

  // 4. Rainfall Rate Factor
  const rain = parseFloat(incident.rainfall || 40);
  if (rain >= 50) score += 12;
  else if (rain >= 40) score += 8;
  else if (rain >= 30) score += 4;

  // 5. Ward Type Scoring
  const zoneKey = Object.keys(ZONE_METADATA).find(k => 
    incident.zone && (incident.zone.includes(k) || k.includes(incident.zone))
  );
  const zoneMeta = zoneKey ? ZONE_METADATA[zoneKey] : { wardType: 'standard', population: 12000 };

  if (zoneMeta.wardType === 'riverside') {
    score += 14;
  } else if (zoneMeta.wardType === 'industrial') {
    score += 12;
  } else if (zoneMeta.wardType === 'metro corridor') {
    score += 10;
  } else if (zoneMeta.wardType === 'commercial') {
    score += 8;
  } else {
    score += 5;
  }

  // 6. Age / Urgency Factor
  if (incident.timestamp && incident.timestamp.includes('m ago')) {
    const mins = parseInt(incident.timestamp, 10) || 5;
    if (mins > 20) score += 6;
    else if (mins > 10) score += 3;
  }

  return Math.min(99, Math.max(15, Math.round(score)));
}

/**
 * Generate plan candidate options with scores based on incident type and specialty matching
 */
export function evaluateResourceOptions(incident, availableTeams) {
  const options = [];
  const teams = availableTeams || [];

  if (incident.type === 'FLOOD' || incident.type === 'FLOOD_ALERT') {
    // Only Rescue & Medical Teams
    const rescueUnits = teams.filter(t => t.type === 'RESCUE' || t.type === 'MEDICAL');
    rescueUnits.forEach(team => {
      const isFree = team.status === 'AVAILABLE' || team.status === 'STANDBY';
      let score = isFree ? 0.75 : 0.20;

      // Proximity check
      const teamZone = team.zone || '';
      const incidentZone = incident.zone || '';
      const isSameZone = teamZone.toLowerCase().includes(incidentZone.toLowerCase().split(' ')[0]) ||
                         incidentZone.toLowerCase().includes(teamZone.toLowerCase().split(' ')[0]);
      if (isSameZone) score += 0.18;

      // Match boats or evacuation equipment
      if (team.boats > 0 || team.equipment?.includes('Boat') || team.equipment?.includes('Truck')) {
        score += 0.06;
      }

      options.push({
        id: team.id,
        name: team.name,
        role: team.role,
        leader: team.leadWorker || team.name,
        type: 'RESCUE_TEAM',
        equipment: team.equipment,
        etaMinutes: isSameZone ? (team.etaMinutes || 4) : ((team.etaMinutes || 6) + 3),
        score: Math.min(0.99, Number(score.toFixed(2))),
        isAvailable: isFree
      });
    });
  } else {
    // Drainage Incidents: Match by obstruction specialty
    // silt -> Rapid Desilting Crew 1
    // heavy debris -> Hydraulic Vacuum Unit 2
    // collapsed/deep -> Emergency Trench Squad 3
    const crews = teams.filter(t => t.type === 'CLEANING');
    
    crews.forEach(crew => {
      const isFree = crew.status === 'AVAILABLE' || crew.status === 'STANDBY';
      let score = isFree ? 0.70 : 0.20;

      const titleAndReason = `${incident.title || ''} ${incident.reason || ''} ${incident.notes || ''}`.toLowerCase();
      
      // Specialty matching
      if (crew.specialty === 'silt' && (titleAndReason.includes('silt') || titleAndReason.includes('culvert') || titleAndReason.includes('c-8'))) {
        score += 0.25;
      } else if (crew.specialty === 'heavy debris' && (titleAndReason.includes('debris') || titleAndReason.includes('market') || titleAndReason.includes('d-03') || titleAndReason.includes('vacuum'))) {
        score += 0.25;
      } else if (crew.specialty === 'collapsed/deep' && (titleAndReason.includes('viaduct') || titleAndReason.includes('trench') || titleAndReason.includes('deep') || titleAndReason.includes('d-07'))) {
        score += 0.25;
      } else {
        score += 0.08;
      }

      options.push({
        id: crew.id,
        name: crew.name,
        role: crew.role,
        leader: crew.leadWorker || crew.name,
        specialty: crew.specialty,
        type: 'CLEANING_CREW',
        equipment: crew.equipment,
        etaMinutes: crew.etaMinutes || 5,
        score: Math.min(0.99, Number(score.toFixed(2))),
        isAvailable: isFree
      });
    });
  }

  return options.sort((a, b) => b.score - a.score);
}

/**
 * Generate simulated answers for the Agent Chat Box from live store data
 */
export function answerAgentQuestion(question, store) {
  const q = question.toLowerCase();
  const { drainNodes = [], floodAlerts = [], rescueTeams = [], reliefCamps = [], loraQueue = [], riskZones = [] } = store;

  // 1. Which teams are free?
  if (q.includes('team') || q.includes('free') || q.includes('available') || q.includes('crew') || q.includes('which teams')) {
    const freeRescue = rescueTeams.filter(t => t.type !== 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY'));
    const freeCleaning = rescueTeams.filter(t => t.type === 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY'));
    const busyTeams = rescueTeams.filter(t => t.status === 'DISPATCHED' || t.status === 'ON SCENE' || t.status === 'RETURNING');

    return `[SIMULATED AI AGENT RESPONSE]
Current Team Availability Matrix:
• Available Rescue Teams (${freeRescue.length}/${rescueTeams.filter(t => t.type !== 'CLEANING').length}): ${freeRescue.map(t => `${t.name} (${t.equipment})`).join('; ') || 'None (all active)'}
• Available Drainage Crews (${freeCleaning.length}/${rescueTeams.filter(t => t.type === 'CLEANING').length}): ${freeCleaning.map(c => `${c.name} [Specialty: ${c.specialty}]`).join('; ') || 'All deployed'}
• Active Field Units (${busyTeams.length}): ${busyTeams.map(b => `${b.name} (${b.status}${b.etaMinutes ? ` - ETA ${b.etaMinutes}m` : ''})`).join('; ') || 'Depot reserve ready'}
Dispatch monitors all units in real time to prevent double-booking.`;
  }

  // 2. What is the highest risk now?
  if (q.includes('risk') || q.includes('highest') || q.includes('danger') || q.includes('critical') || q.includes('what is the highest risk')) {
    const criticalAlert = floodAlerts.find(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
    const criticalDrain = drainNodes.slice().sort((a, b) => (b.blockagePct || 0) - (a.blockagePct || 0))[0];

    if (criticalAlert) {
      return `[SIMULATED AI AGENT RESPONSE]
Highest Operational Flood Risk: ${criticalAlert.title}
• Location: ${criticalAlert.zone}
• Water Stage: ${criticalAlert.waterLevel} (Precipitation: ${criticalAlert.rainfall})
• Triage Assessment: Critical Inundation Risk. Rapid evacuation and rescue boat staging required.
• Associated Drain Node: ${criticalAlert.drainNodeId || 'NODE-C-08'} (${criticalDrain?.blockagePct}% current blockage index).`;
    } else if (criticalDrain && criticalDrain.blockagePct >= 60) {
      return `[SIMULATED AI AGENT RESPONSE]
Highest Operational Risk: Arterial Blockage at ${criticalDrain.name} (${criticalDrain.location})
• Blockage Index: ${criticalDrain.blockagePct}%
• Water Level: ${criticalDrain.waterLevel} (Flow restricted to ${criticalDrain.flowRate})
• Action: Dispatching specialized drainage crew (${criticalDrain.blockagePct > 80 ? 'Rapid Desilting Crew 1' : 'Hydraulic Vacuum Unit 2'}) before upstream crest.`;
    }

    return `[SIMULATED AI AGENT RESPONSE]
All municipal drainage nodes and river basin stations are currently operating within nominal parameters. Average culvert flow rate: 1.4 m/s. No active emergency alert triggers.`;
  }

  // 3. Summarize this shift
  if (q.includes('shift') || q.includes('summary') || q.includes('report') || q.includes('overview') || q.includes('summarize')) {
    const activeAlerts = floodAlerts.filter(a => a.status !== 'RESOLVED').length;
    const resolvedAlerts = floodAlerts.filter(a => a.status === 'RESOLVED').length;
    const highBlockages = drainNodes.filter(d => d.blockagePct >= 60).length;
    const backupSensors = drainNodes.filter(d => d.sensorHealth !== 'PRIMARY_ACTIVE').length;
    const totalShelters = reliefCamps.filter(c => c.status === 'ACTIVE').length;
    const totalOccupants = reliefCamps.reduce((sum, c) => sum + (c.occupancy || 0), 0);

    return `[SIMULATED AI AGENT RESPONSE]
OPERATIONAL SHIFT SUMMARY [SIMULATED]:
• SensaFlow Agent Status: 5/5 Agents Active (Sentinel, Triage, Dispatch, Herald, Steward)
• Flood Incidents: ${activeAlerts} Active, ${resolvedAlerts} Resolved
• Drainage Obstructions: ${highBlockages} nodes with blockage >=60%
• Dual-Sensor Telemetry Failovers: ${backupSensors} node(s) operating on secondary radar/hydrostatic sensors
• Relief Shelters: ${totalShelters} active shelters hosting ${totalOccupants} citizens
• LoRa Mesh Relay: ${loraQueue.length} emergency fallback packets buffered
• Coordination Protocol: Rule-based autonomous state machine running at 98% mean confidence.`;
  }

  // 4. Sensors & Telemetry
  if (q.includes('sensor') || q.includes('failover') || q.includes('node') || q.includes('lora')) {
    const failed = drainNodes.filter(d => d.sensorHealth !== 'PRIMARY_ACTIVE');
    return `[SIMULATED AI AGENT RESPONSE]
Sentinel Sensor Monitoring Report:
• 6 IoT drain monitoring nodes active across municipal catchments.
• Sensor Redundancy Status: ${failed.length === 0 ? 'All 6 primary acoustic transducer sensors are online.' : `${failed.length} node(s) switched to redundant secondary sensors: ${failed.map(f => `${f.name} (${f.sensorHealth})`).join(', ')}.`}
• Radio Comms: Primary 4G cellular telemetry active with automated LoRa sub-GHz mesh fallback.`;
  }

  // 5. Default Fallback
  return `[SIMULATED AI AGENT RESPONSE]
SensaFlow Multi-Agent Assistant standing by. Tracking 6 IoT drain nodes (NODE-C-08 through NODE-D-07), 4 rescue units, and 3 specialized drainage crews. You can ask: "Which teams are free?", "What is the highest risk now?", or "Summarize this shift".`;
}
