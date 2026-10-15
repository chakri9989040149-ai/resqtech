/**
 * ============================================================================
 * FLOODGUARD AI — MAINTENANCE & HYDRAULIC UPKEEP SIMULATION (maintenanceSim.js)
 * ============================================================================
 * 
 * Simulates:
 * 1. 7-day weather forecast rainfall and next-24-hour flood risk.
 * 2. Per-drain hydraulic water flow: inflow, outflow, design capacity, flow efficiency %.
 * 3. Drainage maintenance state: waste accumulation %, debris type composition,
 *    blockage %, maintenance statuses (OK / DUE SOON / OVERDUE / IN PROGRESS),
 *    priority ranking (LOW / MEDIUM / HIGH / URGENT).
 * 4. Rule-based automated maintenance scheduling with pre-rain emergency acceleration.
 * 5. Persistent local storage for scheduled maintenance work orders.
 * ============================================================================
 */

export const MAINTENANCE_CONFIG = {
  // Waste growth rates (% per tick / idle drift)
  BASE_WASTE_GROWTH_PER_TICK: 0.08,
  RAIN_WASTE_MULTIPLIER: 2.8,

  // Thresholds
  BLOCKAGE_CLEAR_MAX: 25.0,    // < 25% = CLEAR
  BLOCKAGE_PARTIAL_MAX: 60.0,  // 25 - 60% = PARTIAL, > 60% = SEVERE
  WASTE_CRITICAL_THRESHOLD: 70.0,
  
  // Forecast Flood-Risk Threshold (mm/day)
  FLOOD_RISK_RAIN_THRESHOLD_MM: 40.0,

  // Auto-schedule SLA Rules (hours from now)
  SCHEDULE_RULES_HOURS: {
    URGENT: 24,       // > 60% blockage or > 70% waste
    HIGH: 72,         // 3 days
    MEDIUM: 168,      // 7 days
    LOW: 720          // 30 days routine
  },

  // Crew Options
  CREWS: [
    'Quick Response Desilting Crew Alpha (Vacuum Truck)',
    'Stormwater Rapid Response Team Bravo',
    'Municipal Mechanical Sweeper Unit 4',
    'Emergency Drainage Clearing Cell 9'
  ],

  // Task Types
  TASK_TYPES: [
    'Debris & Plastic Removal',
    'Heavy Silt Vacuum Desilting',
    'Blockage Jet-Rodding & Clearing',
    'CCTV Conduit Structural Inspection'
  ]
};

// 7-Day Simulated Weather Forecast
export const SIMULATED_7DAY_FORECAST = [
  {
    day: 'Today (Wed)',
    dateOffset: 0,
    rainfallMm: 18.5,
    rainProbPct: 70,
    intensity: 'MODERATE',
    color: '#0284C7',
    icon: 'CloudRain',
    note: 'Intermittent afternoon showers'
  },
  {
    day: 'Tomorrow (Thu)',
    dateOffset: 1,
    rainfallMm: 46.2,
    rainProbPct: 92,
    intensity: 'HEAVY',
    color: '#F59E0B',
    icon: 'CloudRain',
    note: 'Monsoon squall front approaching'
  },
  {
    day: 'Friday',
    dateOffset: 2,
    rainfallMm: 68.0,
    rainProbPct: 98,
    intensity: 'EXTREME',
    color: '#EF4444',
    icon: 'CloudLightning',
    note: 'Catchment cloudburst warning'
  },
  {
    day: 'Saturday',
    dateOffset: 3,
    rainfallMm: 34.0,
    rainProbPct: 80,
    intensity: 'HEAVY',
    color: '#F59E0B',
    icon: 'CloudRain',
    note: 'Continuous steady downpour'
  },
  {
    day: 'Sunday',
    dateOffset: 4,
    rainfallMm: 14.5,
    rainProbPct: 45,
    intensity: 'LIGHT',
    color: '#38BDF8',
    icon: 'CloudRain',
    note: 'Scattered light drizzle'
  },
  {
    day: 'Monday',
    dateOffset: 5,
    rainfallMm: 3.0,
    rainProbPct: 20,
    intensity: 'LIGHT',
    color: '#10B981',
    icon: 'CloudSun',
    note: 'Partly cloudy sky'
  },
  {
    day: 'Tuesday',
    dateOffset: 6,
    rainfallMm: 0.0,
    rainProbPct: 10,
    intensity: 'NONE',
    color: '#10B981',
    icon: 'Sun',
    note: 'Clear dry weather'
  }
];

