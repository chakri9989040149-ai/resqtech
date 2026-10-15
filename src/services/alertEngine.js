/**
 * =============================================================================
 * SENSAFLOW - FLOOD ALERT & CITIZEN WARNING ENGINE (alertEngine.js)
 * =============================================================================
 * Core business logic, SMS segment calculation (GSM-7 vs UCS-2), multi-lingual
 * flood alert templates, simulation triggers, channel previews, and mock gateway.
 *
 * NOTE: Architecture is designed for plug-and-play integration with real SMS
 * gateways (e.g. Twilio, MSG91, CDAC Cell Broadcast) by replacing the
 * simulated dispatch adapter function below.
 * =============================================================================
 */

// =============================================================================
// 1. CONSTANTS: SMS ENCODING & TELECOM CONSTRAINTS
// =============================================================================
export const SMS_CONFIG = {
  // GSM 7-bit (Standard English / Latin Alphabet)
  GSM7_SINGLE_LIMIT: 160,       // Max characters in single SMS segment
  GSM7_CONCAT_LIMIT: 153,       // Max characters per segment in multi-part SMS (7 bytes for UDH)
  
  // UCS-2 / UTF-16 (Indic scripts: Telugu, Hindi, Malayalam, Tamil, Emojis)
  UNICODE_SINGLE_LIMIT: 70,     // Max characters in single SMS segment
  UNICODE_CONCAT_LIMIT: 67,     // Max characters per segment in multi-part SMS (6 bytes for UDH)
  
  // Official Emergency Helpline
  EMERGENCY_HELPLINE: '1070'
};

// =============================================================================
// 2. CONSTANTS: FLOOD ALERT LEVELS & PALETTE
// =============================================================================
export const ALERT_LEVELS = {
  WATCH: {
    id: 'WATCH',
    name: 'Flood Watch',
    subtitle: 'Heavy rain forecast, no flooding yet',
    color: '#0284C7',
    textColor: '#38BDF8',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    icon: 'Eye',
    severityRank: 1
  },
  WARNING: {
    id: 'WARNING',
    name: 'Flood Warning',
    subtitle: 'Water level rising, flooding possible within hours',
    color: '#F59E0B',
    textColor: '#FBBF24',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: 'AlertTriangle',
    severityRank: 2
  },
  DANGER: {
    id: 'DANGER',
    name: 'Flood Danger',
    subtitle: 'Flooding imminent or started in specific area',
    color: '#EF4444',
    textColor: '#F87171',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    icon: 'AlertOctagon',
    severityRank: 3
  },
  ALL_CLEAR: {
    id: 'ALL_CLEAR',
    name: 'All Clear',
    subtitle: 'Water receding, safe to return',
    color: '#10B981',
    textColor: '#34D399',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'CheckCircle2',
    severityRank: 0
  }
};

// =============================================================================
// 3. TARGET ZONES & RECIPIENT ESTIMATES
// =============================================================================
export const AFFECTED_ZONES = [
  { id: 'zone-w4', name: 'Ward 4 (Riverside Lowlands)', baseRecipients: 1420, basin: 'Musi North Basin', riskLevel: 'HIGH' },
  { id: 'zone-w9', name: 'Ward 9 (Old Canal Colony)', baseRecipients: 1180, basin: 'Weir Discharge Basin', riskLevel: 'MODERATE' },
  { id: 'zone-w14', name: 'Ward 14 (Industrial Corridor)', baseRecipients: 2350, basin: 'Industrial Culvert C-8 Catchment', riskLevel: 'CRITICAL' },
  { id: 'zone-w11', name: 'Ward 11 (Market Road Catchment)', baseRecipients: 980, basin: 'Market Underpass Sump', riskLevel: 'HIGH' },
  { id: 'zone-musi', name: 'Musi River South Embankment', baseRecipients: 3100, basin: 'River Main Channel', riskLevel: 'CRITICAL' }
];

