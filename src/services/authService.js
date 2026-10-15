/**
 * SensaFlow — Authentication Service & Government Identity Adapter
 * 
 * Provides isolated authentication architecture.
 * Integrates with live backend when VITE_API_URL is configured,
 * or routes through a secure Development Mock Authentication Adapter in demo mode.
 */

// =============================================================================
// 1. ALLOWED DEMO DOMAINS & DEMO ACCOUNTS
// =============================================================================
export const ALLOWED_DEMO_DOMAINS = ['demo.sensaflow.ai', 'demo.floodguard.ai'];

export const DEMO_PASSWORD = 'Demo@GovGuard2026';

export const DEMO_ACCOUNTS = [
  {
    employeeId: 'EMP-DEMO-01',
    email: 'officer@demo.sensaflow.ai',
    name: 'Demo Officer',
    department: 'State Disaster Management Authority',
    designation: 'Disaster Response Coordinator',
    jurisdiction: 'Regional Monitoring Division',
    badgeNumber: 'DEMO-01',
    phone: '+91 98765 43210'
  },
  {
    employeeId: 'EMP-DEMO-02',
    email: 'engineer@demo.sensaflow.ai',
    name: 'Demo Field Engineer',
    department: 'Public Works Department',
    designation: 'Drainage Field Engineer',
    jurisdiction: 'Stormwater Culvert Division 4',
    badgeNumber: 'DEMO-02',
    phone: '+91 98765 43211'
  },
  {
    employeeId: 'EMP-DEMO-03',
    email: 'coordinator@demo.sensaflow.ai',
    name: 'Demo District Officer',
    department: 'District Disaster Management Authority',
    designation: 'District Coordinator',
    jurisdiction: 'Coastal & Urban Lowland',
    badgeNumber: 'DEMO-03',
    phone: '+91 98765 43212'
  }
];

export const DEPARTMENTS = [
  'State Disaster Management Authority',
  'District Disaster Management Authority',
  'Public Works Department',
  'Municipal Corporation / Municipality',
  'Irrigation / Water Resources Department',
  'Emergency Response / Fire Services',
  'Other Authorized Department'
];

export const DEPARTMENT_DESIGNATIONS = {
  'State Disaster Management Authority': [
    'Disaster Response Coordinator',
    'State Control Room Officer',
    'Emergency Response Officer',
    'System Administrator'
  ],
  'District Disaster Management Authority': [
    'District Coordinator',
    'District Officer',
    'Emergency Response Officer'
  ],
  'Public Works Department': [
    'Drainage Field Engineer',
    'Field Engineer',
    'Executive Engineer'
  ],
  'Municipal Corporation / Municipality': [
    'Drainage Field Engineer',
    'Field Engineer',
    'Municipal Ward Officer',
    'System Administrator'
  ],
  'Irrigation / Water Resources Department': [
    'Drainage Field Engineer',
    'Field Engineer',
    'Hydrologist'
  ],
  'Emergency Response / Fire Services': [
    'Disaster Response Coordinator',
    'Emergency Response Officer',
    'Rescue Team Commander'
  ],
  'Other Authorized Department': [
    'Disaster Response Coordinator',
    'Drainage Field Engineer',
    'District Coordinator',
    'District Officer',
    'Field Engineer',
    'State Control Room Officer',
    'Emergency Response Officer',
    'System Administrator'
  ]
};

// All combined unique designations for flexible selection
export const ALL_DESIGNATIONS = Array.from(
  new Set(Object.values(DEPARTMENT_DESIGNATIONS).flat())
);

// Backward compatibility default designations list
export const DESIGNATIONS = ALL_DESIGNATIONS;

// =============================================================================
// 2. SHARED EMAIL VALIDATOR (CLIENT & MOCK ADAPTER)
// =============================================================================
/**
 * Validate government official email address format.
 * Accepts:
 *  - Standard email format (name@domain.tld)
 *  - Matches ALLOWED_DEMO_DOMAINS (e.g. demo.floodguard.ai)
 *  - Ends with .gov.in, .nic.in, .gov, .org, .ai, .ac.in, .res.in, .mil, .edu, etc.
 *  - Contains government/organizational domain indicators
 */
