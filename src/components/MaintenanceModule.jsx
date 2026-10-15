import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  CloudRain,
  CloudLightning,
  Sun,
  CloudSun,
  Droplets,
  Filter,
  Check,
  Plus,
  X,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Truck,
  Sparkles
} from 'lucide-react';
import { MAINTENANCE_CONFIG } from '../services/maintenanceSim';

export default function MaintenanceModule({
  maintenanceData,
  onScheduleJob,
  onCompleteJob
}) {
  const [activeSubSection, setActiveSubSection] = useState('all'); // 'all', 'flood', 'drainage', 'schedule'
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [sortBy, setSortBy] = useState('blockage-desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDrainId, setSelectedDrainId] = useState('');
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '09:00',
    crew: MAINTENANCE_CONFIG.CREWS[0],
    taskType: MAINTENANCE_CONFIG.TASK_TYPES[0],
    notes: '',
    preRainTag: false
  });
  const [autoSuggestionNote, setAutoSuggestionNote] = useState('');

  if (!maintenanceData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading maintenance telemetry and hydro-forecast...
      </div>
    );
  }

  const { drains, scheduledJobs, summary } = maintenanceData;

  // Open modal with pre-computed suggestion
  const handleOpenScheduleModal = (drainId) => {
    const drain = drains.find(d => d.id === drainId) || drains[0];
    setSelectedDrainId(drain.id);

    // Calculate suggestion based on SLA and forecast
    const heavyRain = summary.forecast.find(f => f.rainfallMm >= MAINTENANCE_CONFIG.FLOOD_RISK_RAIN_THRESHOLD_MM);
    const isUrgent = drain.priority === 'URGENT' || drain.priority === 'HIGH';
    const isPreRain = Boolean(heavyRain && isUrgent);

    const today = new Date();
    let daysToAdd = 3;
    if (drain.priority === 'URGENT') daysToAdd = 1;
    else if (drain.priority === 'HIGH') daysToAdd = 2;
    else if (drain.priority === 'MEDIUM') daysToAdd = 7;
    else daysToAdd = 21;

    if (isPreRain) daysToAdd = 1; // Prioritize before heavy rain

    const targetDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];

    setFormData({
      scheduledDate: dateStr,
      scheduledTime: '09:00',
      crew: isUrgent ? MAINTENANCE_CONFIG.CREWS[0] : MAINTENANCE_CONFIG.CREWS[1],
      taskType: drain.blockagePct > 60 ? 'Heavy Silt Vacuum Desilting' : 'Debris & Plastic Removal',
      notes: isPreRain 
        ? `Pre-rain accelerated maintenance before ${heavyRain?.day || 'storm'} (${heavyRain?.rainfallMm || 45}mm forecast).`
        : `Routine maintenance based on ${drain.priority} priority SLA.`,
      preRainTag: isPreRain
    });

    setAutoSuggestionNote(
      isPreRain
        ? `⚡ Accelerated Pre-Rain Window: Storm of ${heavyRain.rainfallMm}mm arrives ${heavyRain.day}. Clearance mandated within 24h.`
        : `Suggested standard SLA for ${drain.priority} Priority: Within ${daysToAdd} days.`
    );

    setIsModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const drain = drains.find(d => d.id === selectedDrainId);
    if (!drain) return;

    onScheduleJob({
      drainId: drain.id,
      drainName: drain.name,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      crew: formData.crew,
      taskType: formData.taskType,
      notes: formData.notes,
      priority: drain.priority,
      preRainTag: formData.preRainTag
    });

    setIsModalOpen(false);
  };

  // Helper for countdown
  const getCountdownString = (dateStr, timeStr) => {
    const jobTime = new Date(`${dateStr}T${timeStr || '09:00'}`);
    const now = new Date();
    const diffMs = jobTime - now;

    if (diffMs < 0) {
      const overdueHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
      return { text: `OVERDUE by ${overdueHours}h`, isOverdue: true };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;

    if (days > 0) {
      return { text: `Due in ${days}d ${hours}h`, isOverdue: false };
    }
    return { text: `Due in ${hours}h`, isOverdue: false };
  };

  // Unique zones for filter
  const zones = ['ALL', ...Array.from(new Set(drains.map(d => d.zone)))];

  // Filter & Sort Drains
  const filteredDrains = drains.filter(d => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && d.priority !== filterPriority) return false;
    if (filterZone !== 'ALL' && d.zone !== filterZone) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'blockage-desc') return b.blockagePct - a.blockagePct;
    if (sortBy === 'waste-desc') return b.wastePct - a.wastePct;
    if (sortBy === 'efficiency-asc') return (a.outflowLps / a.designCapacityLps) - (b.outflowLps / b.designCapacityLps);
    if (sortBy === 'priority') {
      const pMap = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* =====================================================================
          1. TOP SUMMARY CARDS
          ===================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        {/* Card 1: Drains Health State */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Drain Maintenance Status</span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>SIMULATED DATA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} color="var(--status-normal)" />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-normal)' }}>{summary.drainsOk}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OK</span>
            </div>
            <span style={{ color: 'var(--border-medium)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={16} color="var(--status-warning)" />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-warning)' }}>{summary.drainsDueSoon}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due</span>
            </div>
            <span style={{ color: 'var(--border-medium)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={16} color="var(--status-critical)" />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-critical)' }}>{summary.drainsOverdue}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overdue</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Active monitored network: {summary.totalDrains} storm drains
          </div>
        </div>

        {/* Card 2: Average Blockage & Waste */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Network Silt &amp; Blockage</span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>SIMULATED DATA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: summary.avgBlockagePct > 40 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {summary.avgBlockagePct}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>Avg Blockage</span>
            </div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: summary.avgWastePct > 45 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                {summary.avgWastePct}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>Avg Waste</span>
            </div>
          </div>
          <div style={{
            height: '6px',
            background: 'var(--bg-secondary)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '8px',
            display: 'flex'
          }}>
            <div style={{ width: `${summary.avgBlockagePct}%`, background: 'linear-gradient(90deg, #F59E0B, #EF4444)' }} />
          </div>
        </div>

        {/* Card 3: Next 24 Hours Forecast Rain */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next 24h Rain Forecast</span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>SIMULATED DATA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <CloudRain size={24} color="#F59E0B" />
            <div>
              <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>
                {summary.next24hRainMm} mm
              </span>
              <span style={{ fontSize: '11px', color: 'var(--status-critical)', fontWeight: 700, marginLeft: '6px' }}>
                HEAVY RISK
              </span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Peak front: 16:00 - 19:00 &bull; 92% precipitation probability
          </div>
        </div>

        {/* Card 4: Next Scheduled Job */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Next Scheduled Job</span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>SIMULATED DATA</span>
          </div>
          {summary.nextJob ? (
            <div style={{ marginTop: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-blue-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {summary.nextJob.drainName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {summary.nextJob.scheduledDate} ({summary.nextJob.scheduledTime})
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#EF4444',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {getCountdownString(summary.nextJob.scheduledDate, summary.nextJob.scheduledTime).text}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
              No pending jobs in dispatch queue
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          NAVIGATION SUB-TABS (ALL, FLOOD, DRAINAGE, SCHEDULE)
          ===================================================================== */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Maintenance Sections' },
          { id: 'flood', label: '1. Flood Maintenance (Rain & Flow)' },
          { id: 'drainage', label: '2. Drainage Maintenance (Blockage & Waste)' },
          { id: 'schedule', label: '3. Work Schedule & Calendar' }
        ].map(sub => (
          <button
            key={sub.id}
            type="button"
            onClick={() => setActiveSubSection(sub.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              background: activeSubSection === sub.id ? 'var(--gov-blue-700)' : 'var(--bg-secondary)',
              color: activeSubSection === sub.id ? '#FFFFFF' : 'var(--text-primary)',
              border: '1px solid',
              borderColor: activeSubSection === sub.id ? 'var(--gov-blue-700)' : 'var(--border-medium)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          SECTION 1: FLOOD MAINTENANCE (WEATHER FORECAST & WATER FLOW)
          ===================================================================== */}
      {(activeSubSection === 'all' || activeSubSection === 'flood') && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudRain size={20} color="var(--gov-blue-700)" />
                Flood Maintenance: 7-Day Rainfall Forecast &amp; Hydraulic Balance
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Simulated precipitation projections with automated hydraulic overflow warnings. Zero external APIs called.
              </p>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              SIMULATED DATA
            </span>
          </div>

          {/* Forecast-driven recommendation alert banner */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.12))',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderLeft: '5px solid #EF4444',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={22} color="#EF4444" />
              <div>
                <strong style={{ fontSize: '13px', color: '#EF4444' }}>Forecast Action Recommendation:</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  Heavy rainfall (46.2 mm Thursday, 68.0 mm Friday) will overwhelm clogged culverts. <strong>Execute pre-rain clearing on Drain D-03, Culvert C-08, and Sump P-03 before Wednesday 18:00.</strong>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenScheduleModal('NODE-C-08')}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={13} />
              Auto-Schedule Pre-Rain Desilting
            </button>
          </div>

          {/* 7-Day Rainfall Forecast Cards & Bar Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {summary.forecast.map((dayItem, idx) => {
              const isOverFloodRisk = dayItem.rainfallMm >= MAINTENANCE_CONFIG.FLOOD_RISK_RAIN_THRESHOLD_MM;
              return (
                <div
                  key={dayItem.day}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${isOverFloodRisk ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {isOverFloodRisk && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      fontSize: '8px',
                      fontWeight: 800,
                      background: '#EF4444',
                      color: '#FFF',
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}>
                      FLOOD RISK
                    </span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{dayItem.day}</span>
                  <div style={{ margin: '8px 0' }}>
                    {dayItem.icon === 'CloudLightning' ? <CloudLightning size={26} color="#EF4444" /> :
                     dayItem.icon === 'Sun' ? <Sun size={26} color="#10B981" /> :
                     dayItem.icon === 'CloudSun' ? <CloudSun size={26} color="#10B981" /> :
                     <CloudRain size={26} color={dayItem.color} />}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: dayItem.color }}>
                    {dayItem.rainfallMm} <span style={{ fontSize: '11px' }}>mm</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {dayItem.rainProbPct}% Probability
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: dayItem.color,
                    background: `${dayItem.color}15`,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginTop: '6px'
                  }}>
                    {dayItem.intensity}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Forecast Bar Chart with Threshold Line */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ fontWeight: 700 }}>7-Day Forecast Rainfall Projection vs. 40mm Flood-Risk Line</span>
              <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11px' }}>-- Threshold: 40 mm/day (High Risk)</span>
            </div>

            {/* Simulated CSS Chart */}
            <div style={{
              height: '140px',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '16px',
              padding: '10px 10px 24px 10px',
              borderBottom: '2px solid var(--border-medium)',
              borderLeft: '2px solid var(--border-medium)'
            }}>
              {/* 40mm Threshold Line */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${(40 / 75) * 100}%`,
                borderTop: '2px dashed #EF4444',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <span style={{ position: 'absolute', right: '10px', top: '-18px', fontSize: '9px', color: '#EF4444', fontWeight: 800 }}>
                  Flood Alert Line (40mm)
                </span>
              </div>

              {/* Day Bars */}
              {summary.forecast.map((d, i) => {
                const heightPct = Math.min(100, (d.rainfallMm / 75) * 100);
                const isOver = d.rainfallMm >= 40;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', zIndex: 3 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: isOver ? '#EF4444' : 'var(--text-muted)', marginBottom: '4px' }}>
                      {d.rainfallMm}
                    </span>
                    <div style={{
                      width: '70%',
                      maxWidth: '36px',
                      height: `${Math.max(6, heightPct)}%`,
                      background: isOver ? 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)' : 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                      {d.day.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Water Flow Maintenance Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
              Drain Water Flow &amp; Capacity Deficit Telemetry
            </h3>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Drain ID</th>
                    <th style={{ padding: '10px 14px' }}>Inflow Rate</th>
                    <th style={{ padding: '10px 14px' }}>Outflow Rate</th>
                    <th style={{ padding: '10px 14px' }}>Design Capacity</th>
                    <th style={{ padding: '10px 14px' }}>Flow Efficiency</th>
                    <th style={{ padding: '10px 14px' }}>24h Efficiency Trend</th>
                    <th style={{ padding: '10px 14px' }}>Flow Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drains.map(drain => {
                    const effPct = Math.round((drain.outflowLps / drain.designCapacityLps) * 100);
                    const isInflowDeficit = drain.inflowLps > drain.outflowLps;
                    const statusColor = effPct >= 80 ? '#10B981' : effPct >= 50 ? '#F59E0B' : '#EF4444';
                    const statusLabel = effPct >= 80 ? 'HEALTHY' : effPct >= 50 ? 'REDUCED' : 'POOR';

                    return (
                      <tr key={drain.id} style={{ borderBottom: '1px solid var(--border-light)', background: isInflowDeficit ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{drain.id}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{drain.name}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <strong>{drain.inflowLps} L/s</strong>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <strong>{drain.outflowLps} L/s</strong>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {drain.designCapacityLps} L/s
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontFamily: 'var(--font-mono)', color: statusColor }}>{effPct}%</strong>
                            <div style={{ width: '45px', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${effPct}%`, height: '100%', background: statusColor }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {/* Mini Sparkline */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '50px' }}>
                            {drain.historyEfficiency.map((val, idx) => (
                              <div
                                key={idx}
                                style={{
                                  flex: 1,
                                  height: `${val}%`,
                                  background: statusColor,
                                  borderRadius: '1px'
                                }}
                              />
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: `${statusColor}20`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                              display: 'inline-block',
                              width: 'fit-content'
                            }}>
                              {statusLabel}
                            </span>
                            {isInflowDeficit && (
                              <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: 700 }}>
                                ⚠️ Inflow &gt; Outflow
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: DRAINAGE MAINTENANCE (BLOCKAGE & WASTE INVENTORY)
          ===================================================================== */}
      {(activeSubSection === 'all' || activeSubSection === 'drainage') && (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} color="var(--gov-blue-700)" />
                Drainage Maintenance: Silt, Waste &amp; Blockage Inventory
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Track real-time debris buildup and trigger mechanical desilting or jet-rodding.
              </p>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              SIMULATED DATA
            </span>
          </div>

          {/* Filter & Sort Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'var(--bg-secondary)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <Filter size={14} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="DUE SOON">Due Soon</option>
                  <option value="OK">OK</option>
                  <option value="IN PROGRESS">In Progress</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600 }}>Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px'
                  }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600 }}>Zone:</span>
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px'
                  }}
                >
                  {zones.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px'
                }}
              >
                <option value="blockage-desc">Blockage % (Highest)</option>
                <option value="waste-desc">Waste Accumulation %</option>
                <option value="priority">Priority SLA</option>
                <option value="efficiency-asc">Flow Efficiency (Lowest)</option>
              </select>
            </div>
          </div>

          {/* Drains Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Drain Details</th>
                  <th style={{ padding: '10px 14px' }}>Blockage Level</th>
                  <th style={{ padding: '10px 14px' }}>Waste &amp; Breakdown</th>
                  <th style={{ padding: '10px 14px' }}>Flow / Eff.</th>
                  <th style={{ padding: '10px 14px' }}>Maintenance Dates</th>
                  <th style={{ padding: '10px 14px' }}>Status &amp; Priority</th>
                  <th style={{ padding: '10px 14px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrains.map(drain => {
                  const isSevere = drain.blockagePct > 60;
                  const isPartial = drain.blockagePct >= 25 && drain.blockagePct <= 60;
                  const blockageColor = isSevere ? '#EF4444' : isPartial ? '#F59E0B' : '#10B981';
                  const blockageLabel = isSevere ? 'SEVERE' : isPartial ? 'PARTIAL' : 'CLEAR';

                  const priorityColor = drain.priority === 'URGENT' ? '#EF4444' : drain.priority === 'HIGH' ? '#F59E0B' : '#10B981';
                  const statusColor = drain.status === 'OVERDUE' ? '#EF4444' : drain.status === 'DUE SOON' ? '#F59E0B' : '#10B981';

                  const eff = Math.round((drain.outflowLps / drain.designCapacityLps) * 100);

                  return (
                    <tr key={drain.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* Details */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{drain.id}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{drain.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{drain.zone}</div>
                      </td>

                      {/* Blockage Level */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: blockageColor }}>{drain.blockagePct}%</strong>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: blockageColor, background: `${blockageColor}15`, padding: '1px 5px', borderRadius: '3px' }}>
                            {blockageLabel}
                          </span>
                        </div>
                        <div style={{ width: '80px', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                          <div style={{ width: `${drain.blockagePct}%`, height: '100%', background: blockageColor }} />
                        </div>
                      </td>

                      {/* Waste & Breakdown */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{drain.wastePct}%</strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>accumulated</span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                          <span style={{ fontSize: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#0284C7', padding: '1px 4px', borderRadius: '2px' }}>
                            Plastic {drain.wasteBreakdown.plastic}%
                          </span>
                          <span style={{ fontSize: '8px', background: 'rgba(180, 83, 9, 0.15)', color: '#B45309', padding: '1px 4px', borderRadius: '2px' }}>
                            Silt {drain.wasteBreakdown.silt}%
                          </span>
                          <span style={{ fontSize: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '1px 4px', borderRadius: '2px' }}>
                            Veg {drain.wasteBreakdown.vegetation}%
                          </span>
                        </div>
                      </td>

                      {/* Flow / Eff */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)' }}>{drain.outflowLps} L/s</div>
                        <div style={{ fontSize: '10px', color: eff < 50 ? '#EF4444' : 'var(--text-muted)' }}>
                          Eff: <strong>{eff}%</strong> of {drain.designCapacityLps}
                        </div>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Last: {drain.lastMaintained}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          Next: {drain.nextScheduled}
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}35`,
                            width: 'fit-content'
                          }}>
                            {drain.status}
                          </span>
                          <span style={{ fontSize: '9px', color: priorityColor, fontWeight: 700 }}>
                            {drain.priority} Priority
                          </span>
                          {drain.preRainRequired && (
                            <span style={{ fontSize: '8px', background: '#EF4444', color: '#FFF', padding: '1px 4px', borderRadius: '2px', width: 'fit-content', fontWeight: 700 }}>
                              Pre-Rain Req.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(drain.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--gov-blue-700)',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Calendar size={11} />
                            Schedule
                          </button>

                          <button
                            type="button"
                            onClick={() => onCompleteJob(drain.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={11} />
                            Complete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: WORK SCHEDULE & WEEKLY CALENDAR
          ===================================================================== */}
      {(activeSubSection === 'all' || activeSubSection === 'schedule') && (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--gov-blue-700)" />
                Work Order Dispatch Schedule &amp; Weekly Calendar
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Persistent work orders synchronized in browser storage with pre-rain emergency tags.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenScheduleModal('NODE-C-08')}
              style={{
                background: 'var(--gov-blue-700)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              New Work Order
            </button>
          </div>

          {/* Simple Weekly Calendar Strip */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Weekly Job Heatmap (7 Days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {summary.forecast.map((dayItem, idx) => {
                const targetDate = new Date(Date.now() + dayItem.dateOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const matchingJobs = scheduledJobs.filter(j => j.scheduledDate === targetDate);

                return (
                  <div
                    key={dayItem.day}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      minHeight: '75px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>{dayItem.day.split(' ')[0]}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{targetDate.slice(5)}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                      {matchingJobs.length > 0 ? (
                        matchingJobs.map(j => (
                          <span
                            key={j.id}
                            title={`${j.drainName} - ${j.taskType}`}
                            style={{
                              fontSize: '8px',
                              fontWeight: 700,
                              background: j.preRainTag ? 'rgba(239, 68, 68, 0.2)' : 'var(--gov-blue-50)',
                              color: j.preRainTag ? '#EF4444' : 'var(--gov-blue-700)',
                              border: `1px solid ${j.preRainTag ? '#EF4444' : 'var(--gov-blue-700)'}`,
                              padding: '1px 3px',
                              borderRadius: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {j.drainId.replace('NODE-', '')}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '8px', color: 'var(--text-dim)' }}>0 jobs</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduled Jobs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Upcoming Work Orders ({scheduledJobs.length})</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scheduledJobs.map(job => {
                const countdown = getCountdownString(job.scheduledDate, job.scheduledTime);
                const isCompleted = job.status === 'COMPLETED';

                return (
                  <div
                    key={job.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${job.preRainTag ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-light)'}`,
                      borderLeft: `4px solid ${job.preRainTag ? '#EF4444' : isCompleted ? '#10B981' : 'var(--gov-blue-700)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {job.id}: {job.drainName}
                        </span>
                        {job.preRainTag && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            background: '#EF4444',
                            color: '#FFF',
                            padding: '1px 5px',
                            borderRadius: '3px'
                          }}>
                            PRE-RAIN CLEANING
                          </span>
                        )}
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                          color: isCompleted ? '#10B981' : '#0284C7'
                        }}>
                          {job.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Task: <strong>{job.taskType}</strong> &bull; Crew: {job.crew}
                      </div>
                      {job.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>
                          "{job.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {job.scheduledDate} &bull; {job.scheduledTime}
                      </div>
                      {!isCompleted ? (
                        <div style={{ fontSize: '11px', fontWeight: 800, color: countdown.isOverdue ? '#EF4444' : '#F59E0B', marginTop: '2px' }}>
                          {countdown.text}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                          ✓ Completed &amp; Cleared
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCHEDULING FORM MODAL
          ===================================================================== */}
      {isModalOpen && (
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
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} color="var(--gov-blue-700)" />
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Schedule Drain Maintenance Work Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Auto-suggestion note */}
            {autoSuggestionNote && (
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                borderLeft: '4px solid #0284C7',
                padding: '8px 12px',
                borderRadius: '0 4px 4px 0',
                fontSize: '11px',
                color: 'var(--text-primary)',
                lineHeight: 1.4
              }}>
                {autoSuggestionNote}
              </div>
            )}

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Drain Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Target Storm Drain</label>
                <select
                  value={selectedDrainId}
                  onChange={(e) => handleOpenScheduleModal(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}
                >
                  {drains.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.name} ({d.priority} Priority, {d.blockagePct}% Blocked)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Picker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      marginTop: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Scheduled Time</label>
                  <input
                    type="time"
                    required
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      marginTop: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Crew Selector */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Maintenance Crew</label>
                <select
                  value={formData.crew}
                  onChange={(e) => setFormData({ ...formData, crew: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}
                >
                  {MAINTENANCE_CONFIG.CREWS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Task Type */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Task Type</label>
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}
                >
                  {MAINTENANCE_CONFIG.TASK_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Pre-rain tag toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="preRainTagCheck"
                  checked={formData.preRainTag}
                  onChange={(e) => setFormData({ ...formData, preRainTag: e.target.checked })}
                />
                <label htmlFor="preRainTagCheck" style={{ fontSize: '12px', fontWeight: 600, color: formData.preRainTag ? '#EF4444' : 'var(--text-primary)', cursor: 'pointer' }}>
                  Tag as "Pre-Rain Accelerated Cleaning" (Priority clearance before Thu storm)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Operational Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specific access gates, silt disposal depot, or machinery instructions..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--gov-blue-700)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Confirm &amp; Dispatch Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