export const RADIUS_OPTIONS = [
  { value: '500m', label: '500 m Radius', multiplier: 1.0, desc: 'Immediate drain corridor & adjacent streets' },
  { value: '1km', label: '1.0 km Radius', multiplier: 2.2, desc: 'Full ward catchment & lowland approaches' },
  { value: '2km', label: '2.0 km Radius', multiplier: 4.5, desc: 'Broad municipal sector & downstream floodplains' }
];

// =============================================================================
// 4. MULTI-LINGUAL FLOOD TEMPLATES (CITIZEN-FOCUSED - NO INTERNAL DRAIN/LORA JARGON)
// =============================================================================
// Standard templates (rich and detailed)
export const STANDARD_FLOOD_TEMPLATES = {
  WATCH: {
    en: 'FLOOD WATCH: Heavy rain forecast in {area} ({rain}mm expected). River and drain water levels currently normal. Clear porch drains and avoid low-lying roads. Emergency helpline: 1070.',
    te: 'వరద అప్రమత్తత: {area} పరిధిలో భారీ వర్ష సూచన ({rain}మి.మీ). ప్రస్తుతానికి నీటి ప్రవాహం సాధారణం. లోతట్టు ప్రజలు అప్రమత్తంగా ఉండండి. అత్యవసర హెల్ప్‌లైన్: 1070.',
    hi: 'बाढ़ अलर्ट: {area} में भारी वर्षा का पूर्वानुमान ({rain}मिमी)। वर्तमान में जलस्तर सामान्य है। निचले क्षेत्रों के निवासी सतर्क रहें। हेल्पलाइन: 1070.'
  },
  WARNING: {
    en: 'FLOOD WARNING: Water level rising to {level}% in {area}. Flooding possible within 2-3 hours. Move vehicles and livestock to elevated ground. Shelter: {shelter}. Emergency helpline: 1070.',
    te: 'వరద హెచ్చరిక: {area} వద్ద నీటిమట్టం {level}% కి పెరిగింది. రాబోయే 2-3 గంటల్లో వరద ముప్పు కలదు. వాహనాలు, సామగ్రిని ఎత్తైన ప్రదేశాలకు తరలించండి. ఆశ్రయం: {shelter}. హెల్ప్‌లైన్: 1070.',
    hi: 'बाढ़ चेतावनी: {area} में जलस्तर {level}% तक बढ़ गया है। 2-3 घंटे में जलभराव की आशंका है। वाहन एवं सामान ऊंचे स्थानों पर ले जाएं। आश्रय: {shelter}। हेल्पलाइन: 1070.'
  },
  DANGER: {
    en: 'FLOOD DANGER: Rapid inundation in {area} (water at {level}%). Move to higher ground now. Avoid underpasses and drains. Shelter: {shelter}. Disaster helpline: 1070.',
    te: 'వరద ప్రమాదం: {area} లో ముంపు ప్రమాదం ({level}% నీరు). తక్షణమే ఎత్తైన సురక్షిత ప్రాంతాలకు వెళ్లండి. అండర్‌పాస్‌ల వైపు వెళ్లవద్దు. ఆశ్రయం: {shelter}. హెల్ప్‌లైన్: 1070.',
    hi: 'बाढ़ खतरा: {area} में तेजी से जलभराव ({level}% जलस्तर)। तुरंत ऊंचे सुरक्षित स्थानों पर जाएं। अंडरपास और नालों से दूर रहें। आश्रय: {shelter}। हेल्पलाइन: 1070.'
  },
  ALL_CLEAR: {
    en: 'FLOOD ALL CLEAR: Floodwaters receding across {area}. Water returned to safe channels. Safe to return home. Avoid fallen wires and standing water. Helpline: 1070.',
    te: 'వరద ముప్పు తగ్గింది: {area} లో వరద నీరు తగ్గుముఖం పట్టింది. ప్రజలు సురక్షితంగా ఇళ్లకు వెళ్లవచ్చు. తెగిన విద్యుత్ తీగలను తాకవద్దు. హెల్ప్‌లైన్: 1070.',
    hi: 'बाढ़ खतरा टला: {area} में जलस्तर सुरक्षित स्तर पर पहुंच गया है। नागरिक सुरक्षित लौट सकते हैं। टूटे बिजली तारों से दूर रहें। हेल्पलाइन: 1070.'
  }
};