export function isValidOfficialEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();

  // Standard RFC 5322 regex approximation for basic syntax
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return false;
  const domain = trimmed.slice(atIndex + 1);

  // 1. Check if domain matches any allowed demo domains
  if (
    ALLOWED_DEMO_DOMAINS.includes(domain) ||
    ALLOWED_DEMO_DOMAINS.some(allowed => domain.endsWith(`.${allowed}`))
  ) {
    return true;
  }

  // 2. Check acceptable government or organizational domain suffixes
  const allowedSuffixes = [
    '.gov.in',
    '.nic.in',
    '.gov',
    '.org',
    '.ai',
    '.org.in',
    '.ac.in',
    '.res.in',
    '.mil',
    '.edu',
    '.edu.in'
  ];

  if (allowedSuffixes.some(suffix => domain.endsWith(suffix) || domain.includes('.gov.') || domain.includes('.state.'))) {
    return true;
  }

  // 3. Check if domain contains organizational keyword
  if (domain.includes('gov') || domain.includes('org')) {
    return true;
  }

  return false;
}

// =============================================================================
// 3. RATE LIMITING & AUDIT LEDGER (IN-MEMORY)
// =============================================================================
const attemptTracker = new Map();
const auditLedger = [];

function checkRateLimit(employeeId) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10; // Generous limit for evaluation & testing

  const record = attemptTracker.get(employeeId) || { attempts: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.attempts = 0;
    record.resetAt = now + windowMs;
  }

  if (record.attempts >= maxAttempts) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      message: `Account temporarily locked due to excessive failed attempts. Please retry after ${waitSeconds} seconds.`
    };
  }

  return { allowed: true, record };
}

function registerAttempt(employeeId, success) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const record = attemptTracker.get(employeeId) || { attempts: 0, resetAt: now + windowMs };

  if (success) {
    attemptTracker.delete(employeeId);
    auditLedger.unshift({
      timestamp: new Date().toISOString(),
      type: 'AUTH_SUCCESS',
      employeeId,
      status: 'VERIFIED'
    });
  } else {
    record.attempts += 1;
    attemptTracker.set(employeeId, record);
    auditLedger.unshift({
      timestamp: new Date().toISOString(),
      type: 'AUTH_FAILURE',
      employeeId,
      status: 'REJECTED'
    });
  }
}

