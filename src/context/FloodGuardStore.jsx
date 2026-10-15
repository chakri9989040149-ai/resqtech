import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const FloodGuardContext = createContext(null);
const STORAGE_KEY = 'floodguard_master_store_v2';

// Initial Seeds
const INITIAL_FLOOD_ALERTS = [
  {
    id: 'ALT-FL-01',
    title: 'Flash Inundation Warning — Lowland River Overflow',
    zone: 'River Basin Weir Gate (Ward 4)',
    severity: 'CRITICAL',
    waterLevel: '3.42 m (88%)',
    rainfall: '48 mm/hr',
    status: 'ACTIVE',
    assignedTeamId: 'TEAM-01',
    openedCampId: 'CAMP-01',
    citizenNotified: true,
    timestamp: '12m ago',
    riskReason: 'Sustained precipitation upstream causing weir overflow into residential pocket.'
  },
  {
    id: 'ALT-FL-02',
    title: 'Severe Urban Backflow & Stormwater Obstruction',
    zone: 'Urban Culvert Line C-8 (Ward 14)',
    severity: 'CRITICAL',
    waterLevel: '2.85 m (87%)',
    rainfall: '48 mm/hr',
    status: 'ACTIVE',
    assignedTeamId: null,
    openedCampId: null,
    citizenNotified: false,
    timestamp: '25m ago',
    riskReason: 'Culvert trash rack obstructed with 87% silt and debris; street water rising.'
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
    openedCampId: null,
    citizenNotified: false,
    timestamp: '1h ago',
    riskReason: 'Dual submersible pump operating near peak capacity; runoff approaching barrier.'
  }
];

const INITIAL_DRAIN_NODES = [
  {
    id: 'NODE-C-08',
    name: 'Culvert Line C-8',
    location: 'Urban Culvert Line C-8 (Industrial Sector)',
    zone: 'Ward 14 (Industrial Area)',
    waterLevel: '2.85 m',
    flowRate: '0.4 m/s',
    rainfall: '48 mm/hr',
    status: 'CRITICAL',
    blockagePct: 87,
    reason: 'Heavy silt sedimentation and plastic waste trapped against trash rack, causing rapid backflow.',
    action: 'Mobilize mechanical vacuum desilter crew immediately.',
    battery: 92,
    linkQuality: 'EXCELLENT',
    operationalStatus: 'BLOCKED',
    muted: false,
    lastReading: 'Just now'
  },
  {
    id: 'NODE-WZ-04',
    name: 'River Basin North Weir Gate',
    location: 'River Basin North Weir Gate',
    zone: 'Ward 4 (Riverside)',
    waterLevel: '3.42 m',
    flowRate: '1.8 m/s',
    rainfall: '42 mm/hr',
    status: 'WARNING',
    blockagePct: 15,
    reason: 'Water stage approaching crest warning threshold due to upstream runoff. Siphon gates operating normally.',
    action: 'Monitor crest progression; prepare secondary sluice gate opening.',
    battery: 88,
    linkQuality: 'GOOD',
    operationalStatus: 'NORMAL',
    muted: false,
    lastReading: '1 min ago'
  },
  {
    id: 'NODE-P-03',
    name: 'Central Underpass Sump',
    location: 'Central Underpass Pumping Sump',
    zone: 'Ward 11 (Market Road Catchment)',
    waterLevel: '1.94 m',
    flowRate: '1.2 m/s',
    rainfall: '38 mm/hr',
    status: 'WARNING',
    blockagePct: 42,
    reason: 'High inflow volume causing sump water accumulation. Dual submersible pumps active.',
    action: 'Deploy emergency barrier if sump exceeds 2.2m.',
    battery: 95,
    linkQuality: 'EXCELLENT',
    operationalStatus: 'BLOCKED',
    muted: false,
    lastReading: '2 mins ago'
  },
  {
    id: 'NODE-SB-12',
    name: 'Siphon Retention Basin East',
    location: 'Siphon Retention Basin East',
    zone: 'Ward 9 (Weir Colony)',
    waterLevel: '1.20 m',
    flowRate: '2.4 m/s',
    rainfall: '28 mm/hr',
    status: 'NORMAL',
    blockagePct: 4,
    reason: 'Clear stormwater channel. Water discharging into retention wetland at nominal rate.',
    action: 'Routine automated telemetry polling active.',
    battery: 97,
    linkQuality: 'EXCELLENT',
    operationalStatus: 'NORMAL',
    muted: false,
    lastReading: 'Just now'
  },
  {
    id: 'NODE-D-03',
    name: 'Market Road Arterial Drain',
    location: 'Market Road Arterial Storm Drain (Catchment D-03)',
    zone: 'Ward 9 (Commercial Sector)',
    waterLevel: '2.10 m',
    flowRate: '0.8 m/s',
    rainfall: '45 mm/hr',
    status: 'CRITICAL',
    blockagePct: 66,
    reason: 'Market stall organic waste and leaf litter accumulation restricting arterial culvert mouth.',
    action: 'Schedule emergency mechanical dredging.',
    battery: 84,
    linkQuality: 'GOOD',
    operationalStatus: 'BLOCKED',
    muted: false,
    lastReading: '3 mins ago'
  },
  {
    id: 'NODE-D-07',
    name: 'Metro Viaduct Storm Trench',
    location: 'Metro Rail Viaduct Storm Trench (Zone 11)',
    zone: 'Ward 4 (Metro Corridor)',
    waterLevel: '2.40 m',
    flowRate: '0.6 m/s',
    rainfall: '40 mm/hr',
    status: 'CRITICAL',
    blockagePct: 74,
    reason: 'Construction debris and silt backflow trapped in deep viaduct trench segment.',
    action: 'Dispatch desilting equipment before evening downpour.',
    battery: 79,
    linkQuality: 'EXCELLENT',
    operationalStatus: 'BLOCKED',
    muted: false,
    lastReading: '4 mins ago'
  }
];