// Initial Drainage Network with at least 8 key drains
export const INITIAL_DRAINS = [
  {
    id: 'NODE-C-08',
    name: 'Urban Culvert Line C-8',
    zone: 'Industrial Sector (Ward 14)',
    type: 'Primary Storm Culvert',
    designCapacityLps: 850,
    inflowLps: 780,
    outflowLps: 210,
    blockagePct: 87.0,
    wastePct: 84.0,
    wasteBreakdown: { plastic: 48, silt: 32, vegetation: 14, other: 6 },
    lastMaintained: '2026-09-12 14:30',
    nextScheduled: '2026-10-16 09:00',
    status: 'OVERDUE',
    priority: 'URGENT',
    preRainRequired: true,
    historyEfficiency: [55, 52, 48, 42, 38, 32, 28, 25]
  },
  {
    id: 'NODE-WZ-04',
    name: 'River Basin North Weir Gate',
    zone: 'North Catchment (Ward 4)',
    type: 'Gravity Weir Sluice',
    designCapacityLps: 2400,
    inflowLps: 1820,
    outflowLps: 2040,
    blockagePct: 15.0,
    wastePct: 22.0,
    wasteBreakdown: { plastic: 15, silt: 45, vegetation: 35, other: 5 },
    lastMaintained: '2026-10-02 11:15',
    nextScheduled: '2026-10-22 10:00',
    status: 'OK',
    priority: 'LOW',
    preRainRequired: false,
    historyEfficiency: [88, 87, 86, 85, 85, 84, 85, 85]
  },
  {
    id: 'NODE-P-03',
    name: 'Central Underpass Pumping Sump',
    zone: 'CBD Sector (Ward 7)',
    type: 'Submersible Pump Basin',
    designCapacityLps: 620,
    inflowLps: 510,
    outflowLps: 340,
    blockagePct: 42.0,
    wastePct: 48.0,
    wasteBreakdown: { plastic: 40, silt: 25, vegetation: 20, other: 15 },
    lastMaintained: '2026-09-28 16:45',
    nextScheduled: '2026-10-17 11:30',
    status: 'DUE SOON',
    priority: 'HIGH',
    preRainRequired: true,
    historyEfficiency: [68, 65, 62, 58, 55, 55, 54, 55]
  },
  {
    id: 'NODE-SB-12',
    name: 'Siphon Retention Basin East',
    zone: 'East Catchment (Ward 9)',
    type: 'Siphon Overflow Spillway',
    designCapacityLps: 1200,
    inflowLps: 420,
    outflowLps: 1150,
    blockagePct: 4.0,
    wastePct: 12.0,
    wasteBreakdown: { plastic: 10, silt: 20, vegetation: 65, other: 5 },
    lastMaintained: '2026-10-08 09:30',
    nextScheduled: '2026-11-05 09:00',
    status: 'OK',
    priority: 'LOW',
    preRainRequired: false,
    historyEfficiency: [96, 96, 95, 95, 96, 95, 95, 96]
  },
  {
    id: 'NODE-D-03',
    name: 'Market Road Arterial Storm Drain',
    zone: 'Old City Center (Ward 3)',
    type: 'Masonry Box Drain',
    designCapacityLps: 720,
    inflowLps: 690,
    outflowLps: 245,
    blockagePct: 66.0,
    wastePct: 72.0,
    wasteBreakdown: { plastic: 60, silt: 18, vegetation: 12, other: 10 },
    lastMaintained: '2026-09-15 08:20',
    nextScheduled: '2026-10-16 14:00',
    status: 'OVERDUE',
    priority: 'URGENT',
    preRainRequired: true,
    historyEfficiency: [45, 42, 40, 38, 35, 34, 34, 34]
  },
  {
    id: 'NODE-D-07',
    name: 'Metro Rail Viaduct Storm Trench',
    zone: 'West Transit Hub (Ward 11)',
    type: 'Reinforced Concrete Trench',
    designCapacityLps: 950,
    inflowLps: 810,
    outflowLps: 440,
    blockagePct: 54.0,
    wastePct: 58.0,
    wasteBreakdown: { plastic: 35, silt: 35, vegetation: 20, other: 10 },
    lastMaintained: '2026-09-22 13:00',
    nextScheduled: '2026-10-17 15:00',
    status: 'DUE SOON',
    priority: 'HIGH',
    preRainRequired: true,
    historyEfficiency: [60, 58, 55, 52, 50, 48, 46, 46]
  },
  {
    id: 'NODE-D-09',
    name: 'Highland Bypass Hillside Culvert',
    zone: 'North Catchment (Ward 2)',
    type: 'Corrugated Steel Culvert',
    designCapacityLps: 540,
    inflowLps: 180,
    outflowLps: 480,
    blockagePct: 18.0,
    wastePct: 26.0,
    wasteBreakdown: { plastic: 10, silt: 60, vegetation: 25, other: 5 },
    lastMaintained: '2026-10-05 10:45',
    nextScheduled: '2026-10-28 09:30',
    status: 'OK',
    priority: 'MEDIUM',
    preRainRequired: false,
    historyEfficiency: [90, 89, 88, 88, 88, 89, 89, 89]
  },
  {
    id: 'NODE-D-14',
    name: 'Lake Overflow Spillway Canal',
    zone: 'South Lake Basin (Ward 18)',
    type: 'Trapezoidal Earthen Canal',
    designCapacityLps: 1600,
    inflowLps: 920,
    outflowLps: 1250,
    blockagePct: 24.0,
    wastePct: 35.0,
    wasteBreakdown: { plastic: 25, silt: 30, vegetation: 40, other: 5 },
    lastMaintained: '2026-09-29 15:10',
    nextScheduled: '2026-10-21 11:00',
    status: 'OK',
    priority: 'MEDIUM',
    preRainRequired: false,
    historyEfficiency: [82, 80, 79, 78, 78, 77, 78, 78]
  }
];

