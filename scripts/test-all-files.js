/**
 * SensaFlow - Complete System & File Testing Suite
 * Tests every service, module, data model, component, and simulation file.
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passCount++;
    results.push({ status: 'PASS', message });
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failCount++;
    results.push({ status: 'FAIL', message });
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

console.log('\n================================================================');
console.log('            SENSAFLOW COMPREHENSIVE FILE TEST SUITE             ');
console.log('================================================================\n');

// 1. TEST AGENT MODULES
console.log('>>> [1/8] Testing Multi-Agent Coordinator (src/agent/multiAgentCoordinator.js)...');
try {
  const mac = await import('../src/agent/multiAgentCoordinator.js');
  
  assert(Boolean(mac.AGENT_SPECS) && Object.keys(mac.AGENT_SPECS).length === 5, '5 Simulated AI Agents registered in AGENT_SPECS (Sentinel, Triage, Dispatch, Herald, Steward)');
  assert(mac.AGENT_SPECS.sentinel?.name === 'Sentinel', 'Sentinel agent is defined with correct role');
  assert(mac.AGENT_SPECS.dispatch?.role?.toLowerCase().includes('assignment'), 'Dispatch agent has assignment role');
  assert(Boolean(mac.ZONE_METADATA) && Object.keys(mac.ZONE_METADATA).length >= 4, 'Zone metadata covers all 4 tactical city zones');
  assert(Boolean(mac.WORKFLOW_STAGES) && mac.WORKFLOW_STAGES.length === 6, '6-step workflow cycle defined (PERCEIVE, REASON, PLAN, ACT, VERIFY, DONE)');

  // Test Simulated AI Prompt Responses
  const mockState = {
    drainNodes: [
      { id: 'NODE-C-08', name: 'Urban Culvert Line C-8', blockagePct: 87, waterLevel: '2.40 m', flowRate: '0.4 m/s', sensorHealth: 'PRIMARY_ACTIVE' }
    ],
    floodAlerts: [
      { id: 'ALT-1', title: 'Flash Inundation Warning', severity: 'CRITICAL', status: 'ACTIVE', zone: 'Urban Culvert Line C-8 (Ward 14)', waterLevel: '2.40 m', rainfall: '48 mm/hr' }
    ],
    rescueTeams: [
      { id: 'team-1', name: 'Rescue Unit Alpha', status: 'AVAILABLE', type: 'RESCUE' },
      { id: 'team-2', name: 'Rapid Desilting Crew 1', status: 'DISPATCHED', type: 'DRAINAGE' }
    ],
    reliefCamps: [
      { id: 'CAMP-01', name: 'Model High School Shelter', status: 'ACTIVE', occupancy: 120, capacity: 500 }
    ],
    loraQueue: [],
    activityLog: []
  };

  const freeTeamsAns = mac.generateSimulatedResponse('Which teams are free?', mockState);
  assert(freeTeamsAns.includes('Rescue Unit Alpha') && freeTeamsAns.includes('AVAILABLE'), 'Prompt "Which teams are free?" accurately returns available teams');

  const riskAns = mac.generateSimulatedResponse('What is the highest risk now?', mockState);
  assert(riskAns.includes('Flash Inundation') || riskAns.includes('Urban Culvert Line C-8'), 'Prompt "What is the highest risk now?" identifies active critical alert');

  const shiftAns = mac.generateSimulatedResponse('Summarize this shift', mockState);
  assert(shiftAns.includes('SHIFT SUMMARY') && shiftAns.includes('5/5 Agents Active'), 'Prompt "Summarize this shift" returns formatted overview');
} catch (err) {
  assert(false, `multiAgentCoordinator.js failed to load or test: ${err.message}`);
}

// 2. TEST AUTH SERVICE
console.log('\n>>> [2/8] Testing Authentication Service (src/services/authService.js)...');
try {
  const auth = await import('../src/services/authService.js');
  assert(typeof auth.loginUser === 'function', 'loginUser function exists');
  assert(typeof auth.getStoredSession === 'function', 'getStoredSession function exists');
  assert(typeof auth.validateCredentials === 'function', 'validateCredentials function exists');
  assert(typeof auth.authenticateEmployee === 'function', 'authenticateEmployee function exists');
  
  const validAdmin = auth.validateCredentials('admin@resqtech.gov.in', 'Admin@1234');
  assert(validAdmin && validAdmin.role === 'SUPER_ADMIN', 'Valid super admin credentials authenticate correctly');
  
  const invalidUser = auth.validateCredentials('fake@test.com', 'wrong');
  assert(invalidUser === null, 'Invalid credentials fail authentication correctly');

  const demoAuth = auth.validateCredentials('EMP-DEMO-01', 'Demo@GovGuard2026');
  assert(demoAuth && demoAuth.employeeId === 'EMP-DEMO-01', 'Demo employee ID EMP-DEMO-01 authenticates');
} catch (err) {
  assert(false, `authService.js failed: ${err.message}`);
}

// 3. TEST SIMULATION & TELEMETRY SERVICES (alertEngine, loraSim, maintenanceSim)
console.log('\n>>> [3/8] Testing Simulation Services (alertEngine, loraSim, maintenanceSim)...');
try {
  const lora = await import('../src/services/loraSim.js');
  assert(typeof lora.LoRaSimulationService === 'function', 'LoRaSimulationService class exported');

  const maint = await import('../src/services/maintenanceSim.js');
  assert(typeof maint.MaintenanceSimulationService === 'function', 'MaintenanceSimulationService class exported');

  const alertEng = await import('../src/services/alertEngine.js');
  assert(Boolean(alertEng), 'alertEngine.js exports loaded cleanly');
} catch (err) {
  assert(false, `Simulation services failed: ${err.message}`);
}

// 4. TEST MASTER STORE DATA & TACTICAL OPERATIONS (src/context/FloodGuardStore.jsx)
console.log('\n>>> [4/8] Testing Master Store Data & Tactical Operations (src/context/FloodGuardStore.jsx)...');
try {
  const storeRaw = fs.readFileSync(path.resolve('./src/context/FloodGuardStore.jsx'), 'utf8');
  
  assert(storeRaw.includes('sensaflow_master_store_v6'), 'Store key upgraded to sensaflow_master_store_v6');
  assert(storeRaw.includes('stageTeamAtRiskZone'), 'Tactical action stageTeamAtRiskZone implemented');
  assert(storeRaw.includes('preEvacuateShelter'), 'Tactical action preEvacuateShelter implemented');
  assert(storeRaw.includes('dispatchInspectionCrew'), 'Tactical action dispatchInspectionCrew implemented');
  assert(storeRaw.includes('deployFloodBarriers'), 'Tactical action deployFloodBarriers implemented');
  assert(storeRaw.includes('animateDrainClearing'), 'Tactical action animateDrainClearing (87% -> 40% -> 10%) implemented');
  assert(storeRaw.includes('recallRescueTeam'), 'Tactical action recallRescueTeam implemented');
  assert(storeRaw.includes('reassignRescueTeam'), 'Tactical action reassignRescueTeam implemented');
  assert(storeRaw.includes('undoAgentAction'), 'Undo last agent action implemented');

  // Verify canonical node IDs
  const requiredNodes = ['NODE-C-08', 'NODE-WZ-04', 'NODE-P-03', 'NODE-SB-12', 'NODE-D-03', 'NODE-D-07'];
  const allNodesPresent = requiredNodes.every(nid => storeRaw.includes(nid));
  assert(allNodesPresent, `All canonical drain nodes present (${requiredNodes.join(', ')})`);

  // Verify canonical team names
  const requiredTeams = ['Rescue Unit Alpha', 'Medical Response Cell', 'Rapid Desilting Crew 1', 'Hydraulic Vacuum Unit 2', 'Emergency Trench Squad 3'];
  const allTeamsPresent = requiredTeams.every(tm => storeRaw.includes(tm));
  assert(allTeamsPresent, `All canonical rescue and drainage teams present (${requiredTeams.join(', ')})`);

  // Verify equipment correctness: NO ambulances on drainage crews
  const desiltingAmbulanceCheck = storeRaw.match(/Rapid Desilting Crew 1[\s\S]*?Ambulance/);
  assert(!desiltingAmbulanceCheck, 'Rapid Desilting Crew 1 has NO ambulance assigned');
  const vacuumAmbulanceCheck = storeRaw.match(/Hydraulic Vacuum Unit 2[\s\S]*?Ambulance/);
  assert(!vacuumAmbulanceCheck, 'Hydraulic Vacuum Unit 2 has NO ambulance assigned');

  // Verify drainage equipment uses genuine tools
  assert(storeRaw.includes('Desilting Truck'), 'Drainage crews equipped with Desilting Trucks');
  assert(storeRaw.includes('Vacuum Pumps'), 'Drainage crews equipped with Vacuum Pumps');
  assert(storeRaw.includes('Trench Cutter'), 'Drainage crews equipped with Trench Cutters');
} catch (err) {
  assert(false, `FloodGuardStore.jsx failed tests: ${err.message}`);
}

// 5. TEST DASHBOARD UI & MODAL GUARDS (src/pages/DashboardPage.jsx)
console.log('\n>>> [5/8] Testing Dashboard UI & Action Guards (src/pages/DashboardPage.jsx)...');
try {
  const dashRaw = fs.readFileSync(path.resolve('./src/pages/DashboardPage.jsx'), 'utf8');

  assert(dashRaw.includes('dispatchModalTeam'), 'Team dispatch modal with ETA and zone picker implemented');
  assert(dashRaw.includes('reassignTeamModal'), 'Team reassign modal implemented');
  assert(dashRaw.includes('ON SCENE') && dashRaw.includes('onSceneReassignConfirmed'), 'On-Scene guard warns and requires explicit confirmation before reassigning active team');
  assert(dashRaw.includes('stageTeamAtRiskZone'), 'Zone Card Tactical Action: Stage team connected');
  assert(dashRaw.includes('preEvacuateShelter'), 'Zone Card Tactical Action: Pre-evacuate shelter connected');
  assert(dashRaw.includes('dispatchInspectionCrew'), 'Zone Card Tactical Action: Dispatch inspection crew connected');
  assert(dashRaw.includes('deployFloodBarriers'), 'Zone Card Tactical Action: Deploy flood barriers connected');
  assert(dashRaw.includes('Inspection Crew Dispatched') || dashRaw.includes('crewDispatched'), 'Inspection Crew Dispatched badge rendered on zones');
} catch (err) {
  assert(false, `DashboardPage.jsx failed tests: ${err.message}`);
}

// 6. TEST COMPONENT SUITE INTEGRITY
console.log('\n>>> [6/8] Testing Component Files...');
const componentFiles = [
  'HeaderNavbar.jsx',
  'LeftMonitoringIdentity.jsx',
  'MultiAgentCoordinatorPanel.jsx',
  'FloodAlertCenter.jsx',
  'MaintenanceModule.jsx',
  'OverviewCardDrawer.jsx',
  'GisMiniMap.jsx',
  'LoginForm.jsx',
  'HardwareHighlight.jsx'
];

for (const comp of componentFiles) {
  const fullPath = path.resolve(`./src/components/${comp}`);
  const exists = fs.existsSync(fullPath);
  assert(exists, `Component ${comp} exists`);
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(content.length > 500, `Component ${comp} is populated (${content.length} bytes)`);
  }
}

// Hardware Protection Section verification
try {
  const hwRaw = fs.readFileSync(path.resolve('./src/components/HardwareHighlight.jsx'), 'utf8');
  assert(hwRaw.includes('Built to Survive the Drain'), 'HardwareHighlight has exact title');
  assert(hwRaw.includes('Rugged, waterproof hardware protected by a strong grid guard'), 'HardwareHighlight has exact subtitle');
  assert(hwRaw.includes('Strong Grid Guard'), 'Card 1: Strong Grid Guard present');
  assert(hwRaw.includes('Stays Firmly in Place'), 'Card 2: Stays Firmly in Place present');
  assert(hwRaw.includes('Waterproof, High-Quality Build'), 'Card 3: Waterproof, High-Quality Build present');
  assert(hwRaw.includes('Debris-resistant') && hwRaw.includes('Waterproof design') && hwRaw.includes('Durable materials'), 'All 3 tag chips present');
  assert(hwRaw.includes('sensor-hardware.jpg'), 'References sensor-hardware.jpg');
  assert(hwRaw.includes('NOTE: TECHNICAL SPECIFICATIONS PLACEHOLDER'), 'Clear comment placeholder for future technical specifications');
  assert(hwRaw.includes('hardware-highlight-section'), 'Includes hardware-highlight-section class with responsive styling');

  const dashRaw = fs.readFileSync(path.resolve('./src/pages/DashboardPage.jsx'), 'utf8');
  assert(dashRaw.includes('<HardwareHighlight'), 'DashboardPage mounts HardwareHighlight section at bottom');

  const pubRaw = fs.readFileSync(path.resolve('./src/pages/PublicAlertsPage.jsx'), 'utf8');
  assert(pubRaw.includes('<HardwareHighlight'), 'PublicAlertsPage mounts HardwareHighlight section');
} catch (err) {
  assert(false, `HardwareHighlight tests failed: ${err.message}`);
}


// 7. TEST SMART DRAIN MONITOR SIMULATION ENGINE
console.log('\n>>> [7/8] Testing Smart Drain Simulation Engine (smart-drain-monitor/)...');
try {
  const simRaw = fs.readFileSync(path.resolve('./smart-drain-monitor/simulation.js'), 'utf8');
  assert(simRaw.includes('DrainSimulation'), 'DrainSimulation class defined');
  assert(simRaw.includes('MAX_DEPTH_CM'), 'Simulation constants defined');

  const uiRaw = fs.readFileSync(path.resolve('./smart-drain-monitor/ui.js'), 'utf8');
  assert(uiRaw.includes('*/'), 'smart-drain-monitor/ui.js multiline comment properly closed with */');
  assert(uiRaw.includes('class DrainUI'), 'DrainUI class defined');
} catch (err) {
  assert(false, `smart-drain-monitor failed tests: ${err.message}`);
}

