import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  User,
  Mail,
  Building,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Info,
  LogIn,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DEPARTMENTS,
  DEPARTMENT_DESIGNATIONS,
  ALL_DESIGNATIONS,
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  isValidOfficialEmail
} from '../services/authService';
import ForgotPasswordModal from './ForgotPasswordModal';
import ContactAdminModal from './ContactAdminModal';

export default function LoginForm({ onNavigateToPublicAlerts, onSuccess }) {
  const { login, isAuthenticating, loginError, setLoginError, isDemoMode } = useAuth();

  // Controlled form states
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  // Field touch & validation error states
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // Modals & Panels
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(true); // Open by default for easy demo access

  // Dynamically compute available designations based on selected department
  const availableDesignations = useMemo(() => {
    if (!department) return ALL_DESIGNATIONS;
    return DEPARTMENT_DESIGNATIONS[department] || ALL_DESIGNATIONS;
  }, [department]);

  // Field validation function (uses shared validator)
  const validateField = (field, value, currentDept = department) => {
    switch (field) {
      case 'employeeId': {
        const val = (value || '').trim();
        if (!val) return 'Government Employee / Officer ID is required';
        if (val.length < 4) return 'Employee ID must be at least 4 characters';
        return null;
      }
      case 'email': {
        const val = (value || '').trim();
        if (!val) return 'Official government email address is required';
        if (!isValidOfficialEmail(val)) {
          return 'Enter a valid official government or organizational email (e.g. officer@demo.floodguard.ai)';
        }
        return null;
      }
      case 'department': {
        if (!value) return 'Please select your authorized department / authority';
        return null;
      }
      case 'designation': {
        if (!value) return 'Please select your official designation / role';
        return null;
      }
      case 'password': {
        if (!value) return 'Password is required to authenticate';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      }
      default:
        return null;
    }
  };

  // Re-run full form validation
  const validateAll = (vals = { employeeId, email, department, designation, password }) => {
    return {
      employeeId: validateField('employeeId', vals.employeeId, vals.department),
      email: validateField('email', vals.email, vals.department),
      department: validateField('department', vals.department, vals.department),
      designation: validateField('designation', vals.designation, vals.department),
      password: validateField('password', vals.password, vals.department)
    };
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const currentVal = { employeeId, email, department, designation, password }[field];
    const err = validateField(field, currentVal);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    // Clear global login error whenever user edits any field
    setLoginError(null);

    // Update field value
    if (field === 'employeeId') setEmployeeId(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (field === 'department') {
      setDepartment(value);
      // If the currently selected designation is not in the new department list, update gracefully
      const allowedRoles = DEPARTMENT_DESIGNATIONS[value] || ALL_DESIGNATIONS;
      if (designation && !allowedRoles.includes(designation)) {
        // If not in new department list, clear or keep if user hasn't explicitly picked a new one
        setDesignation('');
      }
    }

    if (field === 'designation') {
      setDesignation(value);
    }

    // Clear field-level error on change if already touched
    if (touched[field]) {
      const err = validateField(field, value, field === 'department' ? value : department);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  // Autofill demo profile with "Use"
  const handleAutoFillDemo = (acc) => {
    setEmployeeId(acc.employeeId);
    setEmail(acc.email);
    setDepartment(acc.department);
    setDesignation(acc.designation);
    setPassword(DEMO_PASSWORD);

    // Clear all errors and touched flags, then revalidate cleanly
    setTouched({});
    setErrors({});
    setLoginError(null);
  };

  // Guaranteed fallback: "Quick Sign In" button directly authenticates
  const handleQuickSignIn = async (acc) => {
    setLoginError(null);
    try {
      const result = await login({
        employeeId: acc.employeeId,
        email: acc.email,
        department: acc.department,
        designation: acc.designation,
        password: DEMO_PASSWORD,
        rememberDevice: false
      });

      if (result.success && onSuccess) {
        onSuccess(result.user);
      }
    } catch (err) {
      console.error('[Quick Sign In Error]', err);
    }
  };

  // Normal Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger touched for all fields to reveal errors
    setTouched({
      employeeId: true,
      email: true,
      department: true,
      designation: true,
      password: true
    });

    const newErrors = validateAll();
    setErrors(newErrors);

    // If any validation error exists, abort
    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    try {
      const result = await login({
        employeeId: employeeId.trim(),
        email: email.trim(),
        department,
        designation,
        password,
        rememberDevice
      });

      if (result.success && onSuccess) {
        onSuccess(result.user);
      }
    } catch (err) {
      console.error('[Form Submit Error]', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '520px',
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-medium)',
      boxShadow: 'var(--shadow-card)',
      padding: '32px 32px 28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative'
    }}>
      {/* CARD HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--gov-blue-50)',
              color: 'var(--gov-blue-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--gov-blue-100)'
            }}>
              <Shield size={18} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gov-blue-800)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              FloodGuard AI Portal
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'var(--gov-blue-50)',
            color: 'var(--gov-blue-700)',
            border: '1px solid var(--gov-blue-100)',
            padding: '3px 9px',
            borderRadius: '999px'
          }}>
            <ShieldCheck size={13} />
            <span>Authorized Personnel Only</span>
          </div>
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: '4px',
          marginBottom: 0
        }}>
          Government Employee Login
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          Sign in to access real-time hydrologic AI telemetry, drainage sensors, and municipal cell broadcasts.
        </p>

        {/* Demo Mode / Environment Notice */}
        {isDemoMode && (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Info size={14} color="var(--gov-blue-600)" />
              <span><strong>Demonstration Mode</strong>: Mock Auth Adapter</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--gov-blue-700)',
                background: 'var(--gov-blue-50)',
                border: '1px solid var(--gov-blue-100)',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={12} />
              {showDemoDrawer ? 'Hide Demo Logins' : 'Sample Logins'}
            </button>
          </div>
        )}

        {/* Quick Demo Accounts Drawer */}
        {showDemoDrawer && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Select a demo officer profile:
              </span>
              <span style={{ fontSize: '10px', color: 'var(--gov-blue-700)', fontWeight: 700 }}>
                Demo@GovGuard2026
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div
                  key={acc.employeeId}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {acc.designation} &bull; <code style={{ color: 'var(--text-secondary)' }}>{acc.employeeId}</code>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gov-blue-700)' }}>
                      {acc.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* "Use" button autofills all fields */}
                    <button
                      type="button"
                      onClick={() => handleAutoFillDemo(acc)}
                      title="Autofill form fields"
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Use
                    </button>

                    {/* Guaranteed Fallback: "Quick Sign In" authenticates directly */}
                    {isDemoMode && (
                      <button
                        type="button"
                        onClick={() => handleQuickSignIn(acc)}
                        disabled={isAuthenticating}
                        title="Skip form and login directly"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: 'var(--gov-blue-700)',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Zap size={11} />
                        <span>Quick Sign In</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ERROR BANNER ABOVE FORM */}
      {loginError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderLeft: '4px solid #EF4444',
          color: '#EF4444',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '12px'
        }} role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ lineHeight: 1.45, fontWeight: 600 }}>{loginError}</div>
        </div>
      )}

      {/* LOGIN FORM */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* FIELD 1: Government Employee ID */}
        <div>
          <label htmlFor="employeeId" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Government Employee ID <span style={{ color: 'var(--status-critical)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <User size={16} />
            </div>
            <input
              id="employeeId"
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. EMP-DEMO-01, EMP-DEMO-02"
              value={employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              onBlur={() => handleBlur('employeeId')}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${touched.employeeId && errors.employeeId ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(touched.employeeId && errors.employeeId)}
            />
          </div>
          {touched.employeeId && errors.employeeId && (
            <div style={{ fontSize: '11px', color: 'var(--status-critical)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>{errors.employeeId}</span>
            </div>
          )}
        </div>

        {/* FIELD 2: Official Government Email */}
        <div>
          <label htmlFor="officialEmail" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Official Email Address <span style={{ color: 'var(--status-critical)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <Mail size={16} />
            </div>
            <input
              id="officialEmail"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. officer@demo.floodguard.ai"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${touched.email && errors.email ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(touched.email && errors.email)}
            />
          </div>
          {touched.email && errors.email && (
            <div style={{ fontSize: '11px', color: 'var(--status-critical)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        {/* FIELD 3: Department / Authority */}
        <div>
          <label htmlFor="departmentSelect" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Department / Authority <span style={{ color: 'var(--status-critical)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <Building size={16} />
            </div>
            <select
              id="departmentSelect"
              required
              value={department}
              onChange={(e) => handleChange('department', e.target.value)}
              onBlur={() => handleBlur('department')}
              style={{
                width: '100%',
                padding: '9px 32px 9px 38px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${touched.department && errors.department ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                background: 'var(--bg-primary)',
                color: department ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(touched.department && errors.department)}
            >
              <option value="">Select your department or authority</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <ChevronDown size={16} />
            </div>
          </div>
          {touched.department && errors.department && (
            <div style={{ fontSize: '11px', color: 'var(--status-critical)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>{errors.department}</span>
            </div>
          )}
        </div>

        {/* FIELD 4: Designation / Role */}
        <div>
          <label htmlFor="designationSelect" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Designation / Role <span style={{ color: 'var(--status-critical)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <Briefcase size={16} />
            </div>
            <select
              id="designationSelect"
              required
              value={designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              onBlur={() => handleBlur('designation')}
              style={{
                width: '100%',
                padding: '9px 32px 9px 38px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${touched.designation && errors.designation ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                background: 'var(--bg-primary)',
                color: designation ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(touched.designation && errors.designation)}
            >
              <option value="">Select official designation / role</option>
              {availableDesignations.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <ChevronDown size={16} />
            </div>
          </div>
          {touched.designation && errors.designation && (
            <div style={{ fontSize: '11px', color: 'var(--status-critical)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>{errors.designation}</span>
            </div>
          )}
        </div>

        {/* FIELD 5: Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
            <label htmlFor="passwordInput" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password <span style={{ color: 'var(--status-critical)' }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                fontSize: '11px',
                color: 'var(--gov-blue-600)',
                fontWeight: 600,
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Forgot Password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}>
              <Lock size={16} />
            </div>
            <input
              id="passwordInput"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter your security credential"
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              style={{
                width: '100%',
                padding: '9px 40px 9px 38px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${touched.password && errors.password ? 'var(--status-critical)' : 'var(--border-medium)'}`,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-invalid={Boolean(touched.password && errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {touched.password && errors.password && (
            <div style={{ fontSize: '11px', color: 'var(--status-critical)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>{errors.password}</span>
            </div>
          )}
        </div>

        {/* REMEMBER DEVICE & IT SUPPORT LINK */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Remember this device (7 days)</span>
          </label>

          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gov-blue-600)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Contact IT Admin
          </button>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isAuthenticating}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: isAuthenticating ? 'var(--gov-blue-600)' : 'var(--gov-blue-700)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 800,
            border: 'none',
            cursor: isAuthenticating ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(30, 64, 175, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.15s'
          }}
        >
          {isAuthenticating ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Verifying Identity...</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>Secure Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* FOOTER: CITIZEN ADVISORY LINK */}
      <div style={{
        borderTop: '1px solid var(--border-light)',
        paddingTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <span>Not a government official?</span>
        <button
          type="button"
          onClick={onNavigateToPublicAlerts}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--water-cyan-600)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0
          }}
        >
          <span>View Public Flood Alerts</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* MODALS */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      <ContactAdminModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
}