// Compact / Shortened templates guaranteed to fit single SMS segment
// GSM-7 <= 160 chars; UCS-2 <= 70 chars
export const SHORTENED_FLOOD_TEMPLATES = {
  WATCH: {
    en: 'FLOOD WATCH: Heavy rain forecast in {area}. Water normal now. Avoid low areas & keep phone charged. Helpline 1070.',
    te: 'వరద అప్రమత్తత: భారీ వర్ష సూచన. లోతట్టు ప్రజలు జాగ్రత్త. హెల్ప్‌లైన్ 1070.',
    hi: 'बाढ़ अलर्ट: भारी बारिश का अनुमान। निचले इलाके सतर्क रहें। हेल्पलाइन 1070.'
  },
  WARNING: {
    en: 'FLOOD WARNING: Water rising to {level}% in {area}. Move to higher ground. Shelter: {shelter}. Helpline 1070.',
    te: 'వరద హెచ్చరిక: నీరు పెరుగుతోంది. ఎత్తైన ప్రదేశాలకు వెళ్లండి. హెల్ప్‌లైన్ 1070.',
    hi: 'बाढ़ चेतावनी: जलस्तर बढ़ रहा है। सुरक्षित स्थान पर जाएं। हेल्पलाइन 1070.'
  },
  DANGER: {
    en: 'FLOOD DANGER: Rapid inundation in {area}. Move to higher ground now. Shelter: {shelter}. Helpline 1070.',
    te: 'వరద ప్రమాదం: వెంటనే సురక్షిత ప్రాంతాలకు తరలండి. హెల్ప్‌లైన్ 1070.',
    hi: 'बाढ़ खतरा: तुरंत ऊंचे स्थान पर जाएं। अंडरपास से बचें। हेल्पलाइन 1070.'
  },
  ALL_CLEAR: {
    en: 'FLOOD ALL CLEAR: Floodwaters receding in {area}. Safe to return. Avoid standing water. Helpline 1070.',
    te: 'వరద ముప్పు తగ్గింది: నీరు తగ్గింది. సురక్షితంగా వెళ్లవచ్చు. హెల్ప్‌లైన్ 1070.',
    hi: 'बाढ़ खतरा टला: जलस्तर घट रहा है। सुरक्षित घर लौटें। हेल्पलाइन 1070.'
  }
};

// =============================================================================
// 5. GSM-7 vs UCS-2 CHARACTER SET & SEGMENT CALCULATION (Fixes the 181/160 Bug)
// =============================================================================
const GSM7_BASIC_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§àa-zäöñüà^{}\\\[~\]|€]*$/;

/**
 * Calculates exact SMS segment requirements conforming to telecom standards:
 * - GSM-7: 160 chars single, 153 chars/segment concatenated
 * - UCS-2 (Telugu, Hindi, Unicode): 70 chars single, 67 chars/segment concatenated
 */