// 8. TEST BRANDING & PUBLIC INTERFACES
console.log('\n>>> [8/8] Testing SensaFlow Brand & Interface Uniformity...');
try {
  const indexHtml = fs.readFileSync(path.resolve('./index.html'), 'utf8');
  assert(indexHtml.includes('SensaFlow — Distributed Flood Warning & Drainage Blockage Detection'), 'index.html title has exact SensaFlow title');
  assert(!indexHtml.includes('<title>FloodGuard AI'), 'Legacy FloodGuard AI removed from title');

  const headerRaw = fs.readFileSync(path.resolve('./src/components/HeaderNavbar.jsx'), 'utf8');
  assert(headerRaw.includes('Sensa') && headerRaw.includes('Flow'), 'HeaderNavbar contains SensaFlow split brand styling');
  assert(headerRaw.includes('Sense Early. Alert Instantly. Rescue Faster.'), 'HeaderNavbar contains exact tagline');

  const coordinatorRaw = fs.readFileSync(path.resolve('./src/components/MultiAgentCoordinatorPanel.jsx'), 'utf8');
  assert(coordinatorRaw.includes('Simulated AI Agent'), 'MultiAgentCoordinatorPanel contains "Simulated AI Agent" label');
  assert(coordinatorRaw.includes('[SIMULATED]'), 'MultiAgentCoordinatorPanel contains [SIMULATED] badge');
  assert(coordinatorRaw.includes('DEMO DATA'), 'MultiAgentCoordinatorPanel contains DEMO DATA badge');
} catch (err) {
  assert(false, `Branding tests failed: ${err.message}`);
}

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
