import React, { useState, useEffect, useRef } from 'react';
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
    dispatchRescueTeam,
    recallRescueTeam,
    reassignRescueTeam,
    cycleTeamStatus,
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
    triggerSendAlertForArea
  } = useFloodGuard();

  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Interactive UI State for Overlays
  const [activeDrawer, setActiveDrawer] = useState(null); // 'alerts' | 'blockages' | 'nodes' | 'teams' | 'camps' | 'activity'
  const [activeZoneModal, setActiveZoneModal] = useState(null);
  const [reassignTeamModal, setReassignTeamModal] = useState(null);
  const [selectedZoneTeam, setSelectedZoneTeam] = useState('');
  const [selectedZoneCamp, setSelectedZoneCamp] = useState('');
  const [newReassignZone, setNewReassignZone] = useState('');

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
  };  const filteredNodes = (drainNodes || []).filter(node => {
    if (filterStatus === 'ALL') return true;
    return node.status === filterStatus;
  });

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

      {/* SECTION 2: FIVE CLEAN TABS (No horizontal scroll, fully responsive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '8px',
        background: 'var(--bg-secondary)',
        padding: '6px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)'
      }}>
        {[
          { id: 'overview', label: '1. Overview', desc: 'Summary & Map' },
          { id: 'drain-monitoring', label: '2. Drain Monitoring', desc: 'Sensor Readings' },
          { id: 'alerts', label: '3. Alerts', desc: 'Flood Alert Center' },
          { id: 'rescue-relief', label: '4. Rescue & Relief', desc: 'Teams & Shelters' },
          { id: 'offline-lora', label: '5. Offline & LoRa', desc: 'Comms Health' },
          { id: 'maintenance', label: '6. Maintenance', desc: 'Flood & Drain Upkeep' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                background: isActive ? 'var(--gov-blue-700)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                border: 'none',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
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
              14 IoT Sensing Nodes &bull; Last synchronized: <strong>{lastUpdated}</strong>
            </div>
          </div>

          {/* 5 Core Interactive KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px'
          }}>
            {/* KPI 1: Active Flood Alerts */}
            <button
              onClick={() => setActiveDrawer('alerts')}
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
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-critical)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeAlertsCount} Active
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {floodAlerts.filter(a => a.status === 'ACTIVE').length} Inundation alerts &bull; Click to action &rarr;
              </div>
            </button>

            {/* KPI 2: Suspected Blockages */}
            <button
              onClick={() => setActiveDrawer('blockages')}
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
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
                {kpis.blockagesCount} Blockages
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Sediment &amp; silt restrictions &bull; Click to clear &rarr;
              </div>
            </button>

            {/* KPI 3: Drain Nodes Online */}
            <button
              onClick={() => setActiveDrawer('nodes')}
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
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gov-blue-700)', fontFamily: 'var(--font-mono)' }}>
                {drainNodes.length} / {drainNodes.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--status-normal)', fontWeight: 600 }}>
                100% telemetry online &bull; Click to inspect &rarr;
              </div>
            </button>

            {/* KPI 4: Rescue Teams Active */}
            <button
              onClick={() => setActiveDrawer('teams')}
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
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeRescueTeamsCount} Teams
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {rescueTeams.filter(t => t.status === 'ON SCENE').length} On Scene, {rescueTeams.filter(t => t.status === 'DISPATCHED').length} Dispatched &rarr;
              </div>
            </button>

            {/* KPI 5: Relief Camps Operating */}
            <button
              onClick={() => setActiveDrawer('camps')}
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
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--water-cyan-600)', fontFamily: 'var(--font-mono)' }}>
                {kpis.activeReliefCampsCount} Shelters
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {reliefCamps.reduce((acc, c) => acc + (c.occupancy || 0), 0)} / {reliefCamps.reduce((acc, c) => acc + (c.capacity || 0), 0)} Citizens &rarr;
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

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: filterStatus === s ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                    background: filterStatus === s ? 'var(--gov-blue-700)' : 'var(--bg-secondary)',
                    color: filterStatus === s ? '#FFFFFF' : 'var(--text-secondary)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    <button
                      onClick={() => dispatchInspectionCrew(node.id)}
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
                      aria-label={`Dispatch inspection crew to ${node.id}`}
                    >
                      Dispatch Crew
                    </button>

                    <button
                      onClick={() => {
                        markDrainUnderMaintenance(node.id);
                        setActiveTab('maintenance');
                      }}
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
                      aria-label={`Schedule clean-up for ${node.id}`}
                    >
                      Schedule Clean-up
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
                      onClick={() => triggerSendAlertForArea(node.location, () => setActiveTab('alerts'))}
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

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Assigned Area: <strong>{team.zone || 'Command Depot Reserve'}</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Personnel: <strong>{team.personnel}</strong> &bull; Equipment: {team.boats ? `${team.boats} Inflatable Boats` : `${team.ambulances || 1} Ambulances`}
                    </div>

                    {/* Action buttons with live simulated state machine */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {isStandbyOrAvail && (
                        <button
                          onClick={() => dispatchRescueTeam(team.id, team.zone || 'Critical Risk Basin', 10)}
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
                              setNewReassignZone(team.zone || '');
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
                      onClick={() => updateCampOccupancy(camp.id, 50)}
                      disabled={camp.status !== 'ACTIVE' || camp.occupancy >= camp.capacity}
                      style={{
                        padding: '3px 6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: (camp.status !== 'ACTIVE' || camp.occupancy >= camp.capacity) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +50
                    </button>

                    <button
                      onClick={() => updateCampOccupancy(camp.id, -50)}
                      disabled={camp.status !== 'ACTIVE' || camp.occupancy <= 0}
                      style={{
                        padding: '3px 6px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: (camp.status !== 'ACTIVE' || camp.occupancy <= 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      -50
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
                    <th style={{ padding: '10px 14px' }}>Link Quality</th>
                    <th style={{ padding: '10px 14px' }}>RSSI</th>
                    <th style={{ padding: '10px 14px' }}>SNR</th>
                    <th style={{ padding: '10px 14px' }}>Spreading Factor</th>
                    <th style={{ padding: '10px 14px' }}>Battery</th>
                    <th style={{ padding: '10px 14px' }}>Success Rate</th>
                    <th style={{ padding: '10px 14px' }}>Last Uplink</th>
                  </tr>
                </thead>
                <tbody>
                  {(loraData?.nodes || DRAIN_NODES).map(node => {
                    const isLost = node.linkQuality === 'LOST';
                    const isWeak = node.linkQuality === 'WEAK';
                    const linkColor = isLost ? '#EF4444' : isWeak ? '#F59E0B' : '#10B981';
                    const linkBg = isLost ? 'rgba(239, 68, 68, 0.15)' : isWeak ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';

                    return (
                      <tr key={node.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{node.id}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{node.location}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: linkBg,
                            color: linkColor,
                            border: `1px solid ${linkColor}40`
                          }}>
                            {node.linkQuality || 'GOOD'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <strong>{node.rssiDbm ?? -92} dBm</strong>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          {node.snrDb ? `${node.snrDb > 0 ? '+' : ''}${node.snrDb} dB` : '+6.5 dB'}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            {node.spreadingFactor || 'SF7'} (ADR)
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Battery size={13} color="var(--status-normal)" />
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{node.batteryPct ?? 92}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          {node.successRatePct ?? 98.5}%
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {node.lastUplinkSec ? `${Math.round(node.lastUplinkSec)}s ago` : '8s ago'}
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
                        openCampForRiskZone(activeZoneModal.id, selectedZoneCamp);
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
                    markZoneSecured(activeZoneModal.id);
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
              Current Area: <strong>{reassignTeamModal.zone}</strong>
            </p>

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
                onClick={() => {
                  reassignRescueTeam(reassignTeamModal.id, newReassignZone);
                  setReassignTeamModal(null);
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
          borderLeft: '4px solid #10B981',
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
          <CheckCircle2 size={16} color="#10B981" />
          <span>{toast}</span>
          <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 5px', borderRadius: '3px', marginLeft: '6px' }}>
            [SIMULATED]
          </span>
        </div>
      )}

    </div>
  );
}
