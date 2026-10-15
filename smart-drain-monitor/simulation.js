/**
 * ============================================================================
 * SMART DRAIN MONITOR - SIMULATION ENGINE (simulation.js)
 * ============================================================================
 * 
 * Physics Model:
 * Mass-balance reservoir model:
 *   dLevel/dt = Inflow - Outflow
 * 
 * Where:
 *   - Inflow (cm/s): determined by rainfall intensity / urban runoff scenario.
 *   - Outflow (cm/s): Torricelli / orifice-inspired drainage flow:
 *       Outflow = BaseOutflow * (1 - BlockageFraction) * sqrt(Level / MaxDepth)
 *     As water head (Level) increases, gravitational discharge pressure increases.
 *     Obstructions (BlockageFraction 0.0 to 1.0) reduce effective discharge aperture.
 *   - Sensor Jitter: Small Gaussian-like noise (+/- 0.3 cm) added to simulate
 *     ultrasonic transducer reflections, surface ripples, and ADC resolution.
 * 
 * Alert Logic:
 *   - State machine with Hysteresis (3% = 1.8 cm on 60 cm scale) to eliminate
 *     rapid flickering at threshold boundaries.
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================
  // TUNABLE CONSTANTS (Modify for calibrations)
  // ==========================================
  const CONFIG = {
  // Physical drain dimensions
  MAX_DEPTH_CM: 60.0,           // Maximum channel depth before complete overflow (cm)
  WARNING_PERCENT: 50.0,         // Warning threshold percentage (50% = 30.0 cm)
  CRITICAL_PERCENT: 80.0,        // Critical threshold percentage (80% = 48.0 cm)
  HYSTERESIS_PERCENT: 3.0,       // Hysteresis deadband in percentage (3% = 1.8 cm)

  // Hydraulic parameters
  BASE_OUTFLOW_RATE: 3.2,        // Peak discharge velocity when full & unblocked (cm/s)
  MIN_OUTFLOW_LEAK: 0.05,        // Small residual drainage even under near-complete blockage (cm/s)
  
  // Rain / Inflow presets (cm/s)
  RAIN_PRESETS: {
    none: 0.0,
    light: 1.2,                  // Normal baseline dry-weather or light trickle
    heavy: 4.2,                  // Heavy storm inflow exceeding baseline outflow
    extreme: 6.8                 // Cloudburst / flash flood inflow
  },

  // Measurement jitter
  SENSOR_JITTER_CM: 0.3,         // Ultrasonic sensor precision noise (+/- cm)

  // Simulation loop
  TICK_INTERVAL_MS: 1000,        // 1-second simulation clock
  HISTORY_MAX_POINTS: 60         // Keep last 60 readings for 1-minute real-time line chart
};

class DrainSimulation {
  constructor(onTickCallback, onLogCallback) {
    this.onTick = onTickCallback || (() => {});
    this.onLog = onLogCallback || (() => {});

    // State Variables
    this.trueLevel = 10.5;                // Physical true water depth in cm (starts in normal band)
    this.measuredLevel = 10.5;            // Simulated sensor reading (includes jitter)
    this.rainfallKey = 'light';           // 'none' | 'light' | 'heavy' | 'extreme'
    this.inflowRate = CONFIG.RAIN_PRESETS.light;
    this.outflowRate = 1.2;
    this.blockage = 0.0;                  // 0.0 (0%) to 1.0 (100%)
    this.targetBlockage = null;           // For gradual obstruction removal
    this.isPaused = false;
    this.timerId = null;

    // Fault Injection Flags
    this.sensorDisconnected = false;
    this.controllerOffline = false;
    this.frozenReading = null;            // Frozen reading when sensor disconnects

    // Alert State with Hysteresis
    this.alertState = 'NORMAL';           // 'NORMAL' | 'WARNING' | 'CRITICAL'
    this.lastStateTransition = null;

    // History for chart
    this.history = []; // Array of { timestamp, level, alertState, isStale }

    // Initialize history with 30 baseline readings so chart starts with a clean view
    this.initHistory();
  }

  initHistory() {
    const now = Date.now();
    for (let i = CONFIG.HISTORY_MAX_POINTS; i >= 0; i--) {
      const pastTime = new Date(now - i * 1000);
      const timeStr = pastTime.toTimeString().split(' ')[0];
      const baselineVal = 10.0 + (Math.sin(i * 0.3) * 0.4);
      this.history.push({
        timestamp: timeStr,
        level: parseFloat(baselineVal.toFixed(1)),
        alertState: 'NORMAL',
        isStale: false
      });
    }
  }

  start() {
    if (this.timerId) return;
    this.log('Simulation engine started [1.0s clock active]', 'info');
    this.timerId = setInterval(() => this.tick(), CONFIG.TICK_INTERVAL_MS);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.log(`Simulation ${this.isPaused ? 'PAUSED' : 'RESUMED'}`, 'info');
    return this.isPaused;
  }

  reset() {
    this.trueLevel = 9.8;
    this.measuredLevel = 9.8;
    this.rainfallKey = 'light';
    this.inflowRate = CONFIG.RAIN_PRESETS.light;
    this.blockage = 0.0;
    this.targetBlockage = null;
    this.sensorDisconnected = false;
    this.controllerOffline = false;
    this.frozenReading = null;
    this.alertState = 'NORMAL';
    this.history = [];
    this.initHistory();
    this.log('Simulation reset to baseline factory parameters', 'warning');
    this.notifyUpdate();
  }

  // ==========================================
  // SCENARIO PRESETS
  // ==========================================
  applyScenario(scenarioId) {
    switch (scenarioId) {
      case 'normal':
        this.rainfallKey = 'light';
        this.inflowRate = CONFIG.RAIN_PRESETS.light;
        this.blockage = 0.0;
        this.targetBlockage = null;
        this.log('Scenario activated: [1. NORMAL CONDITION] - Light flow, clear outlet', 'scenario');
        break;

      case 'heavy_rain':
        this.rainfallKey = 'heavy';
        this.inflowRate = CONFIG.RAIN_PRESETS.heavy;
        this.blockage = 0.0;
        this.targetBlockage = null;
        this.log('Scenario activated: [2. HEAVY RAINFALL] - Sharp inflow increase (4.2 cm/s)', 'scenario');
        break;

      case 'drainage_blockage':
        this.rainfallKey = 'light';
        this.inflowRate = CONFIG.RAIN_PRESETS.light;
        this.blockage = 0.50;
        this.targetBlockage = null;
        this.log('Scenario activated: [3. DRAINAGE BLOCKAGE] - Silt/debris obstruction (50% blockage)', 'scenario');
        break;

      case 'severe_blockage':
        this.rainfallKey = 'light';
        this.inflowRate = CONFIG.RAIN_PRESETS.light;
        this.blockage = 0.90;
        this.targetBlockage = null;
        this.log('Scenario activated: [4. SEVERE BLOCKAGE] - Outlet 90% blocked, imminent overflow risk', 'scenario');
        break;

      case 'combined':
        this.rainfallKey = 'heavy';
        this.inflowRate = CONFIG.RAIN_PRESETS.heavy;
        this.blockage = 0.55;
        this.targetBlockage = null;
        this.log('Scenario activated: [5. COMBINED] - Heavy rainfall storm + 55% partial blockage', 'scenario');
        break;

      default:
        console.warn('Unknown scenario:', scenarioId);
    }
    this.notifyUpdate();
  }

  // ==========================================
  // MANUAL CONTROLS
  // ==========================================
  setRainfall(presetKey) {
    if (CONFIG.RAIN_PRESETS[presetKey] !== undefined) {
      this.rainfallKey = presetKey;
      this.inflowRate = CONFIG.RAIN_PRESETS[presetKey];
      this.log(`Rainfall intensity set to: ${presetKey.toUpperCase()} (${this.inflowRate} cm/s)`, 'control');
      this.notifyUpdate();
    }
  }

  setBlockage(percentage) {
    // Percentage 0 - 100
    this.blockage = Math.max(0, Math.min(100, percentage)) / 100.0;
    this.targetBlockage = null;
    this.log(`Outlet blockage manually set to: ${Math.round(this.blockage * 100)}%`, 'control');
    this.notifyUpdate();
  }

  removeObstruction() {
    this.targetBlockage = 0.0;
    this.log('Obstruction removal initiated - drain clearing gradually', 'action');
    this.notifyUpdate();
  }

  // ==========================================
  // FAULT SIMULATION TOGGLES
  // ==========================================
  toggleSensorDisconnect() {
    this.sensorDisconnected = !this.sensorDisconnected;
    if (this.sensorDisconnected) {
      this.frozenReading = this.measuredLevel;
      this.log('FAULT INJECTED: Ultrasonic sensor disconnected [Signal lost, values frozen as STALE]', 'fault');
    } else {
      this.frozenReading = null;
      this.log('FAULT CLEARED: Ultrasonic sensor reconnected and communicating', 'fault');
    }
    this.notifyUpdate();
  }

  toggleControllerOffline() {
    this.controllerOffline = !this.controllerOffline;
    if (this.controllerOffline) {
      this.log('FAULT INJECTED: ESP32 Controller offline [Telemetry halted, alerts not transmitted]', 'fault');
    } else {
      this.log('FAULT CLEARED: ESP32 Controller online [Telemetry and heartbeat restored]', 'fault');
    }
    this.notifyUpdate();
  }

  // ==========================================
  // SIMULATION TICK
  // ==========================================
  tick() {
    if (this.isPaused) return;

    const dt = 1.0; // 1 second time-step

    // Gradual blockage clearing if obstruction removal requested
    if (this.targetBlockage !== null) {
      if (this.blockage > this.targetBlockage) {
        this.blockage = Math.max(this.targetBlockage, this.blockage - 0.15);
        if (this.blockage === this.targetBlockage) {
          this.targetBlockage = null;
          this.log('Obstruction fully cleared - outlet aperture 100% open', 'action');
        }
      }
    }

    // Outflow calculation based on Torricelli's Law:
    // Outflow scales with sqrt of water head ratio (Level / MaxDepth)
    const headRatio = Math.max(0, this.trueLevel / CONFIG.MAX_DEPTH_CM);
    const headFactor = Math.sqrt(headRatio);
    const effectiveAperture = Math.max(0.02, 1.0 - this.blockage);
    this.outflowRate = (CONFIG.BASE_OUTFLOW_RATE * effectiveAperture * headFactor) + 
                       (this.trueLevel > 0.5 ? CONFIG.MIN_OUTFLOW_LEAK : 0);

    // Mass-balance level update
    const netRate = this.inflowRate - this.outflowRate;
    this.trueLevel = Math.max(0.0, Math.min(CONFIG.MAX_DEPTH_CM, this.trueLevel + (netRate * dt)));

    // Measurement simulation: add small sensor noise jitter (+/- 0.3 cm)
    const jitter = (Math.random() * 2 - 1) * CONFIG.SENSOR_JITTER_CM;
    const noisyLevel = Math.max(0.0, Math.min(CONFIG.MAX_DEPTH_CM, this.trueLevel + jitter));

    // If sensor disconnected, freeze reading at last known value
    if (this.sensorDisconnected) {
      this.measuredLevel = this.frozenReading !== null ? this.frozenReading : noisyLevel;
    } else {
      this.measuredLevel = parseFloat(noisyLevel.toFixed(1));
    }

    // Determine Alert State using Hysteresis
    this.updateAlertState(this.measuredLevel);

    // Record History Point
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    this.history.push({
      timestamp: timeStr,
      level: this.measuredLevel,
      alertState: this.alertState,
      isStale: this.sensorDisconnected
    });

    if (this.history.length > CONFIG.HISTORY_MAX_POINTS) {
      this.history.shift();
    }

    this.notifyUpdate();
  }

  // ==========================================
  // HYSTERESIS ALERT STATE MACHINE
  // ==========================================
  updateAlertState(level) {
    const depth = CONFIG.MAX_DEPTH_CM;
    const warnThreshold = (CONFIG.WARNING_PERCENT / 100) * depth;       // 30.0 cm (50%)
    const critThreshold = (CONFIG.CRITICAL_PERCENT / 100) * depth;      // 48.0 cm (80%)
    const hystDelta = (CONFIG.HYSTERESIS_PERCENT / 100) * depth;        // 1.8 cm (3%)

    const prevState = this.alertState;
    let nextState = prevState;

    if (prevState === 'NORMAL') {
      if (level >= warnThreshold) {
        nextState = 'WARNING';
      }
      if (level >= critThreshold) {
        nextState = 'CRITICAL';
      }
    } else if (prevState === 'WARNING') {
      // Must drop below (30.0 - 1.8 = 28.2 cm) to return to NORMAL
      if (level < (warnThreshold - hystDelta)) {
        nextState = 'NORMAL';
      } else if (level >= critThreshold) {
        nextState = 'CRITICAL';
      }
    } else if (prevState === 'CRITICAL') {
      // Must drop below (48.0 - 1.8 = 46.2 cm) to step down to WARNING
      if (level < (critThreshold - hystDelta)) {
        if (level < (warnThreshold - hystDelta)) {
          nextState = 'NORMAL';
        } else {
          nextState = 'WARNING';
        }
      }
    }

    if (nextState !== prevState) {
      this.alertState = nextState;
      const pct = ((level / depth) * 100).toFixed(0);
      this.log(`ALERT STATE TRANSITION: ${prevState} -> ${nextState} (Level: ${level.toFixed(1)} cm / ${pct}%)`, 
               nextState === 'CRITICAL' ? 'critical' : nextState === 'WARNING' ? 'warning' : 'info');
    }
  }

  getAlertDetails() {
    switch (this.alertState) {
      case 'NORMAL':
        return {
          state: 'NORMAL',
          color: '#10b981', // green
          badgeClass: 'badge-normal',
          message: 'Drain flowing normally'
        };
      case 'WARNING':
        return {
          state: 'WARNING',
          color: '#f59e0b', // amber
          badgeClass: 'badge-warning',
          message: 'Water level rising - monitor drain'
        };
      case 'CRITICAL':
        return {
          state: 'CRITICAL',
          color: '#ef4444', // red
          badgeClass: 'badge-critical',
          message: 'Overflow risk - clear blockage immediately'
        };
      default:
        return {
          state: 'NORMAL',
          color: '#10b981',
          badgeClass: 'badge-normal',
          message: 'Drain flowing normally'
        };
    }
  }

  log(message, type = 'info') {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const entry = {
      timestamp: timeStr,
      message,
      type
    };
    this.onLog(entry);
  }

  notifyUpdate() {
    const alertInfo = this.getAlertDetails();
    const percentage = Math.min(100, Math.max(0, (this.measuredLevel / CONFIG.MAX_DEPTH_CM) * 100));

    const stateSnapshot = {
      levelCm: this.measuredLevel,
      trueLevelCm: this.trueLevel,
      percentage: parseFloat(percentage.toFixed(1)),
      maxDepthCm: CONFIG.MAX_DEPTH_CM,
      inflowRate: parseFloat(this.inflowRate.toFixed(2)),
      outflowRate: parseFloat(this.outflowRate.toFixed(2)),
      netRate: parseFloat((this.inflowRate - this.outflowRate).toFixed(2)),
      blockagePercent: Math.round(this.blockage * 100),
      rainfallKey: this.rainfallKey,
      isPaused: this.isPaused,
      sensorDisconnected: this.sensorDisconnected,
      controllerOffline: this.controllerOffline,
      alert: alertInfo,
      history: [...this.history],
      lastTimestamp: this.history.length > 0 ? this.history[this.history.length - 1].timestamp : '--:--:--'
    };

    this.onTick(stateSnapshot);
  }
}

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.DrainSimulation = DrainSimulation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, DrainSimulation };
}
})();
