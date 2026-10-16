/**
 * ============================================================================
 * SMART DRAIN MONITOR - UI & RENDERING LOGIC (ui.js)
 * ============================================================================
 * Handles DOM updates, HTML5 Canvas live line chart rendering,
 * dynamic SVG drain cross-section rendering, user controls, and event logging.
 * ============================================================================
 */
(function () {
  'use strict';

  // Access globals from simulation.js
  const CONFIG = window.CONFIG;
  const DrainSimulation = window.DrainSimulation;

  class DrainUI {
  constructor() {
    // Instantiate engine with callback hooks
    this.sim = new DrainSimulation(
      (state) => this.render(state),
      (logEntry) => this.addLog(logEntry)
    );

    this.chartCanvas = document.getElementById('chart-canvas');
    this.chartCtx = this.chartCanvas ? this.chartCanvas.getContext('2d') : null;

    this.initDOM();
    this.initEventListeners();
    this.setupChartCanvasResize();

    // Start simulation
    this.sim.start();
  }

  initDOM() {
    // Cache frequently updated elements
    this.elLevelCm = document.getElementById('val-level-cm');
    this.elLevelPct = document.getElementById('val-level-pct');
    this.elTankWater = document.getElementById('tank-water-fill');
    this.elLastReading = document.getElementById('val-last-reading');
    this.elStaleBadge = document.getElementById('stale-indicator');

    // Connection statuses
    this.elSensorDot = document.getElementById('sensor-dot');
    this.elSensorText = document.getElementById('sensor-text');
    this.elControllerDot = document.getElementById('controller-dot');
    this.elControllerText = document.getElementById('controller-text');

    // Alert Badge
    this.elAlertBadge = document.getElementById('alert-badge');
    this.elAlertText = document.getElementById('alert-badge-text');
    this.elAlertMessage = document.getElementById('alert-message');
    this.elTransmissionNote = document.getElementById('transmission-warning-note');

    // Parameters panel
    this.elParamInflow = document.getElementById('param-inflow');
    this.elParamOutflow = document.getElementById('param-outflow');
    this.elParamNet = document.getElementById('param-net');
    this.elParamBlockage = document.getElementById('param-blockage');

    // Control inputs
    this.sliderBlockage = document.getElementById('slider-blockage');
    this.valBlockageDisplay = document.getElementById('val-blockage-display');
    this.btnPause = document.getElementById('btn-pause');
    this.switchSensor = document.getElementById('switch-sensor-fault');
    this.switchController = document.getElementById('switch-controller-fault');

    // Event Log
    this.elLogContainer = document.getElementById('log-scroll-area');

    // Cross section SVG dynamic elements
    this.svgWaterRect = document.getElementById('svg-water-rect');
    this.svgWaterSurfaceLine = document.getElementById('svg-water-surface-line');
    this.svgObstructionGroup = document.getElementById('svg-obstruction-group');
    this.svgUltrasonicBeams = document.getElementById('svg-ultrasonic-beams');
    this.svgLevelMarkerText = document.getElementById('svg-water-level-text');
  }

  initEventListeners() {
    // Scenario Buttons
    const scenarioBtns = document.querySelectorAll('.btn-scenario');
    scenarioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = btn.getAttribute('data-scenario');
        scenarioBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sim.applyScenario(scenario);
        this.syncControlInputs();
      });
    });

    // Rainfall Presets
    const rainBtns = document.querySelectorAll('.btn-preset');
    rainBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rainKey = btn.getAttribute('data-rain');
        rainBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sim.setRainfall(rainKey);
      });
    });

    // Blockage Slider
    if (this.sliderBlockage) {
      this.sliderBlockage.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (this.valBlockageDisplay) this.valBlockageDisplay.textContent = `${val}%`;
        this.sim.setBlockage(val);
      });
    }

    // Action Buttons
    const btnRemoveObstruction = document.getElementById('btn-remove-obstruction');
    if (btnRemoveObstruction) {
      btnRemoveObstruction.addEventListener('click', () => {
        this.sim.removeObstruction();
        if (this.sliderBlockage) this.sliderBlockage.value = 0;
        if (this.valBlockageDisplay) this.valBlockageDisplay.textContent = '0%';
      });
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.sim.reset();
        this.syncControlInputs();
      });
    }

    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => {
        const isPaused = this.sim.togglePause();
        this.btnPause.innerHTML = isPaused 
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
      });
    }

    // Fault Toggles
    if (this.switchSensor) {
      this.switchSensor.addEventListener('change', () => {
        this.sim.toggleSensorDisconnect();
      });
    }

    if (this.switchController) {
      this.switchController.addEventListener('change', () => {
        this.sim.toggleControllerOffline();
      });
    }

    // Keyboard Accessibility for key shortcuts (Space to pause, R to reset)
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.btnPause) this.btnPause.click();
      }
    });
  }

  syncControlInputs() {
    // Update blockage slider
    if (this.sliderBlockage) {
      const pct = Math.round(this.sim.blockage * 100);
      this.sliderBlockage.value = pct;
      if (this.valBlockageDisplay) this.valBlockageDisplay.textContent = `${pct}%`;
    }

    // Update rainfall buttons
    const rainBtns = document.querySelectorAll('.btn-preset');
    rainBtns.forEach(btn => {
      if (btn.getAttribute('data-rain') === this.sim.rainfallKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update fault switches
    if (this.switchSensor) this.switchSensor.checked = this.sim.sensorDisconnected;
    if (this.switchController) this.switchController.checked = this.sim.controllerOffline;
  }

  // =========================================================================
  // MAIN RENDERING LOOP (CALLED ON EACH SIMULATION TICK)
  // =========================================================================
  render(state) {
    // 1. Water Level Readout
    if (this.elLevelCm) {
      this.elLevelCm.textContent = state.levelCm.toFixed(1);
    }
    if (this.elLevelPct) {
      this.elLevelPct.textContent = `${state.percentage.toFixed(1)}%`;
    }

    // 2. Vertical Tank Gauge
    if (this.elTankWater) {
      this.elTankWater.style.height = `${state.percentage}%`;
      // Dynamic color tint for high levels
      if (state.percentage >= CONFIG.CRITICAL_PERCENT) {
        this.elTankWater.style.background = 'linear-gradient(180deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.95) 100%)';
      } else if (state.percentage >= CONFIG.WARNING_PERCENT) {
        this.elTankWater.style.background = 'linear-gradient(180deg, rgba(245, 158, 11, 0.9) 0%, rgba(180, 83, 9, 0.95) 100%)';
      } else {
        this.elTankWater.style.background = 'linear-gradient(180deg, rgba(56, 189, 248, 0.9) 0%, rgba(14, 116, 144, 0.95) 100%)';
      }
    }

    // 3. Stale indicator & Last Reading timestamp
    if (this.elLastReading) {
      this.elLastReading.textContent = `${state.lastTimestamp} • ${state.levelCm.toFixed(1)} cm`;
    }

    if (this.elStaleBadge) {
      if (state.sensorDisconnected) {
        this.elStaleBadge.style.display = 'inline-flex';
      } else {
        this.elStaleBadge.style.display = 'none';
      }
    }

    // 4. Sensor & Controller Status Badges
    if (this.elSensorDot && this.elSensorText) {
      if (state.sensorDisconnected) {
        this.elSensorDot.className = 'dot disconnected';
        this.elSensorText.textContent = 'DISCONNECTED';
        this.elSensorText.style.color = '#f87171';
      } else {
        this.elSensorDot.className = 'dot connected';
        this.elSensorText.textContent = 'CONNECTED';
        this.elSensorText.style.color = '#34d399';
      }
    }

    if (this.elControllerDot && this.elControllerText) {
      if (state.controllerOffline) {
        this.elControllerDot.className = 'dot offline';
        this.elControllerText.textContent = 'OFFLINE';
        this.elControllerText.style.color = '#f87171';
      } else {
        this.elControllerDot.className = 'dot online';
        this.elControllerText.textContent = 'ONLINE';
        this.elControllerText.style.color = '#34d399';
      }
    }

    // 5. Alert Status Badge & Message
    if (this.elAlertBadge && this.elAlertText) {
      this.elAlertBadge.className = `alert-badge-large ${state.alert.badgeClass}`;
      this.elAlertText.textContent = state.alert.state;
    }
    if (this.elAlertMessage) {
      this.elAlertMessage.textContent = state.alert.message;
    }
    if (this.elTransmissionNote) {
      this.elTransmissionNote.style.display = state.controllerOffline ? 'flex' : 'none';
    }

    // 6. Simulation Parameters Panel
    if (this.elParamInflow) this.elParamInflow.textContent = `${state.inflowRate.toFixed(1)} cm/s`;
    if (this.elParamOutflow) this.elParamOutflow.textContent = `${state.outflowRate.toFixed(1)} cm/s`;
    if (this.elParamNet) {
      const netSign = state.netRate > 0 ? `+${state.netRate.toFixed(1)}` : state.netRate.toFixed(1);
      this.elParamNet.textContent = `${netSign} cm/s`;
      this.elParamNet.style.color = state.netRate > 0 ? '#f87171' : state.netRate < 0 ? '#34d399' : '#9ca3af';
    }
    if (this.elParamBlockage) {
      this.elParamBlockage.textContent = `${state.blockagePercent}%`;
      if (this.sliderBlockage && document.activeElement !== this.sliderBlockage) {
        this.sliderBlockage.value = state.blockagePercent;
        if (this.valBlockageDisplay) this.valBlockageDisplay.textContent = `${state.blockagePercent}%`;
      }
    }

    // 7. Render Dynamic SVG Drain Cross-Section
    this.renderCrossSection(state);

    // 8. Render Canvas Line Chart
    this.renderChart(state.history);
  }

  // =========================================================================
  // DRAIN CROSS-SECTION ANIMATION (SVG)
  // Channel depth: 60 cm. 
  // SVG Coordinates: 
  //   Channel Floor: y = 240
  //   Channel Top (Overflow Line, 60cm): y = 90 (Height = 150px, so 2.5px per cm)
  //   Sealed ESP32 Enclosure: mounted at y = 20 to y = 65 (ABOVE y = 90 overflow level)
  //   Ultrasonic Transducer: bottom face at y = 65, emitting cone downwards to water line.
  // =========================================================================
  renderCrossSection(state) {
    if (!this.svgWaterRect) return;

    const channelFloorY = 240;
    const channelHeightPx = 150; // 60 cm = 150 px (2.5 px per cm)
    const pxPerCm = channelHeightPx / CONFIG.MAX_DEPTH_CM;

    // Water level height in pixels
    const waterHeightPx = Math.max(2, Math.min(channelHeightPx, state.trueLevelCm * pxPerCm));
    const waterTopY = channelFloorY - waterHeightPx;

    // Update water body rectangle
    this.svgWaterRect.setAttribute('y', waterTopY);
    this.svgWaterRect.setAttribute('height', waterHeightPx);

    // Surface wave line
    if (this.svgWaterSurfaceLine) {
      this.svgWaterSurfaceLine.setAttribute('y1', waterTopY);
      this.svgWaterSurfaceLine.setAttribute('y2', waterTopY);
      
      // Color surface line based on alert state
      if (state.alert.state === 'CRITICAL') {
        this.svgWaterSurfaceLine.setAttribute('stroke', '#ef4444');
      } else if (state.alert.state === 'WARNING') {
        this.svgWaterSurfaceLine.setAttribute('stroke', '#f59e0b');
      } else {
        this.svgWaterSurfaceLine.setAttribute('stroke', '#38bdf8');
      }
    }

    // Ultrasonic Beams (reflect from y=65 down to waterTopY)
    if (this.svgUltrasonicBeams) {
      const beamStart1 = document.getElementById('svg-beam-1');
      const beamStart2 = document.getElementById('svg-beam-2');
      const beamStart3 = document.getElementById('svg-beam-3');
      if (beamStart1 && beamStart2 && beamStart3) {
        if (state.sensorDisconnected) {
          this.svgUltrasonicBeams.style.opacity = '0.1';
        } else {
          this.svgUltrasonicBeams.style.opacity = '0.85';
          beamStart1.setAttribute('y2', waterTopY);
          beamStart2.setAttribute('y2', waterTopY);
          beamStart3.setAttribute('y2', waterTopY);
        }
      }
    }

    // Obstruction / Debris object near outlet (right side, x ~ 370-420, y = 240)
    if (this.svgObstructionGroup) {
      const blockagePct = state.blockagePercent;
      if (blockagePct <= 0) {
        this.svgObstructionGroup.style.display = 'none';
      } else {
        this.svgObstructionGroup.style.display = 'inline';
        // Scale obstruction height and width proportionally
        const debrisHeight = Math.max(10, (blockagePct / 100) * 80);
        const debrisWidth = Math.max(16, (blockagePct / 100) * 45);
        const debrisRect = document.getElementById('svg-debris-shape');
        if (debrisRect) {
          debrisRect.setAttribute('y', channelFloorY - debrisHeight);
          debrisRect.setAttribute('height', debrisHeight);
          debrisRect.setAttribute('width', debrisWidth);
        }
      }
    }

    // Current Water Level Text readout marker on SVG
    if (this.svgLevelMarkerText) {
      this.svgLevelMarkerText.textContent = `${state.levelCm.toFixed(1)} cm`;
      this.svgLevelMarkerText.setAttribute('y', Math.max(95, waterTopY - 6));
    }
  }

  // =========================================================================
  // LIVE CANVAS LINE CHART (LAST ~60 READINGS WITH THRESHOLD LINES)
  // =========================================================================
  setupChartCanvasResize() {
    if (!this.chartCanvas) return;
    const resize = () => {
      const rect = this.chartCanvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.chartCanvas.width = rect.width * dpr;
      this.chartCanvas.height = rect.height * dpr;
      if (this.chartCtx) {
        this.chartCtx.scale(dpr, dpr);
      }
    };
    window.addEventListener('resize', resize);
    resize();
  }

  renderChart(history) {
    if (!this.chartCtx || !this.chartCanvas || history.length === 0) return;

    const ctx = this.chartCtx;
    const rect = this.chartCanvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Layout margins
    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const maxVal = CONFIG.MAX_DEPTH_CM; // 60 cm
    const warnVal = (CONFIG.WARNING_PERCENT / 100) * maxVal; // 30 cm
    const critVal = (CONFIG.CRITICAL_PERCENT / 100) * maxVal; // 48 cm

    const getY = (val) => padTop + plotH - ((val / maxVal) * plotH);
    const getX = (idx, total) => padLeft + (idx / Math.max(1, total - 1)) * plotW;

    // Draw background subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [0, 15, 30, 45, 60].forEach(levelMark => {
      const y = getY(levelMark);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Axis label
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${levelMark}cm`, padLeft - 6, y + 3);
    });

    // 1. Draw 50% WARNING Threshold Line (Amber dashed)
    const yWarn = getY(warnVal);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, yWarn);
    ctx.lineTo(w - padRight, yWarn);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WARN (50% / 30cm)', padLeft + 6, yWarn - 4);
    ctx.restore();

    // 2. Draw 80% CRITICAL Threshold Line (Red dashed)
    const yCrit = getY(critVal);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, yCrit);
    ctx.lineTo(w - padRight, yCrit);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CRITICAL (80% / 48cm)', padLeft + 6, yCrit - 4);
    ctx.restore();

    // 3. Draw OVERFLOW LIMIT (60cm Solid Red)
    const yMax = getY(maxVal);
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, yMax);
    ctx.lineTo(w - padRight, yMax);
    ctx.stroke();

    // 4. Fill Area Under Curve (Water Gradient)
    const totalPoints = history.length;
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(14, 116, 144, 0.02)');

    ctx.beginPath();
    ctx.moveTo(getX(0, totalPoints), getY(0));
    history.forEach((pt, i) => {
      ctx.lineTo(getX(i, totalPoints), getY(pt.level));
    });
    ctx.lineTo(getX(totalPoints - 1, totalPoints), getY(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 5. Draw Water Level Path
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = getX(i, totalPoints);
      const y = getY(pt.level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 6. Draw glowing point on latest reading
    if (totalPoints > 0) {
      const lastPt = history[totalPoints - 1];
      const lastX = getX(totalPoints - 1, totalPoints);
      const lastY = getY(lastPt.level);

      ctx.save();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = lastPt.isStale ? '#f87171' : '#ffffff';
      ctx.shadowColor = lastPt.isStale ? '#ef4444' : '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    // Time Axis Labels (start and end)
    if (totalPoints > 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(history[0].timestamp, padLeft, h - 10);
      ctx.textAlign = 'right';
      ctx.fillText(history[totalPoints - 1].timestamp, w - padRight, h - 10);
    }
  }

  // =========================================================================
  // EVENT LOG HANDLER
  // =========================================================================
  addLog(entry) {
    if (!this.elLogContainer) return;

    const row = document.createElement('div');
    row.className = `log-entry ${entry.type || 'info'}`;

    row.innerHTML = `
      <span class="log-time">${entry.timestamp}</span>
      <span class="log-tag">[SIMULATED]</span>
      <span class="log-msg">${escapeHtml(entry.message)}</span>
    `;

    this.elLogContainer.appendChild(row);

    // Limit log rows to prevent DOM bloat (keep last 120)
    while (this.elLogContainer.childNodes.length > 120) {
      this.elLogContainer.removeChild(this.elLogContainer.firstChild);
    }

    // Auto-scroll to bottom
    this.elLogContainer.scrollTop = this.elLogContainer.scrollHeight;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.drainUI = new DrainUI();
});
})();