const STORAGE_KEY = 'floodguard_maintenance_jobs';

export class MaintenanceSimulationService {
  constructor(onUpdateCallback = null) {
    this.onUpdate = onUpdateCallback || (() => {});
    this.drains = this.loadDrains();
    this.scheduledJobs = this.loadScheduledJobs();
    this.timerId = null;
  }

  loadDrains() {
    return INITIAL_DRAINS.map(d => ({ ...d }));
  }

  loadScheduledJobs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    // Default pre-seeded scheduled jobs
    return [
      {
        id: 'JOB-2026-101',
        drainId: 'NODE-C-08',
        drainName: 'Urban Culvert Line C-8',
        scheduledDate: '2026-10-16',
        scheduledTime: '09:00',
        crew: 'Quick Response Desilting Crew Alpha (Vacuum Truck)',
        taskType: 'Heavy Silt Vacuum Desilting',
        status: 'SCHEDULED',
        priority: 'URGENT',
        preRainTag: true,
        notes: 'Pre-rain emergency clearing before Thu storm front.'
      },
      {
        id: 'JOB-2026-102',
        drainId: 'NODE-D-03',
        drainName: 'Market Road Arterial Storm Drain',
        scheduledDate: '2026-10-16',
        scheduledTime: '14:00',
        crew: 'Municipal Mechanical Sweeper Unit 4',
        taskType: 'Debris & Plastic Removal',
        status: 'SCHEDULED',
        priority: 'URGENT',
        preRainTag: true,
        notes: 'Clear clogged trash racks near main vegetable market.'
      },
      {
        id: 'JOB-2026-103',
        drainId: 'NODE-P-03',
        drainName: 'Central Underpass Pumping Sump',
        scheduledDate: '2026-10-17',
        scheduledTime: '11:30',
        crew: 'Emergency Drainage Clearing Cell 9',
        taskType: 'Blockage Jet-Rodding & Clearing',
        status: 'SCHEDULED',
        priority: 'HIGH',
        preRainTag: true,
        notes: 'Inspect dual submersible pumps and inlet grates.'
      }
    ];
  }

  saveScheduledJobs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scheduledJobs));
    } catch {
      // ignore
    }
  }

  start() {
    if (this.timerId) return;
    this.timerId = setInterval(() => this.tick(), 2500);
    this.notify();
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  tick() {
    // Gradual simulation drift
    this.drains.forEach(drain => {
      // Small random waste growth
      const rainFactor = SIMULATED_7DAY_FORECAST[0].rainfallMm > 15 
        ? MAINTENANCE_CONFIG.RAIN_WASTE_MULTIPLIER 
        : 1.0;
      const wasteDrift = (Math.random() * MAINTENANCE_CONFIG.BASE_WASTE_GROWTH_PER_TICK) * rainFactor;
      
      drain.wastePct = Math.min(98.0, parseFloat((drain.wastePct + wasteDrift).toFixed(1)));
      // Blockage scales with waste
      const targetBlockage = Math.min(95.0, (drain.wastePct * 0.95) + (Math.sin(Date.now() / 10000) * 1.5));
      drain.blockagePct = parseFloat(targetBlockage.toFixed(1));

      // Flow efficiency drops as blockage rises
      const maxPossibleOutflow = drain.designCapacityLps * Math.max(0.05, (1 - (drain.blockagePct / 100)));
      drain.outflowLps = Math.round(maxPossibleOutflow);
      
      // Calculate efficiency
      const eff = Math.min(100, Math.round((drain.outflowLps / drain.designCapacityLps) * 100));
      drain.historyEfficiency = [...drain.historyEfficiency.slice(1), eff];

      // Update maintenance status and priority
      this.deriveStatusAndPriority(drain);
    });

    this.notify();
  }

  deriveStatusAndPriority(drain) {
    if (drain.blockagePct >= MAINTENANCE_CONFIG.BLOCKAGE_PARTIAL_MAX || drain.wastePct >= MAINTENANCE_CONFIG.WASTE_CRITICAL_THRESHOLD) {
      drain.status = 'OVERDUE';
      drain.priority = 'URGENT';
      drain.preRainRequired = true;
    } else if (drain.blockagePct >= 35.0 || drain.wastePct >= 45.0) {
      drain.status = 'DUE SOON';
      drain.priority = 'HIGH';
      drain.preRainRequired = SIMULATED_7DAY_FORECAST[1].rainfallMm >= MAINTENANCE_CONFIG.FLOOD_RISK_RAIN_THRESHOLD_MM;
    } else if (drain.blockagePct >= 20.0) {
      drain.status = 'OK';
      drain.priority = 'MEDIUM';
      drain.preRainRequired = false;
    } else {
      drain.status = 'OK';
      drain.priority = 'LOW';
      drain.preRainRequired = false;
    }
  }

  // ==========================================
  // USER ACTIONS
  // ==========================================

  markMaintenanceComplete(drainId) {
    const drain = this.drains.find(d => d.id === drainId);
    if (!drain) return;

    // Reset waste & blockage close to zero
    drain.wastePct = parseFloat((Math.random() * 4 + 2).toFixed(1));
    drain.blockagePct = parseFloat((Math.random() * 3 + 1).toFixed(1));
    
    // Outflow recovers to near 100%
    drain.outflowLps = Math.round(drain.designCapacityLps * 0.96);
    drain.historyEfficiency = [...drain.historyEfficiency.slice(1), 96];

    // Update timestamps
    const now = new Date();
    const nowStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
    drain.lastMaintained = nowStr;

    // Calculate next date (30 days default)
    const nextDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    drain.nextScheduled = `${nextDate.toISOString().split('T')[0]} 09:00`;
    
    drain.status = 'OK';
    drain.priority = 'LOW';
    drain.preRainRequired = false;

    // Update any matching scheduled job to COMPLETED
    this.scheduledJobs = this.scheduledJobs.map(job => {
      if (job.drainId === drainId && job.status === 'SCHEDULED') {
        return { ...job, status: 'COMPLETED' };
      }
      return job;
    });
    this.saveScheduledJobs();

    this.notify();
  }

  scheduleJob(jobData) {
    const newJob = {
      id: `JOB-${Date.now().toString().slice(-6)}`,
      status: 'SCHEDULED',
      ...jobData
    };

    this.scheduledJobs.unshift(newJob);
    this.saveScheduledJobs();

    // Update drain's next scheduled time
    const drain = this.drains.find(d => d.id === jobData.drainId);
    if (drain) {
      drain.nextScheduled = `${jobData.scheduledDate} ${jobData.scheduledTime}`;
      drain.status = 'IN PROGRESS';
    }

    this.notify();
  }

  getAutoSuggestedDate(drainId) {
    const drain = this.drains.find(d => d.id === drainId) || this.drains[0];
    const now = new Date();

    // If heavy rain forecast within next 48h and drain is URGENT/HIGH, schedule before rain
    const heavyRainDay = SIMULATED_7DAY_FORECAST.find(f => f.rainfallMm >= MAINTENANCE_CONFIG.FLOOD_RISK_RAIN_THRESHOLD_MM);
    
    let hoursToAdd = 72;
    let isPreRain = false;

    if (heavyRainDay && (drain.priority === 'URGENT' || drain.priority === 'HIGH')) {
      hoursToAdd = Math.max(6, (heavyRainDay.dateOffset * 24) - 12); // Schedule 12h before rain
      isPreRain = true;
    } else {
      hoursToAdd = MAINTENANCE_CONFIG.SCHEDULE_RULES_HOURS[drain.priority] || 72;
    }

    const suggestedTarget = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    const dateStr = suggestedTarget.toISOString().split('T')[0];
    const timeStr = '09:00';

    return {
      date: dateStr,
      time: timeStr,
      priority: drain.priority,
      preRainTag: isPreRain,
      reason: isPreRain 
        ? `Pre-Rain Clean: ${heavyRainDay.day} has ${heavyRainDay.rainfallMm}mm rain forecast` 
        : `Rule: ${drain.priority} priority SLA (${hoursToAdd}h)`
    };
  }

  notify() {
    const drainsOk = this.drains.filter(d => d.status === 'OK').length;
    const drainsDueSoon = this.drains.filter(d => d.status === 'DUE SOON').length;
    const drainsOverdue = this.drains.filter(d => d.status === 'OVERDUE').length;
    
    const avgBlockage = (this.drains.reduce((acc, d) => acc + d.blockagePct, 0) / this.drains.length).toFixed(1);
    const avgWaste = (this.drains.reduce((acc, d) => acc + d.wastePct, 0) / this.drains.length).toFixed(1);

    // Next scheduled job
    const activeJobs = this.scheduledJobs
      .filter(j => j.status === 'SCHEDULED')
      .sort((a, b) => new Date(`${a.scheduledDate} ${a.scheduledTime}`) - new Date(`${b.scheduledDate} ${b.scheduledTime}`));

    const nextJob = activeJobs.length > 0 ? activeJobs[0] : null;

    // Next 24h rainfall
    const next24hRain = SIMULATED_7DAY_FORECAST[1].rainfallMm;

    this.onUpdate({
      drains: this.drains.map(d => ({ ...d })),
      scheduledJobs: [...this.scheduledJobs],
      summary: {
        drainsOk,
        drainsDueSoon,
        drainsOverdue,
        totalDrains: this.drains.length,
        avgBlockagePct: parseFloat(avgBlockage),
        avgWastePct: parseFloat(avgWaste),
        nextJob,
        next24hRainMm: next24hRain,
        forecast: SIMULATED_7DAY_FORECAST
      }
    });
  }
}
