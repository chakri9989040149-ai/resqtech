import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  LogOut,
  Send,
  Wifi,
  WifiOff,
  Radio,
  CloudRain,
  Activity,
  Battery,
  AlertTriangle,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Volume2,
  Shield,
  ArrowRight,
  ChevronRight,
  Plus,
  Minus,
  Info,
  Users,
  Home,
  Droplets,
  Bell,
  Play,
  Check,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFloodGuard } from '../context/FloodGuardStore';
import OverviewCardDrawer from '../components/OverviewCardDrawer';
import GisMiniMap from '../components/GisMiniMap';
import { LoRaSimulationService, PACKET_SPEC } from '../services/loraSim';
import MaintenanceModule from '../components/MaintenanceModule';
import { MaintenanceSimulationService } from '../services/maintenanceSim';
import FloodAlertCenter from '../components/FloodAlertCenter';
import MultiAgentCoordinatorPanel from '../components/MultiAgentCoordinatorPanel';

const SHIPMENT_PROOFS = [
  {
    id: 'SHP-9041',
    item: '1,200 Packaged Meal Kits & Clean Water Cans',
    destination: 'Model High School Relief Camp (Ward 9)',
    deliveredAt: '25 mins ago',
    verifiedBy: 'Camp Administrator',
    sha256: 'sha256:9f8a...3b21',
    gpsLocation: '17.3850° N, 78.4867° E (Match 100%)',
    photoUrl: '/assets/images/drainage-sensor.jpg'
  }
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const {
    kpis,
    floodAlerts,
    drainNodes,
    rescueTeams,
    reliefCamps,
    riskZones,
    activityLog,
    toast,
    resetDemoData,
    activeDrawer,
    setActiveDrawer,
    activeTabIntent,
    setActiveTabIntent,
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
    dispatchInspectionCrew,
    markDrainUnderMaintenance,
    requestDrainRecheck,
    toggleDrainMute,
    stageTeamAtRiskZone,
    openCampForRiskZone,
    preEvacuateShelter,
    markZoneSecured,
    deployFloodBarriers,
    triggerSendAlertForArea,
    isOutageActive,
    loraQueue,
    toggleNetworkOutage,
    queueLoRaAlert,
    scheduledCampaigns,
    scheduleAwarenessCampaign,
    checkInShelter,
    checkOutShelter,
    dispatchRescueTeam,
    recallRescueTeam,
    cycleTeamStatus,
    reassignRescueTeam
  } = useFloodGuard();

  // Tab persistence via sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('sensaflow_active_tab') || sessionStorage.getItem('floodguard_active_tab') || 'overview';
  });

  useEffect(() => {
    sessionStorage.setItem('sensaflow_active_tab', activeTab);
  }, [activeTab]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // Tab 2 Drain Filter, Search & Sort
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [drainSearchTerm, setDrainSearchTerm] = useState('');
  const [drainSortBy, setDrainSortBy] = useState('blockage-desc');

  // Tab 4 Awareness Campaign Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    zone: 'Ward 4 (Riverside)',
    title: '',
    scheduledDate: 'Tomorrow, 10:00 AM',
    targetHouseholds: 1200,
    linkedAlertId: '',
    channel: 'Loudspeaker PA Van & SMS Alert'
  });
  const [campaignFormError, setCampaignFormError] = useState('');

  // Tab 5 Emergency LoRa Queue Form State
  const [isLoRaQueueModalOpen, setIsLoRaQueueModalOpen] = useState(false);
  const [loraQueueForm, setLoraQueueForm] = useState({
    zone: 'Ward 14 (Industrial Area)',
    message: 'EMERGENCY: River overflow cresting weir. Evacuate to Model High School immediately.'
  });

  // Handle cross-tab navigation intent
  useEffect(() => {
    if (activeTabIntent) {
      setActiveTab(activeTabIntent);
      setActiveTabIntent(null);
    }
  }, [activeTabIntent, setActiveTabIntent]);

  // Interactive UI State for Overlays
  const [activeZoneModal, setActiveZoneModal] = useState(null);
  const [reassignTeamModal, setReassignTeamModal] = useState(null);
  const [dispatchModalTeam, setDispatchModalTeam] = useState(null);
  const [dispatchZoneTarget, setDispatchZoneTarget] = useState('Urban Culvert Line C-8 (Ward 14)');
  const [onSceneReassignConfirmed, setOnSceneReassignConfirmed] = useState(false);
  const [selectedZoneTeam, setSelectedZoneTeam] = useState('');
  const [selectedZoneCamp, setSelectedZoneCamp] = useState('');
  const [newReassignZone, setNewReassignZone] = useState('');
  const [traceModalEntry, setTraceModalEntry] = useState(null);

  // LoRa Comms Simulation State
  const [loraData, setLoraData] = useState(null);
  const [loraLogs, setLoraLogs] = useState([]);
  const loraServiceRef = useRef(null);

  useEffect(() => {
    const service = new LoRaSimulationService(
      drainNodes || [],
      (data) => setLoraData(data),
      (log) => setLoraLogs(prev => [log, ...prev].slice(0, 50))
    );
    loraServiceRef.current = service;
    service.start();
    return () => service.stop();
  }, [drainNodes]);

  const handleToggleCellularOutage = () => {
    loraServiceRef.current?.toggleCellularOutage();
  };

  const handleToggleGatewayFailure = () => {
    loraServiceRef.current?.toggleGatewayFailure();
  };

  const handleToggleNodeOutOfRange = (nodeId = 'NODE-C-08') => {
    loraServiceRef.current?.toggleNodeOutOfRange(nodeId);
  };

  // Maintenance Simulation State
  const [maintenanceData, setMaintenanceData] = useState(null);
  const maintenanceServiceRef = useRef(null);

  useEffect(() => {
    const mService = new MaintenanceSimulationService((data) => setMaintenanceData(data));
    maintenanceServiceRef.current = mService;
    mService.start();
    return () => mService.stop();
  }, []);

  const handleScheduleMaintenanceJob = (job) => {
    maintenanceServiceRef.current?.scheduleJob(job);
  };

  const handleCompleteMaintenanceJob = (drainId) => {
    maintenanceServiceRef.current?.markMaintenanceComplete(drainId);
  };

  // Real browser online/offline status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const TABS_LIST = [
    { id: 'overview', label: '1. Overview', desc: 'Summary & Map' },
    { id: 'drain-monitoring', label: '2. Drain Monitoring', desc: 'Sensor Readings' },
    { id: 'alerts', label: '3. Alerts', desc: 'Flood Alert Center' },
    { id: 'rescue-relief', label: '4. Rescue & Relief', desc: 'Teams & Shelters' },
    { id: 'offline-lora', label: '5. Offline & LoRa', desc: 'Comms Health' },
    { id: 'maintenance', label: '6. Maintenance', desc: 'Flood & Drain Upkeep' }
  ];

  const handleTabKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % TABS_LIST.length;
      setActiveTab(TABS_LIST[nextIdx].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + TABS_LIST.length) % TABS_LIST.length;
      setActiveTab(TABS_LIST[prevIdx].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(TABS_LIST[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(TABS_LIST[TABS_LIST.length - 1].id);
    }
  };

  const filteredNodes = useMemo(() => {
    return (drainNodes || [])
      .filter(node => {
        if (filterStatus !== 'ALL' && node.status !== filterStatus) return false;
        if (drainSearchTerm.trim()) {
          const term = drainSearchTerm.toLowerCase();
          const matchesId = node.id?.toLowerCase().includes(term);
          const matchesName = node.name?.toLowerCase().includes(term);
          const matchesLoc = node.location?.toLowerCase().includes(term);
          const matchesZone = node.zone?.toLowerCase().includes(term);
          if (!matchesId && !matchesName && !matchesLoc && !matchesZone) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (drainSortBy === 'blockage-desc') return (b.blockagePct || 0) - (a.blockagePct || 0);
        if (drainSortBy === 'blockage-asc') return (a.blockagePct || 0) - (b.blockagePct || 0);
        if (drainSortBy === 'water-desc') {
          const wA = parseFloat(a.waterLevel) || 0;
          const wB = parseFloat(b.waterLevel) || 0;
          return wB - wA;
        }
        if (drainSortBy === 'severity') {
          const pMap = { CRITICAL: 3, WARNING: 2, NORMAL: 1 };
          return (pMap[b.status] || 0) - (pMap[a.status] || 0);
        }
        return a.id.localeCompare(b.id);
      });
  }, [drainNodes, filterStatus, drainSearchTerm, drainSortBy]);

  return (
    <div style={{
      maxWidth: '1360px',
      margin: '0 auto',
      padding: '24px 20px 60px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* SECTION 1: CLEAN HEADER & OFFICER BAR */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
              Command Dashboard
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'var(--status-normal-bg)',
              color: 'var(--status-normal)',
              border: '1px solid var(--status-normal-border)'
            }}>
              Active Session
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Logged in as <strong>{user?.name || 'Demo Officer'}</strong> &bull; {user?.designation || 'Disaster Response Coordinator'} ({user?.department || 'State Disaster Authority'})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Global Activity Log Drawer Trigger */}
          <button
            onClick={() => setActiveDrawer('activity')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            aria-label="Open Global Activity Log"
          >
            <Activity size={13} color="var(--gov-blue-700)" />
            <span>Activity Log ({activityLog?.length || 0})</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data (alerts, nodes, teams, camps) back to factory simulation defaults?')) {
                resetDemoData();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            aria-label="Reset all demo data"
          >
            <RotateCcw size={13} />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>{lastUpdated}</span>
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-critical-bg)',
              color: 'var(--status-critical)',
              border: '1px solid var(--status-critical-border)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: SIX CLEAN TABS (Accessible tablist with arrow keys & persistence) */}
      <div
        role="tablist"
        aria-label="SensaFlow Command Center Tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '8px',
          background: 'var(--bg-secondary)',
          padding: '6px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        {TABS_LIST.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-button-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                background: isActive ? 'var(--gov-blue-700)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                border: 'none',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{tab.label}</div>
              <div style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.6 }}>{tab.desc}</div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Strip */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isOnline ? 'var(--status-normal)' : 'var(--status-critical)',
                boxShadow: isOnline ? '0 0 6px var(--status-normal)' : 'none'
              }} />
              <span>
                System Status: <strong style={{ color: isOnline ? 'var(--status-normal)' : 'var(--status-critical)' }}>
                  {isOnline ? 'Online — Real-time telemetry feed active' : 'Offline — Operating from local cache'}
                </strong>
              </span>
            </div>

            <div style={{ color: 'var(--text-muted)' }}>
              {kpis.onlineNodesCount} / {kpis.totalNodesCount} IoT Sensing Nodes Online &bull; Last synchronized: <strong>{lastUpdated}</strong>
            </div>
          </div>

          {/* SensaFlow Multi-Agent Coordinator (Simulated Autonomous 5-Agent Cooperative Engine) */}
          <MultiAgentCoordinatorPanel />

          {/* 5 Core Interactive KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}>
            {/* KPI 1: Active Flood Alerts */}
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrawer('alerts')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveDrawer('alerts');
                }
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderLeft: '4px solid var(--status-critical)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              aria-label="Open Active Flood Alerts drawer to dispatch rescue teams or open camps"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Active Flood Alerts
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-critical)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeAlertsCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {kpis.activeAlertsCount} Inundation alerts active &bull; Click to action &rarr;
              </div>
            </button>

            {/* KPI 2: Suspected Blockages */}
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrawer('blockages')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveDrawer('blockages');
                }
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderLeft: '4px solid var(--status-warning)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              aria-label="Open Suspected Blockages drawer to dispatch crews or mark cleared"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Suspected Blockages
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
                {kpis.suspectedBlockagesCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Sediment &amp; silt restrictions &bull; Click to clear &rarr;
              </div>
            </button>

            {/* KPI 3: Drain Nodes Online */}
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrawer('nodes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveDrawer('nodes');
                }
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderLeft: '4px solid var(--gov-blue-700)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              aria-label="Open Drain Nodes Online drawer to inspect telemetry and link health"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Drain Nodes Online
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
                {kpis.onlineNodesCount} / {kpis.totalNodesCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--status-normal)', fontWeight: 600 }}>
                100% telemetry online &bull; Click to inspect &rarr;
              </div>
            </button>

            {/* KPI 4: Rescue Teams Active */}
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrawer('teams')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveDrawer('teams');
                }
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderLeft: '4px solid #10B981',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              aria-label="Open Rescue Teams drawer to recall or reassign emergency units"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Rescue Teams Active
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeTeamsCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {rescueTeams.filter(t => t.status === 'ON SCENE').length} On Scene, {rescueTeams.filter(t => t.status === 'DISPATCHED').length} Dispatched &rarr;
              </div>
            </button>

            {/* KPI 5: Relief Camps Operating */}
            <button
              type="button"
              role="button"
              tabIndex={0}
              onClick={() => setActiveDrawer('camps')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveDrawer('camps');
                }
              }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderLeft: '4px solid var(--water-cyan-600)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              aria-label="Open Relief Camps drawer to adjust capacity or request supplies"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Relief Camps Operating
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--water-cyan-600)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeCampsCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {kpis.totalCampOccupancy} / {kpis.totalCampCapacity} Citizens sheltered &rarr;
              </div>
            </button>
          </div>

          {/* Two-Column Section: Live Weather Card & Live Node Map */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            
            {/* Live Weather Card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudRain size={20} color="var(--gov-blue-700)" />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Catchment Weather Conditions</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Real-time telemetry via Open-Meteo API</p>
                  </div>
                </div>
                <span style={{ fontSize: '10px', background: 'var(--gov-blue-50)', color: 'var(--gov-blue-700)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  LIVE FEED
                </span>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rainfall Intensity</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-critical)', fontFamily: 'var(--font-mono)' }}>
                    42.0 mm/h
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--status-warning)', fontWeight: 600 }}>Heavy Precipitation</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Surface Temperature</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    26.8 °C
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Humidity: 94%</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Wind Velocity</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    24 km/h (SW)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24-Hr Cumulative Rain</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    118 mm
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>Hydro Impact:</strong> Saturated upper catchment run-off is accelerating water levels in low-lying stormwater channels.
              </div>
            </div>

            {/* Interactive GIS Node Map */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Monitoring Grid &amp; Risk Map</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click any node on the map to inspect live water depth and blockage index</p>
              </div>
              <GisMiniMap maintenanceDrains={maintenanceData?.drains || []} />

              {/* Quick Node Selector (Selecting list item highlights its node on map) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Select node to highlight on GIS Map:
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--gov-blue-700)', fontWeight: 600 }}>
                    Active: <strong>{selectedMapNodeId}</strong>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                  {(drainNodes || []).map(node => {
                    const isSelected = selectedMapNodeId === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedMapNodeId(node.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--gov-blue-700)' : 'var(--border-medium)'}`,
                          background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                          color: isSelected ? 'var(--gov-blue-700)' : 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{node.id.replace('NODE-', '')}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: node.blockagePct >= 60 ? '#EF4444' : node.blockagePct >= 25 ? '#F59E0B' : '#10B981',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {node.blockagePct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: LIVE ACTIVITY & DISPATCH JOURNAL */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--gov-blue-700)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Live Incident &amp; Activity Journal</h3>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                  [SIMULATED AUDIT]
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer('activity')}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--gov-blue-700)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                View Full Audit Log ({activityLog?.length || 0}) &rarr;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {(activityLog || []).slice(0, 3).map(entry => (
                <div
                  key={entry.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gov-blue-700)' }}>{entry.action}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{entry.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{entry.details}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(entry.isAgent || entry.actor === 'Coordinator Agent') && (
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
                          🤖 AGENT
                        </span>
                      )}
                      <span>{entry.actor} &bull; <span style={{ color: '#3B82F6' }}>{entry.tag}</span></span>
                    </div>

                    {(entry.isAgent || entry.actor === 'Coordinator Agent') && (
                      <button
                        type="button"
                        onClick={() => setTraceModalEntry(entry)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                      >
                        Why did agent do this? &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DRAIN MONITORING
         ========================================================================= */}
      {activeTab === 'drain-monitoring' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Drain Monitoring &amp; Blockage Status</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Real-time readings from ultrasonic level sensors, acoustic silt detectors, and rain gauges with plain-language diagnostic reasons.
              </p>
            </div>

            {/* Search, Filter & Sort Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {/* Search input */}
              <input
                type="text"
                placeholder="Search drains by ID, name or zone..."
                value={drainSearchTerm}
                onChange={(e) => setDrainSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  minWidth: '200px'
                }}
              />

              {/* Status Filter buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: filterStatus === s ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                      background: filterStatus === s ? 'var(--gov-blue-700)' : 'var(--bg-secondary)',
                      color: filterStatus === s ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Sort by Severity Dropdown */}
              <select
                value={drainSortBy}
                onChange={(e) => setDrainSortBy(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="blockage-desc">Sort: Blockage (High to Low)</option>
                <option value="blockage-asc">Sort: Blockage (Low to High)</option>
                <option value="water-desc">Sort: Water Level (High to Low)</option>
                <option value="severity">Sort: Severity (Critical First)</option>
                <option value="name">Sort: Node ID (A-Z)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNodes.length === 0 ? (
              <div style={{
                padding: '36px',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-medium)',
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}>
                No drain monitoring nodes match your search and filter criteria.
              </div>
            ) : null}
            {filteredNodes.map(node => {
              const isCritical = node.status === 'CRITICAL';
              const isWarning = node.status === 'WARNING';
              const borderColor = isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-normal)';

              return (
                <div
                  key={node.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderLeft: `5px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{node.id}</span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{node.location}</h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(() => {
                        const loraNode = loraData?.nodes?.find(n => n.id === node.id);
                        if (!loraNode) return null;
                        const isLost = loraNode.linkQuality === 'LOST';
                        const isWeak = loraNode.linkQuality === 'WEAK';
                        return (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isLost ? 'rgba(239, 68, 68, 0.15)' : isWeak ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isLost ? '#EF4444' : isWeak ? '#F59E0B' : '#10B981',
                            border: `1px solid ${isLost ? 'rgba(239, 68, 68, 0.35)' : isWeak ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Radio size={12} />
                            Link: {loraNode.linkQuality} ({loraNode.rssiDbm} dBm)
                          </span>
                        );
                      })()}

                      {(() => {
                        const mDrain = maintenanceData?.drains?.find(d => d.id === node.id);
                        if (!mDrain) return null;
                        const mColor = mDrain.status === 'OVERDUE' ? '#EF4444' : mDrain.status === 'DUE SOON' ? '#F59E0B' : '#10B981';
                        return (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: `${mColor}15`,
                            color: mColor,
                            border: `1px solid ${mColor}35`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Wrench size={11} />
                            Maintenance: {mDrain.status}
                          </span>
                        );
                      })()}

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isCritical ? 'var(--status-critical-bg)' : isWarning ? 'var(--status-warning-bg)' : 'var(--status-normal-bg)',
                        color: isCritical ? 'var(--status-critical)' : isWarning ? 'var(--status-warning)' : 'var(--status-normal)'
                      }}>
                        {node.status}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const loraNode = loraData?.nodes?.find(n => n.id === node.id);
                    if (loraNode?.linkQuality === 'LOST') {
                      return (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 10px',
                          color: '#EF4444',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <AlertTriangle size={14} />
                          <span>LORA COMMS LOST — Transceiver out of range or gateway unreachable. Maintenance alert raised.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Telemetry numbers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    background: 'var(--bg-primary)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Water Level: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{node.waterLevel}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Flow Velocity: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{node.flowRate}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Rain Intensity: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{node.rainfall}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Blockage Index: </span>
                      <strong style={{ color: isCritical ? 'var(--status-critical)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {node.blockagePct}
                      </strong>
                    </div>
                  </div>

                  {/* Dual-Sensor Telemetry Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '8px',
                    background: 'var(--bg-primary)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)'
                  }}>
                    {/* Primary Sensor */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>PRIMARY SENSOR</span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: node.primarySensor?.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: node.primarySensor?.status === 'FAILED' ? '#EF4444' : '#10B981'
                        }}>
                          {node.primarySensor?.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {node.primarySensor?.name || 'Ultrasonic Stage Sensor'}
                      </div>
                      <div style={{ fontSize: '10px', color: node.primarySensor?.status === 'FAILED' ? '#EF4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Reading: {node.primarySensor?.reading || node.waterLevel}
                      </div>
                    </div>

                    {/* Backup Sensor */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>BACKUP SENSOR</span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: node.sensorHealth === 'BACKUP_ACTIVE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: node.sensorHealth === 'BACKUP_ACTIVE' ? '#3B82F6' : 'var(--text-muted)'
                        }}>
                          {node.backupSensor?.status || 'STANDBY'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {node.backupSensor?.name || 'Hydrostatic Pressure Transducer'}
                      </div>
                      <div style={{ fontSize: '10px', color: node.sensorHealth === 'BACKUP_ACTIVE' ? '#3B82F6' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {node.sensorHealth === 'BACKUP_ACTIVE' ? '⚡ Dual-Sensor Failover Active' : 'Hot-Spare Standby'}
                      </div>
                    </div>

                    {/* Assigned Worker Info */}
                    <div style={{ gridColumn: '1 / -1', paddingTop: '4px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Assigned Response Worker: <strong style={{ color: node.assignedWorker ? '#3B82F6' : '#F59E0B' }}>{node.assignedWorker || 'Unassigned — Desilting Pending'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Plain language explanation */}
                  <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    <strong>Diagnostic Reason:</strong> {node.reason}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gov-blue-700)', fontWeight: 600 }}>
                    Recommended Action: {node.action}
                  </div>

                  {/* Interactive Action Strip for Drain Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    {/* Failover Simulation Button */}
                    {node.primarySensor?.status !== 'FAILED' ? (
                      <button
                        onClick={() => simulateSensorFailure(node.id)}
                        style={{
                          padding: '5px 10px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#EF4444',
                          cursor: 'pointer'
                        }}
                        aria-label={`Simulate primary sensor failure on ${node.id}`}
                      >
                        Simulate Primary Failure
                      </button>
                    ) : (
                      <button
                        onClick={() => restorePrimarySensor(node.id)}
                        style={{
                          padding: '5px 10px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#10B981',
                          cursor: 'pointer'
                        }}
                        aria-label={`Restore primary sensor on ${node.id}`}
                      >
                        Restore Primary Sensor
                      </button>
                    )}

                    {/* Spike Blockage Button */}
                    <button
                      onClick={() => simulateBlockageSpike(node.id, 88)}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#EF4444',
                        cursor: 'pointer'
                      }}
                      aria-label={`Simulate sudden blockage spike on ${node.id}`}
                    >
                      ⚡ Spike Blockage (88%)
                    </button>

                    <button
                      onClick={() => assignWorkerToBlockage(node.id)}
                      style={{
                        padding: '5px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      aria-label={`Dispatch or reassign cleaning crew for ${node.id}`}
                    >
                      {node.assignedWorker ? 'Reassign Worker' : 'Dispatch Worker'}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMapNodeId(node.id);
                        setActiveTab('overview');
                      }}
                      style={{
                        padding: '5px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--gov-blue-700)',
                        cursor: 'pointer'
                      }}
                      aria-label={`Highlight ${node.id} on GIS map`}
                    >
                      View on Map
                    </button>

                    <button
                      onClick={() => markDrainCleared(node.id)}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#10B981',
                        cursor: 'pointer'
                      }}
                      aria-label={`Mark obstruction cleared for ${node.id}`}
                    >
                      Mark Cleared
                    </button>

                    <button
                      onClick={() => triggerSendAlertForArea(node.location, 'DANGER')}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#EF4444',
                        cursor: 'pointer'
                      }}
                      aria-label={`Raise flood alert for ${node.location}`}
                    >
                      Raise Alert
                    </button>

                    <button
                      onClick={() => toggleDrainMute(node.id)}
                      style={{
                        padding: '5px 10px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: node.muted ? '#EF4444' : 'var(--text-muted)',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                      aria-label={node.muted ? `Unmute alerts for ${node.id}` : `Mute alerts for ${node.id}`}
                    >
                      {node.muted ? 'Unmute Telemetry' : 'Mute Sensor'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ALERTS - FLOOD ALERT & CITIZEN WARNING CENTER
         ========================================================================= */}
      {activeTab === 'alerts' && (
        <FloodAlertCenter
          drainNodes={drainNodes}
          forecastRainfall={maintenanceData?.forecast?.summary24h?.expectedRainMm || 48}
        />
      )}

      {/* =========================================================================
          TAB 4: RESCUE AND RELIEF
         ========================================================================= */}
      {activeTab === 'rescue-relief' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Critical Priority Flood-Risk Zones: High Contrast & Clickable Action Panels */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderLeft: '5px solid #EF4444',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#EF4444" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Critical Priority Flood-Risk Zones (Severe Blockage &gt;60% + Heavy Rain Forecast)
                </h3>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, background: '#EF4444', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px' }}>
                46.2 mm STORM IMMINENT &bull; CLICK ANY ZONE TO ACT
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Click any zone card below to open its tactical action panel: stage rescue teams, pre-evacuate shelters, dispatch inspection crews, or deploy flood barriers.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {(riskZones || []).map(zone => (
                <button
                  key={zone.id}
                  onClick={() => {
                    setActiveZoneModal(zone);
                    setSelectedZoneTeam(rescueTeams.find(t => t.status === 'AVAILABLE' || t.status === 'STANDBY')?.id || '');
                    setSelectedZoneCamp(reliefCamps[0]?.id || '');
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderLeft: `5px solid ${zone.isSecured ? '#10B981' : '#EF4444'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  aria-label={`Open tactical action panel for ${zone.name}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      {/* HIGH CONTRAST WCAG AA COMPLIANT TEXT */}
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {zone.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                        {zone.ward}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: zone.isSecured ? '#10B981' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                        {zone.blockagePct}% Blocked
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: zone.isSecured ? '#10B981' : '#DC2626',
                        background: zone.isSecured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${zone.isSecured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {zone.isSecured ? 'ZONE SECURED' : 'HIGH INUNDATION RISK'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Action Status Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                    {zone.stagedTeamId && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        🛡️ Team {zone.stagedTeamId} Staged
                      </span>
                    )}
                    {zone.openedCampId && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        ⛺ Shelter {zone.openedCampId} Opened
                      </span>
                    )}
                    {zone.alertSent && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        📢 Citizen Alert Dispatched
                      </span>
                    )}
                    {zone.crewDispatched && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        👷 Inspection Crew Dispatched
                      </span>
                    )}
                    {zone.isSecured && (
                      <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 5px', borderRadius: '3px' }}>
                        ✅ Barriers Deployed
                      </span>
                    )}
                    {!zone.stagedTeamId && !zone.openedCampId && !zone.alertSent && !zone.crewDispatched && !zone.isSecured && (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Click to select actions &rarr;</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rescue Teams Section with Live Status Counters & Interactive Actions */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Field Rescue Team Deployments</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Status of emergency mobilization crews in flood zones</p>
              </div>

              {/* Live Count Status Summary Bar */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Available: {rescueTeams.filter(t => t.status === 'AVAILABLE' || t.status === 'STANDBY').length}
                </span>
                <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  Dispatched: {rescueTeams.filter(t => t.status === 'DISPATCHED').length}
                </span>
                <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  On Scene: {rescueTeams.filter(t => t.status === 'ON SCENE').length}
                </span>
                <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  Returning: {rescueTeams.filter(t => t.status === 'RETURNING').length}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {(rescueTeams || []).map(team => {
                const isOnScene = team.status === 'ON SCENE';
                const isDispatched = team.status === 'DISPATCHED';
                const isReturning = team.status === 'RETURNING';
                const isStandbyOrAvail = team.status === 'STANDBY' || team.status === 'AVAILABLE';

                return (
                  <div
                    key={team.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{team.name}</div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isOnScene ? 'var(--status-critical-bg)' : isDispatched ? 'rgba(245, 158, 11, 0.15)' : isReturning ? 'rgba(59, 130, 246, 0.15)' : 'var(--status-normal-bg)',
                        color: isOnScene ? 'var(--status-critical)' : isDispatched ? '#F59E0B' : isReturning ? '#3B82F6' : 'var(--status-normal)'
                      }}>
                        {team.status} {team.etaMinutes ? `(ETA ${team.etaMinutes}m)` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Role: </span>
                        <strong style={{ color: 'var(--gov-blue-700)' }}>{team.role || 'Flood Evacuation'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Workload: </span>
                        <strong style={{ color: (team.workload || (isStandbyOrAvail ? 0 : 1)) > 1 ? '#EF4444' : 'var(--text-primary)' }}>
                          {team.workload ?? (isStandbyOrAvail ? 0 : 1)} active task{(team.workload || (isStandbyOrAvail ? 0 : 1)) === 1 ? '' : 's'}
                        </strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Current Task: </span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {team.target || (isStandbyOrAvail ? 'Standby at Depot Reserve' : 'Deploying to Flood Basin')}
                        </strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Assigned Location: <strong>{team.zone || team.location || 'Command Depot Reserve'}</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Personnel: <strong>{team.personnel}</strong> &bull; Equipment: <strong>{team.equipment || (team.type === 'MEDICAL' ? `${team.ambulances || 2} Critical Care Ambulances` : (team.boats ? `${team.boats} Inflatable Boats` : 'Specialized Municipal Rig'))}</strong>
                    </div>

                    {/* Action buttons with live simulated state machine */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {isStandbyOrAvail && (
                        <button
                          onClick={() => {
                            setDispatchModalTeam(team);
                            setDispatchZoneTarget(team.zone || 'Urban Culvert Line C-8 (Ward 14)');
                          }}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--gov-blue-700)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Dispatch Team
                        </button>
                      )}

                      {(isDispatched || isOnScene) && (
                        <>
                          <button
                            onClick={() => recallRescueTeam(team.id)}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            Recall
                          </button>
                          <button
                            onClick={() => {
                              setReassignTeamModal(team);
                              setNewReassignZone(team.zone || 'Ward 14 (Industrial Area Basin)');
                              setOnSceneReassignConfirmed(false);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            Reassign Zone
                          </button>
                        </>
                      )}

                      {isReturning && (
                        <button
                          onClick={() => cycleTeamStatus(team.id, 'STANDBY')}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Standby
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Relief Camps & Shipment Delivery Proofs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            
            {/* Relief Camps Occupancy with Interactive Controls */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Designated Relief Shelters</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Live occupancy, supply days, and operational activation</p>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                  {reliefCamps.filter(c => c.status === 'ACTIVE').length} Active
                </span>
              </div>

              {(reliefCamps || []).map(camp => (
                <div key={camp.id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{camp.name}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ward: {camp.ward}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: camp.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: camp.status === 'ACTIVE' ? '#10B981' : '#64748B'
                      }}>
                        {camp.status}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
                        {camp.occupancy} / {camp.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (camp.occupancy / camp.capacity) * 100)}%`, height: '100%', background: camp.occupancy >= camp.capacity ? '#EF4444' : 'var(--gov-blue-700)' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Food: {camp.foodDays} Days &bull; Water: {camp.waterDays} Days</span>
                    <span style={{ fontWeight: 600, color: camp.medicalStatus === 'SUPPLIED' ? '#10B981' : '#F59E0B' }}>
                      Med: {camp.medicalStatus}
                    </span>
                  </div>

                  {/* Interactive Shelter Actions Strip */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => camp.status === 'ACTIVE' ? closeReliefCamp(camp.id) : openReliefCamp(camp.id)}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: camp.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                        cursor: 'pointer'
                      }}
                    >
                      {camp.status === 'ACTIVE' ? 'Close Camp' : 'Open Camp'}
                    </button>

                    <button
                      onClick={() => checkInShelter(camp.id, 50)}
                      disabled={camp.status !== 'ACTIVE' || camp.occupancy >= camp.capacity}
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#10B981',
                        cursor: (camp.status !== 'ACTIVE' || camp.occupancy >= camp.capacity) ? 'not-allowed' : 'pointer'
                      }}
                      aria-label={`Check in 50 evacuees to ${camp.name}`}
                    >
                      Check in (+50)
                    </button>

                    <button
                      onClick={() => checkOutShelter(camp.id, 50)}
                      disabled={camp.status !== 'ACTIVE' || camp.occupancy <= 0}
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#EF4444',
                        cursor: (camp.status !== 'ACTIVE' || camp.occupancy <= 0) ? 'not-allowed' : 'pointer'
                      }}
                      aria-label={`Check out 50 citizens from ${camp.name}`}
                    >
                      Check out (-50)
                    </button>

                    <button
                      onClick={() => requestCampSupplies(camp.id, 'food')}
                      style={{
                        padding: '3px 6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      +Food
                    </button>

                    <button
                      onClick={() => requestCampSupplies(camp.id, 'water')}
                      style={{
                        padding: '3px 6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      +Water
                    </button>

                    <button
                      onClick={() => requestCampSupplies(camp.id, 'medical')}
                      style={{
                        padding: '3px 6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      +Med
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipment Delivery Proof Photos */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Verified Supply Delivery Proofs</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tamper-evident photographic delivery confirmation</p>
              </div>

              {SHIPMENT_PROOFS.map(proof => (
                <div key={proof.id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{proof.item}</strong>
                    <span style={{ fontSize: '10px', background: 'var(--status-normal-bg)', color: 'var(--status-normal)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      ✓ VERIFIED PROOF
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>To: {proof.destination}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>GPS: {proof.gpsLocation}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Hash: {proof.sha256}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preventive Awareness Campaign Scheduling Section */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Preventive Awareness &amp; Evacuation Campaigns</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Pre-monsoon and storm mobilization drives: loudspeaker vans, community drills, and direct SMS alerts for high-risk wards.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCampaignForm({
                    zone: 'Ward 4 (Riverside)',
                    title: '',
                    scheduledDate: 'Tomorrow, 10:00 AM',
                    targetHouseholds: 1200,
                    linkedAlertId: '',
                    channel: 'Loudspeaker PA Van & SMS Alert'
                  });
                  setCampaignFormError('');
                  setIsCampaignModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gov-blue-700)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Schedule Campaign</span>
              </button>
            </div>

            {/* Campaign Cards List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              {(scheduledCampaigns || []).length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}>
                  No awareness campaigns currently scheduled. Click above to schedule a pre-flood campaign.
                </div>
              ) : (
                scheduledCampaigns.map(camp => (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {camp.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {camp.zone}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {camp.status || 'SCHEDULED'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Channel: <strong>{camp.channel}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                      <span>Target: <strong>{camp.targetHouseholds} households</strong></span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{camp.scheduledDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule Campaign Modal */}
          {isCampaignModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Schedule Preventive Awareness Campaign</h3>
                  <button
                    onClick={() => setIsCampaignModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {campaignFormError && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {campaignFormError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Zone / Ward:</label>
                    <select
                      value={campaignForm.zone}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, zone: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Ward 4 (Riverside)">Ward 4 (Riverside Lowlands)</option>
                      <option value="Ward 14 (Industrial Area)">Ward 14 (Industrial Area)</option>
                      <option value="Ward 9 (Commercial Sector)">Ward 9 (Commercial Sector)</option>
                      <option value="Ward 11 (Market Road Catchment)">Ward 11 (Market Road Catchment)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Campaign Title &amp; Objective:</label>
                    <input
                      type="text"
                      placeholder="e.g. Flash Flood Evacuation Drill & PA Announcements"
                      value={campaignForm.title}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, title: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Scheduled Date / Time:</label>
                      <input
                        type="text"
                        value={campaignForm.scheduledDate}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Households:</label>
                      <input
                        type="number"
                        value={campaignForm.targetHouseholds}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, targetHouseholds: Number(e.target.value) || 0 }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Broadcast &amp; Outreach Channel:</label>
                    <select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, channel: e.target.value }))}
                      style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Loudspeaker PA Van & SMS Alert">Loudspeaker PA Van & SMS Alert</option>
                      <option value="Door-to-Door Relief Volunteer Drill">Door-to-Door Relief Volunteer Drill</option>
                      <option value="WhatsApp Community Flood Advisory">WhatsApp Community Flood Advisory</option>
                      <option value="Siren Testing & Shelter Walkthrough">Siren Testing & Shelter Walkthrough</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={() => setIsCampaignModalOpen(false)}
                    style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!campaignForm.title.trim()) {
                        setCampaignFormError('Please provide a campaign title.');
                        return;
                      }
                      scheduleAwarenessCampaign(campaignForm);
                      setIsCampaignModalOpen(false);
                    }}
                    style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--gov-blue-700)', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Confirm &amp; Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: OFFLINE AND LORA COMMS
         ========================================================================= */}
      {activeTab === 'offline-lora' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Network Outage & LoRa Fallback Status Banner */}
          <div style={{
            background: isOutageActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isOutageActive ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderLeft: `5px solid ${isOutageActive ? '#EF4444' : '#10B981'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: isOutageActive ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOutageActive ? <Radio size={16} /> : <CheckCircle2 size={16} />}
                <span>{isOutageActive ? 'OUTAGE ACTIVE: LoRa Mesh Fallback Engaged' : 'Primary Cellular Network Operational'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isOutageActive
                  ? 'Simulated cellular blackout active. All drain telemetry sensors have fallen back to sub-GHz LoRa mesh radio.'
                  : 'Cellular 4G IoT backhaul connected. Sub-GHz LoRa mesh transceivers in hot-standby for emergency failover.'}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNetworkOutage}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isOutageActive ? '#10B981' : '#EF4444',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isOutageActive ? 'Restore Cellular Network' : '⚡ Simulate Network Outage'}
            </button>
          </div>

          {/* Header Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Offline Resilience &amp; LoRa Comms</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  How the platform keeps monitoring and transmitting during cellular and power outages using a long-range, low-power LoRa mesh.
                </p>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                SIMULATED DATA
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              {/* Left Card: Real Browser Network State (IndexedDB) */}
              <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isOnline ? <Wifi size={20} color="var(--status-normal)" /> : <WifiOff size={20} color="var(--status-critical)" />}
                  <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Browser Network State</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Status: <strong>{isOnline ? 'Online (Connected to Internet)' : 'Offline (Disconnected)'}</strong>. When disconnected, field incident reports and inspections automatically queue in local browser IndexedDB.
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Queued Outbox Items: <strong>0 pending sync</strong>
                </div>
              </div>

              {/* Right Card: LoRa Long-Range Uplink */}
              <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={20} color="var(--gov-blue-700)" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700 }}>LoRa Long-Range Uplink</h3>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gov-blue-700)', background: 'var(--gov-blue-50)', padding: '2px 8px', borderRadius: '4px' }}>
                    SUB-GHZ MESH
                  </span>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  For remote areas lacking 4G, each drain sensor node (ESP32 + LoRa transceiver) sends compact binary telemetry over license-free sub-GHz radio to a nearby LoRa gateway. The gateway forwards data to the command centre over whatever backhaul is available (cellular, Wi-Fi or wired), and buffers it locally if the backhaul is down.
                </p>

                {/* Packet Spec Box (Monospace) */}
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--bg-primary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)'
                }}>
                  <div><strong>Band:</strong> 865-867 MHz (India licence-free ISM) &nbsp;|&nbsp; <strong>Modulation:</strong> LoRa CSS</div>
                  <div><strong>Packet Size:</strong> 24 Bytes &nbsp;|&nbsp; <strong>Frequency:</strong> every 60 s (normal), every 10 s (CRITICAL)</div>
                  <div><strong>Typical range:</strong> 2-5 km urban, up to 10+ km line-of-sight</div>
                </div>

                {/* Packet Structure Breakdown */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Binary Packet Structure (24 Bytes Payload):
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {PACKET_SPEC.map(item => (
                      <span
                        key={item.field}
                        title={item.desc}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <strong style={{ color: 'var(--gov-blue-700)' }}>{item.field}</strong> ({item.bytes})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SIMULATED LORA HEALTH PANEL */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--gov-blue-700)" />
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Simulated LoRa Gateway &amp; Mesh Telemetry Health</h3>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.35)'
              }}>
                SIMULATED DATA
              </span>
            </div>

            {/* Gateway High-Level KPI Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {/* Gateway Status */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gateway Status (GW-HYD-01)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: loraData?.gateway?.status === 'ONLINE' ? 'var(--status-normal)' : 'var(--status-critical)',
                    boxShadow: loraData?.gateway?.status === 'ONLINE' ? '0 0 6px var(--status-normal)' : 'none'
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: loraData?.gateway?.status === 'ONLINE' ? 'var(--status-normal)' : 'var(--status-critical)' }}>
                    {loraData?.gateway?.status || 'ONLINE'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Frequency: 866.5 MHz (ISM)
                </div>
              </div>

              {/* Gateway Backhaul */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gateway Backhaul</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: loraData?.gateway?.backhaul.includes('OFFLINE') ? '#EF4444' : 'var(--gov-blue-700)', marginTop: '4px' }}>
                  {loraData?.gateway?.backhaul || 'CELLULAR'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {loraData?.gateway?.bufferedPackets > 0 
                    ? `Flash Buffer: ${loraData?.gateway?.bufferedPackets} packets queued`
                    : 'Direct uplink to Command Cloud'}
                </div>
              </div>

              {/* Nodes Online */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mesh Nodes Online</div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {loraData?.nodesOnline ?? 4} of {loraData?.totalNodes ?? 4}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Battery-powered sub-GHz transceivers
                </div>
              </div>

              {/* Packet Success Counter */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Packets (Sent / Recv / Lost)</div>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {loraData?.counters?.packetsSentToday ?? 14280} / {loraData?.counters?.packetsReceivedToday ?? 13994} / <span style={{ color: '#EF4444' }}>{loraData?.counters?.packetsLostToday ?? 286}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Packet Error Rate: ~2.0% (Adaptive CSS)
                </div>
              </div>
            </div>

            {/* Per-Node Health Telemetry Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Node ID &amp; Location</th>
                    <th style={{ padding: '10px 14px' }}>Comms Status</th>
                    <th style={{ padding: '10px 14px' }}>Link Quality</th>
                    <th style={{ padding: '10px 14px' }}>Signal Strength (RSSI)</th>
                    <th style={{ padding: '10px 14px' }}>Battery</th>
                    <th style={{ padding: '10px 14px' }}>Protocol</th>
                    <th style={{ padding: '10px 14px' }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {(drainNodes || []).map(node => {
                    const loraNode = loraData?.nodes?.find(n => n.id === node.id);
                    const isLost = loraNode?.linkQuality === 'LOST' || node.commsStatus === 'OFFLINE';
                    const isLoRa = isOutageActive || node.commsStatus === 'LORA_FALLBACK';
                    
                    const commsLabel = isOutageActive ? 'LoRa Fallback' : (node.commsStatus || 'Online');
                    const commsColor = isLost ? '#EF4444' : isLoRa ? '#F59E0B' : '#10B981';
                    const commsBg = isLost ? 'rgba(239, 68, 68, 0.15)' : isLoRa ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';

                    return (
                      <tr key={node.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{node.id}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{node.location}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: commsBg,
                            color: commsColor,
                            border: `1px solid ${commsColor}40`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isLoRa ? <Radio size={12} /> : <Wifi size={12} />}
                            {commsLabel}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isLost ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isLost ? '#EF4444' : '#10B981'
                          }}>
                            {loraNode?.linkQuality || node.linkQuality || 'GOOD'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <strong>{loraNode?.rssiDbm ?? node.rssiDbm ?? -78} dBm</strong>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Battery size={13} color="var(--status-normal)" />
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{node.battery ?? 95}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '11px' }}>
                            {isLoRa ? 'Sub-GHz (866 MHz)' : 'Cellular 4G/LTE-M'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                          {node.lastSeen || 'Just now'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FAULT TESTING CONTROLS */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800 }}>Demo Fault Injection &amp; Resilience Controls</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to test real-time failover and local flash buffering</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {/* Toggle 1: Cellular Outage */}
                <button
                  type="button"
                  onClick={handleToggleCellularOutage}
                  style={{
                    background: loraData?.faults?.cellularOutage ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-primary)',
                    border: `1px solid ${loraData?.faults?.cellularOutage ? '#EF4444' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: loraData?.faults?.cellularOutage ? '#EF4444' : 'var(--text-primary)' }}>
                      1. Simulate Cellular Outage
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: loraData?.faults?.cellularOutage ? '#EF4444' : 'var(--text-muted)' }}>
                      {loraData?.faults?.cellularOutage ? 'ACTIVE' : 'NORMAL'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Switches gateway to local flash buffer; flushes when restored.
                  </span>
                </button>

                {/* Toggle 2: Gateway Failure */}
                <button
                  type="button"
                  onClick={handleToggleGatewayFailure}
                  style={{
                    background: loraData?.faults?.gatewayFailure ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-primary)',
                    border: `1px solid ${loraData?.faults?.gatewayFailure ? '#EF4444' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: loraData?.faults?.gatewayFailure ? '#EF4444' : 'var(--text-primary)' }}>
                      2. Simulate Gateway Failure
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: loraData?.faults?.gatewayFailure ? '#EF4444' : 'var(--text-muted)' }}>
                      {loraData?.faults?.gatewayFailure ? 'ACTIVE' : 'NORMAL'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Gateway shuts down; all node links show LOST and trigger alert.
                  </span>
                </button>

                {/* Toggle 3: Node Out of Range */}
                <button
                  type="button"
                  onClick={() => handleToggleNodeOutOfRange('NODE-C-08')}
                  style={{
                    background: loraData?.faults?.nodeOutOfRange === 'NODE-C-08' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-primary)',
                    border: `1px solid ${loraData?.faults?.nodeOutOfRange === 'NODE-C-08' ? '#F59E0B' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: loraData?.faults?.nodeOutOfRange === 'NODE-C-08' ? '#F59E0B' : 'var(--text-primary)' }}>
                      3. Node C-08 Out of Range
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: loraData?.faults?.nodeOutOfRange === 'NODE-C-08' ? '#F59E0B' : 'var(--text-muted)' }}>
                      {loraData?.faults?.nodeOutOfRange === 'NODE-C-08' ? 'ACTIVE' : 'NORMAL'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Culvert C-08 signal drops; flagged LOST on Drain Monitoring tab.
                  </span>
                </button>
              </div>
            </div>

            {/* Scrolling Telemetry Event Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>LoRa Telemetry Event Stream</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sub-GHz 865-867 MHz</span>
              </div>

              <div style={{
                height: '140px',
                overflowY: 'auto',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {loraLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>Listening for incoming LoRa packet telemetry...</div>
                ) : (
                  loraLogs.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{entry.timestamp}]</span>
                      <span style={{
                        color: entry.type === 'critical' ? '#EF4444' : entry.type === 'warning' ? '#F59E0B' : entry.type === 'action' ? '#10B981' : 'var(--text-secondary)'
                      }}>
                        {entry.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Emergency LoRa Broadcast Alert Queue */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Radio size={14} color="var(--gov-blue-700)" />
                    <span>Emergency LoRa Broadcast Queue ({loraQueue?.length || 0})</span>
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Sub-GHz 865-867 MHz out-of-band emergency broadcast packets for cellular blackout regions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLoRaQueueModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--gov-blue-700)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>Queue Emergency LoRa Alert</span>
                </button>
              </div>

              {/* LoRa Queue Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>Packet ID</th>
                      <th style={{ padding: '8px 12px' }}>Target Zone</th>
                      <th style={{ padding: '8px 12px' }}>Emergency Broadcast Content</th>
                      <th style={{ padding: '8px 12px' }}>Comms Status</th>
                      <th style={{ padding: '8px 12px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loraQueue || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No pending packets in LoRa emergency transmission buffer.
                        </td>
                      </tr>
                    ) : (
                      loraQueue.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {item.id}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                            {item.payload?.zone || item.zone || 'Catchment Basin'}
                          </td>
                          <td style={{ padding: '8px 12px', maxWidth: '320px' }}>
                            {item.payload?.message || item.message || 'Emergency inundation broadcast.'}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              {item.status === 'SENT_VIA_LORA' ? 'SENT VIA LORA' : (item.status || 'QUEUED')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {item.timestamp}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Queue Emergency Alert Modal */}
            {isLoRaQueueModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  maxWidth: '460px',
                  width: '100%',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={16} color="var(--gov-blue-700)" />
                      <span>Queue Emergency Broadcast Packet</span>
                    </h3>
                    <button
                      onClick={() => setIsLoRaQueueModalOpen(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Catchment / Zone:</label>
                      <input
                        type="text"
                        value={loraQueueForm.zone}
                        onChange={(e) => setLoraQueueForm(prev => ({ ...prev, zone: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>LoRa Emergency Packet Message (Max 120 chars):</label>
                      <textarea
                        rows={3}
                        maxLength={120}
                        value={loraQueueForm.message}
                        onChange={(e) => setLoraQueueForm(prev => ({ ...prev, message: e.target.value }))}
                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none' }}
                      />
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>
                        {loraQueueForm.message.length} / 120 chars (Optimized for Sub-GHz ISM Band)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => setIsLoRaQueueModalOpen(false)}
                      style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (loraQueueForm.message.trim()) {
                          queueLoRaAlert(loraQueueForm);
                          setIsLoRaQueueModalOpen(false);
                        }
                      }}
                      style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--gov-blue-700)', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Transmit via LoRa &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: MAINTENANCE (FLOOD & DRAIN UPKEEP)
         ========================================================================= */}
      {activeTab === 'maintenance' && (
        <MaintenanceModule
          maintenanceData={maintenanceData}
          onScheduleJob={handleScheduleMaintenanceJob}
          onCompleteJob={handleCompleteMaintenanceJob}
        />
      )}

      {/* =========================================================================
          SHARED OVERVIEW CARD DRAWER
         ========================================================================= */}
      {activeDrawer && (
        <OverviewCardDrawer
          drawerType={activeDrawer}
          onClose={() => setActiveDrawer(null)}
          onSwitchTab={(tabId) => {
            setActiveDrawer(null);
            setActiveTab(tabId);
          }}
        />
      )}

      {/* =========================================================================
          CRITICAL RISK ZONE ACTION MODAL
         ========================================================================= */}
      {activeZoneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderLeft: `5px solid ${activeZoneModal.isSecured ? '#10B981' : '#EF4444'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: activeZoneModal.isSecured ? '#10B981' : '#EF4444',
                  background: activeZoneModal.isSecured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {activeZoneModal.isSecured ? 'ZONE SECURED' : 'CRITICAL PRIORITY INUNDATION ZONE'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-primary)' }}>
                  {activeZoneModal.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {activeZoneModal.ward} &bull; Channel {activeZoneModal.area || activeZoneModal.id}
                </div>
              </div>

              <button
                onClick={() => setActiveZoneModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                aria-label="Close action modal"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              background: 'var(--bg-secondary)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Blockage Index:</span>
                <div style={{ fontWeight: 800, fontSize: '14px', color: activeZoneModal.isSecured ? '#10B981' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                  {activeZoneModal.blockagePct}%
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Water Stage:</span>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {activeZoneModal.waterLevel || '2.40 m'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rain Intensity:</span>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {activeZoneModal.rainfall || '48 mm/hr'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Choose a tactical emergency action for this zone:
            </div>

            {/* Tactical Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Action 1: Stage Rescue Team */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>1. Stage Rescue Team</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deploy unit on standby at this perimeter</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    value={selectedZoneTeam}
                    onChange={(e) => setSelectedZoneTeam(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {rescueTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedZoneTeam) {
                        stageTeamAtRiskZone(activeZoneModal.id, selectedZoneTeam);
                        setActiveZoneModal(null);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      background: 'var(--gov-blue-700)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Stage Team
                  </button>
                </div>
              </div>

              {/* Action 2: Pre-evacuate / Open Relief Camp */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>2. Pre-evacuate / Open Relief Camp</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Activate nearby evacuation shelter</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    value={selectedZoneCamp}
                    onChange={(e) => setSelectedZoneCamp(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {reliefCamps.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.status})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedZoneCamp) {
                        preEvacuateShelter(activeZoneModal.id, selectedZoneCamp);
                        setActiveZoneModal(null);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Open Shelter
                  </button>
                </div>
              </div>

              {/* Action 3: Send Flood Alert for this zone */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>3. Send Citizen Flood Alert</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pre-fill multi-channel broadcast for this zone</div>
                </div>
                <button
                  onClick={() => {
                    triggerSendAlertForArea(activeZoneModal.name, () => setActiveTab('alerts'));
                    setActiveZoneModal(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Send Flood Alert &rarr;
                </button>
              </div>

              {/* Action 4: Dispatch Inspection Crew */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>4. Dispatch Inspection Crew</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobilize desilting vacuum crew</div>
                </div>
                <button
                  onClick={() => {
                    dispatchInspectionCrew(activeZoneModal.id);
                    setActiveZoneModal(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Dispatch Crew
                </button>
              </div>

              {/* Action 5: Mark Zone Secured */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>5. Mark Zone Secured</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deploy flood barriers and confirm drainage flow</div>
                </div>
                <button
                  onClick={() => {
                    deployFloodBarriers(activeZoneModal.id);
                    setActiveZoneModal(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#10B981',
                    cursor: 'pointer'
                  }}
                >
                  Mark Secured
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DISPATCH RESCUE / DRAINAGE TEAM MODAL (PART 4)
         ========================================================================= */}
      {dispatchModalTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Dispatch {dispatchModalTeam.name}
              </h3>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(13, 148, 136, 0.15)', color: '#0D9488' }}>
                {dispatchModalTeam.type}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Equipment Payload: <strong>{dispatchModalTeam.equipment}</strong>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Select Target Municipal Risk Zone:
              </label>
              <select
                value={dispatchZoneTarget}
                onChange={(e) => setDispatchZoneTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="Urban Culvert Line C-8 (Ward 14)">Urban Culvert Line C-8 (Ward 14)</option>
                <option value="River Basin Weir Gate (Ward 4)">River Basin Weir Gate (Ward 4)</option>
                <option value="Market Road Arterial Storm Drain (Ward 9)">Market Road Arterial Storm Drain (Ward 9)</option>
                <option value="Central Underpass Pumping Sump (Ward 11)">Central Underpass Pumping Sump (Ward 11)</option>
                <option value="Metro Rail Viaduct Storm Trench (Ward 4)">Metro Rail Viaduct Storm Trench (Ward 4)</option>
              </select>
            </div>

            {/* Equipment & Incident Matching Check */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Rapid Response Transit:</span>
                <strong style={{ color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
                  {dispatchZoneTarget.includes('Ward 14') ? '5 mins' : (dispatchZoneTarget.includes('Ward 4') ? '4 mins' : '7 mins')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Capability Fit:</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  {dispatchModalTeam.type === 'CLEANING' ? '✅ Specialized Drainage Equipment' : '✅ Floodwater Evacuation Certified'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={() => setDispatchModalTeam(null)}
                style={{
                  padding: '6px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const calculatedEta = dispatchZoneTarget.includes('Ward 14') ? 5 : (dispatchZoneTarget.includes('Ward 4') ? 4 : 7);
                  dispatchRescueTeam(dispatchModalTeam.id, dispatchZoneTarget, calculatedEta);
                  setDispatchModalTeam(null);
                }}
                style={{
                  padding: '6px 14px',
                  background: 'var(--gov-blue-700)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REASSIGN RESCUE TEAM MODAL
         ========================================================================= */}
      {reassignTeamModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Reassign {reassignTeamModal.name}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Current Area: <strong>{reassignTeamModal.zone}</strong> &bull; Status: <strong>{reassignTeamModal.status}</strong>
            </p>

            {reassignTeamModal.status === 'ON SCENE' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '6px', padding: '10px', fontSize: '11px', color: '#EF4444' }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>⚠️ UNIT IS CURRENTLY ON SCENE</div>
                <div>This unit is actively engaged in on-scene operations. Reassignment will pull them from their live post.</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={onSceneReassignConfirmed}
                    onChange={(e) => setOnSceneReassignConfirmed(e.target.checked)}
                  />
                  I confirm pulling and reassigning this On-Scene unit
                </label>
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Select New Target Zone:
              </label>
              <select
                value={newReassignZone}
                onChange={(e) => setNewReassignZone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="Ward 4 (Riverside Lowlands)">Ward 4 (Riverside Lowlands)</option>
                <option value="Ward 14 (Industrial Area Basin)">Ward 14 (Industrial Area Basin)</option>
                <option value="Ward 9 (Commercial Sector)">Ward 9 (Commercial Sector)</option>
                <option value="Urban Culvert Line C-8">Urban Culvert Line C-8</option>
                <option value="Central Underpass Pumping Sump">Central Underpass Pumping Sump</option>
                <option value="Metro Rail Viaduct Storm Trench">Metro Rail Viaduct Storm Trench</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={() => setReassignTeamModal(null)}
                style={{
                  padding: '6px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={reassignTeamModal.status === 'ON SCENE' && !onSceneReassignConfirmed}
                onClick={() => {
                  reassignRescueTeam(reassignTeamModal.id, newReassignZone);
                  setReassignTeamModal(null);
                }}
                style={{
                  padding: '6px 14px',
                  background: (reassignTeamModal.status === 'ON SCENE' && !onSceneReassignConfirmed) ? 'var(--text-muted)' : 'var(--gov-blue-700)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: (reassignTeamModal.status === 'ON SCENE' && !onSceneReassignConfirmed) ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GLOBAL TOAST NOTIFICATION
         ========================================================================= */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2000,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#FFFFFF',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderLeft: `4px solid ${toast?.type === 'error' ? '#EF4444' : '#10B981'}`,
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          animation: 'slideUp 0.2s ease-out'
        }}>
          {toast?.type === 'error' ? (
            <AlertTriangle size={16} color="#EF4444" />
          ) : (
            <CheckCircle2 size={16} color="#10B981" />
          )}
          <span>{typeof toast === 'string' ? toast : toast?.message}</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 5px', borderRadius: '3px', marginLeft: '6px' }}>
            [SIMULATED]
          </span>
        </div>
      )}

      {/* Perceive-to-Report Trace Audit Dialog for Activity Journal */}
      {traceModalEntry && (
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
          onClick={() => setTraceModalEntry(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              maxWidth: '600px',
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
                  Action: {traceModalEntry.action} &bull; {traceModalEntry.timestamp}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTraceModalEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#0D9488' }}>1. PERCEIVE:</strong> Sentinel detected telemetry anomaly from IoT drainage sensor baseline.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#D97706' }}>2. REASON:</strong> Triage evaluated multi-criteria risk (severity, population density, rainfall rate). Priority score: <strong>92/100</strong>.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#2563EB' }}>3. PLAN:</strong> Evaluated proximity, capability, and double-booking avoidance. Selected top-scoring candidate resource.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#4F46E5' }}>4. ACT:</strong> {traceModalEntry.details}
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#059669' }}>5. VERIFY:</strong> Steward confirmed state transition and synchronized store counters across all 6 tabs.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <strong style={{ color: '#7C3AED' }}>6. REPORT:</strong> Recorded immutable auditable entry to Activity Log marked with 🤖 AGENT badge.
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setTraceModalEntry(null)}
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
