/**
 * ============================================================================
 * SENSAFLOW — LORA (LONG RANGE) COMMUNICATION SIMULATION SERVICE (loraSim.js)
 * ============================================================================
 * 
 * Simulates a municipal sub-GHz LoRa mesh/star network for edge IoT drain sensors:
 * - Operates in the 865-867 MHz India license-free ISM band (LoRa CSS).
 * - Compact 24-byte binary packets for minimal airtime and multi-year battery life.
 * - Dynamic RSSI/SNR fluctuations with simulated rain fade.
 * - Adaptive Data Rate (ADR) spreading factor scaling (SF7 to SF12).
 * - Gateway backhaul management (Cellular, Wi-Fi, Offline buffer mode).
 * - Fault injection: cellular outage, gateway failure, node out-of-range.
 * 
 * NOTE: This service can be replaced with a live MQTT/HTTP gateway broker
 * (e.g., The Things Network, ChirpStack, or private LoRaWAN gateway) in production.
 * ============================================================================
 */

export const LORA_CONFIG = {
  // RF Band and Modulation
  BAND: '865-867 MHz (India Licence-Free ISM)',
  MODULATION: 'LoRa CSS (Chirp Spread Spectrum)',
  PACKET_SIZE_BYTES: 24,

  // Transmission frequencies
  TX_INTERVAL_NORMAL_SEC: 60,   // Routine telemetry uplink rate
  TX_INTERVAL_CRITICAL_SEC: 10, // Emergency fast telemetry uplink rate
  
  // RF Link Budget Parameters
  RSSI_MIN_DBM: -120,           // Sensitivity threshold
  RSSI_MAX_DBM: -70,            // Strong line-of-sight signal
  SNR_MIN_DB: -15,              // Sub-noise floor demodulation limit
  SNR_MAX_DB: 12,               // Clean signal-to-noise ratio
  
  // Rain Fade / Atmospheric attenuation
  RAIN_FADE_RSSI_DB: 4.5,       // Additional path loss during heavy rainfall
  RAIN_FADE_SNR_DB: 3.0,        // Thermal noise elevation from storm rain

  // Packet Loss Probability
  BASE_PACKET_LOSS_RATE: 0.02,  // 2% nominal ambient packet loss
  RAIN_PACKET_LOSS_RATE: 0.06,  // 6% packet loss during storms
  
  // Spreading Factors (ADR scale)
  SPREADING_FACTORS: ['SF7', 'SF8', 'SF9', 'SF10', 'SF11', 'SF12']
};

export const PACKET_SPEC = [
  { field: 'Node ID', bytes: '2B', desc: 'Unique uint16 edge device identifier' },
  { field: 'Timestamp', bytes: '4B', desc: 'Epoch seconds (UTC) edge telemetry timestamp' },
  { field: 'Water Level', bytes: '2B', desc: 'Ultrasonic depth in cm (0.1 cm resolution)' },
  { field: 'Level %', bytes: '1B', desc: 'Percentage of channel depth capacity (0-100%)' },
  { field: 'Battery %', bytes: '1B', desc: 'Solar lithium-iron battery reserve (0-100%)' },
  { field: 'Alert State', bytes: '1B', desc: '0=NORMAL, 1=WARNING, 2=CRITICAL' },
  { field: 'Blockage Flag', bytes: '1B', desc: 'Silt / acoustic blockage indicator mask' },
  { field: 'Telemetry Flags', bytes: '11B', desc: 'Flow velocity, rain rate, tamper bit, sequence' },
  { field: 'CRC Checksum', bytes: '2B', desc: 'Cyclic redundancy check for payload integrity' }
];