export function calculateSmsSegments(text = '', languageHint = 'en') {
  if (!text) {
    const isUnicode = languageHint === 'te' || languageHint === 'hi';
    const maxSingle = isUnicode ? SMS_CONFIG.UNICODE_SINGLE_LIMIT : SMS_CONFIG.GSM7_SINGLE_LIMIT;
    const concat = isUnicode ? SMS_CONFIG.UNICODE_CONCAT_LIMIT : SMS_CONFIG.GSM7_CONCAT_LIMIT;
    return {
      encoding: isUnicode ? 'UCS-2 (Unicode)' : 'GSM-7',
      isUnicode,
      charCount: 0,
      segmentCount: 0,
      charsRemainingInSegment: maxSingle,
      isSingleSegment: true,
      maxSingleLimit: maxSingle,
      concatLimit: concat
    };
  }

  // Force Unicode if language is Indic, or if any character falls outside GSM-7 basic charset
  const hasUnicodeChars = !GSM7_BASIC_REGEX.test(text);
  const isUnicode = languageHint === 'te' || languageHint === 'hi' || hasUnicodeChars;

  const charCount = text.length;
  const maxSingleLimit = isUnicode ? SMS_CONFIG.UNICODE_SINGLE_LIMIT : SMS_CONFIG.GSM7_SINGLE_LIMIT;
  const concatLimit = isUnicode ? SMS_CONFIG.UNICODE_CONCAT_LIMIT : SMS_CONFIG.GSM7_CONCAT_LIMIT;

  let segmentCount = 1;
  let charsRemainingInSegment = 0;

  if (charCount <= maxSingleLimit) {
    segmentCount = charCount === 0 ? 0 : 1;
    charsRemainingInSegment = maxSingleLimit - charCount;
  } else {
    segmentCount = Math.ceil(charCount / concatLimit);
    charsRemainingInSegment = (segmentCount * concatLimit) - charCount;
  }

  return {
    encoding: isUnicode ? 'UCS-2 (Unicode)' : 'GSM-7',
    isUnicode,
    charCount,
    segmentCount,
    charsRemainingInSegment,
    isSingleSegment: segmentCount <= 1,
    maxSingleLimit,
    concatLimit
  };
}

// =============================================================================
// 6. DRAFT GENERATOR & SHORTENER
// =============================================================================
export function generateFloodMessage(levelId, language = 'en', params = {}, useShortVersion = false) {
  const dictionary = useShortVersion ? SHORTENED_FLOOD_TEMPLATES : STANDARD_FLOOD_TEMPLATES;
  const templateSet = dictionary[levelId] || dictionary.WARNING;
  const rawTemplate = templateSet[language] || templateSet.en;

  const area = params.area || 'Industrial Corridor & Riverside Lowlands';
  const level = params.level || '87';
  const rain = params.rain || '48';
  const shelter = params.shelter || 'Govt High School Ward 4';

  return rawTemplate
    .replace('{area}', area)
    .replace('{level}', level)
    .replace('{rain}', rain)
    .replace('{shelter}', shelter);
}

// =============================================================================
// 7. SIMULATION TRIGGER ENGINE
// =============================================================================
/**
 * Automatically evaluates live simulation telemetry (drain nodes + forecast)
 * and returns recommended alert level, reason, and target areas.
 */
export function evaluateSimulationTriggers(drainNodes = [], forecastRainfall = 48) {
  // Check for critical flood stage or severe blockage
  const criticalDrain = drainNodes.find(d => {
    const isCritical = d.status === 'CRITICAL';
    const blockage = parseInt(d.blockagePct, 10) || 0;
    return isCritical || blockage >= 60;
  });

  const warningDrain = drainNodes.find(d => d.status === 'WARNING');

  if (criticalDrain || forecastRainfall >= 45) {
    return {
      recommendedLevel: 'DANGER',
      reason: `Water level at 87% & ${forecastRainfall}mm storm runoff detected at ${criticalDrain?.location || 'Industrial Corridor'}. Flash flooding imminent.`,
      targetZoneIds: ['zone-w14', 'zone-w4'],
      affectedAreaName: 'Industrial Corridor & Ward 4 Lowlands',
      waterLevelPct: 87,
      forecastRainMm: forecastRainfall,
      nearestShelter: 'Model High School Shelter (Ward 4)'
    };
  }

  if (warningDrain || forecastRainfall >= 30) {
    return {
      recommendedLevel: 'WARNING',
      reason: `Catchment runoff rising (68% water stage) at ${warningDrain?.location || 'North Weir'}. Flooding possible within 2-3 hours.`,
      targetZoneIds: ['zone-w4', 'zone-w9'],
      affectedAreaName: 'Ward 4 Riverside Lowlands',
      waterLevelPct: 68,
      forecastRainMm: forecastRainfall,
      nearestShelter: 'Community Center Shelter (Ward 9)'
    };
  }

  if (forecastRainfall >= 15) {
    return {
      recommendedLevel: 'WATCH',
      reason: `Meteorological alert: ${forecastRainfall}mm precipitation expected in next 12 hours. Drain levels currently normal.`,
      targetZoneIds: ['zone-w4', 'zone-w11'],
      affectedAreaName: 'North Catchment & Market Ward',
      waterLevelPct: 35,
      forecastRainMm: forecastRainfall,
      nearestShelter: 'Ward 11 Civic Hall'
    };
  }

  return {
    recommendedLevel: 'ALL_CLEAR',
    reason: 'Water levels stabilized below 30% nominal capacity. Stormwater channels draining normally.',
    targetZoneIds: ['zone-w14'],
    affectedAreaName: 'All Municipal Drainage Basins',
    waterLevelPct: 22,
    forecastRainMm: 0,
    nearestShelter: 'All relief centers on standby'
  };
}

