import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Eye,
  CheckCircle2,
  Send,
  Radio,
  MapPin,
  Users,
  Compass,
  Volume2,
  VolumeX,
  Share2,
  PhoneCall,
  Sparkles,
  Scissors,
  Check,
  Filter,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Globe,
  Download,
  Trash2,
  Clock
} from 'lucide-react';
import { useFloodGuard } from '../context/FloodGuardStore';
import {
  ALERT_LEVELS,
  AFFECTED_ZONES,
  RADIUS_OPTIONS,
  SMS_CONFIG,
  calculateSmsSegments,
  generateFloodMessage,
  evaluateSimulationTriggers,
  generateExtraChannels
} from '../services/alertEngine';

export default function FloodAlertCenter({ drainNodes = [], forecastRainfall = 48 }) {
  const {
    floodAlerts,
    rescueTeams,
    assignTeamToAlert,
    reassignUnit,
    markTeamOnScene,
    markAlertResolved,
    acknowledgeAlert,
    sendPublicAlertForInundation,
    showToast,
    broadcastHistory,
    lastDispatchedBroadcast,
    dispatchCitizenBroadcast,
    clearBroadcastHistory,
    alertPrefillParams,
    setAlertPrefillParams
  } = useFloodGuard();

  // Tab 3 Alert Incident Center States
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('ALL');
  const [alertStatusFilter, setAlertStatusFilter] = useState('ALL');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [assignModalAlert, setAssignModalAlert] = useState(null);
  const [manualTeamSelect, setManualTeamSelect] = useState('');
  const [reassignModalAlert, setReassignModalAlert] = useState(null);
  const [reassignTeamSelect, setReassignTeamSelect] = useState('');

  const availableRescueTeams = useMemo(() => {
    return (rescueTeams || []).filter(t => 
      (t.type === 'RESCUE' || !t.type) && (t.status === 'AVAILABLE' || t.status === 'STANDBY')
    );
  }, [rescueTeams]);

  const filteredFloodAlerts = useMemo(() => {
    return (floodAlerts || []).filter(alert => {
      if (alertSeverityFilter !== 'ALL' && alert.severity !== alertSeverityFilter) return false;
      if (alertStatusFilter !== 'ALL' && alert.status !== alertStatusFilter) return false;
      if (alertSearchTerm.trim()) {
        const term = alertSearchTerm.toLowerCase();
        const matchesZone = alert.zone?.toLowerCase().includes(term);
        const matchesTitle = alert.title?.toLowerCase().includes(term);
        const matchesId = alert.id?.toLowerCase().includes(term);
        if (!matchesZone && !matchesTitle && !matchesId) return false;
      }
      return true;
    });
  }, [floodAlerts, alertSeverityFilter, alertStatusFilter, alertSearchTerm]);

  // Alert level selection (WATCH | WARNING | DANGER | ALL_CLEAR)
  const [selectedLevel, setSelectedLevel] = useState('DANGER');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Custom edited text per language (if edited by officer)
  const [draftTexts, setDraftTexts] = useState({});
  const [isShortened, setIsShortened] = useState(false);

  // Targeting state
  const [selectedZones, setSelectedZones] = useState(['zone-w14', 'zone-w4']);
  const [selectedRadius, setSelectedRadius] = useState('1km');

  // Channel preview tab (public-feed | siren-pa | whatsapp)
  const [activeChannelTab, setActiveChannelTab] = useState('whatsapp');
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  // Dispatch Confirmation Modal & Loading
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState(null);

  // Filtering
  const [historyLevelFilter, setHistoryLevelFilter] = useState('ALL');
  const [historyLangFilter, setHistoryLangFilter] = useState('ALL');

  // Channel delivery animation state for unified board
  const [channelDeliveryState, setChannelDeliveryState] = useState('Delivered');

  useEffect(() => {
    if (!lastDispatchedBroadcast) return;
    setChannelDeliveryState('Queued');
    const t1 = setTimeout(() => setChannelDeliveryState('Sending'), 650);
    const t2 = setTimeout(() => setChannelDeliveryState('Delivered'), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastDispatchedBroadcast?.id]);

  // Consume pre-fill params from other tabs
  useEffect(() => {
    if (alertPrefillParams) {
      if (alertPrefillParams.level) {
        setSelectedLevel(alertPrefillParams.level);
      }
      if (alertPrefillParams.area) {
        // Find matching zone or default
        const matched = AFFECTED_ZONES.find(z =>
          alertPrefillParams.area.toLowerCase().includes(z.name.toLowerCase()) ||
          z.name.toLowerCase().includes(alertPrefillParams.area.toLowerCase())
        );
        if (matched) {
          setSelectedZones([matched.id]);
        }
      }
      setAlertPrefillParams(null);
    }
  }, [alertPrefillParams, setAlertPrefillParams]);

  // 1. Evaluate Live Simulation Trigger
  const triggerRecommendation = useMemo(() => {
    return evaluateSimulationTriggers(drainNodes, forecastRainfall);
  }, [drainNodes, forecastRainfall]);

  // Derived current area name from selected zones
  const targetAreaDisplay = useMemo(() => {
    if (selectedZones.length === 0) return 'City Lowland Drainage Basins';
    const names = selectedZones.map(id => AFFECTED_ZONES.find(z => z.id === id)?.name || id);
    return names.join(' & ');
  }, [selectedZones]);

  // Compute live current draft text based on level, language, and params
  const currentDraftText = useMemo(() => {
    const key = `${selectedLevel}_${selectedLanguage}_${isShortened ? 'short' : 'std'}`;
    if (draftTexts[key]) return draftTexts[key];

    return generateFloodMessage(
      selectedLevel,
      selectedLanguage,
      {
        area: targetAreaDisplay,
        level: triggerRecommendation.waterLevelPct || '87',
        rain: triggerRecommendation.forecastRainMm || '48',
        shelter: triggerRecommendation.nearestShelter || 'Govt High School Ward 4'
      },
      isShortened
    );
  }, [selectedLevel, selectedLanguage, isShortened, draftTexts, targetAreaDisplay, triggerRecommendation]);

  // Live SMS Telecom Metrics (Fixes 181/160 bug)
  const smsMetrics = useMemo(() => {
    return calculateSmsSegments(currentDraftText, selectedLanguage);
  }, [currentDraftText, selectedLanguage]);

  // Total recipient calculation based on zones and radius multiplier
  const totalRecipients = useMemo(() => {
    const radiusObj = RADIUS_OPTIONS.find(r => r.value === selectedRadius) || RADIUS_OPTIONS[0];
    const baseSum = selectedZones.reduce((acc, zoneId) => {
      const zone = AFFECTED_ZONES.find(z => z.id === zoneId);
      return acc + (zone ? zone.baseRecipients : 0);
    }, 0);
    return Math.round(baseSum * radiusObj.multiplier);
  }, [selectedZones, selectedRadius]);

  // Extra channels preview
  const extraChannels = useMemo(() => {
    return generateExtraChannels(selectedLevel, selectedLanguage, {
      area: targetAreaDisplay,
      level: triggerRecommendation.waterLevelPct || '87',
      rain: triggerRecommendation.forecastRainMm || '48',
      shelter: triggerRecommendation.nearestShelter || 'Govt High School Ward 4'
    });
  }, [selectedLevel, selectedLanguage, targetAreaDisplay, triggerRecommendation]);

  // Handle changing text in draft box
  const handleTextChange = (e) => {
    const newText = e.target.value;
    const key = `${selectedLevel}_${selectedLanguage}_${isShortened ? 'short' : 'std'}`;
    setDraftTexts(prev => ({ ...prev, [key]: newText }));
  };

  // Toggle Shorten message to fit single segment
  const handleToggleShorten = () => {
    setIsShortened(prev => !prev);
  };

  // One-click apply recommended alert from live simulation
  const handleApplyRecommendation = () => {
    setSelectedLevel(triggerRecommendation.recommendedLevel);
    setSelectedZones(triggerRecommendation.targetZoneIds);
    setIsShortened(false);
  };

  // Handle zone checkbox toggle
  const handleToggleZone = (zoneId) => {
    setSelectedZones(prev => {
      if (prev.includes(zoneId)) {
        return prev.filter(id => id !== zoneId);
      } else {
        return [...prev, zoneId];
      }
    });
  };

  // Relative time formatter helper
  const formatTimeAgo = (timestamp, fallback) => {
    if (!timestamp) return fallback || 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  };

  // Handle Dispatch Broadcast via master store
  const handleConfirmDispatch = async () => {
    setIsDispatching(true);
    try {
      // Small simulated transmission delay
      await new Promise(r => setTimeout(r, 450));

      const entry = dispatchCitizenBroadcast({
        level: selectedLevel,
        area: targetAreaDisplay,
        language: selectedLanguage,
        message: currentDraftText,
        recipients: totalRecipients,
        segments: smsMetrics.segmentCount,
        encoding: smsMetrics.encoding
      });

      setDispatchSuccessToast({
        transactionId: entry.id,
        count: entry.recipients,
        deliveryRate: entry.deliveryPct,
        time: new Date().toLocaleTimeString()
      });
      setShowConfirmModal(false);

      setTimeout(() => {
        setDispatchSuccessToast(null);
      }, 6000);
    } finally {
      setIsDispatching(false);
    }
  };

  // CSV Export for Broadcast Audit Logs
  const handleExportCsv = () => {
    if (filteredHistory.length === 0) return;
    const headers = 'ID,Alert Level,Target Area,Language,Encoding,Recipients,Delivery %,Timestamp\n';
    const rows = filteredHistory.map(item =>
      `"${item.id}","${item.level}","${item.area.replace(/"/g, '""')}","${item.language}","${item.encoding}","${item.recipients}","${item.deliveryPct}%","${new Date(item.timestamp || Date.now()).toISOString()}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `floodguard_broadcast_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Alert History from Master Store
  const filteredHistory = useMemo(() => {
    return (broadcastHistory || []).filter(item => {
      const matchLevel = historyLevelFilter === 'ALL' || item.level === historyLevelFilter;
      const matchLang = historyLangFilter === 'ALL' || item.language === historyLangFilter;
      return matchLevel && matchLang;
    });
  }, [broadcastHistory, historyLevelFilter, historyLangFilter]);

  const activeLevelMeta = ALERT_LEVELS[selectedLevel] || ALERT_LEVELS.WARNING;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* =========================================================================
          SECTION HEADER
         ========================================================================= */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Flood Alert &amp; Citizen Warning Center
            </h2>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#3B82F6',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              SIMULATED DATA
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
            Authoritative municipal cell broadcast and multi-channel flood warnings for citizen evacuation and emergency preparedness.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>National Disaster Cell &bull; Helpline: <strong>1070</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 3 REQUIREMENT: MUNICIPAL FLOOD ALERTS & INCIDENT RESPONSE CENTER
         ========================================================================= */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={20} color="#EF4444" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Active Flood Incidents &amp; Team Dispatch
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {filteredFloodAlerts.length} Incidents
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Live emergency telemetry alerts. Assign rescue teams, verify on-scene progression, broadcast citizen alerts, or mark resolved.
            </p>
          </div>

          <span style={{ fontSize: '10px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            [SIMULATED DISPATCH]
          </span>
        </div>

        {/* Filters and Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'var(--bg-secondary)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search alerts by zone, ID, or description..."
              value={alertSearchTerm}
              onChange={(e) => setAlertSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Severity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Severity:</span>
            {['ALL', 'CRITICAL', 'WARNING'].map(sev => (
              <button
                key={sev}
                type="button"
                onClick={() => setAlertSeverityFilter(sev)}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: alertSeverityFilter === sev ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                  background: alertSeverityFilter === sev ? 'var(--gov-blue-700)' : 'var(--bg-primary)',
                  color: alertSeverityFilter === sev ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {['ALL', 'NEW', 'ASSIGNED', 'ON SCENE', 'RESOLVED'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setAlertStatusFilter(st)}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: alertStatusFilter === st ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                  background: alertStatusFilter === st ? 'var(--gov-blue-700)' : 'var(--bg-primary)',
                  color: alertStatusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Flood Alert Cards List */}
        {filteredFloodAlerts.length === 0 ? (
          <div style={{
            padding: '36px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            No active flood alerts matching the specified criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFloodAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isResolved = alert.status === 'RESOLVED';
              const isOnScene = alert.status === 'ON SCENE';
              const isAssigned = alert.status === 'ASSIGNED';
              const isNew = alert.status === 'NEW';

              const cardBorder = isResolved
                ? '#10B981'
                : isCritical
                ? '#EF4444'
                : '#F59E0B';

              const assignedTeam = rescueTeams.find(t => t.id === alert.assignedTeamId);

              return (
                <div
                  key={alert.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderLeft: `5px solid ${cardBorder}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Top line: Title, ID, Time, Badges */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {alert.id}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {alert.title}
                        </h4>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--gov-blue-700)" />
                        <strong>{alert.zone}</strong> &bull; Reported: {alert.timestamp || 'Recent'}
                      </div>
                    </div>

                    {/* Badges strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Severity badge */}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isCritical ? '#EF4444' : '#F59E0B',
                        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                      }}>
                        {alert.severity}
                      </span>

                      {/* Status badge */}
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isResolved ? 'rgba(16, 185, 129, 0.15)' : isOnScene ? 'rgba(239, 68, 68, 0.15)' : isAssigned ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isResolved ? '#10B981' : isOnScene ? '#EF4444' : isAssigned ? '#3B82F6' : '#F59E0B',
                        border: '1px solid currentColor'
                      }}>
                        {alert.status}
                      </span>

                      {/* Public notified badge */}
                      {alert.citizenNotified && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#3B82F6',
                          border: '1px solid rgba(59, 130, 246, 0.35)'
                        }}>
                          📢 Public Notified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry and Reason details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                    background: 'var(--bg-primary)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Water Stage: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: isCritical ? '#EF4444' : 'var(--text-primary)' }}>
                        {alert.waterLevel}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Precipitation: </span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{alert.rainfall}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                      <strong>Risk Diagnosis:</strong> {alert.riskReason}
                    </div>
                  </div>

                  {/* Assigned Unit Status Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '8px 12px',
                    background: assignedTeam ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${assignedTeam ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Rescue Unit: </span>
                      <strong style={{ color: assignedTeam ? '#3B82F6' : '#F59E0B' }}>
                        {alert.assignedTeamName ? `${alert.assignedTeamName} (${alert.assignedTeamId})` : 'Unassigned — Needs Emergency Dispatch'}
                      </strong>
                      {assignedTeam && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          Status: <strong>{assignedTeam.status}</strong> &bull; Workload: <strong>{assignedTeam.workload || 1} tasks</strong>
                        </span>
                      )}
                    </div>
                    {alert.assignedAt && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Dispatched: {alert.assignedAt}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    {/* 1. Assign Team */}
                    {!isResolved && !alert.assignedTeamId && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalAlert(alert);
                          setManualTeamSelect('');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--gov-blue-700)',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Assign Team
                      </button>
                    )}

                    {/* 2. Reassign Team */}
                    {!isResolved && alert.assignedTeamId && (
                      <button
                        type="button"
                        onClick={() => {
                          setReassignModalAlert(alert);
                          setReassignTeamSelect('');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Reassign Team
                      </button>
                    )}

                    {/* 3. Acknowledge */}
                    {isNew && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#F59E0B',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Acknowledge
                      </button>
                    )}

                    {/* 4. Mark On Scene */}
                    {!isResolved && (isAssigned || alert.assignedTeamId) && !isOnScene && (
                      <button
                        type="button"
                        onClick={() => markTeamOnScene(alert.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          color: '#3B82F6',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark On Scene
                      </button>
                    )}

                    {/* 5. Mark Resolved */}
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => markAlertResolved(alert.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10B981',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark Resolved
                      </button>
                    )}

                    {/* 6. Send Public Alert */}
                    <button
                      type="button"
                      onClick={() => sendPublicAlertForInundation(alert.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#EF4444',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                    >
                      Send Public Alert
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ASSIGN RESCUE TEAM MODAL */}
        {assignModalAlert && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Assign Rescue Unit to Alert
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {assignModalAlert.id}: {assignModalAlert.title} ({assignModalAlert.zone})
                </p>
              </div>

              {availableRescueTeams.length === 0 ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  ⚠️ No rescue teams are currently free! All rescue units are dispatched or on scene. Free a team by marking an existing incident resolved or recall a unit.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Select Rescue Unit:
                  </label>
                  <select
                    value={manualTeamSelect}
                    onChange={(e) => setManualTeamSelect(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">⚡ Auto-assign best available team (nearest &amp; free)</option>
                    {availableRescueTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.role} ({t.zone}) &bull; {t.personnel} crew, {t.boats} boats
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Auto-assignment picks the closest standing rescue unit to {assignModalAlert.zone} and sets status to Dispatched.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAssignModalAlert(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={availableRescueTeams.length === 0}
                  onClick={() => {
                    assignTeamToAlert(assignModalAlert.id, manualTeamSelect || null);
                    setAssignModalAlert(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: availableRescueTeams.length === 0 ? 'var(--text-muted)' : 'var(--gov-blue-700)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: availableRescueTeams.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REASSIGN RESCUE TEAM MODAL */}
        {reassignModalAlert && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Reassign Emergency Response Team
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Currently assigned: <strong>{reassignModalAlert.assignedTeamName || reassignModalAlert.assignedTeamId}</strong>
                </p>
              </div>

              {availableRescueTeams.length === 0 ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  ⚠️ No replacement rescue teams currently free!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Select Replacement Rescue Unit:
                  </label>
                  <select
                    value={reassignTeamSelect}
                    onChange={(e) => setReassignTeamSelect(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Select a free rescue team...</option>
                    {availableRescueTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.role} ({t.zone}) &bull; {t.personnel} crew
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReassignModalAlert(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reassignTeamSelect}
                  onClick={() => {
                    reassignUnit(reassignModalAlert.id, reassignTeamSelect, 'ALERT');
                    setReassignModalAlert(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: !reassignTeamSelect ? 'var(--text-muted)' : 'var(--gov-blue-700)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: !reassignTeamSelect ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TRIGGER FROM SIMULATION: RECOMMENDED ALERT BANNER
         ========================================================================= */}
      <div style={{
        background: triggerRecommendation.recommendedLevel === 'DANGER'
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(239, 68, 68, 0.04) 100%)'
          : triggerRecommendation.recommendedLevel === 'WARNING'
          ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.14) 0%, rgba(245, 158, 11, 0.04) 100%)'
          : 'linear-gradient(90deg, rgba(2, 132, 199, 0.14) 0%, rgba(2, 132, 199, 0.04) 100%)',
        border: `1px solid ${ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.borderColor || 'rgba(239,68,68,0.4)'}`,
        borderLeft: `5px solid ${ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.color || '#EF4444'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '800px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <Sparkles size={18} color={ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.color} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.textColor }}>
                HYDROLOGIC SIMULATION TRIGGER: Recommended Alert &rarr; {ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.name.toUpperCase()}
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '1px 6px',
                borderRadius: '3px'
              }}>
                AUTO-EVALUATED
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              {triggerRecommendation.reason}
            </div>
          </div>
        </div>

        <button
          onClick={handleApplyRecommendation}
          style={{
            padding: '8px 16px',
            background: ALERT_LEVELS[triggerRecommendation.recommendedLevel]?.color,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.15s'
          }}
        >
          <Sparkles size={14} />
          <span>Apply Recommended Draft</span>
        </button>
      </div>

      {/* Success Toast */}
      {dispatchSuccessToast && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderLeft: '4px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#34D399',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span>
              Simulation broadcast completed successfully: <strong>{dispatchSuccessToast.count.toLocaleString()} recipients queued</strong> with {dispatchSuccessToast.deliveryRate}% simulated delivery. Token: <code style={{ color: '#FFFFFF' }}>{dispatchSuccessToast.transactionId}</code>
            </span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>Logged to history</span>
        </div>
      )}

      {/* =========================================================================
          MAIN WORKSPACE: FLOOD ALERT LEVELS + DRAFTING ENGINE (LEFT) & TARGETING/PREVIEWS (RIGHT)
         ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(300px, 1fr)',
        gap: '20px'
      }}>
        
        {/* LEFT COLUMN: ALERT LEVEL SELECTOR + MESSAGE DRAFTING + SMS COUNTER */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          
          {/* 1. FLOOD ALERT LEVEL SELECTOR */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                1. Select Flood Alert Level
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Changes badge, template tone &amp; safe actions
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {Object.values(ALERT_LEVELS).map(lvl => {
                const isSelected = selectedLevel === lvl.id;
                const IconComponent = lvl.id === 'WATCH' ? Eye : lvl.id === 'WARNING' ? AlertTriangle : lvl.id === 'DANGER' ? AlertOctagon : CheckCircle2;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setSelectedLevel(lvl.id);
                      setIsShortened(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid',
                      borderColor: isSelected ? lvl.color : 'var(--border-medium)',
                      background: isSelected ? lvl.bgColor : 'var(--bg-secondary)',
                      color: isSelected ? lvl.textColor : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'center',
                      boxShadow: isSelected ? `0 0 10px ${lvl.bgColor}` : 'none'
                    }}
                  >
                    <IconComponent size={20} color={isSelected ? lvl.color : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{lvl.name}</span>
                    <span style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px', lineHeight: 1.2 }}>
                      {lvl.id === 'WATCH' ? 'Heavy Rain' : lvl.id === 'WARNING' ? 'Rising Water' : lvl.id === 'DANGER' ? 'Inundation' : 'Receding'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. LANGUAGE SELECTOR TABS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                2. Citizen Language
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {selectedLanguage === 'en' ? 'GSM 7-bit Encoding (160 limit)' : 'UCS-2 Unicode (70 limit)'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'en', label: 'English', sub: 'GSM-7' },
                { id: 'te', label: 'Telugu (తెలుగు)', sub: 'UCS-2' },
                { id: 'hi', label: 'Hindi (हिंदी)', sub: 'UCS-2' }
              ].map(lang => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setSelectedLanguage(lang.id);
                      setIsShortened(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                      background: isSelected ? 'var(--gov-blue-50)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--gov-blue-700)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Globe size={13} />
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. OUTGOING SMS DRAFT PREVIEW & CHARACTER COUNTER (BUG FIX) */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${activeLevelMeta.borderColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            
            {/* Header Strip with Segment & Encoding Info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: activeLevelMeta.color,
                  background: activeLevelMeta.bgColor,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${activeLevelMeta.borderColor}`
                }}>
                  {activeLevelMeta.id} &bull; {selectedLanguage.toUpperCase()}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  SMS Character Counter: <span style={{ fontFamily: 'var(--font-mono)', color: smsMetrics.isSingleSegment ? 'var(--status-normal)' : '#F59E0B' }}>
                    {smsMetrics.charCount} / {smsMetrics.maxSingleLimit} chars
                  </span>
                </span>
              </div>

              {/* Status Indicator: Green tick only if 1 segment, else Amber Warning */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {smsMetrics.isSingleSegment ? (
                  <span style={{
                    color: 'var(--status-normal)',
                    fontWeight: 700,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <Check size={13} />
                    <span>Single SMS ({smsMetrics.segmentCount} Segment &bull; {smsMetrics.encoding})</span>
                  </span>
                ) : (
                  <span style={{
                    color: '#F59E0B',
                    fontWeight: 700,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <AlertTriangle size={13} />
                    <span>Splits into {smsMetrics.segmentCount} segments ({smsMetrics.concatLimit} chars/seg &bull; {smsMetrics.encoding})</span>
                  </span>
                )}
              </div>
            </div>

            {/* Editable Draft Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={currentDraftText}
                onChange={handleTextChange}
                rows={4}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: selectedLanguage === 'en' ? 'var(--font-mono)' : 'inherit',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions Strip: Shorten message button + Telemetry Source line for officers */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={handleToggleShorten}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isShortened ? 'var(--gov-blue-700)' : 'var(--bg-primary)',
                  color: isShortened ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <Scissors size={13} />
                <span>{isShortened ? 'Reset to Full Message' : 'Shorten Message (Fit 1 Segment)'}</span>
              </button>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Safe Action &bull; Shelter &bull; Toll-Free 1070
              </div>
            </div>

            {/* OFFICER TELEMETRY SOURCE LINE (Kept separate from Citizen SMS!) */}
            <div style={{
              background: 'rgba(30, 58, 138, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '11px',
              color: 'var(--gov-blue-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Radio size={14} style={{ flexShrink: 0 }} />
              <div>
                <strong>Telemetry Source (Officer Eyes Only):</strong> Data derived via LoRa Sub-GHz field mesh (865-867 MHz) &amp; hydrologic simulation. Internal technical metadata excluded from citizen SMS broadcast.
              </div>
            </div>

            {/* Send Dispatch Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Target Recipients: <strong>{totalRecipients.toLocaleString()} citizens</strong> ({selectedRadius})
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: activeLevelMeta.color,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s'
                }}
              >
                <Send size={15} />
                <span>Simulate Dispatch (Preview Mode)</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TARGETING CONTROLS + SMALL MAP PREVIEW */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* TARGETING CARD */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                4. Broadcast Targeting
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--gov-blue-700)',
                background: 'var(--gov-blue-50)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {totalRecipients.toLocaleString()} Recipients
              </span>
            </div>

            {/* Radius Options */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                BROADCAST RADIUS AROUND EPICENTER:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {RADIUS_OPTIONS.map(opt => {
                  const isSelected = selectedRadius === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedRadius(opt.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                        background: isSelected ? 'var(--gov-blue-50)' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--gov-blue-700)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Affected Zones Checkboxes */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                AFFECTED WARDS &amp; RIVER BASINS:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {AFFECTED_ZONES.map(zone => {
                  const isChecked = selectedZones.includes(zone.id);
                  return (
                    <label
                      key={zone.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                        border: '1px solid',
                        borderColor: isChecked ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleZone(zone.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{zone.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{zone.basin}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          ~{zone.baseRecipients}
                        </span>
                        <div style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: zone.riskLevel === 'CRITICAL' ? '#EF4444' : zone.riskLevel === 'HIGH' ? '#F59E0B' : '#10B981'
                        }}>
                          {zone.riskLevel}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Interactive High-Tech Target Zone Map Preview */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  GEO-FENCED BROADCAST RADIUS PREVIEW:
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {selectedRadius} buffer zone
                </span>
              </div>

              <div style={{
                position: 'relative',
                width: '100%',
                height: '170px',
                background: '#0B1120',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* SVG Visual Radar / Map */}
                <svg width="100%" height="100%" viewBox="0 0 400 200" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <defs>
                    <radialGradient id="radiusGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={activeLevelMeta.color} stopOpacity="0.4" />
                      <stop offset="70%" stopColor={activeLevelMeta.color} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={activeLevelMeta.color} stopOpacity="0" />
                    </radialGradient>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Grid background */}
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />

                  {/* River Channel Blue Line */}
                  <path
                    d="M 10 140 Q 120 160 200 110 T 390 70"
                    fill="none"
                    stroke="#1E40AF"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                  />
                  <path
                    d="M 10 140 Q 120 160 200 110 T 390 70"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                    strokeDasharray="4 2"
                  />

                  {/* Epicenter Node (Culvert C-8 / Industrial Basin) */}
                  {/* Broadcast Radius Rings */}
                  <circle
                    cx="200"
                    cy="110"
                    r={selectedRadius === '500m' ? '40' : selectedRadius === '1km' ? '68' : '92'}
                    fill="url(#radiusGradient)"
                    stroke={activeLevelMeta.color}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  
                  {/* Epicenter Pulse Marker */}
                  <circle cx="200" cy="110" r="10" fill={activeLevelMeta.color} fillOpacity="0.3" />
                  <circle cx="200" cy="110" r="5" fill={activeLevelMeta.color} />

                  {/* Ward Markers */}
                  <circle cx="150" cy="80" r="4" fill="#60A5FA" />
                  <text x="156" y="83" fill="#93C5FD" fontSize="9" fontWeight="600">Ward 4</text>

                  <circle cx="270" cy="120" r="4" fill="#F59E0B" />
                  <text x="276" y="123" fill="#FCD34D" fontSize="9" fontWeight="600">Ward 14</text>

                  <circle cx="110" cy="130" r="4" fill="#34D399" />
                  <text x="70" y="133" fill="#6EE7B7" fontSize="9" fontWeight="600">Ward 9</text>

                  {/* Safe Shelter Icon Marker */}
                  <g transform="translate(140, 50)">
                    <rect x="0" y="0" width="16" height="16" rx="3" fill="#10B981" />
                    <text x="8" y="11" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">H</text>
                  </g>
                  <text x="160" y="62" fill="#34D399" fontSize="9" fontWeight="700">Govt Shelter</text>
                </svg>

                {/* Floating Map Overlay Badges */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '10px',
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Compass size={11} color="#60A5FA" />
                  <span>Center: 17.3850° N, 78.4867° E &bull; Catchment Geo-Fence</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          SECTION 7: EXTRA CHANNELS (PREVIEW ONLY)
         ========================================================================= */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={16} color="var(--gov-blue-700)" />
              Multi-Channel Unified Flood Broadcast Previews
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Automatically synced from the active flood alert draft for consistent citizen communications across web feeds, sirens, and chat apps.
            </p>
          </div>

          {/* Sub-channel switcher */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'whatsapp', label: 'WhatsApp Citizen Broadcast', icon: MessageSquare },
              { id: 'public-feed', label: 'Public Alerts Web Feed', icon: Globe },
              { id: 'siren-pa', label: 'Siren & PA Script', icon: Volume2 }
            ].map(tab => {
              const IconComp = tab.icon;
              const isActive = activeChannelTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveChannelTab(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--gov-blue-700)' : 'var(--border-medium)',
                    background: isActive ? 'var(--gov-blue-50)' : 'var(--bg-secondary)',
                    color: isActive ? 'var(--gov-blue-700)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconComp size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LIVE SYNCHRONIZED LAST DISPATCHED BROADCAST BOARD */}
        {lastDispatchedBroadcast && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderLeft: `4px solid ${ALERT_LEVELS[lastDispatchedBroadcast.level]?.color || 'var(--gov-blue-700)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: ALERT_LEVELS[lastDispatchedBroadcast.level]?.bgColor || 'rgba(59, 130, 246, 0.1)',
                  color: ALERT_LEVELS[lastDispatchedBroadcast.level]?.textColor || '#3B82F6',
                  border: `1px solid ${ALERT_LEVELS[lastDispatchedBroadcast.level]?.borderColor || 'rgba(59, 130, 246, 0.3)'}`
                }}>
                  {lastDispatchedBroadcast.level} BROADCAST
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Last Dispatched: {lastDispatchedBroadcast.area}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  &bull; {formatTimeAgo(lastDispatchedBroadcast.timestamp, lastDispatchedBroadcast.sentAt)}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                  [SIMULATED]
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: channelDeliveryState === 'Delivered' ? 'var(--status-normal)' : '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {channelDeliveryState === 'Delivered' ? (
                    <>
                      <CheckCircle2 size={13} color="var(--status-normal)" />
                      <span>Sent &bull; {lastDispatchedBroadcast.deliveryPct}% Delivered</span>
                    </>
                  ) : channelDeliveryState === 'Sending' ? (
                    <>
                      <RefreshCw size={13} color="#F59E0B" />
                      <span>Broadcasting across Channels...</span>
                    </>
                  ) : (
                    <>
                      <Clock size={13} color="#F59E0B" />
                      <span>Queued in Dispatch Buffer</span>
                    </>
                  )}
                </span>
                <code style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '3px' }}>
                  {lastDispatchedBroadcast.id}
                </code>
              </div>
            </div>

            {/* 4 Per-channel live animated status chips */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px'
            }}>
              {/* Channel 1: SMS Cell Broadcast */}
              <div style={{
                background: 'var(--bg-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Cell Broadcast (SMS)</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: channelDeliveryState === 'Delivered' ? '#10B981' : '#F59E0B'
                  }}>
                    {channelDeliveryState === 'Delivered' ? 'DELIVERED' : channelDeliveryState.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {channelDeliveryState === 'Delivered'
                    ? `${lastDispatchedBroadcast.recipients?.toLocaleString()} Citizens (${lastDispatchedBroadcast.deliveryPct}%)`
                    : channelDeliveryState === 'Sending'
                    ? 'Paging 6 base transceiver stations...'
                    : 'Awaiting radio queue slot...'}
                </div>
              </div>

              {/* Channel 2: WhatsApp Citizen Alert */}
              <div style={{
                background: 'var(--bg-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>WhatsApp Channel</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: channelDeliveryState === 'Delivered' ? '#10B981' : '#F59E0B'
                  }}>
                    {channelDeliveryState === 'Delivered' ? 'DELIVERED' : channelDeliveryState.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {channelDeliveryState === 'Delivered'
                    ? 'Push dispatched with verified status (✓✓)'
                    : channelDeliveryState === 'Sending'
                    ? 'Broadcasting to citizen channel...'
                    : 'Template payload queued...'}
                </div>
              </div>

              {/* Channel 3: Public Alerts Web Feed */}
              <div style={{
                background: 'var(--bg-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Public Alerts Web Feed</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: channelDeliveryState === 'Delivered' ? '#10B981' : '#F59E0B'
                  }}>
                    {channelDeliveryState === 'Delivered' ? 'LIVE' : channelDeliveryState.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {channelDeliveryState === 'Delivered'
                    ? 'Published to public portal & edge cache'
                    : channelDeliveryState === 'Sending'
                    ? 'Syncing edge CDN nodes...'
                    : 'Draft queued for publish...'}
                </div>
              </div>

              {/* Channel 4: Siren & PA Speaker */}
              <div style={{
                background: 'var(--bg-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Acoustic Siren &amp; PA</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: channelDeliveryState === 'Delivered' ? '#10B981' : '#F59E0B'
                  }}>
                    {channelDeliveryState === 'Delivered' ? (lastDispatchedBroadcast.level === 'DANGER' ? 'ACTIVE' : 'CHIME') : channelDeliveryState.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {channelDeliveryState === 'Delivered'
                    ? (lastDispatchedBroadcast.level === 'DANGER' ? '110 dBA municipal sweep active' : 'Advisory chime dispatched')
                    : channelDeliveryState === 'Sending'
                    ? 'Triggering RF siren telemetry...'
                    : 'Speaker relays armed...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. WHATSAPP CITIZEN ALERT PREVIEW */}
        {activeChannelTab === 'whatsapp' && (
          <div style={{
            background: '#0B141A',
            border: '1px solid #1F2C34',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            maxWidth: '540px',
            margin: '0 auto',
            width: '100%',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* WhatsApp Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1F2C34', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#00A884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold' }}>
                FG
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#E9EDEF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {extraChannels.whatsappPreview.senderName}
                </div>
                <div style={{ fontSize: '10px', color: '#8696A0' }}>
                  Official State Emergency Service &bull; {extraChannels.whatsappPreview.phone}
                </div>
              </div>
            </div>

            {/* Green Message Bubble */}
            <div style={{
              background: '#005C4B',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#E9EDEF',
              fontSize: '12px',
              lineHeight: 1.5,
              position: 'relative'
            }}>
              <div style={{ fontWeight: 800, color: activeLevelMeta.textColor, marginBottom: '6px' }}>
                {extraChannels.whatsappPreview.title}
              </div>
              <div style={{ whiteSpace: 'pre-line', fontFamily: 'inherit' }}>
                {extraChannels.whatsappPreview.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', color: '#8696A0' }}>
                <span>Just now</span>
                <span style={{ color: '#53BDEB' }}>✓✓</span>
              </div>
            </div>

            {/* Quick Action CTA Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {extraChannels.whatsappPreview.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#1F2C34',
                    border: '1px solid #2A3942',
                    borderRadius: '6px',
                    color: '#00A884',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {btn.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. PUBLIC ALERTS WEB FEED PREVIEW */}
        {activeChannelTab === 'public-feed' && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${activeLevelMeta.borderColor}`,
            borderLeft: `4px solid ${activeLevelMeta.color}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: activeLevelMeta.textColor,
                background: activeLevelMeta.bgColor,
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                {extraChannels.publicFeedPost.badge}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Published: {extraChannels.publicFeedPost.postedTime} &bull; Target: {extraChannels.publicFeedPost.location}
              </span>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {extraChannels.publicFeedPost.title}
            </h4>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {extraChannels.publicFeedPost.body}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="var(--gov-blue-700)" />
                <span>Immediate Lowland Catchment Zone</span>
              </div>
              <a
                href="#shelters"
                onClick={(e) => e.preventDefault()}
                style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-blue-700)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>View Real-time Shelter Capacity</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* 3. SIREN & LOUDSPEAKER PA SCRIPT */}
        {activeChannelTab === 'siren-pa' && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color={activeLevelMeta.color} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Acoustic Tone: {extraChannels.loudspeakerScript.sirenTone}
                </span>
              </div>

              <button
                onClick={() => setIsSirenPlaying(prev => !prev)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSirenPlaying ? '#EF4444' : 'var(--gov-blue-700)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSirenPlaying ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isSirenPlaying ? 'Stop Simulated Tone' : 'Play Tone Preview (Simulated)'}</span>
              </button>
            </div>

            {/* Simulated audio waveform visualizer */}
            {isSirenPlaying && (
              <div style={{
                height: '32px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                overflow: 'hidden'
              }}>
                {[12, 28, 16, 30, 22, 14, 28, 32, 20, 15, 29, 24, 18, 32, 27, 14, 26, 30, 18, 22].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${h}px`,
                      background: '#EF4444',
                      borderRadius: '2px',
                      animation: 'pulse 1s infinite alternate'
                    }}
                  />
                ))}
                <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 800, marginLeft: '8px' }}>
                  110 dBA MUNICIPAL SIREN SWEEP TRANSMITTING
                </span>
              </div>
            )}

            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              color: 'var(--text-primary)'
            }}>
              {extraChannels.loudspeakerScript.scriptText}
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {extraChannels.loudspeakerScript.phoneticGuide}
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          SECTION 6: RECENT ALERT BROADCAST HISTORY
         ========================================================================= */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Historical Broadcast Log &amp; Telemetry Audits
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                {filteredHistory.length} Records
              </span>
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              All broadcasts timestamped with mock cell-broadcast tokens for regulatory compliance.
            </span>
          </div>

          {/* Filter & Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Level Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Level:</span>
              <select
                value={historyLevelFilter}
                onChange={(e) => setHistoryLevelFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Levels</option>
                <option value="DANGER">Danger</option>
                <option value="WARNING">Warning</option>
                <option value="WATCH">Watch</option>
                <option value="ALL_CLEAR">All Clear</option>
              </select>
            </div>

            {/* Language Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lang:</span>
              <select
                value={historyLangFilter}
                onChange={(e) => setHistoryLangFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Languages</option>
                <option value="en">English (EN)</option>
                <option value="te">Telugu (TE)</option>
                <option value="hi">Hindi (HI)</option>
              </select>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              disabled={filteredHistory.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                color: filteredHistory.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: filteredHistory.length === 0 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Export Broadcast History as CSV"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>

            {/* Clear Simulated History button */}
            <button
              onClick={() => {
                if (window.confirm('Clear all simulated broadcast history records?')) {
                  clearBroadcastHistory();
                }
              }}
              disabled={broadcastHistory.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                color: broadcastHistory.length === 0 ? 'var(--text-muted)' : '#EF4444',
                fontSize: '11px',
                fontWeight: 600,
                cursor: broadcastHistory.length === 0 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Clear simulated history"
            >
              <Trash2 size={12} />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* History List or Empty State */}
        {filteredHistory.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-muted)'
          }}>
            <Radio size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>No Broadcast Records Found</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              {broadcastHistory.length === 0
                ? 'No broadcast records exist in simulated storage. Dispatch an alert using the form above to populate telemetry.'
                : 'No records match the active level/language filter criteria.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHistory.map((item) => {
              const levelInfo = ALERT_LEVELS[item.level] || ALERT_LEVELS.WARNING;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '650px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: levelInfo.color,
                      background: levelInfo.bgColor,
                      border: `1px solid ${levelInfo.borderColor}`,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {item.level}
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.area}</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          &bull; {formatTimeAgo(item.timestamp, item.sentAt)}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-primary)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          {item.language.toUpperCase()} ({item.encoding})
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#3B82F6',
                          background: 'rgba(59, 130, 246, 0.1)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          [SIMULATED]
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {item.message}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-normal)' }}>
                      {item.deliveryStatus} ({item.recipients.toLocaleString()} Recipients)
                    </div>
                    
                    {/* Delivery % Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '80px', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.deliveryPct}%`, height: '100%', background: '#10B981' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981' }}>
                        {item.deliveryPct}%
                      </span>
                    </div>

                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      Token: {item.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* =========================================================================
          CONFIRMATION MODAL FOR BROADCAST DISPATCH
         ========================================================================= */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${activeLevelMeta.borderColor}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: activeLevelMeta.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Send size={18} color={activeLevelMeta.color} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Confirm Simulated Broadcast Dispatch
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Municipal Disaster Cell &bull; Simulated Cell Broadcast
                </span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Alert Level:</span>
                <strong style={{ color: activeLevelMeta.textColor }}>{activeLevelMeta.name.toUpperCase()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Areas:</span>
                <strong style={{ textAlign: 'right', maxWidth: '300px' }}>{targetAreaDisplay}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Broadcast Buffer Radius:</span>
                <strong>{selectedRadius}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Citizen Recipients:</span>
                <strong style={{ color: 'var(--gov-blue-700)' }}>{totalRecipients.toLocaleString()} Estimated Residents</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Language &amp; Segments:</span>
                <strong>{selectedLanguage.toUpperCase()} &bull; {smsMetrics.segmentCount} Segment ({smsMetrics.encoding})</strong>
              </div>
            </div>

            {/* Message preview snippet */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: '11px',
              fontFamily: selectedLanguage === 'en' ? 'var(--font-mono)' : 'inherit',
              lineHeight: 1.5,
              color: 'var(--text-secondary)'
            }}>
              {currentDraftText}
            </div>

            <div style={{ fontSize: '11px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.08)', padding: '8px 10px', borderRadius: '4px' }}>
              ⚠️ Running in <strong>Preview / Drill Mode</strong>: Message will be queued and logged to simulation audit history without charging live gateway credits.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDispatching}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: activeLevelMeta.color,
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDispatching ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Authorize &amp; Simulate Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