export class LoRaSimulationService {
  constructor(initialNodes = [], onUpdateCallback = null, onLogCallback = null) {
    this.onUpdate = onUpdateCallback || (() => {});
    this.onLog = onLogCallback || (() => {});

    // Fault state flags
    this.faultCellularOutage = false;
    this.faultGatewayFailure = false;
    this.faultNodeOutOfRange = null; // node ID string or null

    // Gateway state
    this.gateway = {
      id: 'GW-HYD-01',
      name: 'Municipal Ward-9 LoRa Gateway (Tower Alpha)',
      status: 'ONLINE', // 'ONLINE' | 'OFFLINE'
      backhaul: 'CELLULAR', // 'CELLULAR' | 'WI-FI' | 'OFFLINE (Buffering)'
      bufferedPackets: 0,
      ip67Temperature: 38.5,
      frequencyMhz: 866.5
    };

    // Global Telemetry Counters
    this.counters = {
      packetsSentToday: 14280,
      packetsReceivedToday: 13994,
      packetsLostToday: 286
    };

    // Node Radio States
    this.nodes = initialNodes.map((n, idx) => ({
      id: n.id,
      location: n.location,
      status: n.status || 'NORMAL',
      rssiDbm: -82 - (idx * 7),
      snrDb: 9.5 - (idx * 2.5),
      spreadingFactor: 'SF7',
      linkQuality: 'EXCELLENT', // 'EXCELLENT' | 'GOOD' | 'WEAK' | 'LOST'
      batteryPct: 94 - (idx * 3),
      successRatePct: 98.4,
      lastUplinkSec: 4 + idx * 3,
      isOutOfRange: false
    }));

    this.timerId = null;
  }