// =============================================================================
// 8. EXTRA CHANNELS PREVIEW GENERATORS
// =============================================================================
export function generateExtraChannels(levelId, language, params = {}) {
  const area = params.area || 'Industrial Corridor & Riverside Lowlands';
  const shelter = params.shelter || 'Govt High School Ward 4';
  const rain = params.rain || '48';
  const level = params.level || '87';
  const levelMeta = ALERT_LEVELS[levelId] || ALERT_LEVELS.WARNING;

  // 1. Public Alerts Feed Web Post
  const publicFeedPost = {
    badge: `${levelMeta.name.toUpperCase()} ADVISORY`,
    title: levelId === 'DANGER' 
      ? `FLASH FLOOD EMERGENCY — Lowland Evacuation Active for ${area}`
      : levelId === 'WARNING'
      ? `Inundation Alert: Water Levels Rising in ${area}`
      : levelId === 'WATCH'
      ? `Pre-Monsoon Flood Surveillance Notice: ${area}`
      : `Flood Waters Receded: All Clear for ${area}`,
    body: levelId === 'DANGER'
      ? `Catchment sensors confirm rapid inundation (stage ${level}%). Citizens in ground floor residences within 500m of main storm conduits must move to ${shelter} immediately. Avoid all underpasses.`
      : levelId === 'WARNING'
      ? `Runoff inflow exceeds nominal culvert throughput. Standing water up to 1.5 ft anticipated within 2 hours. Move vehicles to designated high-ground parking.`
      : levelId === 'WATCH'
      ? `Heavy rain forecast (${rain}mm) expected. Municipal desilting units deployed. Avoid parking near open catch pits.`
      : `Floodwaters have cleared into the retention reservoir. Municipal crews have inspected primary culverts. Residents may safely return.`,
    postedTime: 'Just now',
    location: area,
    actionUrl: 'https://sensaflow.gov.in/shelters'
  };

  // 2. Siren / Loudspeaker Public Address Script
  const loudspeakerScript = {
    sirenTone: levelId === 'DANGER' 
      ? 'Continuous High-Pitch Wailing Siren (30s) — Evacuate Immediately'
      : levelId === 'WARNING'
      ? 'Intermittent Pulse Tone (15s) — Prepare for Rising Water'
      : levelId === 'WATCH'
      ? 'Single Chime Alert (5s) — Public Weather Notice'
      : 'Steady Low Tone (10s) — All Clear Signal',
    scriptText: levelId === 'DANGER'
      ? `[SIREN SOUND: 30 SECONDS] ATTENTION CITIZENS. THIS IS AN URGENT FLOOD WARNING FROM MUNICIPAL DISASTER CONTROL. FLOODWATERS ARE ENTERING ${area.toUpperCase()}. VACATE GROUND FLOORS IMMEDIATELY. EVACUATE TO ${shelter.toUpperCase()}. DO NOT ATTEMPT TO CROSS FLOODED ROADS. DIAL 1070 FOR RESCUE ASSISTANCE. REPEAT: EVACUATE NOW.`
      : levelId === 'WARNING'
      ? `[INTERMITTENT WARNING CHIME] ATTENTION RESIDENTS OF ${area.toUpperCase()}. WATER LEVELS ARE RISING DUE TO HEAVY RAINFALL. PLEASE MOVE VEHICLES AND VALUABLES TO ELEVATED SPOTS. DESIGNATED SHELTER IS AT ${shelter.toUpperCase()}. HELPLINE IS 1070.`
      : levelId === 'WATCH'
      ? `[CIVIC NOTICE CHIME] ATTENTION RESIDENTS. HEAVY RAINFALL IS FORECAST FOR ${area.toUpperCase()}. AVOID STANDING NEAR LARGE DRAINS. KEEP MOBILES CHARGED. EMERGENCY NUMBER IS 1070.`
      : `[CLEAR SIGNAL CHIME] ATTENTION RESIDENTS. FLOOD RISK HAS SUBSIDED ACROSS ${area.toUpperCase()}. WATER HAS DRAINED SAFELY. PLEASE REPORT ANY DAMAGED ROADS OR POWER LINES TO 1070.`,
    phoneticGuide: 'Tone modulation: 800Hz-1200Hz sweep at 110 dBA output.'
  };

  // 3. WhatsApp Citizen Alert Card
  const whatsappPreview = {
    senderName: 'Govt Flood Emergency Response Cell ✔',
    phone: '+91 40 2345 1070',
    title: `🚨 *OFFICIAL FLOOD ALERT: ${levelMeta.name.toUpperCase()}*`,
    content: levelId === 'DANGER'
      ? `*URGENT ADVISORY: Flash Flooding Active*\n\n📍 *Area:* ${area}\n🌊 *Water Level:* ${level}%\n⏱️ *Impact Time:* Immediate\n\n⚠️ *Action Required:*\n1. Move to 1st floor or higher\n2. Do NOT drive through waterlogged roads\n3. Nearest Shelter: *${shelter}*\n\n📞 *Disaster Helpline:* 1070 (Toll-Free)`
      : levelId === 'WARNING'
      ? `*ADVISORY: Rising Floodwater Warning*\n\n📍 *Area:* ${area}\n🌊 *Water Level:* ${level}%\n⏱️ *Expected Window:* Next 2-3 Hours\n\n⚠️ *Action Required:*\n• Park cars on elevated grounds\n• Prepare emergency kit with medicine\n• Relief Shelter: *${shelter}*\n\n📞 *Helpline:* 1070`
      : levelId === 'WATCH'
      ? `*WEATHER ALERT: Heavy Rain Watch*\n\n📍 *Area:* ${area}\n🌧️ *Forecast:* ${rain}mm rain in 12h\n\n⚠️ *Precaution:*\n• Clear private stormwater outlets\n• Keep phone and torch charged\n\n📞 *Helpline:* 1070`
      : `*STATUS UPDATE: All Clear*\n\n📍 *Area:* ${area}\n✅ Floodwaters safely drained\n• Safe to return to residences\n• Report damaged electric lines to 1070`,
    buttons: [
      { text: '📍 Open Shelter Route Map', type: 'url' },
      { text: '📞 Call 1070 Rescue Cell', type: 'call' }
    ]
  };

  return { publicFeedPost, loudspeakerScript, whatsappPreview };
}

