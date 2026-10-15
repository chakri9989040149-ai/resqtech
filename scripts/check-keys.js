/**
 * FloodGuard AI — Key Verification Script
 * Prints CONNECTED / NOT CONFIGURED per key without showing the key.
 */

import fs from 'fs';

console.log('\n--- FLOODGUARD AI: INTEGRATION KEY STATUS ---');

let envContent = '';
try {
  if (fs.existsSync('.env.local')) {
    envContent = fs.readFileSync('.env.local', 'utf8');
  } else if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }
} catch {
  // ignore
}

const envMap = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    if (k) envMap[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const keysToCheck = [
  { name: 'Weather Data (Open-Meteo)', key: 'WEATHER_PROVIDER', alwaysConnected: true },
  { name: 'Radar Tile Overlay (OpenWeatherMap)', key: 'OPENWEATHER_API_KEY' },
  { name: 'Base Map (MapTiler)', key: 'MAPTILER_API_KEY' },
  { name: 'AI Advisory Engine (Gemini)', key: 'GEMINI_API_KEY' },
  { name: 'Emergency SMS Gateway (Twilio/MSG91)', key: 'SMS_API_KEY' },
  { name: 'LoRa Gateway Uplink', key: 'LORA_GATEWAY_URL' }
];

for (const item of keysToCheck) {
  const val = envMap[item.key];
  const isConnected = item.alwaysConnected || (Boolean(val) && val.length > 0);
  const status = isConnected ? 'CONNECTED' : 'NOT CONFIGURED';
  console.log(`${item.name} [${item.key}]: ${status}`);
}

console.log('---------------------------------------------\n');