  start() {
    if (this.timerId) return;
    this.logEvent('LoRa Gateway GW-HYD-01 online (865-867 MHz India ISM)', 'info');
    this.timerId = setInterval(() => this.tick(), 1500);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // ==========================================
  // FAULT INJECTION CONTROLS
  // ==========================================
  toggleCellularOutage() {
    this.faultCellularOutage = !this.faultCellularOutage;
    if (this.faultCellularOutage) {
      this.gateway.backhaul = 'OFFLINE (Buffering)';
      this.logEvent('FAULT: Cellular backhaul tower outage! LoRa gateway switched to local flash buffering mode.', 'warning');
    } else {
      const flushed = this.gateway.bufferedPackets;
      this.gateway.backhaul = 'CELLULAR';
      this.gateway.bufferedPackets = 0;
      this.logEvent(`RECOVERY: Cellular backhaul restored. Flushed ${flushed} buffered packets to Command Cloud.`, 'action');
    }
    this.notify();
  }

  toggleGatewayFailure() {
    this.faultGatewayFailure = !this.faultGatewayFailure;
    if (this.faultGatewayFailure) {
      this.gateway.status = 'OFFLINE';
      this.gateway.backhaul = 'OFFLINE';
      this.logEvent('CRITICAL FAULT: LoRa Gateway hardware power failure! All node uplinks LOST.', 'critical');
    } else {
      this.gateway.status = 'ONLINE';
      this.gateway.backhaul = this.faultCellularOutage ? 'OFFLINE (Buffering)' : 'CELLULAR';
      this.logEvent('RECOVERY: LoRa Gateway restarted; node handshake packets re-established.', 'action');
    }
    this.notify();
  }

  toggleNodeOutOfRange(nodeId) {
    if (this.faultNodeOutOfRange === nodeId) {
      this.faultNodeOutOfRange = null;
      this.logEvent(`RECOVERY: Node ${nodeId} signal restored to LoRa mesh.`, 'action');
    } else {
      this.faultNodeOutOfRange = nodeId;
      this.logEvent(`FAULT: Node ${nodeId} antenna obstructed / out of range. Uplink marked as LOST.`, 'warning');
    }
    this.notify();
  }

  // ==========================================
  // SIMULATION TICK
  // ==========================================
  tick() {
    const isGwDown = this.faultGatewayFailure;
    const isBuffering = this.faultCellularOutage && !isGwDown;

    this.nodes.forEach(node => {
      // Advance uplink time
      node.lastUplinkSec = (node.lastUplinkSec + 1.5) % 60;

      // Check if node is specifically faulted or gateway is down
      const isNodeDown = isGwDown || this.faultNodeOutOfRange === node.id;
      node.isOutOfRange = isNodeDown;

      if (isNodeDown) {
        node.rssiDbm = -128;
        node.snrDb = -18.0;
        node.spreadingFactor = 'SF12';
        node.linkQuality = 'LOST';
        node.successRatePct = Math.max(0, parseFloat((node.successRatePct - 0.5).toFixed(1)));
        this.counters.packetsLostToday += 1;
        return;
      }

      // Small jitter on RSSI (+/- 1.5 dBm)
      const rssiNoise = (Math.random() * 3 - 1.5);
      const isCriticalDrain = node.status === 'CRITICAL';

      // Heavy rain fade simulation
      const rainFadeRssi = isCriticalDrain ? LORA_CONFIG.RAIN_FADE_RSSI_DB : 0;
      const rainFadeSnr = isCriticalDrain ? LORA_CONFIG.RAIN_FADE_SNR_DB : 0;

      let baseRssi = -88 - (Math.sin(Date.now() / 8000) * 8);
      if (node.id.includes('C-08')) baseRssi = -94; // slightly farther node
      if (node.id.includes('SB-12')) baseRssi = -76; // near node

      node.rssiDbm = Math.round(Math.max(-122, Math.min(-68, baseRssi + rssiNoise - rainFadeRssi)));

      // SNR calculation
      const snrNoise = (Math.random() * 1.0 - 0.5);
      const baseSnr = ((node.rssiDbm + 120) / 50) * 15 - 5;
      node.snrDb = parseFloat(Math.max(-14, Math.min(12, baseSnr + snrNoise - rainFadeSnr)).toFixed(1));

      // Adaptive Data Rate (ADR) algorithm: Spreading Factor adjusts to maintain link margin
      if (node.rssiDbm > -85 && node.snrDb > 5) {
        node.spreadingFactor = 'SF7';
        node.linkQuality = 'EXCELLENT';
      } else if (node.rssiDbm > -98 && node.snrDb > 0) {
        node.spreadingFactor = 'SF8';
        node.linkQuality = 'GOOD';
      } else if (node.rssiDbm > -108 && node.snrDb > -6) {
        node.spreadingFactor = 'SF10';
        node.linkQuality = 'WEAK';
      } else {
        node.spreadingFactor = 'SF12';
        node.linkQuality = 'WEAK';
      }

      // Random packet loss calculation
      const lossProb = isCriticalDrain ? LORA_CONFIG.RAIN_PACKET_LOSS_RATE : LORA_CONFIG.BASE_PACKET_LOSS_RATE;
      const isLost = Math.random() < lossProb;

      this.counters.packetsSentToday += 1;
      if (isLost) {
        this.counters.packetsLostToday += 1;
        node.successRatePct = parseFloat(Math.max(88, node.successRatePct - 0.1).toFixed(1));
      } else {
        this.counters.packetsReceivedToday += 1;
        node.successRatePct = parseFloat(Math.min(99.8, node.successRatePct + 0.05).toFixed(1));
      }

      // If gateway is buffering, accumulate in local memory
      if (isBuffering && !isLost) {
        this.gateway.bufferedPackets = Math.min(LORA_CONFIG.BUFFER_MAX_PACKETS, this.gateway.bufferedPackets + 1);
      }
    });

    this.notify();
  }

  logEvent(message, type = 'info') {
    const timeStr = new Date().toTimeString().split(' ')[0];
    this.onLog({
      timestamp: timeStr,
      message: `[SIMULATED] ${message}`,
      type
    });
  }

  notify() {
    const nodesOnline = this.nodes.filter(n => !n.isOutOfRange).length;
    const totalNodes = this.nodes.length;

    this.onUpdate({
      gateway: { ...this.gateway },
      nodes: this.nodes.map(n => ({ ...n })),
      nodesOnline,
      totalNodes,
      counters: { ...this.counters },
      faults: {
        cellularOutage: this.faultCellularOutage,
        gatewayFailure: this.faultGatewayFailure,
        nodeOutOfRange: this.faultNodeOutOfRange
      }
    });
  }
}
