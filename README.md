# FloodGuard AI — Distributed Flood Warning & Drainage Blockage Detection

> **Official Government Incident & Warning Command System**  
> **Repository:** [https://github.com/chakri9989040149-ai/resqtech](https://github.com/chakri9989040149-ai/resqtech)  
> **Live Website:** [https://chakri9989040149-ai.github.io/resqtech/](https://chakri9989040149-ai.github.io/resqtech/)  

---

## 📌 Project Overview

**FloodGuard AI** is a distributed flood warning and municipal drainage monitoring platform designed for disaster management authorities and public works departments. Urban inundation and flash flooding are predominantly triggered by stormwater drainage obstructions (silt sedimentation, solid waste accumulation, and debris) combined with heavy localized precipitation. 

FloodGuard AI provides real-time telemetry, automated risk evaluation, multi-channel citizen warnings, maintenance crew dispatch, and emergency rescue staging in a single, resilient operational dashboard.

---

## 🚀 Key Features

### 1. 📢 Multi-Channel Flood Alerts & Citizen Warning Center
- **4-Tier Alert Levels:** Automatic generation of standard municipal alerts for **WATCH**, **WARNING**, **DANGER**, and **ALL CLEAR**.
- **Trilingual Citizen Warning:** Real-time generation of alerts in **English (GSM-7)**, **Telugu (UCS-2 Unicode)**, and **Hindi (UCS-2 Unicode)**.
- **Accurate Character & Segment Accounting:** GSM-7 (160 single / 153 multi) and Unicode (70 single / 67 multi) segment counters.
- **Unified Multi-Channel Broadcast:** Synchronized distribution to SMS Cell Broadcast, WhatsApp Citizen Feed, Public Alerts Web Feed, and Acoustic Municipal Siren sweep.

### 2. 🌊 Dual-Sensor Drainage Blockage Detection
- **Acoustic & Ultrasonic Telemetry:** Fuses ultrasonic water stage depth with acoustic silt resonance and flow velocity to identify restrictions before street flooding occurs.
- **Physics-Based Simulation Engine:** 60 cm channel depth model computing real-time inflow, outflow, and obstruction percentages with hysteresis-backed warning states.
- **Fault Tolerance:** Simulation and diagnostic detection for sensor disconnects, controller outages, and LoRa packet degradation.

### 3. 👷 Automatic Cleaning Worker & Inspection Crew Assignment
- **Automated Crew Dispatch:** Mobilize mechanical vacuum desilting crews directly from drain telemetry alerts and suspected blockage lists.
- **Integrated Upkeep Scheduling:** Weekly upkeep calendar, job assignment by ward and severity priority, countdown timers, and overdue flagging.
- **Gradual Desilting Recovery:** Real-time feedback loop showing gradual drop in blockage percentage upon obstruction clearance.

### 4. 🛡️ Multi-Action Response Team & Tactical Shelter Staging
- **Emergency Mobilization:** Live status tracking across **AVAILABLE**, **DISPATCHED**, **ON SCENE**, and **RETURNING** with simulated transit timers.
- **Tactical Flood-Risk Zone Panels:** One-click unit staging, shelter pre-evacuation, and flood barrier deployment across critical flood-risk culverts and viaduct trenches.
- **Designated Relief Camps:** Real-time shelter occupancy management, capacity bars, and supply requisitioning (food, water, medical).

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Vanilla CSS Design System (Light & Dark Mode)
- **Icons & Typography:** Lucide React, Google Inter, JetBrains Mono
- **State Management:** Centralized localStorage-persisted Master Store (`FloodGuardStore`)
- **Offline & Comms Resilience:** Sub-GHz LoRa Mesh Telemetry Simulation (865-867 MHz ISM band) with offline queueing
- **CI/CD:** GitHub Actions automated build and deployment to GitHub Pages

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chakri9989040149-ai/resqtech.git
   cd resqtech
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://127.0.0.1:5173/` in your browser.

4. **Build production bundle:**
   ```bash
   npm run build
   ```

---

## 👥 Demo Officer Profiles

All data and accounts run in simulated demonstration mode:
- **Disaster Response Coordinator:** `officer@demo.floodguard.ai`
- **Drainage Field Engineer:** `engineer@demo.floodguard.ai`
- **District Coordinator:** `district@demo.floodguard.ai`  
*Demo Password:* `Demo@GovGuard2026`

---

## 📄 License

Developed for disaster resilience and municipal drainage monitoring under open government guidelines.
