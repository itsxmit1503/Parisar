'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  Mail, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { setCurrentUserId, allUsers, organizerRequests } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [signupRole, setSignupRole] = useState<'student' | 'organizer'>('student');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Roll no or email
  const [department, setDepartment] = useState('Department of Computer Science & Applications');
  const [semester, setSemester] = useState('6');
  const [designation, setDesignation] = useState('Student Society Lead');
  const [phone, setPhone] = useState('+91 98260 00000');
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('parisar2026');

  const handleQuickLogin = (userId: string) => {
    setCurrentUserId(userId);
    const user = allUsers.find(u => u._id === userId);
    showToast('success', `Signed in as ${user?.name} (${user?.role.toUpperCase()})`, 'Welcome to PARISAR');
    onClose();
    if (user) onSuccess(user.role);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default to student-1 or find by email
    const found = allUsers.find(u => 
      u.email.toLowerCase() === identifier.toLowerCase() || 
      (u.rollNumber && u.rollNumber.toLowerCase() === identifier.toLowerCase())
    );

    if (found) {
      setCurrentUserId(found._id);
      showToast('success', `Signed in as ${found.name}`, 'Session Started');
      onClose();
      onSuccess(found.role);
    } else {
      // Fallback demo sign-in
      setCurrentUserId('student-1');
      showToast('success', 'Logged in as Amit Sharma (Student)', 'Demo Session Started');
      onClose();
      onSuccess('student');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !identifier.trim()) {
      showToast('error', 'Please enter your full name and university identifier.', 'Required Fields');
      return;
    }

    if (signupRole === 'student') {
      // Direct student signup
      setCurrentUserId('student-1');
      showToast('success', `Account created for ${fullName}. Welcome to PARISAR!`, 'Registration Complete');
      onClose();
      onSuccess('student');
    } else {
      // Organizer verification application
      setCurrentUserId('student-2'); // Set to pending organizer persona
      showToast(
        'info', 
        'Organizer verification request submitted to the Dean of Students Welfare Office.', 
        'Verification Pending'
      );
      onClose();
      onSuccess('organizer');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR • DHSGSU Authentication"
      subtitle="Dr. Harisingh Gour Vishwavidyalaya, Sagar (M.P.)"
      maxWidth="lg"
    >
      <div className="space-y-6 text-xs text-[#18212B]">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#EAE5DB] p-1 border border-[#B9B4AA] rounded-[2px] font-mono font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-center rounded-[2px] transition-colors ${
              mode === 'login' 
                ? 'bg-[#B6533C] text-white shadow-[1px_1px_0_0_#18212B]' 
                : 'text-[#62605B] hover:text-[#18212B]'
            }`}
          >
            Sign In to PARISAR
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2 text-center rounded-[2px] transition-colors ${
              mode === 'signup' 
                ? 'bg-[#B6533C] text-white shadow-[1px_1px_0_0_#18212B]' 
                : 'text-[#62605B] hover:text-[#18212B]'
            }`}
          >
            Create Campus Account
          </button>
        </div>

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <div className="space-y-5">
            {/* Quick Demo Switcher Cards */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-[#62605B] uppercase tracking-wider block">
                Quick Persona Login (For Testing & Evaluation):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student-1')}
                  className="text-left p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[2px_2px_0_0_#18212B] hover:bg-[#EAE5DB] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#18212B]">Amit Sharma</div>
                    <div className="text-[10px] text-[#62605B] font-mono">Student • Y23141042</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#2F613B] uppercase">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('org-1')}
                  className="text-left p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[2px_2px_0_0_#18212B] hover:bg-[#EAE5DB] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#18212B]">Dr. Alok Sahay</div>
                    <div className="text-[10px] text-[#62605B] font-mono">Faculty Convener • DCSA</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#B08A4A] uppercase">Organizer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('student-2')}
                  className="text-left p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[2px_2px_0_0_#18212B] hover:bg-[#EAE5DB] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#18212B]">Priya Patel</div>
                    <div className="text-[10px] text-[#62605B] font-mono">Physics • Pending Review</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#B08A4A] uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin-1')}
                  className="text-left p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[2px_2px_0_0_#18212B] hover:bg-[#EAE5DB] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#18212B]">Prof. S.P. Gautam</div>
                    <div className="text-[10px] text-[#62605B] font-mono">Dean Students Welfare (DSW)</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#B6533C] uppercase">Admin</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#B9B4AA]/50"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-[#62605B] uppercase">Or Enter Credentials</span>
              <div className="flex-grow border-t border-[#B9B4AA]/50"></div>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#18212B] mb-1">
                  University Roll Number or Campus Email
                </label>
                <div className="flex items-center gap-2 bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <Mail className="w-4 h-4 text-[#62605B]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Y23141042 or amit.sharma@dhsgsu.edu.in"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="w-full bg-transparent border-none text-xs focus:outline-none text-[#18212B] placeholder:text-[#62605B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#18212B] mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2 bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <Lock className="w-4 h-4 text-[#62605B]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-xs focus:outline-none text-[#18212B]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" className="w-full" type="submit">
                  Sign In to PARISAR
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 2. SIGNUP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            {/* Account Type Selection */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#18212B] mb-1.5 uppercase">
                Step 1: Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupRole('student')}
                  className={`p-3 border rounded-[2px] text-left transition-all ${
                    signupRole === 'student'
                      ? 'bg-[#FCFAF5] border-[#B6533C] shadow-[2px_2px_0_0_#B6533C]'
                      : 'bg-[#EAE5DB] border-[#B9B4AA]'
                  }`}
                >
                  <div className="font-bold text-[#18212B] flex items-center justify-between">
                    <span>Student</span>
                    {signupRole === 'student' && <CheckCircle2 className="w-3.5 h-3.5 text-[#B6533C]" />}
                  </div>
                  <div className="text-[10px] text-[#62605B] mt-0.5">
                    Participate in events, receive passes, earn certificates.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('organizer')}
                  className={`p-3 border rounded-[2px] text-left transition-all ${
                    signupRole === 'organizer'
                      ? 'bg-[#FCFAF5] border-[#B08A4A] shadow-[2px_2px_0_0_#B08A4A]'
                      : 'bg-[#EAE5DB] border-[#B9B4AA]'
                  }`}
                >
                  <div className="font-bold text-[#18212B] flex items-center justify-between">
                    <span>Event Organizer</span>
                    {signupRole === 'organizer' && <CheckCircle2 className="w-3.5 h-3.5 text-[#B08A4A]" />}
                  </div>
                  <div className="text-[10px] text-[#62605B] mt-0.5">
                    Requires DSW verification before creating events.
                  </div>
                </button>
              </div>

              <div className="mt-2 text-[10px] text-[#62605B] italic">
                * Note: Administrator accounts cannot be created publicly and must be designated by DHSGSU IT / DSW.
              </div>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#18212B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#18212B] mb-1">
                  {signupRole === 'student' ? 'Roll Number' : 'University Roll / Employee ID'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={signupRole === 'student' ? 'e.g. Y23141099' : 'e.g. EMP-DCSA-105'}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-[#18212B] mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] text-xs focus:outline-none"
                >
                  <option>Department of Computer Science & Applications</option>
                  <option>Department of Physics</option>
                  <option>Department of Electronics & Communication</option>
                  <option>Department of Mathematics</option>
                  <option>School of Law & Jurisprudence</option>
                  <option>Department of Technology & Engineering</option>
                  <option>Department of Applied Geology</option>
                  <option>Faculty of Commerce & Management</option>
                </select>
              </div>

              {signupRole === 'student' ? (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#18212B] mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] text-xs focus:outline-none"
                  >
                    <option value="2">Semester 2</option>
                    <option value="4">Semester 4</option>
                    <option value="6">Semester 6</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#18212B] mb-1">
                    Designation / Society Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Professor or Club President"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Organizer Specific Verification Fields (Section 7) */}
            {signupRole === 'organizer' && (
              <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] space-y-2">
                <div className="font-bold text-[#18212B] flex items-center gap-1.5 text-[11px] font-mono uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B08A4A]" />
                  <span>DHSGSU Organizer Credential Justification</span>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#62605B] mb-1">
                    Why do you need organizer privileges on PARISAR?
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Specify the events, clubs, or academic workshops you will be convening..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-[#FCFAF5] border border-[#B9B4AA] p-2 rounded-[2px] text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button variant="primary" size="md" className="w-full" type="submit">
                {signupRole === 'student' ? 'Complete Student Registration' : 'Submit Organizer Verification Application'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