const INITIAL_RESCUE_TEAMS = [
  {
    id: 'TEAM-01',
    name: 'Rescue Unit Alpha',
    zone: 'Ward 4 (Riverside)',
    status: 'ON SCENE',
    personnel: 6,
    boats: 2,
    ambulances: 0,
    etaMinutes: 0,
    target: 'River Basin North Weir Gate'
  },
  {
    id: 'TEAM-02',
    name: 'Rescue Unit Bravo',
    zone: 'Ward 14 (Industrial Area)',
    status: 'DISPATCHED',
    personnel: 4,
    boats: 1,
    ambulances: 0,
    etaMinutes: 12,
    target: 'Urban Culvert Line C-8'
  },
  {
    id: 'TEAM-03',
    name: 'Medical Response Cell',
    zone: 'Central Hospital Hub',
    status: 'STANDBY',
    personnel: 5,
    boats: 0,
    ambulances: 2,
    etaMinutes: null,
    target: null
  },
  {
    id: 'TEAM-04',
    name: 'Rapid Evacuation Squad',
    zone: 'Sector 4 Underpass',
    status: 'AVAILABLE',
    personnel: 8,
    boats: 3,
    ambulances: 1,
    etaMinutes: null,
    target: null
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
    crewDispatched: false,
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
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Officer (Disaster Response Coordinator)',
    action: 'RESCUE_DISPATCH',
    details: 'Dispatched Rescue Unit Bravo to Culvert C-8 (ETA 12m).',
    tag: '[SIMULATED]'
  },
  {
    id: 'ACT-002',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Officer (Disaster Response Coordinator)',
    action: 'CITIZEN_ALERT',
    details: 'Simulated DANGER broadcast sent to 3,770 residents in Ward 14 & Ward 4.',
    tag: '[SIMULATED]'
  },
  {
    id: 'ACT-003',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toLocaleTimeString(),
    actor: 'Demo Field Engineer',
    action: 'DRAIN_TELEMETRY',
    details: 'Acoustic blockage sensor flagged 87% silt sedimentation on Culvert C-8.',
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

  // =========================================================================
  // ACTIONS: FLOOD ALERTS
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

  const resolveAlert = useCallback((alertId) => {
    setStore(prev => ({
      ...prev,
      floodAlerts: prev.floodAlerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a)
    }));
    addActivity('ALERT_RESOLVED', `Resolved flood alert ${alertId}. Conditions stabilized.`);
    showToast(`Alert ${alertId} successfully marked as Resolved.`);
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: RESCUE TEAMS
  // =========================================================================
  const dispatchRescueTeam = useCallback((teamId, targetTitle, eta = 10, alertId = null) => {
    setStore(prev => {
      const updatedTeams = prev.rescueTeams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            status: 'DISPATCHED',
            etaMinutes: eta,
            target: targetTitle
          };
        }
        return t;
      });

      const updatedAlerts = alertId
        ? prev.floodAlerts.map(a => a.id === alertId ? { ...a, assignedTeamId: teamId } : a)
        : prev.floodAlerts;

      return {
        ...prev,
        rescueTeams: updatedTeams,
        floodAlerts: updatedAlerts
      };
    });

    addActivity('RESCUE_DISPATCH', `Dispatched team ${teamId} to ${targetTitle} (ETA ${eta}m).`);
    showToast(`Rescue team ${teamId} dispatched to ${targetTitle}!`);

    // Simulated arrival: Transition DISPATCHED -> ON SCENE after 8 seconds
    setTimeout(() => {
      setStore(prev => ({
        ...prev,
        rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: 'ON SCENE', etaMinutes: 0 } : t)
      }));
      addActivity('TEAM_ARRIVED', `Rescue team ${teamId} is now ON SCENE at ${targetTitle}.`);
      showToast(`Team ${teamId} is ON SCENE at ${targetTitle}.`);
    }, 8000);
  }, [addActivity, showToast]);

  const recallRescueTeam = useCallback((teamId) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: 'RETURNING', etaMinutes: 5 } : t)
    }));
    addActivity('RESCUE_RECALLED', `Recalled rescue team ${teamId} to base.`);
    showToast(`Rescue team ${teamId} recalled.`);

    setTimeout(() => {
      setStore(prev => ({
        ...prev,
        rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, status: 'STANDBY', etaMinutes: null, target: null } : t)
      }));
      addActivity('TEAM_STANDBY', `Rescue team ${teamId} returned and now on STANDBY.`);
    }, 5000);
  }, [addActivity, showToast]);

  const reassignRescueTeam = useCallback((teamId, newZone) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? { ...t, zone: newZone, status: 'DISPATCHED', etaMinutes: 8 } : t)
    }));
    addActivity('RESCUE_REASSIGNED', `Reassigned team ${teamId} to new zone: ${newZone}.`);
    showToast(`Team ${teamId} reassigned to ${newZone}.`);
  }, [addActivity, showToast]);

  const addTeamEquipment = useCallback((teamId, { personnel = 2, boats = 1, ambulances = 0 }) => {
    setStore(prev => ({
      ...prev,
      rescueTeams: prev.rescueTeams.map(t => t.id === teamId ? {
        ...t,
        personnel: t.personnel + personnel,
        boats: t.boats + boats,
        ambulances: t.ambulances + ambulances
      } : t)
    }));
    addActivity('EQUIPMENT_REINFORCED', `Reinforced team ${teamId} with +${personnel} personnel, +${boats} boats.`);
    showToast(`Team ${teamId} equipment reinforced.`);
  }, [addActivity, showToast]);

  // =========================================================================
  // ACTIONS: RELIEF CAMPS
  // =========================================================================
  const openReliefCamp = useCallback((campData) => {
    setStore(prev => {
      // Check if camp exists or is new
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

  // =========================================================================
  // ACTIONS: DRAIN NODES & BLOCKAGES
  // =========================================================================
  const dispatchInspectionCrew = useCallback((drainId) => {
    setStore(prev => ({
      ...prev,
      drainNodes: prev.drainNodes.map(d => d.id === drainId ? {
        ...d,
        operationalStatus: 'CREW_DISPATCHED',
        action: 'Inspection crew in transit. Desilting vehicle en route.'
      } : d),
      riskZones: prev.riskZones.map(z => z.id.includes(drainId.replace('NODE-', '')) ? {
        ...z,
        crewDispatched: true
      } : z)
    }));
    addActivity('CREW_DISPATCHED', `Dispatched hydraulic inspection crew to drain ${drainId}.`);
    showToast(`Inspection crew dispatched to ${drainId}!`);
  }, [addActivity, showToast]);

  const markDrainCleared = useCallback((drainId) => {
    setStore(prev => ({
      ...prev,
      drainNodes: prev.drainNodes.map(d => {
        if (d.id === drainId) {
          return {
            ...d,
            blockagePct: 4,
            status: 'NORMAL',
            operationalStatus: 'CLEARED',
            action: 'Culvert cleared; nominal stormwater discharge restored.'
          };
        }
        return d;
      }),
      riskZones: prev.riskZones.map(z => z.id.includes(drainId.replace('NODE-', '')) ? {
        ...z,
        blockagePct: 5,
        isSecured: true
      } : z),
      // Also mark related flood alert resolved if any
      floodAlerts: prev.floodAlerts.map(a => a.zone.includes(drainId.replace('NODE-', '')) ? { ...a, status: 'RESOLVED' } : a)
    }));
    addActivity('DRAIN_CLEARED', `Drain ${drainId} desilted and obstruction cleared. Blockage reduced to 4%.`);
    showToast(`Drain ${drainId} cleared! Blockage dropped to 4%.`);
  }, [addActivity, showToast]);

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

  // =========================================================================
  // ACTIONS: CRITICAL RISK ZONES
  // =========================================================================
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

  // =========================================================================
  // ACTIONS: CITIZEN BROADCAST DISPATCH & HISTORY
  // =========================================================================
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
      // Also update flood alerts status
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

      // Update risk zones
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

  // Jump to Alerts Tab with pre-filled content
  const triggerSendAlertForArea = useCallback((areaName, defaultLevel = 'DANGER') => {
    setAlertPrefillParams({
      area: areaName,
      level: defaultLevel
    });
    setActiveTabIntent('alerts');
  }, []);

  // Compute live KPI aggregates from shared store
  const kpis = useMemo(() => {
    const activeAlertsCount = store.floodAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'ESCALATED').length;
    const suspectedBlockagesCount = store.drainNodes.filter(d => d.blockagePct >= 25 && d.operationalStatus !== 'CLEARED').length;
    const onlineNodesCount = store.drainNodes.length;
    const activeTeamsCount = store.rescueTeams.filter(t => t.status === 'DISPATCHED' || t.status === 'ON SCENE').length;
    const activeCampsCount = store.reliefCamps.filter(c => c.status === 'ACTIVE').length;
    const totalCampCapacity = store.reliefCamps.reduce((acc, c) => acc + c.capacity, 0);
    const totalCampOccupancy = store.reliefCamps.reduce((acc, c) => acc + c.occupancy, 0);

    return {
      activeAlertsCount,
      suspectedBlockagesCount,
      onlineNodesCount,
      totalNodesCount: store.drainNodes.length,
      activeTeamsCount,
      totalTeamsCount: store.rescueTeams.length,
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
    riskZones: store.riskZones,
    broadcastHistory: store.broadcastHistory,
    lastDispatchedBroadcast: store.lastDispatchedBroadcast,
    activityLog: store.activityLog,
    kpis,
    toast,
    activeDrawer,
    activeTabIntent,
    alertPrefillParams,

    // Controls
    setActiveDrawer,
    setActiveTabIntent,
    setAlertPrefillParams,
    showToast,

    // Actions
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