// =============================================================================
// 9. LOCAL STORAGE PERSISTENCE & INITIAL SEED DATA
// =============================================================================
const STORAGE_KEY = 'sensaflow_alert_history';
const LEGACY_STORAGE_KEY = 'floodguard_alert_history';

const SEED_ALERT_HISTORY = [
  {
    id: 'ALT-SIM-0912',
    level: 'DANGER',
    area: 'Ward 14 (Industrial Corridor Basin)',
    language: 'en',
    message: 'FLOOD DANGER: Rapid inundation in Ward 14 Industrial Corridor. Move to higher ground now. Shelter: Govt High School Ward 4. Helpline 1070.',
    sentAt: '25 mins ago',
    timestamp: Date.now() - 25 * 60 * 1000,
    recipients: 3770,
    deliveryStatus: 'Delivered',
    deliveryPct: 98.4,
    segments: 1,
    encoding: 'GSM-7',
    isSimulated: true
  },
  {
    id: 'ALT-SIM-0884',
    level: 'WARNING',
    area: 'Ward 4 (Riverside Lowlands)',
    language: 'te',
    message: 'వరద హెచ్చరిక: నీరు పెరుగుతోంది. ఎత్తైన ప్రదేశాలకు వెళ్లండి. హెల్ప్‌లైన్ 1070.',
    sentAt: '1 hour ago',
    timestamp: Date.now() - 65 * 60 * 1000,
    recipients: 1420,
    deliveryStatus: 'Delivered',
    deliveryPct: 99.1,
    segments: 1,
    encoding: 'UCS-2 (Unicode)',
    isSimulated: true
  },
  {
    id: 'ALT-SIM-0842',
    level: 'WATCH',
    area: 'Ward 9 & Ward 11 Basin Catchment',
    language: 'hi',
    message: 'बाढ़ अलर्ट: भारी बारिश का अनुमान। निचले इलाके सतर्क रहें। हेल्पलाइन 1070.',
    sentAt: '3 hours ago',
    timestamp: Date.now() - 180 * 60 * 1000,
    recipients: 2160,
    deliveryStatus: 'Delivered',
    deliveryPct: 97.6,
    segments: 1,
    encoding: 'UCS-2 (Unicode)',
    isSimulated: true
  },
  {
    id: 'ALT-SIM-0790',
    level: 'ALL_CLEAR',
    area: 'Musi River South Embankment',
    language: 'en',
    message: 'FLOOD ALL CLEAR: Floodwaters receding across Musi River South Embankment. Water returned to safe channels. Safe to return home. Helpline 1070.',
    sentAt: 'Yesterday',
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    recipients: 3100,
    deliveryStatus: 'Delivered',
    deliveryPct: 100.0,
    segments: 1,
    encoding: 'GSM-7',
    isSimulated: true
  }
];

