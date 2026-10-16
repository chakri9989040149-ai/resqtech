import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const FloodGuardContext = createContext(null);
const STORAGE_KEY = 'sensaflow_master_store_v6';
const LEGACY_STORAGE_KEY = 'sensaflow_master_store_v5';

// Initial Seeds with coordinates for Map and Dual-Sensor telemetry
const INITIAL_DRAIN_NODES = [
  {
    id: 'NODE-C-08',
    name: 'Culvert Line C-8',
    location: 'Urban Culvert Line C-8 (Industrial Sector)',
    zone: 'Ward 14 (Industrial Area)',
    x: 62,
    y: 42,
    waterLevel: '2.85 m',
    threshold: '2.50 m',
    flowRate: '0.4 m/s',
    rainfall: '48 mm/hr',
    status: 'CRITICAL',
    blockagePct: 87,
    reason: 'Heavy silt sedimentation and plastic waste trapped against trash rack, causing rapid backflow.',
    action: 'Mobilize mechanical vacuum desilter crew immediately.',
    battery: 92,
    linkQuality: 'EXCELLENT',
    commsStatus: 'ONLINE',
    rssiDbm: -72,
    lastSeen: 'Just now',
    operationalStatus: 'BLOCKED',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: 'Just now',
    primarySensor: {
      name: 'Acoustic AI Blockage & Depth',
      type: 'Acoustic Ultrasonic',
      status: 'ACTIVE',
      reading: '2.85 m (87% Blockage)'
    },
    backupSensor: {
      name: 'Submerged Hydrostatic Pressure',
      type: 'Hydrostatic Pressure',
      status: 'STANDBY',
      reading: '2.84 m'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  },
  {
    id: 'NODE-WZ-04',
    name: 'River Basin North Weir Gate',
    location: 'River Basin North Weir Gate',
    zone: 'Ward 4 (Riverside)',
    x: 28,
    y: 35,
    waterLevel: '3.42 m',
    threshold: '4.00 m',
    flowRate: '1.8 m/s',
    rainfall: '42 mm/hr',
    status: 'WARNING',
    blockagePct: 15,
    reason: 'Water stage approaching crest warning threshold due to upstream runoff. Siphon gates operating normally.',
    action: 'Monitor crest progression; prepare secondary sluice gate opening.',
    battery: 88,
    linkQuality: 'GOOD',
    commsStatus: 'ONLINE',
    rssiDbm: -81,
    lastSeen: '1m ago',
    operationalStatus: 'NORMAL',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: '1 min ago',
    primarySensor: {
      name: 'Ultrasonic Stage Sensor',
      type: 'Ultrasonic Depth',
      status: 'ACTIVE',
      reading: '3.42 m'
    },
    backupSensor: {
      name: 'Pressure Transducer Gate Array',
      type: 'Pressure Transducer',
      status: 'STANDBY',
      reading: '3.41 m'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  },
  {
    id: 'NODE-P-03',
    name: 'Central Underpass Sump',
    location: 'Central Underpass Pumping Sump',
    zone: 'Ward 11 (Market Road Catchment)',
    x: 78,
    y: 65,
    waterLevel: '1.94 m',
    threshold: '2.20 m',
    flowRate: '1.2 m/s',
    rainfall: '38 mm/hr',
    status: 'WARNING',
    blockagePct: 42,
    reason: 'High inflow volume causing sump water accumulation. Dual submersible pumps active.',
    action: 'Deploy emergency barrier if sump exceeds 2.2m.',
    battery: 95,
    linkQuality: 'EXCELLENT',
    commsStatus: 'ONLINE',
    rssiDbm: -68,
    lastSeen: '2m ago',
    operationalStatus: 'NORMAL',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: '2 mins ago',
    primarySensor: {
      name: 'IoT Optical Flow & Level',
      type: 'Optical Telemetry',
      status: 'ACTIVE',
      reading: '1.94 m'
    },
    backupSensor: {
      name: 'Conductive Stage Switch Array',
      type: 'Conductive Switch',
      status: 'STANDBY',
      reading: 'Stage 2 Active'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  },
  {
    id: 'NODE-SB-12',
    name: 'Siphon Retention Basin East',
    location: 'Siphon Retention Basin East',
    zone: 'Ward 9 (Weir Colony)',
    x: 45,
    y: 72,
    waterLevel: '1.20 m',
    threshold: '3.00 m',
    flowRate: '2.4 m/s',
    rainfall: '28 mm/hr',
    status: 'NORMAL',
    blockagePct: 4,
    reason: 'Clear stormwater channel. Water discharging into retention wetland at nominal rate.',
    action: 'Routine automated telemetry polling active.',
    battery: 97,
    linkQuality: 'EXCELLENT',
    commsStatus: 'ONLINE',
    rssiDbm: -70,
    lastSeen: 'Just now',
    operationalStatus: 'NORMAL',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: 'Just now',
    primarySensor: {
      name: 'Pressure Transducer Sensor',
      type: 'Submerged Transducer',
      status: 'ACTIVE',
      reading: '1.20 m'
    },
    backupSensor: {
      name: 'Ultrasonic Stage Radar',
      type: 'Radar Stage',
      status: 'STANDBY',
      reading: '1.20 m'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  },
  {
    id: 'NODE-D-03',
    name: 'Market Road Arterial Drain',
    location: 'Market Road Arterial Storm Drain (Catchment D-03)',
    zone: 'Ward 9 (Commercial Sector)',
    x: 20,
    y: 25,
    waterLevel: '2.10 m',
    threshold: '2.00 m',
    flowRate: '0.8 m/s',
    rainfall: '45 mm/hr',
    status: 'CRITICAL',
    blockagePct: 66,
    reason: 'Market stall organic waste and leaf litter accumulation restricting arterial culvert mouth.',
    action: 'Schedule emergency mechanical dredging.',
    battery: 84,
    linkQuality: 'GOOD',
    commsStatus: 'ONLINE',
    rssiDbm: -84,
    lastSeen: '3m ago',
    operationalStatus: 'BLOCKED',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: '3 mins ago',
    primarySensor: {
      name: 'Acoustic Doppler Flow Profiler',
      type: 'Acoustic Doppler',
      status: 'ACTIVE',
      reading: '2.10 m (66% Blockage)'
    },
    backupSensor: {
      name: 'Hydrostatic Level Gauge',
      type: 'Hydrostatic',
      status: 'STANDBY',
      reading: '2.09 m'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  },
  {
    id: 'NODE-D-07',
    name: 'Metro Viaduct Storm Trench',
    location: 'Metro Rail Viaduct Storm Trench (Zone 11)',
    zone: 'Ward 4 (Metro Corridor)',
    x: 85,
    y: 30,
    waterLevel: '2.40 m',
    threshold: '2.10 m',
    flowRate: '0.6 m/s',
    rainfall: '40 mm/hr',
    status: 'CRITICAL',
    blockagePct: 74,
    reason: 'Construction debris and silt backflow trapped in deep viaduct trench segment.',
    action: 'Dispatch desilting equipment before evening downpour.',
    battery: 79,
    linkQuality: 'EXCELLENT',
    commsStatus: 'ONLINE',
    rssiDbm: -76,
    lastSeen: '4m ago',
    operationalStatus: 'BLOCKED',
    assignedWorker: null,
    assignedWorkerId: null,
    muted: false,
    lastReading: '4 mins ago',
    primarySensor: {
      name: 'Ultrasonic Stage Sensor B',
      type: 'Ultrasonic Stage',
      status: 'ACTIVE',
      reading: '2.40 m (74% Blockage)'
    },
    backupSensor: {
      name: 'Pneumatic Bubbler Tube Sensor',
      type: 'Pneumatic Bubbler',
      status: 'STANDBY',
      reading: '2.39 m'
    },
    sensorHealth: 'PRIMARY_ACTIVE'
  }
];

const INITIAL_FLOOD_ALERTS = [
  {
    id: 'ALT-FL-01',
    title: 'Flash Inundation Warning — Lowland River Overflow',
    zone: 'River Basin Weir Gate (Ward 4)',
    severity: 'CRITICAL',
    waterLevel: '3.42 m (88%)',
    rainfall: '48 mm/hr',
    status: 'NEW',
    assignedTeamId: null,
    assignedTeamName: null,
    assignedAt: null,
    openedCampId: 'CAMP-01',
    citizenNotified: false,
    timestamp: '12m ago',
    riskReason: 'Sustained precipitation upstream causing weir overflow into residential pocket.',
    drainNodeId: 'NODE-WZ-04'
  },
  {
    id: 'ALT-FL-02',
    title: 'Severe Urban Backflow & Stormwater Obstruction',
    zone: 'Urban Culvert Line C-8 (Ward 14)',
    severity: 'CRITICAL',
    waterLevel: '2.85 m (87%)',
    rainfall: '48 mm/hr',
    status: 'NEW',
    assignedTeamId: null,
    assignedTeamName: null,
    assignedAt: null,
    openedCampId: null,
    citizenNotified: false,
    timestamp: '25m ago',
    riskReason: 'Culvert trash rack obstructed with 87% silt and debris; street water rising.',
    drainNodeId: 'NODE-C-08'
  },
  {
    id: 'ALT-FL-03',
    title: 'Precautionary Inundation Advisory',
    zone: 'Central Underpass Pumping Sump (Ward 11)',
    severity: 'WARNING',
    waterLevel: '1.94 m (52%)',
    rainfall: '38 mm/hr',
    status: 'NEW',
    assignedTeamId: null,
    assignedTeamName: null,
    assignedAt: null,
    openedCampId: null,
    citizenNotified: false,
    timestamp: '1h ago',
    riskReason: 'Dual submersible pump operating near peak capacity; runoff approaching barrier.',
    drainNodeId: 'NODE-P-03'
  }
];

const INITIAL_RESCUE_TEAMS = [
  {
    id: 'TEAM-01',
    name: 'Rescue Unit Alpha',
    role: 'Disaster Rescue & Water Extraction',
    type: 'RESCUE',
    zone: 'Ward 4 (Riverside)',
    status: 'AVAILABLE',
    personnel: 6,
    boats: 2,
    ambulances: 0,
    equipment: '2 Inflatable Boats, 6 Life Vests',
    etaMinutes: 4,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  {
    id: 'TEAM-02',
    name: 'Rescue Unit Bravo',
    role: 'Urban Stormwater Evacuation',
    type: 'RESCUE',
    zone: 'Ward 14 (Industrial Area)',
    status: 'AVAILABLE',
    personnel: 4,
    boats: 1,
    ambulances: 0,
    equipment: '1 Inflatable Boat, 4 Wading Drysuits',
    etaMinutes: 6,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  {
    id: 'TEAM-03',
    name: 'Medical Response Cell',
    role: 'Emergency Triage & Paramedic',
    type: 'MEDICAL',
    zone: 'Central Hospital Hub',
    status: 'AVAILABLE',
    personnel: 5,
    boats: 0,
    ambulances: 2,
    equipment: '2 Critical Care Ambulances, 4 Mobile Triage Kits',
    etaMinutes: 8,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  {
    id: 'TEAM-04',
    name: 'Rapid Evacuation Squad',
    role: 'High-Clearance Flood Transport',
    type: 'RESCUE',
    zone: 'Sector 4 Underpass',
    status: 'AVAILABLE',
    personnel: 8,
    boats: 3,
    ambulances: 0,
    equipment: '3 High-Clearance Flood Trucks, 2 Rafts',
    etaMinutes: 10,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  // 3 Municipal Cleaning Crews with correct drainage equipment (NO ambulances!)
  {
    id: 'CREW-01',
    name: 'Rapid Desilting Crew 1',
    role: 'High-Velocity Sucker & Culvert Jetting',
    type: 'CLEANING',
    specialty: 'silt',
    zone: 'Ward 14 (Industrial Area)',
    leadWorker: 'Ramesh K. (Senior Desilting Tech)',
    status: 'AVAILABLE',
    personnel: 4,
    boats: 0,
    ambulances: 0,
    equipment: '1 Desilting Truck, 1 High-Pressure Jetter',
    etaMinutes: 5,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  {
    id: 'CREW-02',
    name: 'Hydraulic Vacuum Unit 2',
    role: 'Heavy Mechanical Dredging & Silt Clearing',
    type: 'CLEANING',
    specialty: 'heavy debris',
    zone: 'Ward 9 (Commercial Sector)',
    leadWorker: 'S. Suresh (Sanitation Supervisor)',
    status: 'AVAILABLE',
    personnel: 3,
    boats: 0,
    ambulances: 0,
    equipment: '2 Vacuum Pumps, 1 Suction Tanker',
    etaMinutes: 7,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  },
  {
    id: 'CREW-03',
    name: 'Emergency Trench Squad 3',
    role: 'Trash Rack Clearing & Manual De-weeding',
    type: 'CLEANING',
    specialty: 'collapsed/deep',
    zone: 'Ward 4 (Metro Corridor)',
    leadWorker: 'M. Anjaneyulu (Civic Drainage Eng)',
    status: 'AVAILABLE',
    personnel: 4,
    boats: 0,
    ambulances: 0,
    equipment: '1 Trench Cutter, 2 Submersible Dewatering Pumps',
    etaMinutes: 8,
    target: null,
    assignedTargetId: null,
    assignedAt: null,
    workload: 0
  }
];

const INITIAL_RELIEF_CAMPS = [
  {
    id: 'CAMP-01',
    name: 'Model High School Relief Camp',
    ward: 'Ward 9 (Weir Colony)',
    capacity: 800,
    occupancy: 340,
    foodDays: 4,
    waterDays: 3,
    medicalStatus: 'SUPPLIED',
    status: 'ACTIVE'
  },
  {
    id: 'CAMP-02',
    name: 'Community Center Shelter',
    ward: 'Ward 4 (Riverside)',
    capacity: 500,
    occupancy: 210,
    foodDays: 3,
    waterDays: 2,
    medicalStatus: 'SUPPLIED',
    status: 'ACTIVE'
  },
  {
    id: 'CAMP-03',
    name: 'Civic Sports Complex Hall',
    ward: 'Ward 14 (Industrial Area)',
    capacity: 1000,
    occupancy: 0,
    foodDays: 6,
    waterDays: 5,
    medicalStatus: 'STANDBY',
    status: 'CLOSED'
  }
];

const INITIAL_MAINTENANCE_TASKS = [
  {
    id: 'TASK-M-101',
    drainId: 'NODE-C-08',
    title: 'Emergency Mechanical Vacuum Silt Dredging',
    location: 'Culvert Line C-8 (Ward 14)',
    type: 'Mechanical Desilting',
    priority: 'URGENT',
    status: 'IN_PROGRESS', // 'OPEN' | 'IN_PROGRESS' | 'DONE'
    assignedWorker: 'Rapid Desilting Crew 1 (Ramesh K.)',
    assignedWorkerId: 'CREW-01',
    dueDate: 'Today, 14:00',
    preRainTag: true,
    notes: 'Severe trash rack blockage (87%). Vacuum desilter deployed.'
  },
  {
    id: 'TASK-M-102',
    drainId: 'NODE-D-03',
    title: 'Market Channel Trash Clearing & Sediment Removal',
    location: 'Market Road Arterial Storm Drain (Ward 9)',
    type: 'Sediment Clearing',
    priority: 'HIGH',
    status: 'OPEN',
    assignedWorker: 'Unassigned',
    assignedWorkerId: null,
    dueDate: 'Tomorrow, 10:00',
    preRainTag: true,
    notes: 'Organic waste from market stalls constricting flow by 66%.'
  },
  {
    id: 'TASK-M-103',
    drainId: 'NODE-D-07',
    title: 'Metro Viaduct Trench Trash Extraction',
    location: 'Metro Rail Viaduct Trench (Ward 4)',
    type: 'Trash Rack Clearing',
    priority: 'HIGH',
    status: 'OPEN',
    assignedWorker: 'Unassigned',
    assignedWorkerId: null,
    dueDate: 'Tomorrow, 16:00',
    preRainTag: false,
    notes: 'Construction debris and runoff silting.'
  }
];

const INITIAL_AWARENESS_CAMPAIGNS = [
  {
    id: 'CMP-01',
    zone: 'Ward 4 (Riverside Lowlands)',
    title: 'Pre-Monsoon Flood Evacuation & Floodplain Awareness',
    scheduledDate: 'Tomorrow, 10:00 AM',
    status: 'SCHEDULED', // 'SCHEDULED' | 'ACTIVE' | 'COMPLETED'
    targetHouseholds: 1420,
    linkedAlertId: 'ALT-FL-01',
    channel: 'Loudspeaker Van & Door-to-Door SMS Leaflet'
  },
  {
    id: 'CMP-02',
    zone: 'Ward 14 (Industrial Basin)',
    title: 'Culvert Trash Disposal Compliance & Drainage Maintenance Drive',
    scheduledDate: 'Saturday, 09:30 AM',
    status: 'SCHEDULED',
    targetHouseholds: 2800,
    linkedAlertId: 'ALT-FL-02',
    channel: 'Industrial Association SMS Advisory & PA System'
  }
];

const INITIAL_RISK_ZONES = [
  {
    id: 'ZONE-C-08',
    name: 'Urban Culvert Line C-8',
    area: 'Industrial Sector Catchment',
    ward: 'Ward 14 (Industrial Area)',
    blockagePct: 87,
    waterLevel: '2.85 m',
    rainfall: '48 mm/hr',
    stagedTeamId: null,
    openedCampId: null,
    alertSent: false,
    crewDispatched: true,
    isSecured: false
  },
  {
    id: 'ZONE-P-03',
    name: 'Central Underpass Pumping Sump',
    area: 'Sector 4 Lowland Underpass',
    ward: 'Ward 11 (Market Road Catchment)',
    blockagePct: 42,
    waterLevel: '1.94 m',
    rainfall: '38 mm/hr',
    stagedTeamId: null,
    openedCampId: null,
    alertSent: false,
    crewDispatched: false,
    isSecured: false
  },
  {
    id: 'ZONE-D-03',
    name: 'Market Road Arterial Storm Drain',
    area: 'Commercial Core Channel D-03',
    ward: 'Ward 9 (Commercial Sector)',
    blockagePct: 66,
    waterLevel: '2.10 m',
    rainfall: '45 mm/hr',
    stagedTeamId: null,
    openedCampId: null,
    alertSent: false,
    crewDispatched: false,
    isSecured: false
  },
  {
    id: 'ZONE-D-07',
    name: 'Metro Rail Viaduct Storm Trench',
    area: 'Deep Sump Zone 11',
    ward: 'Ward 4 (Metro Corridor)',
    blockagePct: 74,
    waterLevel: '2.40 m',
    rainfall: '40 mm/hr',
    stagedTeamId: null,
    openedCampId: null,
    alertSent: false,
    crewDispatched: false,
    isSecured: false
  }
];

const INITIAL_BROADCAST_HISTORY = [
  {
    id: 'SIM-DISPATCH-9402',
    level: 'DANGER',
    area: 'Ward 14 (Industrial Corridor Basin) & Ward 4 Lowlands',
    language: 'en',
    encoding: 'GSM-7',
    segments: 1,
    message: 'FLOOD DANGER: Rapid inundation in Ward 14 Industrial Corridor. Move to higher ground now. Shelter: Govt High School Ward 4. Helpline 1070.',
    sentAt: '25 mins ago',
    timestamp: Date.now() - 25 * 60 * 1000,
    recipients: 3770,
    deliveryStatus: 'Delivered',
    deliveryPct: 98.4,
    isSimulated: true
  },
  {
    id: 'SIM-DISPATCH-8841',
    level: 'WARNING',
    area: 'Ward 4 (Riverside Lowlands)',
    language: 'te',
    encoding: 'UCS-2 (Unicode)',
    segments: 1,
    message: 'వరద హెచ్చరిక: నీరు పెరుగుతోంది. ఎత్తైన ప్రదేశాలకు వెళ్లండి. హెల్ప్‌లైన్ 1070.',
    sentAt: '1 hour ago',
    timestamp: Date.now() - 65 * 60 * 1000,
    recipients: 1420,
    deliveryStatus: 'Delivered',
    deliveryPct: 99.1,
    isSimulated: true
  },
  {
    id: 'SIM-DISPATCH-8120',
    level: 'WATCH',
    area: 'Ward 9 & Ward 11 Basin Catchment',
    language: 'hi',
    encoding: 'UCS-2 (Unicode)',
    segments: 1,
    message: 'बाढ़ अलर्ट: भारी बारिश का अनुमान। निचले इलाके सतर्क रहें। हेल्पलाइन 1070.',
    sentAt: '3 hours ago',
    timestamp: Date.now() - 180 * 60 * 1000,
    recipients: 2160,
    deliveryStatus: 'Delivered',
    deliveryPct: 97.6,
    isSimulated: true
  },
  {
    id: 'SIM-DISPATCH-7052',
    level: 'ALL_CLEAR',
    area: 'Musi River South Embankment',
    language: 'en',
    encoding: 'GSM-7',
    segments: 1,
    message: 'FLOOD ALL CLEAR: Floodwaters receding across Musi River South Embankment. Water returned to safe channels. Safe to return home. Helpline 1070.',
    sentAt: 'Yesterday',
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    recipients: 3100,
    deliveryStatus: 'Delivered',
    deliveryPct: 100.0,
    isSimulated: true
  }
];

const INITIAL_ACTIVITY_LOG = [
  {
    id: 'ACT-001',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Officer (Disaster Response Coordinator)',
    action: 'RESCUE_DISPATCH',
    details: 'Dispatched Rescue Unit Bravo to Culvert C-8 (ETA 12m).',
    tag: '[SIMULATED]'
  },
  {
    id: 'ACT-002',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Field Engineer (PWD)',
    action: 'CLEANING_CREW_ASSIGNED',
    details: 'Assigned Rapid Desilting Crew 1 (Ramesh K.) to clear 87% silt blockage on Culvert C-8.',
    tag: '[SIMULATED]'
  },
  {
    id: 'ACT-003',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Officer (Disaster Response Coordinator)',
    action: 'CITIZEN_ALERT',
    details: 'Simulated DANGER broadcast sent to 3,770 residents in Ward 14 & Ward 4.',
    tag: '[SIMULATED]'
  },
  {
    id: 'ACT-004',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toLocaleTimeString(),
    actor: 'IoT Telemetry Sentinel',
    action: 'DUAL_SENSOR_HEALTH',
    details: 'All 6 IoT drainage nodes online with primary ultrasonic & backup pressure sensors.',
    tag: '[SIMULATED]'
  }
];

export function FloodGuardProvider({ children }) {
  const { user } = useAuth();

  // Load from localStorage or defaults
  const [store, setStore] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          floodAlerts: parsed.floodAlerts || INITIAL_FLOOD_ALERTS,
          drainNodes: parsed.drainNodes || INITIAL_DRAIN_NODES,
          rescueTeams: parsed.rescueTeams || INITIAL_RESCUE_TEAMS,
          reliefCamps: parsed.reliefCamps || INITIAL_RELIEF_CAMPS,
          maintenanceTasks: parsed.maintenanceTasks || INITIAL_MAINTENANCE_TASKS,
          scheduledCampaigns: parsed.scheduledCampaigns || INITIAL_AWARENESS_CAMPAIGNS,
          riskZones: parsed.riskZones || INITIAL_RISK_ZONES,
          broadcastHistory: parsed.broadcastHistory || INITIAL_BROADCAST_HISTORY,
          lastDispatchedBroadcast: parsed.lastDispatchedBroadcast || INITIAL_BROADCAST_HISTORY[0],
          activityLog: parsed.activityLog || INITIAL_ACTIVITY_LOG,
          isOutageActive: Boolean(parsed.isOutageActive),
          loraQueue: parsed.loraQueue || []
        };
      }
    } catch {
      // Fallback
    }
    return {
      floodAlerts: INITIAL_FLOOD_ALERTS,
      drainNodes: INITIAL_DRAIN_NODES,
      rescueTeams: INITIAL_RESCUE_TEAMS,
      reliefCamps: INITIAL_RELIEF_CAMPS,
      maintenanceTasks: INITIAL_MAINTENANCE_TASKS,
      scheduledCampaigns: INITIAL_AWARENESS_CAMPAIGNS,
      riskZones: INITIAL_RISK_ZONES,
      broadcastHistory: INITIAL_BROADCAST_HISTORY,
      lastDispatchedBroadcast: INITIAL_BROADCAST_HISTORY[0],
      activityLog: INITIAL_ACTIVITY_LOG,
      isOutageActive: false,
      loraQueue: []
    };
  });

  // Global Toast Notification State
  const [toast, setToast] = useState(null);

  // Cross-tab Navigation & Prefill Intent
  const [activeTabIntent, setActiveTabIntent] = useState(null);
  const [alertPrefillParams, setAlertPrefillParams] = useState(null);

  // Active Drawer State for Overview Cards
  const [activeDrawer, setActiveDrawer] = useState(null); // 'alerts' | 'blockages' | 'nodes' | 'teams' | 'camps' | 'activity'

  // Selected Map Node for synchronized highlighting
  const [selectedMapNodeId, setSelectedMapNodeId] = useState('NODE-C-08');

  // Persist store to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.error('Failed to persist SensaFlow store:', err);
    }
  }, [store]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const addActivity = useCallback((action, details, customActor = null, customTag = null, isAgent = false) => {
    const actorName = customActor || (user?.name ? `${user.name} (${user.designation || 'Officer'})` : 'Officer (Disaster Cell)');
    const entryIsAgent = Boolean(isAgent || customActor === 'Coordinator Agent' || customTag === 'Agent');
    const newEntry = {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action,
      details,
      tag: customTag || '[SIMULATED]',
      isAgent: entryIsAgent
    };
    setStore(prev => ({
      ...prev,
      activityLog: [newEntry, ...prev.activityLog].slice(0, 60)
    }));
  }, [user]);

  // Demo: Simulate multiple simultaneous incidents (Blockage spike + Sensor failure + Flood alert)
  const simulateMultipleIncidents = useCallback(() => {
    setStore(prev => {
      // 1. Spike blockage on NODE-C-08
      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === 'NODE-C-08') {
          return {
            ...d,
            blockagePct: 89,
            waterLevel: '2.92 m',
            status: 'CRITICAL',
            operationalStatus: 'BLOCKED',
            reason: 'Simulated high silt sediment and stormwater debris trapping.',
            action: 'Emergency vacuum desilter crew required.'
          };
        }
        // 2. Simulate primary sensor fault on NODE-P-03
        if (d.id === 'NODE-P-03') {
          return {
            ...d,
            primarySensor: {
              ...d.primarySensor,
              status: 'FAILED',
              reading: '0.00 m (NO SIGNAL)'
            },
            sensorHealth: 'PRIMARY_FAILED'
          };
        }
        return d;
      });

      // 3. Flood alert in Ward 14 Industrial Corridor
      const multiAlertId = `ALT-MULTI-${Date.now().toString().slice(-4)}`;
      const newAlert = {
        id: multiAlertId,
        title: 'Critical Inundation Risk — Ward 14 Industrial Corridor',
        location: 'Urban Culvert Line C-8',
        zone: 'Ward 14 (Industrial Area)',
        severity: 'CRITICAL',
        waterLevel: '2.92 m',
        threshold: '2.50 m',
        rainfall: '48 mm/hr',
        time: 'Just now',
        timestamp: Date.now(),
        status: 'NEW',
        assignedTeamId: null,
        assignedTeamName: null,
        drainNodeId: 'NODE-C-08'
      };

      const newActivity = {
        id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleTimeString(),
        actor: 'Simulation Engine',
        action: 'MULTI_INCIDENTS_TRIGGERED',
        details: 'Simulated 3 concurrent emergencies: Blockage spike on NODE-C-08 (89%), primary sensor fault on NODE-P-03, and critical flood alert in Ward 14.',
        tag: '[SIMULATED]',
        isAgent: false
      };

      showToast('Triggered multi-incident scenario: blockage (89%) + sensor fault + flood alert!');

      return {
        ...prev,
        drainNodes: updatedDrains,
        floodAlerts: [newAlert, ...prev.floodAlerts.filter(a => a.id !== multiAlertId)],
        activityLog: [newActivity, ...prev.activityLog].slice(0, 60)
      };
    });
  }, [showToast]);



  // Reset entire simulation to pristine default
  const resetDemoData = useCallback(() => {
    setStore({
      floodAlerts: INITIAL_FLOOD_ALERTS,
      drainNodes: INITIAL_DRAIN_NODES,
      rescueTeams: INITIAL_RESCUE_TEAMS,
      reliefCamps: INITIAL_RELIEF_CAMPS,
      maintenanceTasks: INITIAL_MAINTENANCE_TASKS,
      scheduledCampaigns: INITIAL_AWARENESS_CAMPAIGNS,
      riskZones: INITIAL_RISK_ZONES,
      broadcastHistory: INITIAL_BROADCAST_HISTORY,
      lastDispatchedBroadcast: INITIAL_BROADCAST_HISTORY[0],
      activityLog: INITIAL_ACTIVITY_LOG,
      isOutageActive: false,
      loraQueue: []
    });
    setSelectedMapNodeId('NODE-C-08');
    showToast('Simulation data reset to default factory state.');
  }, [showToast]);

  // =========================================================================
  // ACTIONS: TEAM ASSIGNMENT & DISPATCH (TABS 1, 3, 4)
  // =========================================================================

  // Assign a Rescue Team to a Flood Alert
  const assignTeamToAlert = useCallback((alertId, manualTeamId = null) => {
    setStore(prev => {
      const alert = prev.floodAlerts.find(a => a.id === alertId);
      if (!alert) return prev;

      let chosenTeam = null;
      if (manualTeamId) {
        chosenTeam = prev.rescueTeams.find(t => t.id === manualTeamId);
        if (!chosenTeam) {
          showToast(`Selected team ${manualTeamId} not found!`, 'error');
          return prev;
        }
        if (chosenTeam.status !== 'AVAILABLE' && chosenTeam.status !== 'STANDBY') {
          showToast(`Team ${chosenTeam.name} is currently busy (${chosenTeam.status}). Choose an available team!`, 'error');
          return prev;
        }
      } else {
        const availableRescue = prev.rescueTeams.filter(t => 
          (t.type === 'RESCUE' || !t.type) && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
        );

        if (availableRescue.length === 0) {
          showToast('No rescue teams currently free! All units are dispatched or on scene.', 'error');
          return prev;
        }

        chosenTeam = availableRescue.find(t => alert.zone.toLowerCase().includes(t.zone.toLowerCase())) || availableRescue[0];
      }

      const timestamp = new Date().toLocaleTimeString();

      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.id === chosenTeam.id) {
          return {
            ...t,
            status: 'DISPATCHED',
            target: alert.title,
            assignedTargetId: alert.id,
            assignedAt: timestamp,
            etaMinutes: t.etaMinutes || 12,
            workload: (t.workload || 0) + 1
          };
        }
        return t;
      });

      const updatedAlerts = prev.floodAlerts.map(a => {
        if (a.id === alert.id) {
          return {
            ...a,
            status: 'ASSIGNED',
            assignedTeamId: chosenTeam.id,
            assignedTeamName: chosenTeam.name,
            assignedAt: timestamp
          };
        }
        return a;
      });

      addActivity('TEAM_ASSIGNED', `Dispatched ${chosenTeam.name} to flood alert: ${alert.title} in ${alert.zone}`);
      showToast(`Assigned ${chosenTeam.name} to ${alert.title}!`);

      return {
        ...prev,
        rescueTeams: updatedTeams,
        floodAlerts: updatedAlerts
      };
    });
  }, [addActivity, showToast]);

  // Assign a Cleaning Crew to a Blocked Drain
  const assignWorkerToBlockage = useCallback((drainId, manualCrewId = null) => {
    setStore(prev => {
      const drain = prev.drainNodes.find(d => d.id === drainId);
      if (!drain) return prev;

      let chosenCrew = null;
      if (manualCrewId) {
        chosenCrew = prev.rescueTeams.find(t => t.id === manualCrewId);
        if (!chosenCrew) {
          showToast(`Selected crew ${manualCrewId} not found!`, 'error');
          return prev;
        }
        if (chosenCrew.status !== 'AVAILABLE' && chosenCrew.status !== 'STANDBY') {
          showToast(`Crew ${chosenCrew.name} is currently busy (${chosenCrew.status}).`, 'error');
          return prev;
        }
      } else {
        const availableCrews = prev.rescueTeams.filter(t => 
          t.type === 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
        );

        if (availableCrews.length === 0) {
          showToast('No cleaning crews currently free! All desilting units are deployed.', 'error');
          return prev;
        }

        chosenCrew = availableCrews.find(c => drain.zone.toLowerCase().includes(c.zone.toLowerCase())) || availableCrews[0];
      }

      const timestamp = new Date().toLocaleTimeString();
      const workerLabel = `${chosenCrew.name} (${chosenCrew.leadWorker || 'Crew'})`;

      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.id === chosenCrew.id) {
          return {
            ...t,
            status: 'DISPATCHED',
            target: drain.location,
            assignedTargetId: drain.id,
            assignedAt: timestamp,
            etaMinutes: 10,
            workload: (t.workload || 0) + 1
          };
        }
        return t;
      });

      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === drain.id) {
          return {
            ...d,
            operationalStatus: 'CREW_DISPATCHED',
            assignedWorker: workerLabel,
            assignedWorkerId: chosenCrew.id,
            action: `Desilting underway by ${workerLabel}. In transit.`
          };
        }
        return d;
      });

      // Also ensure a maintenance task exists and is linked
      const existingTask = prev.maintenanceTasks.find(t => t.drainId === drainId && t.status !== 'DONE');
      let updatedTasks = prev.maintenanceTasks;
      if (existingTask) {
        updatedTasks = prev.maintenanceTasks.map(t => t.id === existingTask.id ? {
          ...t,
          status: 'IN_PROGRESS',
          assignedWorker: workerLabel,
          assignedWorkerId: chosenCrew.id
        } : t);
      } else {
        const newTask = {
          id: `TASK-M-${Math.floor(200 + Math.random() * 800)}`,
          drainId,
          title: `Emergency Desilting & Trash Clearing — ${drain.name}`,
          location: drain.location,
          type: 'Mechanical Desilting',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          assignedWorker: workerLabel,
          assignedWorkerId: chosenCrew.id,
          dueDate: 'Today, within 2h',
          preRainTag: true,
          notes: `Auto-generated from blockage telemetry (${drain.blockagePct}%).`
        };
        updatedTasks = [newTask, ...prev.maintenanceTasks];
      }

      addActivity('CLEANING_ASSIGNED', `Assigned ${workerLabel} to clear blockage on ${drain.id} (${drain.location}).`);
      showToast(`Assigned ${chosenCrew.name} to ${drain.name}!`);

      return {
        ...prev,
        rescueTeams: updatedTeams,
        drainNodes: updatedDrains,
        maintenanceTasks: updatedTasks
      };
    });
  }, [addActivity, showToast]);

  // Reassign Team or Crew
  const reassignUnit = useCallback((targetId, newTeamId, type = 'ALERT') => {
    setStore(prev => {
      const newTeam = prev.rescueTeams.find(t => t.id === newTeamId);
      if (!newTeam) {
        showToast('Selected replacement team not found.', 'error');
        return prev;
      }
      if (newTeam.status !== 'AVAILABLE' && newTeam.status !== 'STANDBY') {
        showToast(`Team ${newTeam.name} is already busy. Choose an available unit!`, 'error');
        return prev;
      }

      const timestamp = new Date().toLocaleTimeString();

      if (type === 'ALERT') {
        const alert = prev.floodAlerts.find(a => a.id === targetId);
        if (!alert) return prev;

        const prevTeamId = alert.assignedTeamId;

        const updatedTeams = prev.rescueTeams.map(t => {
          if (t.id === prevTeamId) {
            return {
              ...t,
              status: 'AVAILABLE',
              target: null,
              assignedTargetId: null,
              assignedAt: null,
              workload: Math.max(0, (t.workload || 1) - 1)
            };
          }
          if (t.id === newTeam.id) {
            return {
              ...t,
              status: 'DISPATCHED',
              target: alert.title,
              assignedTargetId: alert.id,
              assignedAt: timestamp,
              etaMinutes: 10,
              workload: (t.workload || 0) + 1
            };
          }
          return t;
        });

        const updatedAlerts = prev.floodAlerts.map(a => {
          if (a.id === targetId) {
            return {
              ...a,
              status: 'ASSIGNED',
              assignedTeamId: newTeam.id,
              assignedTeamName: newTeam.name,
              assignedAt: timestamp
            };
          }
          return a;
        });

        addActivity('TEAM_REASSIGNED', `Reassigned flood alert ${targetId} from ${prevTeamId || 'None'} to ${newTeam.name}.`);
        showToast(`Reassigned to ${newTeam.name}!`);

        return {
          ...prev,
          rescueTeams: updatedTeams,
          floodAlerts: updatedAlerts
        };
      } else {
        const drain = prev.drainNodes.find(d => d.id === targetId);
        if (!drain) return prev;

        const prevCrewId = drain.assignedWorkerId;

        const updatedTeams = prev.rescueTeams.map(t => {
          if (t.id === prevCrewId) {
            return {
              ...t,
              status: 'AVAILABLE',
              target: null,
              assignedTargetId: null,
              assignedAt: null,
              workload: Math.max(0, (t.workload || 1) - 1)
            };
          }
          if (t.id === newTeam.id) {
            return {
              ...t,
              status: 'DISPATCHED',
              target: drain.location,
              assignedTargetId: drain.id,
              assignedAt: timestamp,
              etaMinutes: 10,
              workload: (t.workload || 0) + 1
            };
          }
          return t;
        });

        const workerLabel = `${newTeam.name} (${newTeam.leadWorker || 'Crew'})`;
        const updatedDrains = prev.drainNodes.map(d => {
          if (d.id === targetId) {
            return {
              ...d,
              operationalStatus: 'CREW_DISPATCHED',
              assignedWorker: workerLabel,
              assignedWorkerId: newTeam.id,
              action: `Desilting reassigned to ${workerLabel}.`
            };
          }
          return d;
        });

        // Update maintenance tasks
        const updatedTasks = prev.maintenanceTasks.map(task => 
          task.drainId === targetId ? { ...task, assignedWorker: workerLabel, assignedWorkerId: newTeam.id } : task
        );

        addActivity('CREW_REASSIGNED', `Reassigned drain ${targetId} cleaning to ${newTeam.name}.`);
        showToast(`Reassigned to ${newTeam.name}!`);

        return {
          ...prev,
          rescueTeams: updatedTeams,
          drainNodes: updatedDrains,
          maintenanceTasks: updatedTasks
        };
      }
    });
  }, [addActivity, showToast]);

  // Mark Team or Alert as "ON SCENE"
  const markTeamOnScene = useCallback((teamOrAlertId) => {
    setStore(prev => {
      // Find team by team id OR alert id
      const team = prev.rescueTeams.find(t => t.id === teamOrAlertId || t.assignedTargetId === teamOrAlertId);
      const alert = prev.floodAlerts.find(a => a.id === teamOrAlertId || (team && a.assignedTeamId === team.id));

      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.id === team?.id) {
          return { ...t, status: 'ON SCENE', etaMinutes: 0 };
        }
        return t;
      });

      const updatedAlerts = prev.floodAlerts.map(a => {
        if (a.id === alert?.id) {
          return { ...a, status: 'ON SCENE' };
        }
        return a;
      });

      const teamName = team ? team.name : 'Emergency Unit';
      addActivity('TEAM_ON_SCENE', `${teamName} arrived and is now ON SCENE.`);
      showToast(`${teamName} is now ON SCENE!`);

      return {
        ...prev,
        rescueTeams: updatedTeams,
        floodAlerts: updatedAlerts
      };
    });
  }, [addActivity, showToast]);

  // Mark Alert as RESOLVED
  const markAlertResolved = useCallback((alertId) => {
    setStore(prev => {
      const alert = prev.floodAlerts.find(a => a.id === alertId);
      if (!alert) return prev;

      let freedTeamName = null;
      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.assignedTargetId === alertId || t.id === alert.assignedTeamId) {
          freedTeamName = t.name;
          return {
            ...t,
            status: 'AVAILABLE',
            target: null,
            assignedTargetId: null,
            assignedAt: null,
            etaMinutes: null,
            workload: Math.max(0, (t.workload || 1) - 1)
          };
        }
        return t;
      });

      const updatedAlerts = prev.floodAlerts.map(a => {
        if (a.id === alertId) {
          return { ...a, status: 'RESOLVED' };
        }
        return a;
      });

      addActivity('ALERT_RESOLVED', `Flood alert ${alertId} (${alert.zone}) resolved. ${freedTeamName ? `${freedTeamName} released to AVAILABLE.` : ''}`);
      showToast(`Alert resolved! ${freedTeamName ? `${freedTeamName} is now Available.` : ''}`);

      return {
        ...prev,
        floodAlerts: updatedAlerts,
        rescueTeams: updatedTeams
      };
    });
  }, [addActivity, showToast]);

  // Send Public Alert for Inundation Alert
  const sendPublicAlertForInundation = useCallback((alertId) => {
    setStore(prev => {
      const alert = prev.floodAlerts.find(a => a.id === alertId);
      if (!alert) return prev;

      const updatedAlerts = prev.floodAlerts.map(a => a.id === alertId ? { ...a, citizenNotified: true } : a);

      const msg = `FLOOD ${alert.severity}: Inundation active in ${alert.zone}. Water level at ${alert.waterLevel}. Move to safe higher ground. Helpline 1070.`;
      const newHistoryEntry = {
        id: `SIM-DISPATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        level: alert.severity === 'CRITICAL' ? 'DANGER' : 'WARNING',
        area: alert.zone,
        language: 'en',
        encoding: 'GSM-7',
        segments: 1,
        message: msg,
        sentAt: 'Just now',
        timestamp: Date.now(),
        recipients: 3770,
        deliveryStatus: 'Delivered',
        deliveryPct: 98.6,
        isSimulated: true
      };

      addActivity('CITIZEN_BROADCAST', `Dispatched public alert broadcast for ${alert.zone} (3,770 residents queued).`);
      showToast(`Public flood warning broadcast to ${alert.zone}!`);

      return {
        ...prev,
        floodAlerts: updatedAlerts,
        broadcastHistory: [newHistoryEntry, ...prev.broadcastHistory]
      };
    });
  }, [addActivity, showToast]);

  // Mark Drain Cleared (Clears blockage everywhere and frees worker)
  const markDrainCleared = useCallback((drainId) => {
    setStore(prev => {
      const drain = prev.drainNodes.find(d => d.id === drainId);
      if (!drain) return prev;

      let freedCrewName = null;
      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.assignedTargetId === drainId || t.id === drain.assignedWorkerId) {
          freedCrewName = t.name;
          return {
            ...t,
            status: 'AVAILABLE',
            target: null,
            assignedTargetId: null,
            assignedAt: null,
            etaMinutes: null,
            workload: Math.max(0, (t.workload || 1) - 1)
          };
        }
        return t;
      });

      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === drainId) {
          return {
            ...d,
            blockagePct: 4,
            status: 'NORMAL',
            operationalStatus: 'CLEARED',
            assignedWorker: null,
            assignedWorkerId: null,
            action: 'Culvert cleared; nominal stormwater discharge restored.'
          };
        }
        return d;
      });

      // Complete linked maintenance tasks
      const updatedTasks = prev.maintenanceTasks.map(task => {
        if (task.drainId === drainId) {
          return { ...task, status: 'DONE' };
        }
        return task;
      });

      // Also resolve any linked risk zone or flood alert
      const updatedZones = prev.riskZones.map(z => 
        z.id.includes(drainId.replace('NODE-', '')) ? { ...z, blockagePct: 4, isSecured: true } : z
      );
      const updatedAlerts = prev.floodAlerts.map(a => 
        a.drainNodeId === drainId || a.zone.includes(drainId.replace('NODE-', '')) ? { ...a, status: 'RESOLVED' } : a
      );

      addActivity('DRAIN_CLEARED', `Drain ${drainId} cleared. Blockage dropped to 4%. ${freedCrewName ? `${freedCrewName} is now AVAILABLE.` : ''}`);
      showToast(`Drain ${drainId} cleared! Blockage dropped to 4%.`);

      return {
        ...prev,
        drainNodes: updatedDrains,
        rescueTeams: updatedTeams,
        maintenanceTasks: updatedTasks,
        riskZones: updatedZones,
        floodAlerts: updatedAlerts
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: DUAL-SENSOR FAILOVER (TAB 2)
  // =========================================================================
  const simulateSensorFailure = useCallback((drainId) => {
    setStore(prev => {
      const target = prev.drainNodes.find(d => d.id === drainId);
      if (!target) return prev;

      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === drainId) {
          return {
            ...d,
            primarySensor: {
              ...d.primarySensor,
              status: 'FAILED',
              reading: 'COMM_FAIL (No Echo / 0V)'
            },
            backupSensor: {
              ...d.backupSensor,
              status: 'ACTIVE',
              reading: d.waterLevel
            },
            sensorHealth: 'BACKUP_ACTIVE'
          };
        }
        return d;
      });

      addActivity(
        'DUAL_SENSOR_FAILOVER',
        `Backup sensor activated on ${drainId}. Primary ultrasonic sensor failed, node stays Online.`
      );
      showToast(`Backup sensor activated on ${drainId}! Node remains Online.`);

      return { ...prev, drainNodes: updatedDrains };
    });
  }, [addActivity, showToast]);

  const restorePrimarySensor = useCallback((drainId) => {
    setStore(prev => {
      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === drainId) {
          return {
            ...d,
            primarySensor: {
              ...d.primarySensor,
              status: 'ACTIVE',
              reading: d.waterLevel
            },
            backupSensor: {
              ...d.backupSensor,
              status: 'STANDBY'
            },
            sensorHealth: 'PRIMARY_ACTIVE'
          };
        }
        return d;
      });

      addActivity('SENSOR_RESTORED', `Primary sensor on ${drainId} restored. Backup sensor returned to STANDBY.`);
      showToast(`Primary sensor on ${drainId} restored to active.`);

      return { ...prev, drainNodes: updatedDrains };
    });
  }, [addActivity, showToast]);

  const simulateBlockageSpike = useCallback((drainId, spikePct = 88) => {
    setStore(prev => {
      const drain = prev.drainNodes.find(d => d.id === drainId);
      if (!drain) return prev;

      // Find nearest available cleaning crew
      const availableCrew = prev.rescueTeams.find(t => 
        t.type === 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
      );

      const timestamp = new Date().toLocaleTimeString();
      const workerLabel = availableCrew 
        ? `${availableCrew.name} (${availableCrew.leadWorker || 'Crew'})`
        : 'Emergency PWD On-Call Unit';

      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === drainId) {
          return {
            ...d,
            blockagePct: spikePct,
            status: 'CRITICAL',
            operationalStatus: 'CREW_DISPATCHED',
            assignedWorker: workerLabel,
            assignedWorkerId: availableCrew?.id || null,
            reason: `Sudden stormwater debris spike detected: ${spikePct}% cross-sectional restriction.`,
            action: `Rapid Desilting crew automatically assigned. Emergency clearance in progress.`
          };
        }
        return d;
      });

      // Update crew if available
      const updatedTeams = availableCrew ? prev.rescueTeams.map(t => {
        if (t.id === availableCrew.id) {
          return {
            ...t,
            status: 'DISPATCHED',
            target: drain.location,
            assignedTargetId: drain.id,
            assignedAt: timestamp,
            etaMinutes: 10,
            workload: (t.workload || 0) + 1
          };
        }
        return t;
      }) : prev.rescueTeams;

      // Create new flood alert
      const newAlert = {
        id: `ALT-SPIKE-${Math.floor(100 + Math.random() * 900)}`,
        title: `Rapid Blockage Inundation Warning — ${drain.name}`,
        zone: drain.location,
        severity: 'CRITICAL',
        waterLevel: drain.waterLevel,
        rainfall: '52 mm/hr',
        status: 'ASSIGNED',
        assignedTeamId: availableCrew?.id || 'CREW-01',
        assignedTeamName: availableCrew?.name || 'Rapid Desilting Crew 1',
        assignedAt: timestamp,
        openedCampId: null,
        citizenNotified: false,
        timestamp: 'Just now',
        riskReason: `Critical ${spikePct}% obstruction detected. Street water rising rapidly.`,
        drainNodeId: drain.id
      };

      // Create new maintenance task
      const newTask = {
        id: `TASK-M-${Math.floor(200 + Math.random() * 800)}`,
        drainId: drain.id,
        title: `Immediate Desilting — ${drain.name} (${spikePct}%)`,
        location: drain.location,
        type: 'Emergency Desilting',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        assignedWorker: workerLabel,
        assignedWorkerId: availableCrew?.id || null,
        dueDate: 'Today, within 2h',
        preRainTag: true,
        notes: `High blockage spike (${spikePct}%) detected.`
      };

      addActivity(
        'BLOCKAGE_AUTO_ACTION',
        `High blockage (${spikePct}%) on ${drain.id}! Created alert, maintenance task, and auto-assigned ${workerLabel}.`
      );
      showToast(`Blockage Spike: ${spikePct}% on ${drain.id}! Auto-assigned ${workerLabel}.`);

      return {
        ...prev,
        drainNodes: updatedDrains,
        rescueTeams: updatedTeams,
        floodAlerts: [newAlert, ...prev.floodAlerts],
        maintenanceTasks: [newTask, ...prev.maintenanceTasks]
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: SHELTERS & CHECK-IN/OUT (TAB 4)
  // =========================================================================
  const checkInShelter = useCallback((campId, count = 50) => {
    setStore(prev => {
      const camp = prev.reliefCamps.find(c => c.id === campId);
      if (!camp) return prev;

      const newOcc = Math.min(camp.capacity, camp.occupancy + count);
      const updatedCamps = prev.reliefCamps.map(c => c.id === campId ? { ...c, occupancy: newOcc, status: 'ACTIVE' } : c);

      addActivity('SHELTER_CHECKIN', `Checked in +${count} citizens to ${camp.name} (${newOcc}/${camp.capacity}).`);
      showToast(`Checked in evacuees to ${camp.name} (${newOcc}/${camp.capacity})`);

      return { ...prev, reliefCamps: updatedCamps };
    });
  }, [addActivity, showToast]);

  const checkOutShelter = useCallback((campId, count = 50) => {
    setStore(prev => {
      const camp = prev.reliefCamps.find(c => c.id === campId);
      if (!camp) return prev;

      const newOcc = Math.max(0, camp.occupancy - count);
      const updatedCamps = prev.reliefCamps.map(c => c.id === campId ? { ...c, occupancy: newOcc } : c);

      addActivity('SHELTER_CHECKOUT', `Discharged/checked out -${count} citizens from ${camp.name} (${newOcc}/${camp.capacity}).`);
      showToast(`Checked out evacuees from ${camp.name} (${newOcc}/${camp.capacity})`);

      return { ...prev, reliefCamps: updatedCamps };
    });
  }, [addActivity, showToast]);

  const scheduleAwarenessCampaign = useCallback((campaignData) => {
    setStore(prev => {
      const newCampaign = {
        id: `CMP-0${prev.scheduledCampaigns.length + 1}`,
        zone: campaignData.zone || 'Ward 4 (Riverside)',
        title: campaignData.title || 'Pre-Flood Citizen Readiness & Evacuation Drive',
        scheduledDate: campaignData.scheduledDate || 'Tomorrow, 10:00 AM',
        status: 'SCHEDULED',
        targetHouseholds: parseInt(campaignData.targetHouseholds, 10) || 1200,
        linkedAlertId: campaignData.linkedAlertId || null,
        channel: campaignData.channel || 'Mobile PA Vans & SMS Advisories'
      };

      addActivity('CAMPAIGN_SCHEDULED', `Scheduled preventive awareness campaign in ${newCampaign.zone}: "${newCampaign.title}".`);
      showToast(`Awareness campaign scheduled for ${newCampaign.zone}!`);

      return {
        ...prev,
        scheduledCampaigns: [newCampaign, ...prev.scheduledCampaigns]
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: OFFLINE & LoRa TELEMETRY (TAB 5)
  // =========================================================================
  const toggleNetworkOutage = useCallback(() => {
    setStore(prev => {
      const nextOutage = !prev.isOutageActive;
      const updatedDrains = prev.drainNodes.map(d => ({
        ...d,
        commsStatus: nextOutage ? 'LORA_FALLBACK' : 'ONLINE',
        linkQuality: nextOutage ? 'LORA_ACTIVE' : 'EXCELLENT',
        rssiDbm: nextOutage ? -92 : -72
      }));

      addActivity(
        'NETWORK_COMMS_EVENT',
        nextOutage
          ? 'SIMULATED CELLULAR OUTAGE: All 6 IoT nodes switched to LoRa fallback comms.'
          : 'CELLULAR RESTORED: All 6 nodes reconnected to primary cellular telemetry bus.'
      );
      showToast(
        nextOutage
          ? 'Network Outage Active: Nodes switched to LoRa fallback.'
          : 'Network Restored: Nodes returned to online cellular feed.'
      );

      return {
        ...prev,
        isOutageActive: nextOutage,
        drainNodes: updatedDrains
      };
    });
  }, [addActivity, showToast]);

  const queueLoRaAlert = useCallback((alertPayload) => {
    setStore(prev => {
      const queuedItem = {
        id: `LORA-MSG-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: alertPayload,
        status: 'SENT_VIA_LORA'
      };

      addActivity('LORA_PACKET_QUEUED', `Alert dispatched via sub-GHz LoRa radio fallback for ${alertPayload.zone || 'drain node'}.`);
      showToast('Dispatched alert via LoRa fallback radio link!');

      return {
        ...prev,
        loraQueue: [queuedItem, ...prev.loraQueue]
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: MAINTENANCE TASKS (TAB 6)
  // =========================================================================
  const createMaintenanceTask = useCallback((taskData) => {
    if (!taskData.location || !taskData.title) {
      showToast('Please provide a location and task title.', 'error');
      return false;
    }

    setStore(prev => {
      const newTask = {
        id: `TASK-M-${Math.floor(300 + Math.random() * 700)}`,
        drainId: taskData.drainId || null,
        title: taskData.title,
        location: taskData.location,
        type: taskData.type || 'Mechanical Desilting',
        priority: taskData.priority || 'MEDIUM',
        status: 'OPEN',
        assignedWorker: taskData.assignedWorker || 'Unassigned',
        assignedWorkerId: taskData.assignedWorkerId || null,
        dueDate: taskData.dueDate || 'Tomorrow, 12:00',
        preRainTag: Boolean(taskData.preRainTag),
        notes: taskData.notes || 'Routine upkeep.'
      };

      addActivity('MAINTENANCE_CREATED', `Created upkeep task: "${newTask.title}" for ${newTask.location}.`);
      showToast(`Maintenance task created: ${newTask.title}`);

      return {
        ...prev,
        maintenanceTasks: [newTask, ...prev.maintenanceTasks]
      };
    });
    return true;
  }, [addActivity, showToast]);

  const completeMaintenanceTask = useCallback((taskId) => {
    setStore(prev => {
      const task = prev.maintenanceTasks.find(t => t.id === taskId);
      if (!task) return prev;

      // Update task status
      const updatedTasks = prev.maintenanceTasks.map(t => t.id === taskId ? { ...t, status: 'DONE' } : t);

      // If linked to a drain, clear the drain obstruction as well
      let updatedDrains = prev.drainNodes;
      let updatedTeams = prev.rescueTeams;
      let updatedZones = prev.riskZones;
      let updatedAlerts = prev.floodAlerts;

      if (task.drainId) {
        updatedDrains = prev.drainNodes.map(d => d.id === task.drainId ? {
          ...d,
          blockagePct: 4,
          status: 'NORMAL',
          operationalStatus: 'CLEARED',
          assignedWorker: null,
          assignedWorkerId: null,
          action: 'Culvert cleared; nominal stormwater discharge restored.'
        } : d);

        // Free the worker
        updatedTeams = prev.rescueTeams.map(t => {
          if (t.assignedTargetId === task.drainId || t.id === task.assignedWorkerId) {
            return {
              ...t,
              status: 'AVAILABLE',
              target: null,
              assignedTargetId: null,
              assignedAt: null,
              workload: Math.max(0, (t.workload || 1) - 1)
            };
          }
          return t;
        });

        // Resolve risk zones and alerts
        updatedZones = prev.riskZones.map(z => 
          z.id.includes(task.drainId.replace('NODE-', '')) ? { ...z, blockagePct: 4, isSecured: true } : z
        );
        updatedAlerts = prev.floodAlerts.map(a => 
          a.drainNodeId === task.drainId || a.zone.includes(task.drainId.replace('NODE-', '')) ? { ...a, status: 'RESOLVED' } : a
        );
      }

      addActivity('TASK_COMPLETED', `Completed maintenance task ${taskId} (${task.title}). Obstruction cleared & worker released.`);
      showToast(`Task ${taskId} marked Done! Blockage cleared.`);

      return {
        ...prev,
        maintenanceTasks: updatedTasks,
        drainNodes: updatedDrains,
        rescueTeams: updatedTeams,
        riskZones: updatedZones,
        floodAlerts: updatedAlerts
      };
    });
  }, [addActivity, showToast]);

  const reassignMaintenanceWorker = useCallback((taskId, newWorkerName, newWorkerId = null) => {
    setStore(prev => {
      const task = prev.maintenanceTasks.find(t => t.id === taskId);
      if (!task) return prev;

      const updatedTasks = prev.maintenanceTasks.map(t => t.id === taskId ? {
        ...t,
        assignedWorker: newWorkerName,
        assignedWorkerId: newWorkerId,
        status: 'IN_PROGRESS'
      } : t);

      // If linked to drain, also update drain node
      let updatedDrains = prev.drainNodes;
      if (task.drainId) {
        updatedDrains = prev.drainNodes.map(d => d.id === task.drainId ? {
          ...d,
          assignedWorker: newWorkerName,
          assignedWorkerId: newWorkerId
        } : d);
      }

      addActivity('MAINTENANCE_REASSIGNED', `Reassigned task ${taskId} to ${newWorkerName}.`);
      showToast(`Task ${taskId} assigned to ${newWorkerName}`);

      return {
        ...prev,
        maintenanceTasks: updatedTasks,
        drainNodes: updatedDrains
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: RESCUE, TACTICAL & AGENT SCENARIOS (TAB 4 & AGENT COORDINATOR)
  // =========================================================================
  const dispatchRescueTeam = useCallback((teamId, zone = 'Critical Risk Basin', etaMinutes = 10) => {
    setStore(prev => {
      const team = prev.rescueTeams.find(t => t.id === teamId);
      const updatedTeams = prev.rescueTeams.map(t => t.id === teamId ? {
        ...t,
        status: 'DISPATCHED',
        zone,
        etaMinutes,
        target: `Mobilized to ${zone}`,
        workload: (t.workload || 0) + 1
      } : t);

      addActivity('TEAM_DISPATCHED', `Dispatched ${team ? team.name : teamId} to ${zone}. ETA: ${etaMinutes} mins.`);
      showToast(`Dispatched ${team ? team.name : teamId} to ${zone}`);

      return { ...prev, rescueTeams: updatedTeams };
    });
  }, [addActivity, showToast]);

  const recallRescueTeam = useCallback((teamId) => {
    setStore(prev => {
      const team = prev.rescueTeams.find(t => t.id === teamId);
      if (!team) return prev;

      addActivity('TEAM_RECALLED', `Recalled ${team.name} from field. Status updated to RETURNING.`);
      showToast(`${team.name} recalled. Returning to base...`);

      const updatedTeams = prev.rescueTeams.map(t => t.id === teamId ? {
        ...t,
        status: 'RETURNING',
        target: 'Returning to depot'
      } : t);

      // Auto-transition to AVAILABLE after 2500ms
      setTimeout(() => {
        setStore(inner => {
          const tObj = inner.rescueTeams.find(t => t.id === teamId);
          if (!tObj || tObj.status !== 'RETURNING') return inner;

          const nextTeams = inner.rescueTeams.map(t => t.id === teamId ? {
            ...t,
            status: 'AVAILABLE',
            target: null,
            assignedTargetId: null,
            workload: 0
          } : t);

          addActivity('TEAM_AVAILABLE', `${tObj.name} returned to depot reserve and is now AVAILABLE.`);
          showToast(`${tObj.name} is now AVAILABLE.`);

          return { ...inner, rescueTeams: nextTeams };
        });
      }, 2500);

      return { ...prev, rescueTeams: updatedTeams };
    });
  }, [addActivity, showToast]);

  const cycleTeamStatus = useCallback((teamId, status) => {
    setStore(prev => {
      const team = prev.rescueTeams.find(t => t.id === teamId);
      const updatedTeams = prev.rescueTeams.map(t => t.id === teamId ? { ...t, status } : t);
      addActivity('TEAM_STATUS_CYCLE', `Updated ${team ? team.name : teamId} status to ${status}.`);
      showToast(`Updated status of ${team ? team.name : teamId} to ${status}`);
      return { ...prev, rescueTeams: updatedTeams };
    });
  }, [addActivity, showToast]);

  const reassignRescueTeam = useCallback((teamId, zone) => {
    setStore(prev => {
      const team = prev.rescueTeams.find(t => t.id === teamId);
      if (!team) return prev;

      const updatedTeams = prev.rescueTeams.map(t => t.id === teamId ? {
        ...t,
        zone,
        status: 'DISPATCHED',
        target: `Reassigned to ${zone}`,
        etaMinutes: 7
      } : t);

      addActivity('TEAM_REASSIGNED', `Reassigned ${team.name} to ${zone}. ETA: 7 mins.`);
      showToast(`Reassigned ${team.name} to ${zone}!`);

      return { ...prev, rescueTeams: updatedTeams };
    });
  }, [addActivity, showToast]);

  // Tactical Actions for Risk Zones (Part 4)
  const stageTeamAtRiskZone = useCallback((zoneId, teamId) => {
    setStore(prev => {
      const zone = prev.riskZones.find(z => z.id === zoneId);
      const team = prev.rescueTeams.find(t => t.id === teamId);
      if (!zone || !team) return prev;

      const updatedZones = prev.riskZones.map(z => z.id === zoneId ? { ...z, stagedTeamId: team.id } : z);
      const updatedTeams = prev.rescueTeams.map(t => t.id === teamId ? {
        ...t,
        status: 'DISPATCHED',
        zone: zone.ward || zone.name,
        target: `Staged at ${zone.name}`,
        assignedTargetId: zone.id,
        etaMinutes: 6,
        workload: (t.workload || 0) + 1
      } : t);

      addActivity('TEAM_STAGED', `[TACTICAL] Staged ${team.name} at high-risk zone ${zone.name}.`);
      showToast(`${team.name} staged at ${zone.name}!`);

      return {
        ...prev,
        riskZones: updatedZones,
        rescueTeams: updatedTeams
      };
    });
  }, [addActivity, showToast]);

  const preEvacuateShelter = useCallback((zoneId, campId) => {
    setStore(prev => {
      const zone = prev.riskZones.find(z => z.id === zoneId);
      const camp = prev.reliefCamps.find(c => c.id === campId);
      if (!camp) return prev;

      const newOcc = Math.min(camp.capacity, camp.occupancy + 120);
      const updatedCamps = prev.reliefCamps.map(c => c.id === campId ? { ...c, status: 'ACTIVE', occupancy: newOcc } : c);
      const updatedZones = zone ? prev.riskZones.map(z => z.id === zoneId ? { ...z, openedCampId: camp.id } : z) : prev.riskZones;

      addActivity('SHELTER_PRE_EVAC', `[TACTICAL] Pre-evacuated citizens from ${zone ? zone.name : 'lowlands'} to ${camp.name} (${newOcc}/${camp.capacity}).`);
      showToast(`Pre-evacuated citizens to ${camp.name}! Shelter is ACTIVE.`);

      return {
        ...prev,
        reliefCamps: updatedCamps,
        riskZones: updatedZones
      };
    });
  }, [addActivity, showToast]);

  const dispatchInspectionCrew = useCallback((zoneId) => {
    setStore(prev => {
      const zone = prev.riskZones.find(z => z.id === zoneId);
      const availableCrew = prev.rescueTeams.find(t => t.type === 'CLEANING' && (t.status === 'AVAILABLE' || t.status === 'STANDBY')) 
        || prev.rescueTeams.find(t => t.id === 'CREW-01');

      const updatedZones = prev.riskZones.map(z => z.id === zoneId ? { ...z, crewDispatched: true } : z);
      let updatedTeams = prev.rescueTeams;

      if (availableCrew) {
        updatedTeams = prev.rescueTeams.map(t => t.id === availableCrew.id ? {
          ...t,
          status: 'DISPATCHED',
          target: `Inspection at ${zone ? zone.name : zoneId}`,
          assignedTargetId: zoneId,
          etaMinutes: 5,
          workload: (t.workload || 0) + 1
        } : t);
      }

      const matchingDrain = prev.drainNodes.find(d => zone && (d.id.includes(zone.id.replace('ZONE-', '')) || zone.name.includes(d.name)));
      let updatedDrains = prev.drainNodes;
      if (matchingDrain) {
        updatedDrains = prev.drainNodes.map(d => d.id === matchingDrain.id ? {
          ...d,
          operationalStatus: 'CREW_DISPATCHED',
          assignedWorker: availableCrew ? `${availableCrew.name} (${availableCrew.leadWorker || 'Inspection Crew'})` : 'Inspection Crew'
        } : d);
      }

      addActivity('INSPECTION_DISPATCHED', `[TACTICAL] Dispatched inspection crew to ${zone ? zone.name : zoneId}.`);
      showToast(`Inspection crew dispatched to ${zone ? zone.name : zoneId}!`);

      return {
        ...prev,
        riskZones: updatedZones,
        rescueTeams: updatedTeams,
        drainNodes: updatedDrains
      };
    });
  }, [addActivity, showToast]);

  const deployFloodBarriers = useCallback((zoneId) => {
    setStore(prev => {
      const zone = prev.riskZones.find(z => z.id === zoneId);
      const updatedZones = prev.riskZones.map(z => z.id === zoneId ? { ...z, isSecured: true, barriersDeployed: true } : z);

      addActivity('BARRIERS_DEPLOYED', `[TACTICAL] Deployed flood barriers at ${zone ? zone.name : zoneId}. Perimeter secured.`);
      showToast(`Flood barriers deployed at ${zone ? zone.name : zoneId}. Zone secured!`);

      return { ...prev, riskZones: updatedZones };
    });
  }, [addActivity, showToast]);

  // Animated Drainage Clearance Verification (87% -> 40% -> 10%)
  const animateDrainClearing = useCallback((drainId) => {
    setStore(prev => {
      const drain = prev.drainNodes.find(d => d.id === drainId);
      if (!drain) return prev;

      const updatedDrains = prev.drainNodes.map(d => d.id === drainId ? {
        ...d,
        operationalStatus: 'CREW_DISPATCHED',
        action: 'High-pressure vacuum jetting active. Debris extraction underway.'
      } : d);

      addActivity('CLEARING_STARTED', `Verification: Mechanical desilting initiated at ${drain.name} (${drain.blockagePct}% blocked).`);
      showToast(`Desilting started on ${drain.name}...`);

      // Step 2: 700ms - Blockage drops to 40%
      setTimeout(() => {
        setStore(s2 => {
          const d2 = s2.drainNodes.map(d => d.id === drainId ? {
            ...d,
            blockagePct: 40,
            waterLevel: '1.80 m',
            action: 'Culvert blockage clearing: 40% restriction remaining.'
          } : d);
          const z2 = s2.riskZones.map(z => z.id.includes(drainId.replace('NODE-', '')) ? { ...z, blockagePct: 40 } : z);
          return { ...s2, drainNodes: d2, riskZones: z2 };
        });

        // Step 3: 1400ms - Blockage drops to 10%, marked NORMAL / CLEARED
        setTimeout(() => {
          setStore(s3 => {
            let freedWorkerName = null;
            const targetDrain = s3.drainNodes.find(d => d.id === drainId);
            if (targetDrain) freedWorkerName = targetDrain.assignedWorker;

            const d3 = s3.drainNodes.map(d => d.id === drainId ? {
              ...d,
              blockagePct: 10,
              status: 'NORMAL',
              waterLevel: '1.20 m',
              operationalStatus: 'CLEARED',
              assignedWorker: null,
              assignedWorkerId: null,
              action: 'Culvert cleared; nominal stormwater discharge restored.'
            } : d);

            const z3 = s3.riskZones.map(z => z.id.includes(drainId.replace('NODE-', '')) ? {
              ...z,
              blockagePct: 10,
              isSecured: true
            } : z);

            const t3 = s3.rescueTeams.map(t => {
              if (t.assignedTargetId === drainId || (freedWorkerName && freedWorkerName.includes(t.name))) {
                return {
                  ...t,
                  status: 'AVAILABLE',
                  target: null,
                  assignedTargetId: null,
                  workload: Math.max(0, (t.workload || 1) - 1)
                };
              }
              return t;
            });

            const m3 = s3.maintenanceTasks.map(task => {
              if (task.drainId === drainId) {
                return { ...task, status: 'DONE' };
              }
              return task;
            });

            addActivity('DRAIN_CLEARED', `Drain clearance verified: ${targetDrain?.name || drainId} blockage dropped 87% -> 40% -> 10%. Zone secured and crew released.`);
            showToast(`Drain ${drainId} cleared! Blockage dropped to 10%.`);

            return {
              ...s3,
              drainNodes: d3,
              riskZones: z3,
              rescueTeams: t3,
              maintenanceTasks: m3
            };
          });
        }, 700);
      }, 700);

      return { ...prev, drainNodes: updatedDrains };
    });
  }, [addActivity, showToast]);

  // Preset Scenarios (Part 5)
  const triggerHeavyRainSurgeScenario = useCallback(() => {
    setStore(prev => {
      const updatedDrains = prev.drainNodes.map(d => ({
        ...d,
        rainfall: '48.5 mm/hr',
        waterLevel: d.id === 'NODE-C-08' ? '3.45 m' : (d.id === 'NODE-WZ-04' ? '3.60 m' : d.waterLevel)
      }));

      const updatedAlerts = prev.floodAlerts.map(a => ({
        ...a,
        severity: 'CRITICAL',
        rainfall: '48.5 mm/hr',
        status: a.status === 'RESOLVED' ? 'NEW' : a.status
      }));

      const updatedZones = prev.riskZones.map(z => ({
        ...z,
        rainfall: '48.5 mm/hr',
        waterLevel: '3.45 m',
        isSecured: false
      }));

      addActivity('SCENARIO_HEAVY_RAIN', '[SIMULATED AI AGENT] Sentinel triggered Heavy Rain Surge scenario: 48.5 mm storm front detected.');
      showToast('Heavy Rain Surge scenario activated (48.5 mm)!');

      return {
        ...prev,
        drainNodes: updatedDrains,
        floodAlerts: updatedAlerts,
        riskZones: updatedZones
      };
    });
  }, [addActivity, showToast]);

  const triggerSensorFailureScenario = useCallback(() => {
    setStore(prev => {
      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === 'NODE-C-08') {
          return {
            ...d,
            primarySensor: {
              ...d.primarySensor,
              status: 'FAILED',
              reading: 'COMM_FAIL (No Echo / 0V)'
            },
            backupSensor: {
              ...d.backupSensor,
              status: 'ACTIVE',
              reading: d.waterLevel
            },
            sensorHealth: 'BACKUP_ACTIVE'
          };
        }
        return d;
      });

      addActivity('DUAL_SENSOR_FAILOVER', '[SIMULATED AI AGENT] Sentinel failover: Primary sensor on NODE-C-08 failed. Backup sensor activated.');
      showToast('Sensor Failure on NODE-C-08: Backup sensor activated!');

      return { ...prev, drainNodes: updatedDrains };
    });
  }, [addActivity, showToast]);

  const triggerNetworkOutageScenario = useCallback(() => {
    setStore(prev => {
      const updatedDrains = prev.drainNodes.map(d => ({
        ...d,
        commsStatus: 'LORA_FALLBACK',
        linkQuality: 'LORA_ACTIVE',
        rssiDbm: -94
      }));

      const loraPacket = {
        id: `LORA-MSG-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        payload: {
          zone: 'Ward 14 (Industrial Area)',
          level: 'DANGER',
          message: 'EMERGENCY: Cellular link offline. SensaFlow LoRa packet relay active. Move to safe shelters.'
        },
        status: 'SENT_VIA_LORA'
      };

      addActivity('LORA_PACKET_QUEUED', '[SIMULATED AI AGENT] Cellular blackout detected. SensaFlow comms switched to sub-GHz LoRa mesh radio.');
      showToast('Network Outage active: IoT nodes switched to LoRa fallback.');

      return {
        ...prev,
        isOutageActive: true,
        drainNodes: updatedDrains,
        loraQueue: [loraPacket, ...prev.loraQueue]
      };
    });
  }, [addActivity, showToast]);

  const triggerMultiIncidentStormScenario = useCallback(() => {
    setStore(prev => {
      const updatedAlerts = prev.floodAlerts.map(a => {
        if (a.id === 'ALT-FL-02') {
          return {
            ...a,
            severity: 'CRITICAL',
            waterLevel: '3.42 m (92%)',
            rainfall: '54 mm/hr',
            status: 'NEW',
            assignedTeamId: null,
            assignedTeamName: null
          };
        }
        return a;
      });

      const updatedDrains = prev.drainNodes.map(d => {
        if (d.id === 'NODE-C-08') {
          return {
            ...d,
            blockagePct: 87,
            status: 'CRITICAL',
            operationalStatus: 'BLOCKED',
            assignedWorker: null,
            assignedWorkerId: null,
            waterLevel: '3.42 m'
          };
        }
        if (d.id === 'NODE-D-03') {
          return {
            ...d,
            blockagePct: 75,
            status: 'CRITICAL',
            operationalStatus: 'BLOCKED',
            assignedWorker: null,
            assignedWorkerId: null
          };
        }
        if (d.id === 'NODE-P-03') {
          return {
            ...d,
            primarySensor: {
              ...d.primarySensor,
              status: 'FAILED',
              reading: 'STAGE_LOST'
            },
            backupSensor: {
              ...d.backupSensor,
              status: 'ACTIVE',
              reading: '1.94 m'
            },
            sensorHealth: 'BACKUP_ACTIVE'
          };
        }
        return d;
      });

      const updatedZones = prev.riskZones.map(z => ({
        ...z,
        isSecured: false,
        crewDispatched: false,
        stagedTeamId: null,
        barriersDeployed: false
      }));

      addActivity('MULTI_INCIDENT_STORM', '[SIMULATED AI AGENT] Multi-Incident Storm triggered: Concurrent flood surge, severe culvert blockage & sensor fault.');
      showToast('Multi-Incident Storm triggered! Multi-agent coordinator active.');

      return {
        ...prev,
        floodAlerts: updatedAlerts,
        drainNodes: updatedDrains,
        riskZones: updatedZones
      };
    });
  }, [addActivity, showToast]);

  const undoAgentAction = useCallback((actionToUndo) => {
    setStore(prev => {
      let updatedTeams = prev.rescueTeams;
      let updatedAlerts = prev.floodAlerts;
      let updatedDrains = prev.drainNodes;
      let updatedZones = prev.riskZones;

      if (actionToUndo?.teamId) {
        updatedTeams = prev.rescueTeams.map(t => t.id === actionToUndo.teamId ? {
          ...t,
          status: 'AVAILABLE',
          target: null,
          assignedTargetId: null,
          workload: 0
        } : t);
      }

      if (actionToUndo?.alertId) {
        updatedAlerts = prev.floodAlerts.map(a => a.id === actionToUndo.alertId ? {
          ...a,
          status: 'NEW',
          assignedTeamId: null,
          assignedTeamName: null
        } : a);
      }

      if (actionToUndo?.drainId) {
        updatedDrains = prev.drainNodes.map(d => d.id === actionToUndo.drainId ? {
          ...d,
          assignedWorker: null,
          assignedWorkerId: null,
          operationalStatus: 'BLOCKED'
        } : d);
      }

      if (actionToUndo?.zoneId) {
        updatedZones = prev.riskZones.map(z => z.id === actionToUndo.zoneId ? {
          ...z,
          stagedTeamId: null,
          crewDispatched: false,
          openedCampId: null,
          isSecured: false
        } : z);
      }

      addActivity('ACTION_UNDONE', `Undone agent action: ${actionToUndo?.description || 'Action rolled back'}.`);
      showToast(`Undone: ${actionToUndo?.description || 'Agent action reverted.'}`);

      return {
        ...prev,
        rescueTeams: updatedTeams,
        floodAlerts: updatedAlerts,
        drainNodes: updatedDrains,
        riskZones: updatedZones
      };
    });
  }, [addActivity, showToast]);

  // Compute live KPI aggregates from one unified source of truth
  const kpis = useMemo(() => {
    const activeAlertsCount = store.floodAlerts.filter(a => a.status === 'NEW' || a.status === 'ACTIVE' || a.status === 'ESCALATED' || a.status === 'ASSIGNED' || a.status === 'ON SCENE').length;
    const suspectedBlockagesCount = store.drainNodes.filter(d => d.blockagePct >= 25 && d.operationalStatus !== 'CLEARED').length;
    const onlineNodesCount = store.drainNodes.filter(d => d.operationalStatus !== 'OFFLINE' && d.commsStatus !== 'OFFLINE').length;
    const totalNodesCount = store.drainNodes.length;
    const activeTeamsCount = store.rescueTeams.filter(t => t.status === 'DISPATCHED' || t.status === 'ON SCENE').length;
    const totalTeamsCount = store.rescueTeams.length;
    const activeCampsCount = store.reliefCamps.filter(c => c.status === 'ACTIVE').length;
    const totalCampCapacity = store.reliefCamps.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const totalCampOccupancy = store.reliefCamps.reduce((acc, c) => acc + (c.occupancy || 0), 0);

    return {
      activeAlertsCount,
      suspectedBlockagesCount,
      onlineNodesCount,
      totalNodesCount,
      activeTeamsCount,
      totalTeamsCount,
      activeCampsCount,
      totalCampCapacity,
      totalCampOccupancy
    };
  }, [store]);

  const contextValue = {
    // State
    floodAlerts: store.floodAlerts,
    drainNodes: store.drainNodes,
    rescueTeams: store.rescueTeams,
    reliefCamps: store.reliefCamps,
    maintenanceTasks: store.maintenanceTasks,
    scheduledCampaigns: store.scheduledCampaigns,
    riskZones: store.riskZones,
    broadcastHistory: store.broadcastHistory,
    lastDispatchedBroadcast: store.lastDispatchedBroadcast,
    activityLog: store.activityLog,
    isOutageActive: store.isOutageActive,
    loraQueue: store.loraQueue,
    kpis,
    toast,
    activeDrawer,
    activeTabIntent,
    alertPrefillParams,
    selectedMapNodeId,

    // Controls
    setActiveDrawer,
    setActiveTabIntent,
    setAlertPrefillParams,
    setSelectedMapNodeId,
    showToast,
    resetDemoData,
    addActivity,
    simulateMultipleIncidents,

    // Tab 1 & Tab 3: Alerts & Assignment
    assignTeamToAlert,
    assignWorkerToBlockage,
    reassignUnit,
    markTeamOnScene,
    markAlertResolved,
    sendPublicAlertForInundation,
    acknowledgeAlert: (id) => {
      setStore(prev => ({
        ...prev,
        floodAlerts: prev.floodAlerts.map(a => a.id === id ? { ...a, status: 'ASSIGNED' } : a)
      }));
      showToast(`Acknowledged alert ${id}`);
    },

    // Tab 2: Drain Telemetry & Failover
    markDrainCleared,
    simulateSensorFailure,
    restorePrimarySensor,
    simulateBlockageSpike,
    toggleDrainMute: (drainId) => {
      setStore(prev => ({
        ...prev,
        drainNodes: prev.drainNodes.map(d => d.id === drainId ? { ...d, muted: !d.muted } : d)
      }));
      showToast(`Mute state toggled for ${drainId}`);
    },

    // Tab 4: Rescue, Shelters & Campaigns
    checkInShelter,
    checkOutShelter,
    scheduleAwarenessCampaign,
    dispatchRescueTeam,
    recallRescueTeam,
    cycleTeamStatus,
    reassignRescueTeam,

    // Tactical Actions (Part 4)
    stageTeamAtRiskZone,
    preEvacuateShelter,
    openCampForRiskZone: preEvacuateShelter,
    dispatchInspectionCrew,
    deployFloodBarriers,
    markZoneSecured: deployFloodBarriers,
    animateDrainClearing,

    // Tab 5: Comms & Outage
    toggleNetworkOutage,
    queueLoRaAlert,

    // Tab 6: Maintenance Tasks
    createMaintenanceTask,
    completeMaintenanceTask,
    reassignMaintenanceWorker,

    // Legacy/Convenience bindings
    openReliefCamp: (campData) => {
      const id = typeof campData === 'string' ? campData : campData?.id;
      setStore(prev => ({
        ...prev,
        reliefCamps: prev.reliefCamps.map(c => c.id === id ? { ...c, status: 'ACTIVE' } : c)
      }));
      showToast('Shelter activated!');
    },
    closeReliefCamp: (id) => {
      setStore(prev => ({
        ...prev,
        reliefCamps: prev.reliefCamps.map(c => c.id === id ? { ...c, status: 'CLOSED', occupancy: 0 } : c)
      }));
      showToast('Shelter closed.');
    },
    updateCampOccupancy: (id, delta) => {
      if (delta > 0) checkInShelter(id, delta);
      else checkOutShelter(id, Math.abs(delta));
    },
    requestCampSupplies: (id) => {
      showToast(`Replenishment shipment dispatched to shelter ${id}!`);
    },
    markDrainUnderMaintenance: (id) => {
      setStore(prev => ({
        ...prev,
        drainNodes: prev.drainNodes.map(d => d.id === id ? { ...d, operationalStatus: 'UNDER_MAINTENANCE' } : d)
      }));
      showToast(`${id} flagged as under maintenance.`);
    },
    dispatchCitizenBroadcast: (payload) => {
      const newHistoryEntry = {
        id: `SIM-DISPATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        level: payload.level,
        area: payload.area,
        language: payload.language,
        encoding: payload.encoding || 'GSM-7',
        segments: payload.segments || 1,
        message: payload.message,
        sentAt: 'Just now',
        timestamp: Date.now(),
        recipients: payload.recipients || 3770,
        deliveryStatus: 'Delivered',
        deliveryPct: 98.8,
        isSimulated: true
      };
      setStore(prev => ({
        ...prev,
        broadcastHistory: [newHistoryEntry, ...prev.broadcastHistory]
      }));
      showToast(`Broadcast dispatched to ${payload.recipients || 3770} citizens!`);
      return newHistoryEntry;
    },
    clearBroadcastHistory: () => {
      setStore(prev => ({ ...prev, broadcastHistory: [] }));
      showToast('Broadcast history cleared.');
    },
    triggerSendAlertForArea: (areaName, defaultLevel = 'DANGER') => {
      setAlertPrefillParams({ area: areaName, level: defaultLevel });
      setActiveTabIntent('alerts');
    },

    // Multi-Agent Coordinator Preset Scenarios & Undo
    triggerHeavyRainSurgeScenario,
    triggerSensorFailureScenario,
    triggerNetworkOutageScenario,
    triggerMultiIncidentStormScenario,
    undoAgentAction
  };

  return (
    <FloodGuardContext.Provider value={contextValue}>
      {children}
    </FloodGuardContext.Provider>
  );
}

export function useFloodGuard() {
  const ctx = useContext(FloodGuardContext);
  if (!ctx) {
    throw new Error('useFloodGuard must be used within a FloodGuardProvider');
  }
  return ctx;
}
