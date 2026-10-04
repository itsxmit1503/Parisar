'use client';

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ParisarLogo } from '../ui/ParisarLogo';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { User } from '../../types';

interface AuthViewProps {
  initialMode?: 'login' | 'signup' | 'admin-login' | 'forgot-password';
  onSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

const DEPARTMENTS = [
  'Department of Computer Science & Applications (DCSA)',
  'Department of Electronics & Communication',
  'School of Chemical & Physical Sciences',
  'Department of Technology & Engineering',
  'Department of Mathematics & Statistics',
  'School of Law & Jurisprudence',
  'Department of Applied Geology',
  'Faculty of Commerce & Management',
  'Department of Hindi & Indian Languages',
  'Department of Physical Education & Sports Board',
];

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToLanding,
}) => {
  const {
    loginWithCredentials,
    activateAdminInvitation,
    registerStudentAccount,
    registerOrganizerAccount,
  } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'admin-login' | 'admin-activate' | 'forgot-password'>(initialMode);
  const [signupRole, setSignupRole] = useState<'student' | 'organizer'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showDemoHelper, setShowDemoHelper] = useState(false);

  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Invitation Activation Fields
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');

  // Signup Form Fields
  const [fullName, setFullName] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [semester, setSemester] = useState('6');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('+91 98260 ');
  const [reason, setReason] = useState('');
  const [supportingDoc, setSupportingDoc] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearErrors = () => {
    setErrorMsg(null);
    setResetSent(false);
  };

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'admin-login' | 'admin-activate' | 'forgot-password') => {
    clearErrors();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent, isAdminLogin = false) => {
    e.preventDefault();
    clearErrors();

    if (!loginIdentifier.trim()) {
      setErrorMsg('Account not found. Check your email or roll number.');
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMsg('Incorrect password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCredentials(loginIdentifier, loginPassword, isAdminLogin);
      setIsLoading(false);

      if (res.success) {
        if (res.data.role === 'organizer' && res.data.organizerStatus === 'PENDING') {
          showToast(
            'info',
            'Your organizer verification is still pending.',
            'Organizer Verification Pending'
          );
        } else {
          showToast(
            'success',
            `Signed in as ${res.data.name}`,
            'Welcome to PARISAR'
          );
        }
        onSuccess(res.data);
      } else {
        setErrorMsg(res.error.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Account not found. Check your email or roll number.');
    }
  };

  const handleActivateAdminInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!inviteEmail.trim() || !inviteToken.trim() || !invitePassword) {
      setErrorMsg('Institutional Email, One-Time Invitation Token, and Password are required.');
      return;
    }
    if (invitePassword.length < 8) {
      setErrorMsg('Administrator password must be at least 8 characters long.');
      return;
    }
    if (invitePassword !== inviteConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await activateAdminInvitation(inviteEmail, inviteToken, invitePassword);
    setIsLoading(false);

    if (res.success) {
      showToast('success', `Administrator account activated for ${res.data.name}.`, 'Admin Account Active');
      onSuccess(res.data);
    } else {
      setErrorMsg(res.error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!fullName.trim() || !universityId.trim() || !email.trim()) {
      setErrorMsg('Full Name, Roll Number / University ID, and University Email are mandatory.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (signupRole === 'organizer' && !reason.trim()) {
      setErrorMsg('Please provide your reason for requesting organizer access.');
      return;
    }

    setIsLoading(true);
    try {
      if (signupRole === 'student') {
        const res = await registerStudentAccount({
          name: fullName,
          rollNumber: universityId,
          email,
          department,
          semester: parseInt(semester, 10) || 6,
          password,
        });
        setIsLoading(false);

        if (res.success) {
          showToast(
            'success',
            `Student account created for ${res.data.name}. Welcome to PARISAR!`,
            'Account Created'
          );
          onSuccess(res.data);
        } else {
          setErrorMsg(res.error.message);
        }
      } else {
        const fullReason = supportingDoc.trim()
          ? `${reason.trim()} [Ref: ${supportingDoc.trim()}]`
          : reason.trim();

        const res = await registerOrganizerAccount({
          name: fullName,
          universityId,
          email,
          department,
          designation: designation.trim() || 'Faculty / Society Event Convener',
          phone,
          reason: fullReason,
          password,
        });
        setIsLoading(false);

        if (res.success) {
          showToast(
            'info',
            'Your organizer verification is still pending.',
            'Organizer Verification Pending'
          );
          onSuccess(res.data);
        } else {
          setErrorMsg(res.error.message);
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Unable to create account right now. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered University Email or Roll Number.');
      return;
    }
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot-password',
          identifier: loginIdentifier.trim(),
        }),
      });
    } catch {
      // Anti-enumeration: always show uniform response
    }
    setIsLoading(false);
    setResetSent(true);
    showToast(
      'info',
      'If an account exists for this email, password recovery instructions have been sent.',
      'Recovery Instructions Sent'
    );
  };

  const fillCredential = (id: string, isAdmin = false) => {
    clearErrors();
    if (isAdmin && mode !== 'admin-login') {
      setMode('admin-login');
    } else if (!isAdmin && mode !== 'login') {
      setMode('login');
    }
    setLoginIdentifier(id);
    setLoginPassword('parisar2026');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-2 sm:px-0">
      {/* Top Navigation Return */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#62605B] hover:text-[#18212B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#B6533C]" />
          <span>Back to PARISAR Landing</span>
        </button>

        <div className="text-[11px] font-mono text-[#62605B]">
          DHSGSU • Central University, Sagar
        </div>
      </div>

      {/* Main Editorial Authentication Card */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] shadow-[4px_4px_0_0_#18212B] overflow-hidden">
        {/* Institutional Header Strip */}
        <div className="bg-[#EAE5DB] border-b border-[#B9B4AA] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Dr. Harisingh Gour Vishwavidyalaya • DHSGSU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#18212B] tracking-tight font-serif">
                {mode === 'login' && 'Welcome back to PARISAR'}
                {mode === 'signup' && 'Create your PARISAR account'}
                {mode === 'admin-login' && 'PARISAR — University Administration'}
                {mode === 'admin-activate' && 'Activate Administrator Invitation'}
                {mode === 'forgot-password' && 'Campus Credential Recovery'}
              </h1>
              <p className="text-xs text-[#62605B]">
                {mode === 'login' && 'Sign in with your university roll number, employee ID, or institutional email.'}
                {mode === 'signup' && 'Select your university role below to register for campus events or apply for organizer privileges.'}
                {mode === 'admin-login' && 'Authorized university administrators only.'}
                {mode === 'admin-activate' && 'Enter your one-time invitation token from a Super Admin to set your password and activate your administrator account.'}
                {mode === 'forgot-password' && 'Verify your university enrollment or employee ID to receive password recovery instructions.'}
              </p>
            </div>
            <div className="shrink-0 hidden sm:block">
              <ParisarLogo size="md" variant="compact" />
            </div>
          </div>

          {/* Primary Mode Switcher (Login vs Create Account) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="grid grid-cols-2 gap-2 bg-[#FCFAF5] p-1.5 border border-[#B9B4AA] rounded-[3px] mt-6 font-mono text-xs font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`py-2.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
                    : 'text-[#62605B] hover:text-[#18212B]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                className={`py-2.5 text-center rounded-[2px] transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
                    : 'text-[#62605B] hover:text-[#18212B]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 bg-[#FDF0EE] border-l-4 border-l-[#A83226] border border-[#E9BFB8] rounded-[2px] text-xs text-[#A83226] flex items-start gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold uppercase font-mono text-[10px]">Authentication Notice</div>
                <div className="font-medium leading-relaxed">{errorMsg}</div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 1. LOGIN FORM (Section 4)                  */}
          {/* ========================================== */}
          {mode === 'login' && (
            <form onSubmit={e => handleLogin(e, false)} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1.5"
                >
                  Email / University ID (Roll No or Employee ID) *
                </label>
                <div className="flex items-center gap-2.5 bg-[#EAE5DB] border border-[#B9B4AA] px-3.5 py-2.5 rounded-[3px] focus-within:border-[#18212B] focus-within:bg-[#FCFAF5] transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <Mail className="w-4 h-4 text-[#B6533C] shrink-0" />
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="e.g. Y23141042 or amit.sharma@dhsgsu.edu.in"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-medium text-[#18212B] placeholder:text-[#62605B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B]"
                  >
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot-password')}
                    className="text-[11px] font-mono font-bold text-[#B6533C] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center gap-2.5 bg-[#EAE5DB] border border-[#B9B4AA] px-3.5 py-2.5 rounded-[3px] focus-within:border-[#18212B] focus-within:bg-[#FCFAF5] transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <Lock className="w-4 h-4 text-[#B6533C] shrink-0" />
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your campus password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-medium text-[#18212B] placeholder:text-[#62605B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center py-3 text-sm"
                >
                  Sign In to PARISAR
                </Button>
              </div>

              <div className="pt-4 border-t border-[#B9B4AA]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#62605B]">
                  New to PARISAR?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="font-bold text-[#B6533C] underline hover:text-[#18212B] cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>

                <button
                  type="button"
                  onClick={() => handleSwitchMode('admin-login')}
                  className="text-[11px] font-mono font-bold text-[#62605B] hover:text-[#18212B] flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B08A4A]" />
                  <span>Authorized University Admin Login →</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* 2. SIGNUP / CREATE ACCOUNT (Sections 5-7)  */}
          {/* ========================================== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Step 1: Select Account Type (Strictly Student or Organizer) */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-2">
                  Select Account Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setSignupRole('student');
                    }}
                    className={`p-4 rounded-[3px] border-2 text-left transition-all cursor-pointer ${
                      signupRole === 'student'
                        ? 'bg-[#FCFAF5] border-[#18212B] shadow-[3px_3px_0_0_#B6533C]'
                        : 'bg-[#EAE5DB]/60 border-[#B9B4AA] hover:bg-[#EAE5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 font-bold text-sm text-[#18212B]">
                        <GraduationCap className="w-4 h-4 text-[#B6533C]" />
                        <span>Student</span>
                      </span>
                      {signupRole === 'student' && (
                        <CheckCircle2 className="w-4 h-4 text-[#B6533C]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#62605B] leading-relaxed">
                      Discover upcoming seminars, workshops & cultural events, register in 1-click, and access your QR pass.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setSignupRole('organizer');
                    }}
                    className={`p-4 rounded-[3px] border-2 text-left transition-all cursor-pointer ${
                      signupRole === 'organizer'
                        ? 'bg-[#FCFAF5] border-[#18212B] shadow-[3px_3px_0_0_#B08A4A]'
                        : 'bg-[#EAE5DB]/60 border-[#B9B4AA] hover:bg-[#EAE5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 font-bold text-sm text-[#18212B]">
                        <Briefcase className="w-4 h-4 text-[#B08A4A]" />
                        <span>Organizer</span>
                      </span>
                      {signupRole === 'organizer' && (
                        <CheckCircle2 className="w-4 h-4 text-[#B08A4A]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#62605B] leading-relaxed">
                      Conduct official university events. Requires University Administrator verification before panel activation.
                    </p>
                  </button>
                </div>
              </div>

              {/* Organizer Verification Notice Banner */}
              {signupRole === 'organizer' && (
                <div className="p-3.5 bg-[#FBF4E8] border border-[#E5D2AF] border-l-4 border-l-[#B08A4A] rounded-[2px] text-xs text-[#18212B] space-y-1">
                  <div className="font-bold font-mono text-[10px] uppercase tracking-wider text-[#8F5E15] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B08A4A]" />
                    <span>DHSGSU Organizer Verification Policy</span>
                  </div>
                  <p className="text-[11px] text-[#62605B] leading-relaxed">
                    Submitting this form creates your account and forwards an <strong>Organizer Verification Request</strong> to the University Administrator. Organizer tools unlock immediately upon approval.
                  </p>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Ananya Verma"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    {signupRole === 'student'
                      ? 'University ID / Roll Number *'
                      : 'University ID / Roll / Employee ID *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={signupRole === 'student' ? 'e.g. Y24141055' : 'e.g. EMP-DCSA-112 or Y23141090'}
                    value={universityId}
                    onChange={e => setUniversityId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono font-bold text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    University Email *
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. ananya.verma@dhsgsu.edu.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {signupRole === 'student' ? (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                      Semester *
                    </label>
                    <select
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={String(sem)}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                        Semester / Designation *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Assistant Professor or 6th Sem Society Secretary"
                        value={designation}
                        onChange={e => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98260 12345"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Organizer-only Verification Fields */}
              {signupRole === 'organizer' && (
                <div className="space-y-3 pt-2 border-t border-[#B9B4AA]">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                      Reason for Organizing *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the university seminars, departmental workshops, or cultural events you are authorized to convene..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase text-[#62605B] mb-1">
                      Supporting Authorization Reference / Letter No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Endorsed by Head of Department (DCSA/2026/Notice-14)"
                      value={supportingDoc}
                      onChange={e => setSupportingDoc(e.target.value)}
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                    />
                  </div>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#B9B4AA]">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center py-3 text-sm"
                >
                  {signupRole === 'student'
                    ? 'Create Student Account & Enter Panel'
                    : 'Create Account & Submit Verification Request'}
                </Button>
              </div>

              <div className="pt-3 border-t border-[#B9B4AA]/60 text-center text-xs text-[#62605B]">
                Already have a PARISAR campus account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-[#B6533C] underline hover:text-[#18212B] cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* 3. UNIVERSITY ADMIN LOGIN (Sections 3, 7)  */}
          {/* ========================================== */}
          {mode === 'admin-login' && (
            <form onSubmit={e => handleLogin(e, true)} className="space-y-4">
              <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#B6533C] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Authorized university administrators only.</strong> Administrator accounts are provisioned by Dr. Harisingh Gour Vishwavidyalaya and cannot be created via public signup.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1.5">
                  University Email / Admin ID *
                </label>
                <div className="flex items-center gap-2.5 bg-[#EAE5DB] border border-[#B9B4AA] px-3.5 py-2.5 rounded-[3px] focus-within:border-[#18212B] focus-within:bg-[#FCFAF5]">
                  <KeyRound className="w-4 h-4 text-[#B6533C] shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Enter authorized administrator email or ID"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-mono font-bold text-[#18212B] placeholder:text-[#62605B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot-password')}
                    className="text-[11px] font-mono font-bold text-[#B6533C] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center gap-2.5 bg-[#EAE5DB] border border-[#B9B4AA] px-3.5 py-2.5 rounded-[3px] focus-within:border-[#18212B] focus-within:bg-[#FCFAF5]">
                  <Lock className="w-4 h-4 text-[#B6533C] shrink-0" />
                  <input
                    type="password"
                    required
                    placeholder="Enter administrative password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-medium text-[#18212B] placeholder:text-[#62605B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="submit"
                  variant="dark"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<ShieldCheck className="w-4 h-4 text-[#B6533C]" />}
                  className="w-full justify-center py-3 text-sm"
                >
                  Sign In
                </Button>
              </div>

              <div className="pt-3 border-t border-[#B9B4AA]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-mono font-bold text-[#62605B] hover:text-[#18212B] cursor-pointer"
                >
                  ← Standard Student / Organizer Login
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('admin-activate')}
                  className="font-mono text-[11px] font-bold text-[#B6533C] hover:underline cursor-pointer"
                >
                  Activate One-Time Admin Invitation →
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* 3B. ONE-TIME ADMIN INVITATION ACTIVATION   */}
          {/* ========================================== */}
          {mode === 'admin-activate' && (
            <form onSubmit={handleActivateAdminInvite} className="space-y-4">
              <div className="p-3.5 bg-[#FBF4E8] border border-[#E5D2AF] border-l-4 border-l-[#B08A4A] rounded-[2px] text-xs text-[#18212B]">
                Enter your invited DHSGSU institutional email and the one-time cryptographically generated invitation token issued by a Super Admin.
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1">
                  Invited Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. proctor@dhsgsu.edu.in"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1">
                  One-Time Invitation Token *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste one-time invitation token"
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-mono font-bold text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1">
                    Set New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={inviteConfirmPassword}
                    onChange={e => setInviteConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="dark"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<ShieldCheck className="w-4 h-4 text-[#B6533C]" />}
                  className="w-full justify-center py-3 text-sm"
                >
                  Activate Administrator Account
                </Button>
              </div>

              <div className="pt-3 border-t border-[#B9B4AA]/60 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('admin-login')}
                  className="font-mono font-bold text-[#62605B] hover:text-[#18212B] cursor-pointer"
                >
                  ← Back to Admin Login
                </button>
              </div>
            </form>
          )}

          {/* ========================================== */}
          {/* 4. FORGOT PASSWORD FLOW (Section 25)       */}
          {/* ========================================== */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetSent ? (
                <div className="p-4 bg-[#EBF3ED] border border-[#2F613B] rounded-[3px] text-xs text-[#2F613B] space-y-2">
                  <div className="font-bold flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recovery Instructions Sent</span>
                  </div>
                  <p className="leading-relaxed text-[#18212B]">
                    If an account exists for this email, password recovery instructions have been sent.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#18212B] mb-1.5">
                    Registered University Email or Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Y23141042 or amit.sharma@dhsgsu.edu.in"
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs font-mono font-bold text-[#62605B] hover:text-[#18212B] cursor-pointer"
                >
                  ← Return to Sign In
                </button>
                {!resetSent && (
                  <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Discreet Reference Directory Accordion for Student & Organizer Evaluators */}
          {mode !== 'admin-login' && mode !== 'admin-activate' && (
            <div className="pt-4 border-t border-[#B9B4AA]/60">
              <button
                type="button"
                onClick={() => setShowDemoHelper(!showDemoHelper)}
                className="w-full flex items-center justify-between text-[11px] font-mono text-[#62605B] hover:text-[#18212B] py-1 cursor-pointer"
              >
                <span>DHSGSU Student &amp; Organizer Directory Reference</span>
                {showDemoHelper ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDemoHelper && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-[#EAE5DB]/50 p-3 rounded-[3px] border border-[#B9B4AA]">
                  <button
                    type="button"
                    onClick={() => fillCredential('Y23141042')}
                    className="p-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-left hover:border-[#18212B] transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#2F613B]">STUDENT ACCOUNT</div>
                    <div className="text-[#18212B] font-sans font-bold">Amit Sharma</div>
                    <div className="text-[#62605B] text-[10px]">ID: Y23141042</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredential('alok.sahay@dhsgsu.edu.in')}
                    className="p-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-left hover:border-[#18212B] transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#B08A4A]">APPROVED ORGANIZER</div>
                    <div className="text-[#18212B] font-sans font-bold">Dr. Alok Sahay</div>
                    <div className="text-[#62605B] text-[10px]">ID: EMP-DCSA-104</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredential('Y23122018')}
                    className="p-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-left hover:border-[#18212B] transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#8F5E15]">PENDING ORGANIZER</div>
                    <div className="text-[#18212B] font-sans font-bold">Priya Patel</div>
                    <div className="text-[#62605B] text-[10px]">ID: Y23122018</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredential('Y23141088')}
                    className="p-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-left hover:border-[#18212B] transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[#A83226]">REJECTED ORGANIZER</div>
                    <div className="text-[#18212B] font-sans font-bold">Rohan Mehra</div>
                    <div className="text-[#62605B] text-[10px]">ID: Y23141088</div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