export function getAlertHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ALERT_HISTORY));
      return SEED_ALERT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_ALERT_HISTORY;
  } catch {
    return SEED_ALERT_HISTORY;
  }
}

export function saveAlertHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save alert history to localStorage:', err);
  }
}

// =============================================================================
// 10. SIMULATED DISPATCH ADAPTER (Swappable for Twilio / MSG91 in Production)
// =============================================================================
/**
 * Simulates dispatch of multi-recipient SMS broadcast.
 * In a real environment, replace this with:
 *   const response = await fetch('/api/v1/sms/dispatch', { method: 'POST', body: JSON.stringify(payload) });
 */
export async function simulateSmsDispatch(payload) {
  // Artificial mock network delay (600ms)
  await new Promise(res => setTimeout(res, 600));

  const transactionId = `SIM-DISPATCH-${Math.floor(1000 + Math.random() * 9000)}`;
  const deliveryRate = (97.5 + Math.random() * 2.3).toFixed(1);

  const newHistoryItem = {
    id: transactionId,
    level: payload.level,
    area: payload.area,
    language: payload.language,
    message: payload.message,
    sentAt: 'Just now',
    timestamp: Date.now(),
    recipients: payload.recipients,
    deliveryStatus: 'Delivered',
    deliveryPct: parseFloat(deliveryRate),
    segments: payload.segments || 1,
    encoding: payload.encoding || 'GSM-7',
    isSimulated: true
  };

  const currentHistory = getAlertHistory();
  const updatedHistory = [newHistoryItem, ...currentHistory];
  saveAlertHistory(updatedHistory);

  return {
    success: true,
    transactionId,
    deliveryRate: parseFloat(deliveryRate),
    queuedCount: payload.recipients,
    timestamp: new Date().toLocaleTimeString(),
    historyItem: newHistoryItem
  };
}