function normalizeString(str) {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// =============================================================================
// 4. PRIMARY AUTHENTICATION FUNCTION
// =============================================================================
export async function authenticateEmployee({
  employeeId,
  email,
  department,
  designation,
  password,
  rememberDevice
}) {
  const isRealBackendConfigured = Boolean(import.meta.env.VITE_API_URL);

  // 1. Sanitize input values
  const cleanId = (employeeId || '').trim().toUpperCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanDept = normalizeString(department);
  const cleanRole = normalizeString(designation);
  const cleanPassword = (password || '').trim();

  // 2. Validate email format using shared validator
  if (!isValidOfficialEmail(cleanEmail)) {
    const err = new Error('Enter a valid official government or organizational email');
    console.error('[Auth Error] Email validation failed:', err.message, { cleanEmail });
    throw err;
  }

  // 3. Rate limiting check
  const rateLimitStatus = checkRateLimit(cleanId);
  if (!rateLimitStatus.allowed) {
    const err = new Error(rateLimitStatus.message);
    console.error('[Auth Error] Rate limited:', err.message, { cleanId });
    throw err;
  }

  // 4. Real Backend Authentication (when endpoint is configured)
  if (isRealBackendConfigured) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/employee-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          employeeId: cleanId,
          email: cleanEmail,
          department,
          designation,
          password: cleanPassword,
          rememberDevice
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        registerAttempt(cleanId, false);
        throw new Error(errorData.message || 'Authentication failed: Invalid credentials or unauthorized department access.');
      }

      const data = await response.json();
      registerAttempt(cleanId, true);
      return {
        isDemo: false,
        user: data.user,
        token: data.token,
        sessionExpiry: data.expiresAt
      };
    } catch (err) {
      if (err.message && err.message.includes('Authentication failed')) {
        throw err;
      }
      throw new Error(`Production identity server unreachable: ${err.message}. Contact IT Operations.`);
    }
  }

  // 5. DEVELOPMENT MOCK ADAPTER (Demo Environment)
  await new Promise(resolve => setTimeout(resolve, 350));

  // Match against known demo accounts
  const matchedById = DEMO_ACCOUNTS.find(
    acc => acc.employeeId.toUpperCase() === cleanId
  );
  const matchedByEmail = DEMO_ACCOUNTS.find(
    acc => acc.email.toLowerCase() === cleanEmail 
      || acc.email.toLowerCase().replace('@demo.sensaflow.ai', '@demo.floodguard.ai') === cleanEmail
  );

  // If this was attempted as an EMP-DEMO account or a demo.sensaflow.ai / demo.floodguard.ai email
  const isDemoAccountAttempt = cleanId.startsWith('EMP-DEMO') || cleanEmail.includes('demo.sensaflow.ai') || cleanEmail.includes('demo.floodguard.ai');

  if (isDemoAccountAttempt) {
    if (!matchedById) {
      registerAttempt(cleanId, false);
      const err = new Error('Employee ID not found');
      console.error('[Auth Failure] Demo account ID not found:', cleanId);
      throw err;
    }

    if (!matchedByEmail || matchedById.employeeId !== matchedByEmail.employeeId) {
      registerAttempt(cleanId, false);
      const err = new Error('Email not recognised');
      console.error('[Auth Failure] Demo account email does not match ID:', { cleanId, cleanEmail });
      throw err;
    }

    if (cleanPassword !== DEMO_PASSWORD) {
      registerAttempt(cleanId, false);
      const err = new Error('Wrong password');
      console.error('[Auth Failure] Incorrect demo password for employee:', cleanId);
      throw err;
    }

    // Role and department validation (case & space tolerant)
    if (cleanDept && cleanRole) {
      const expectedDept = normalizeString(matchedById.department);
      const expectedRole = normalizeString(matchedById.designation);

      // Verify role matches department or matches demo account exactly
      const allowedRolesForDept = (DEPARTMENT_DESIGNATIONS[matchedById.department] || []).map(normalizeString);
      if (cleanDept !== expectedDept && !allowedRolesForDept.includes(cleanRole)) {
        registerAttempt(cleanId, false);
        const err = new Error('Role does not match department');
        console.error('[Auth Failure] Role does not match department:', { cleanDept, cleanRole, expectedDept, expectedRole });
        throw err;
      }
    }

    registerAttempt(cleanId, true);
    const mockToken = `gov_sim_jwt_${btoa(cleanId)}_${Date.now()}`;
    const expiryTime = Date.now() + (rememberDevice ? 7 * 24 * 3600 * 1000 : 8 * 3600 * 1000);

    return {
      isDemo: true,
      user: {
        ...matchedById,
        verifiedDepartment: matchedById.department,
        verifiedRole: matchedById.designation,
        isDemoSession: true
      },
      token: mockToken,
      sessionExpiry: expiryTime
    };
  }

  // 6. Generic Government Employee Demo Access (for custom gov emails)
  if (!cleanId || cleanId.length < 4) {
    registerAttempt(cleanId, false);
    const err = new Error('Employee ID not found');
    console.error('[Auth Failure] Invalid employee ID:', cleanId);
    throw err;
  }

  if (cleanPassword !== DEMO_PASSWORD && cleanPassword.length < 6) {
    registerAttempt(cleanId, false);
    const err = new Error('Wrong password');
    console.error('[Auth Failure] Password failed for ID:', cleanId);
    throw err;
  }

  if (!cleanRole || !cleanDept) {
    registerAttempt(cleanId, false);
    const err = new Error('Role does not match department');
    console.error('[Auth Failure] Missing department or designation');
    throw err;
  }

  registerAttempt(cleanId, true);
  const syntheticUser = {
    employeeId: cleanId,
    email: cleanEmail,
    name: `Officer ${cleanId.replace(/[^A-Z0-9]/g, '')}`,
    department: department || 'District Disaster Management Authority',
    designation: designation || 'District Officer',
    jurisdiction: 'Simulated Regional Monitoring Basin',
    clearanceLevel: 'Level 3 — Regional Officer',
    badgeNumber: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    verifiedDepartment: department || 'District Disaster Management Authority',
    verifiedRole: designation || 'District Officer',
    isDemoSession: true
  };

  const mockToken = `gov_sim_jwt_${btoa(cleanId)}_${Date.now()}`;
  const expiryTime = Date.now() + (rememberDevice ? 7 * 24 * 3600 * 1000 : 8 * 3600 * 1000);

  return {
    isDemo: true,
    user: syntheticUser,
    token: mockToken,
    sessionExpiry: expiryTime
  };
}

export function getAuditLogs() {
  return [...auditLedger];
}
