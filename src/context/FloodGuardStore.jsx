import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const FloodGuardContext = createContext(null);
const STORAGE_KEY = 'floodguard_master_store_v3';

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
    operationalStatus: 'BLOCKED',
    assignedWorker: 'Rapid Desilting Crew 1 (Ramesh K.)',
    assignedWorkerId: 'CREW-01',
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
    sensorHealth: 'PRIMARY_ACTIVE' // 'PRIMARY_ACTIVE' | 'BACKUP_ACTIVE' | 'ALL_FAILED'
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
    operationalStatus: 'BLOCKED',
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
    status: 'ASSIGNED',
    assignedTeamId: 'TEAM-01',
    assignedTeamName: 'Rescue Unit Alpha',
    assignedAt: '12m ago',
    openedCampId: 'CAMP-01',
    citizenNotified: true,
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
    status: 'ASSIGNED',
    assignedTeamId: 'TEAM-02',
    assignedTeamName: 'Rescue Unit Bravo',
    assignedAt: '25m ago',
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
    status: 'ACTIVE',
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
    status: 'ON SCENE', // 'AVAILABLE' | 'DISPATCHED' | 'ON SCENE' | 'STANDBY'
    personnel: 6,
    boats: 2,
    ambulances: 0,
    etaMinutes: 0,
    target: 'River Basin Weir Gate (Ward 4)',
    assignedTargetId: 'ALT-FL-01',
    assignedAt: '12m ago'
  },
  {
    id: 'TEAM-02',
    name: 'Rescue Unit Bravo',
    role: 'Urban Stormwater Evacuation',
    type: 'RESCUE',
    zone: 'Ward 14 (Industrial Area)',
    status: 'DISPATCHED',
    personnel: 4,
    boats: 1,
    ambulances: 0,
    etaMinutes: 12,
    target: 'Urban Culvert Line C-8 (Ward 14)',
    assignedTargetId: 'ALT-FL-02',
    assignedAt: '25m ago'
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
    etaMinutes: null,
    target: null,
    assignedTargetId: null,
    assignedAt: null
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
    ambulances: 1,
    etaMinutes: null,
    target: null,
    assignedTargetId: null,
    assignedAt: null
  },
  {
    id: 'CREW-01',
    name: 'Rapid Desilting Crew 1',
    role: 'High-Velocity Sucker & Culvert Jetting',
    type: 'CLEANING',
    zone: 'Ward 14 (Industrial Area)',
    leadWorker: 'Ramesh K. (Senior Desilting Tech)',
    status: 'DISPATCHED',
    personnel: 4,
    boats: 0,
    ambulances: 0,
    etaMinutes: 15,
    target: 'Culvert Line C-8',
    assignedTargetId: 'NODE-C-08',
    assignedAt: '18m ago'
  },
  {
    id: 'CREW-02',
    name: 'Hydraulic Vacuum Unit 2',
    role: 'Heavy Mechanical Dredging & Silt Clearing',
    type: 'CLEANING',
    zone: 'Ward 9 (Commercial Sector)',
    leadWorker: 'S. Suresh (Sanitation Supervisor)',
    status: 'AVAILABLE',
    personnel: 3,
    boats: 0,
    ambulances: 0,
    etaMinutes: null,
    target: null,
    assignedTargetId: null,
    assignedAt: null
  },
  {
    id: 'CREW-03',
    name: 'Emergency Trench Squad 3',
    role: 'Trash Rack Clearing & Manual De-weeding',
    type: 'CLEANING',
    zone: 'Ward 4 (Metro Corridor)',
    leadWorker: 'M. Anjaneyulu (Civic Drainage Eng)',
    status: 'AVAILABLE',
    personnel: 4,
    boats: 0,
    ambulances: 0,
    etaMinutes: null,
    target: null,
    assignedTargetId: null,
    assignedAt: null
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          floodAlerts: parsed.floodAlerts || INITIAL_FLOOD_ALERTS,
          drainNodes: parsed.drainNodes || INITIAL_DRAIN_NODES,
          rescueTeams: parsed.rescueTeams || INITIAL_RESCUE_TEAMS,
          reliefCamps: parsed.reliefCamps || INITIAL_RELIEF_CAMPS,
          riskZones: parsed.riskZones || INITIAL_RISK_ZONES,
          broadcastHistory: parsed.broadcastHistory || INITIAL_BROADCAST_HISTORY,
          lastDispatchedBroadcast: parsed.lastDispatchedBroadcast || INITIAL_BROADCAST_HISTORY[0],
          activityLog: parsed.activityLog || INITIAL_ACTIVITY_LOG
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
      riskZones: INITIAL_RISK_ZONES,
      broadcastHistory: INITIAL_BROADCAST_HISTORY,
      lastDispatchedBroadcast: INITIAL_BROADCAST_HISTORY[0],
      activityLog: INITIAL_ACTIVITY_LOG
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
      console.error('Failed to persist FloodGuard store:', err);
    }
  }, [store]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const addActivity = useCallback((action, details) => {
    const actorName = user?.name ? `${user.name} (${user.designation || 'Officer'})` : 'Officer (Disaster Cell)';
    const newEntry = {
      id: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString(),
      actor: actorName,
      action,
      details,
      tag: '[SIMULATED]'
    };
    setStore(prev => ({
      ...prev,
      activityLog: [newEntry, ...prev.activityLog].slice(0, 50)
    }));
  }, [user]);

  // Reset entire simulation to pristine default
  const resetDemoData = useCallback(() => {
    setStore({
      floodAlerts: INITIAL_FLOOD_ALERTS,
      drainNodes: INITIAL_DRAIN_NODES,
      rescueTeams: INITIAL_RESCUE_TEAMS,
      reliefCamps: INITIAL_RELIEF_CAMPS,
      riskZones: INITIAL_RISK_ZONES,
      broadcastHistory: INITIAL_BROADCAST_HISTORY,
      lastDispatchedBroadcast: INITIAL_BROADCAST_HISTORY[0],
      activityLog: INITIAL_ACTIVITY_LOG
    });
    setSelectedMapNodeId('NODE-C-08');
    showToast('Simulation data reset to default factory state.');
  }, [showToast]);

  // =========================================================================
  // ACTIONS: TEAM ASSIGNMENT & DISPATCH (PART 2)
  // =========================================================================

  // Assign a Rescue Team to a Flood Alert (Automatic best match or manual)
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
        // Automatic best match:
        // 1. Right team type: 'RESCUE'
        // 2. Currently available/standby
        // 3. Nearest matching zone
        const availableRescue = prev.rescueTeams.filter(t => 
          (t.type === 'RESCUE' || !t.type) && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
        );

        if (availableRescue.length === 0) {
          showToast('No rescue teams currently free! All units are dispatched or on scene.', 'error');
          return prev;
        }

        // Zone match
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
            etaMinutes: t.etaMinutes || 12
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

  // Assign a Cleaning Crew to a Blocked Drain (Automatic best match or manual)
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
        // Automatic best match:
        // 1. Right team type: 'CLEANING'
        // 2. Currently available
        // 3. Nearest matching zone
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
            etaMinutes: 10
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

      addActivity('CLEANING_ASSIGNED', `Assigned ${workerLabel} to clear blockage on ${drain.id} (${drain.location}).`);
      showToast(`Assigned ${chosenCrew.name} to ${drain.name}!`);

      return {
        ...prev,
        rescueTeams: updatedTeams,
        drainNodes: updatedDrains
      };
    });
  }, [addActivity, showToast]);

  // Reassign Team or Crew to a different unit
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

        // Free previous team
        const prevTeamId = alert.assignedTeamId;

        const updatedTeams = prev.rescueTeams.map(t => {
          if (t.id === prevTeamId) {
            return { ...t, status: 'AVAILABLE', target: null, assignedTargetId: null, assignedAt: null };
          }
          if (t.id === newTeam.id) {
            return {
              ...t,
              status: 'DISPATCHED',
              target: alert.title,
              assignedTargetId: alert.id,
              assignedAt: timestamp,
              etaMinutes: 10
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
        // Blockage / Drain
        const drain = prev.drainNodes.find(d => d.id === targetId);
        if (!drain) return prev;

        const prevCrewId = drain.assignedWorkerId;

        const updatedTeams = prev.rescueTeams.map(t => {
          if (t.id === prevCrewId) {
            return { ...t, status: 'AVAILABLE', target: null, assignedTargetId: null, assignedAt: null };
          }
          if (t.id === newTeam.id) {
            return {
              ...t,
              status: 'DISPATCHED',
              target: drain.location,
              assignedTargetId: drain.id,
              assignedAt: timestamp,
              etaMinutes: 10
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

        addActivity('CREW_REASSIGNED', `Reassigned drain ${targetId} cleaning to ${newTeam.name}.`);
        showToast(`Reassigned to ${newTeam.name}!`);

        return {
          ...prev,
          rescueTeams: updatedTeams,
          drainNodes: updatedDrains
        };
      }
    });
  }, [addActivity, showToast]);

  // Mark a Team or Crew as "ON SCENE"
  const markTeamOnScene = useCallback((teamId) => {
    setStore(prev => {
      const team = prev.rescueTeams.find(t => t.id === teamId);
      if (!team) return prev;

      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.id === teamId) {
          return { ...t, status: 'ON SCENE', etaMinutes: 0 };
        }
        return t;
      });

      addActivity('TEAM_ON_SCENE', `${team.name} arrived and is now ON SCENE at ${team.target || 'location'}.`);
      showToast(`${team.name} is now ON SCENE!`);

      return { ...prev, rescueTeams: updatedTeams };
    });
  }, [addActivity, showToast]);

  // Mark an Alert as RESOLVED (Frees the assigned team)
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
            etaMinutes: null
          };
        }
        return t;
      });

      const updatedAlerts = prev.floodAlerts.map(a => {
        if (a.id === alertId) {
          return { ...a, status: 'RESOLVED', assignedTeamId: null, assignedTeamName: null };
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

  // Mark a Blocked Drain as CLEARED (Frees assigned worker, drops blockage to nominal)
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
            etaMinutes: null
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

      // Also resolve any linked risk zone or flood alert
      const updatedZones = prev.riskZones.map(z => 
        z.id.includes(drainId.replace('NODE-', '')) ? { ...z, blockagePct: 4, isSecured: true } : z
      );
      const updatedAlerts = prev.floodAlerts.map(a => 
        a.drainNodeId === drainId || a.zone.includes(drainId.replace('NODE-', '')) ? { ...a, status: 'RESOLVED' } : a
      );

      addActivity('DRAIN_CLEARED', `Drain ${drainId} cleared. Blockage 4%. ${freedCrewName ? `${freedCrewName} is now AVAILABLE.` : ''}`);
      showToast(`Drain ${drainId} cleared! ${freedCrewName ? `${freedCrewName} is now Available.` : ''}`);

      return {
        ...prev,
        drainNodes: updatedDrains,
        rescueTeams: updatedTeams,
        riskZones: updatedZones,
        floodAlerts: updatedAlerts
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: DUAL-SENSOR FAILOVER (PART 3)
  // =========================================================================

  // Simulate Primary Sensor Failure -> Backup Sensor Activates Automatically!
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
        `Primary sensor on ${drainId} marked FAILED. Dual-sensor failover activated backup sensor automatically. Node stays ONLINE.`
      );
      showToast(`Failover Triggered: Backup sensor on ${drainId} activated automatically! Node remains ONLINE.`);

      return { ...prev, drainNodes: updatedDrains };
    });
  }, [addActivity, showToast]);

  // Restore Primary Sensor
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

  // Simulate Blockage Spike -> Automatically creates alert & auto-assigns cleaning worker!
  const simulateBlockageSpike = useCallback((drainId, spikePct = 89) => {
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
            etaMinutes: 10
          };
        }
        return t;
      }) : prev.rescueTeams;

      // Create or update flood alert
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

      addActivity(
        'BLOCKAGE_AUTO_ACTION',
        `Blockage spike (${spikePct}%) on ${drain.id}! Auto-generated flood alert and auto-assigned ${workerLabel}.`
      );
      showToast(`Blockage Spike: ${spikePct}% on ${drain.id}! Auto-assigned ${workerLabel}.`);

      return {
        ...prev,
        drainNodes: updatedDrains,
        rescueTeams: updatedTeams,
        floodAlerts: [newAlert, ...prev.floodAlerts]
      };
    });
  }, [addActivity, showToast]);

  // =========================================================================
  // OTHER ACTIONS: ALERTS, CAMPS, LOGISTICS
  // =========================================================================
  const acknowledgeAlert = useCallback((alertId) => {
    setStore(prev => ({
      ...prev,
      floodAlerts: prev.floodAlerts.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)
    }));
    addActivity('ALERT_ACKNOWLEDGED', `Acknowledged flood alert ${alertId}`);
    showToast(`Alert ${alertId} marked as Acknowledged.`);
  }, [addActivity, showToast]);

  const escalateAlert = useCallback((alertId) => {
    setStore(prev => ({
      ...prev,
      floodAlerts: prev.floodAlerts.map(a => a.id === alertId ? { ...a, status: 'ESCALATED', severity: 'CRITICAL' } : a)
    }));
    addActivity('ALERT_ESCALATED', `Escalated flood alert ${alertId} to CRITICAL priority.`);
    showToast(`Alert ${alertId} Escalated to State Command.`);
  }, [addActivity, showToast]);

  const openReliefCamp = useCallback((campData) => {
    setStore(prev => {
      const exists = prev.reliefCamps.find(c => c.id === campData.id);
      let updatedCamps;
      if (exists) {
        updatedCamps = prev.reliefCamps.map(c => c.id === campData.id ? { ...c, status: 'ACTIVE' } : c);
      } else {
        const newCamp = {
          id: `CAMP-0${prev.reliefCamps.length + 1}`,
          name: campData.name || 'New Municipal Relief Shelter',
          ward: campData.ward || 'Ward 4 (Riverside)',
          capacity: parseInt(campData.capacity, 10) || 600,
          occupancy: 0,
          foodDays: 5,
          waterDays: 4,
          medicalStatus: 'SUPPLIED',
          status: 'ACTIVE'
        };
        updatedCamps = [...prev.reliefCamps, newCamp];
      }
      return { ...prev, reliefCamps: updatedCamps };
    });
    addActivity('CAMP_ACTIVATED', `Activated relief shelter ${campData.name || campData.id}`);
    showToast(`Relief shelter activated successfully.`);
  }, [addActivity, showToast]);

  const closeReliefCamp = useCallback((campId) => {
    setStore(prev => ({
      ...prev,
      reliefCamps: prev.reliefCamps.map(c => c.id === campId ? { ...c, status: 'CLOSED', occupancy: 0 } : c)
    }));
    addActivity('CAMP_CLOSED', `Deactivated relief shelter ${campId}.`);
    showToast(`Relief shelter ${campId} closed.`);
  }, [addActivity, showToast]);

  const updateCampOccupancy = useCallback((campId, delta) => {
    setStore(prev => ({
      ...prev,
      reliefCamps: prev.reliefCamps.map(c => {
        if (c.id === campId) {
          const nextOcc = Math.max(0, Math.min(c.capacity, c.occupancy + delta));
          return { ...c, occupancy: nextOcc };
        }
        return c;
      })
    }));
    addActivity('OCCUPANCY_UPDATED', `Updated occupancy at shelter ${campId} by ${delta > 0 ? `+${delta}` : delta}.`);
    showToast(`Shelter occupancy updated.`);
  }, [addActivity, showToast]);

  const requestCampSupplies = useCallback((campId, { food = 2, water = 2 }) => {
    setStore(prev => ({
      ...prev,
      reliefCamps: prev.reliefCamps.map(c => c.id === campId ? {
        ...c,
        foodDays: c.foodDays + food,
        waterDays: c.waterDays + water
      } : c)
    }));
    addActivity('SUPPLIES_REQUESTED', `Emergency replenishment allocated to shelter ${campId} (+${food}d food, +${water}d water).`);
    showToast(`Emergency supplies dispatched to camp ${campId}.`);
  }, [addActivity, showToast]);

  const dispatchInspectionCrew = useCallback((drainId) => {
    assignWorkerToBlockage(drainId);
  }, [assignWorkerToBlockage]);

  const markDrainUnderMaintenance = useCallback((drainId) => {
    setStore(prev => ({
      ...prev,
      drainNodes: prev.drainNodes.map(d => d.id === drainId ? {
        ...d,
        operationalStatus: 'UNDER_MAINTENANCE',
        action: 'Scheduled desilting works in progress.'
      } : d)
    }));
    addActivity('MAINTENANCE_MARKED', `Flagged ${drainId} as Under Maintenance.`);
    showToast(`${drainId} set to Under Maintenance.`);
  }, [addActivity, showToast]);

  const requestDrainRecheck = useCallback((drainId) => {
    setStore(prev => ({
      ...prev,
      drainNodes: prev.drainNodes.map(d => d.id === drainId ? {
        ...d,
        lastReading: 'Just now'
      } : d)
    }));
    addActivity('TELEMETRY_PING', `Requested immediate acoustic diagnostic ping for ${drainId}.`);
    showToast(`Acoustic telemetry ping returned for ${drainId}.`);
  }, [addActivity, showToast]);

  const toggleDrainMute = useCallback((drainId) => {
    setStore(prev => ({
      ...prev,
      drainNodes: prev.drainNodes.map(d => d.id === drainId ? {
        ...d,
        muted: !d.muted
      } : d)
    }));
    showToast(`Sensor telemetry alerts toggled for ${drainId}.`);
  }, [showToast]);

  const stageTeamAtRiskZone = useCallback((zoneId, teamId) => {
    setStore(prev => ({
      ...prev,
      riskZones: prev.riskZones.map(z => z.id === zoneId ? { ...z, stagedTeamId: teamId } : z),
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: 'ON SCENE', target: zoneId } : t)
    }));
    addActivity('ZONE_STAGED', `Staged rescue team ${teamId} at critical flood zone ${zoneId}.`);
    showToast(`Rescue team ${teamId} staged at zone.`);
  }, [addActivity, showToast]);

  const openCampForRiskZone = useCallback((zoneId, campId) => {
    setStore(prev => ({
      ...prev,
      riskZones: prev.riskZones.map(z => z.id === zoneId ? { ...z, openedCampId: campId } : z),
      reliefCamps: prev.reliefCamps.map(c => c.id === campId ? { ...c, status: 'ACTIVE' } : c)
    }));
    addActivity('ZONE_EVACUATION', `Activated pre-evacuation shelter ${campId} for zone ${zoneId}.`);
    showToast(`Pre-evacuation shelter ${campId} opened.`);
  }, [addActivity, showToast]);

  const markZoneSecured = useCallback((zoneId) => {
    setStore(prev => ({
      ...prev,
      riskZones: prev.riskZones.map(z => z.id === zoneId ? { ...z, isSecured: true, blockagePct: 8 } : z)
    }));
    addActivity('ZONE_SECURED', `Flood barrier deployed & drainage channel secured for ${zoneId}.`);
    showToast(`Zone marked as Secured.`);
  }, [addActivity, showToast]);

  const dispatchCitizenBroadcast = useCallback((payload) => {
    const transactionId = `SIM-DISPATCH-${Math.floor(1000 + Math.random() * 9000)}`;
    const deliveryRate = (97.5 + Math.random() * 2.3).toFixed(1);

    const newHistoryEntry = {
      id: transactionId,
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
      deliveryPct: parseFloat(deliveryRate),
      isSimulated: true,
      channels: {
        sms: 'Delivered',
        whatsapp: 'Delivered',
        publicFeed: 'Published',
        siren: payload.level === 'DANGER' ? 'Siren Active' : 'Advisory Chime'
      }
    };

    setStore(prev => {
      const updatedAlerts = prev.floodAlerts.map(a => {
        if (payload.area.includes(a.zone) || a.zone.includes(payload.area)) {
          return {
            ...a,
            citizenNotified: true,
            status: payload.level === 'ALL_CLEAR' ? 'RESOLVED' : 'ACTIVE'
          };
        }
        return a;
      });

      const updatedZones = prev.riskZones.map(z => {
        if (payload.area.includes(z.name) || z.name.includes(payload.area)) {
          return { ...z, alertSent: true };
        }
        return z;
      });

      return {
        ...prev,
        broadcastHistory: [newHistoryEntry, ...prev.broadcastHistory],
        lastDispatchedBroadcast: newHistoryEntry,
        floodAlerts: updatedAlerts,
        riskZones: updatedZones
      };
    });

    addActivity(
      'CITIZEN_BROADCAST',
      `Dispatched ${payload.level} alert to ${payload.recipients?.toLocaleString() || 3770} citizens in ${payload.area}.`
    );
    showToast(`Broadcast dispatched! ${payload.recipients?.toLocaleString() || 3770} citizens queued.`);

    return newHistoryEntry;
  }, [addActivity, showToast]);

  const clearBroadcastHistory = useCallback(() => {
    setStore(prev => ({
      ...prev,
      broadcastHistory: []
    }));
    addActivity('HISTORY_CLEARED', 'Cleared simulated broadcast logs.');
    showToast('Broadcast history cleared.');
  }, [addActivity, showToast]);

  const triggerSendAlertForArea = useCallback((areaName, defaultLevel = 'DANGER') => {
    setAlertPrefillParams({
      area: areaName,
      level: defaultLevel
    });
    setActiveTabIntent('alerts');
  }, []);

  // Compute live KPI aggregates from one unified source of truth
  const kpis = useMemo(() => {
    const activeAlertsCount = store.floodAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'ESCALATED' || a.status === 'ASSIGNED').length;
    const suspectedBlockagesCount = store.drainNodes.filter(d => d.blockagePct >= 25 && d.operationalStatus !== 'CLEARED').length;
    const onlineNodesCount = store.drainNodes.filter(d => d.operationalStatus !== 'OFFLINE').length;
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

  const recallRescueTeam = useCallback((teamId) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: 'AVAILABLE', etaMinutes: null, target: null, assignedTargetId: null } : t)
    }));
    addActivity('RESCUE_RECALLED', `Recalled team ${teamId} to standby depot.`);
    showToast(`Team ${teamId} recalled to base.`);
  }, [addActivity, showToast]);

  const cycleTeamStatus = useCallback((teamId, newStatus) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: newStatus } : t)
    }));
    addActivity('TEAM_STATUS_UPDATE', `Updated team ${teamId} status to ${newStatus}.`);
    showToast(`Team ${teamId} set to ${newStatus}.`);
  }, [addActivity, showToast]);

  const reassignRescueTeam = useCallback((teamId, newZone) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, zone: newZone, status: 'DISPATCHED', etaMinutes: 8 } : t)
    }));
    addActivity('RESCUE_REASSIGNED', `Reassigned team ${teamId} to new zone: ${newZone}.`);
    showToast(`Team ${teamId} reassigned to ${newZone}.`);
  }, [addActivity, showToast]);

  const contextValue = {
    // State
    floodAlerts: store.floodAlerts,
    drainNodes: store.drainNodes,
    rescueTeams: store.rescueTeams,
    reliefCamps: store.reliefCamps,
    riskZones: store.riskZones,
    broadcastHistory: store.broadcastHistory,
    lastDispatchedBroadcast: store.lastDispatchedBroadcast,
    activityLog: store.activityLog,
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

    // Assignment & Failover Actions
    assignTeamToAlert,
    assignWorkerToBlockage,
    reassignUnit,
    markTeamOnScene,
    markAlertResolved,
    markDrainCleared,
    simulateSensorFailure,
    restorePrimarySensor,
    simulateBlockageSpike,

    // Team operations
    recallRescueTeam,
    cycleTeamStatus,
    reassignRescueTeam,

    // Legacy/Existing Actions
    acknowledgeAlert,
    escalateAlert,
    resolveAlert: markAlertResolved,
    dispatchRescueTeam: assignTeamToAlert,
    openReliefCamp,
    closeReliefCamp,
    updateCampOccupancy,
    requestCampSupplies,
    dispatchInspectionCrew,
    markDrainUnderMaintenance,
    requestDrainRecheck,
    toggleDrainMute,
    stageTeamAtRiskZone,
    openCampForRiskZone,
    markZoneSecured,
    dispatchCitizenBroadcast,
    clearBroadcastHistory,
    triggerSendAlertForArea
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
