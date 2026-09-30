'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  QrCode, 
  PlusCircle, 
  ShieldCheck, 
  User,
  Menu,
  X,
  LogOut,
  Edit3,
  ChevronDown,
  LogIn,
  UserPlus,
  Compass,
  Clock
} from 'lucide-react';
import { ParisarLogo } from '../ui/ParisarLogo';
import { Button } from '../ui/Button';

export type ActiveTab = 
  // Landing & Auth Pages
  | 'landing'
  | 'auth-login'
  | 'auth-signup'
  | 'auth-admin'
  // Student Panel (Section 10: Home, Events, My Events, My Pass, Profile)
  | 'student-home' 
  | 'student-events' 
  | 'student-my-events'
  | 'student-passes' 
  | 'student-map' 
  | 'student-profile'
  | 'student-passport' 
  | 'student-notifications'
  | 'mobile-apk'
  // Organizer Panel (Section 11: Dashboard, My Events, Create Event, Participants, Attendance, Profile)
  | 'organizer-dashboard'
  | 'organizer-events'
  | 'organizer-create'
  | 'organizer-scanner'
  | 'organizer-participants'
  | 'organizer-announcements'
  | 'organizer-certificates'
  | 'organizer-profile'
  | 'organizer-pending'
  // Admin Panel (Section 13: Dashboard, Organizer Requests, Events, Participants, Attendance, Settings)
  | 'admin-dashboard'
  | 'admin-organizer-requests'
  | 'admin-moderation'
  | 'admin-participants'
  | 'admin-attendance'
  | 'admin-users'
  | 'admin-venues'
  | 'admin-audit'
  | 'admin-profile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCreateEvent?: () => void;
  onSendAnnouncement?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  onCreateEvent,
  onLogout
}) => {
  const { 
    currentUser, 
    isAuthenticated,
    logout,
    notifications, 
    registrations,
    organizerRequests,
    events
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = isAuthenticated
    ? notifications.filter(n => n.userId === currentUser._id && !n.read).length
    : 0;
  const userConfirmedPasses = isAuthenticated
    ? registrations.filter(r => r.userId === currentUser._id && r.status === 'CONFIRMED').length
    : 0;
  const pendingOrgRequestsCount = organizerRequests.filter(r => r.status === 'PENDING').length;
  const pendingEventsCount = events.filter(e => e.status === 'PENDING_REVIEW').length;

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    if (onLogout) {
      onLogout();
    } else {
      setActiveTab('landing');
    }
  };

  const getRoleDisplayLabel = () => {
    if (currentUser.role === 'student') return 'STUDENT';
    if (currentUser.role === 'organizer') {
      if (currentUser.organizerStatus === 'PENDING') return 'ORGANIZER (PENDING)';
      if (currentUser.organizerStatus === 'REJECTED') return 'ORGANIZER (REJECTED)';
      return 'VERIFIED ORGANIZER';
    }
    return 'UNIVERSITY ADMINISTRATOR';
  };

  const handleViewProfile = () => {
    if (currentUser.role === 'student') handleNavClick('student-profile');
    else if (currentUser.role === 'organizer') handleNavClick('organizer-profile');
    else handleNavClick('admin-profile');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FCFAF5] border-b border-[#B9B4AA] shadow-[0_2px_4px_rgba(24,33,43,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
              title="PARISAR — Dr. Harisingh Gour Vishwavidyalaya"
            >
              <ParisarLogo size="md" variant="compact" />
            </button>
          </div>

          {/* Desktop Navigation Links — Role-Separated */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavClick('landing')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'landing'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold'
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Campus Overview
                </button>
                <button
                  onClick={() => handleNavClick('student-events')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'student-events'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold'
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#B6533C]" />
                  <span>Explore Events</span>
                </button>
                <button
                  onClick={() => handleNavClick('student-map')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'student-map'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold'
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Campus Map
                </button>
              </>
            ) : currentUser.role === 'student' ? (
              /* STUDENT PANEL NAVIGATION: Home, Events, My Events, My Pass, Profile */
              <>
                <button
                  onClick={() => handleNavClick('student-home')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'student-home' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('student-events')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'student-events' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => handleNavClick('student-my-events')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'student-my-events' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  My Events
                </button>
                <button
                  onClick={() => handleNavClick('student-passes')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'student-passes' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  <span>My Pass</span>
                  {userConfirmedPasses > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#B6533C] text-white font-bold">
                      {userConfirmedPasses}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('student-profile')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'student-profile' || activeTab === 'student-passport'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#B6533C]" />
                  <span>Profile</span>
                </button>
              </>
            ) : currentUser.role === 'organizer' ? (
              /* ORGANIZER PANEL NAVIGATION */
              currentUser.organizerStatus === 'VERIFIED' ? (
                /* Verified Organizer: Dashboard, My Events, Create Event, Participants, Attendance, Profile */
                <>
                  <button
                    onClick={() => handleNavClick('organizer-dashboard')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                      activeTab === 'organizer-dashboard' 
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavClick('organizer-events')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                      activeTab === 'organizer-events' 
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    My Events
                  </button>
                  {onCreateEvent && (
                    <button
                      onClick={onCreateEvent}
                      className="px-3 py-1.5 rounded-[3px] text-[#B6533C] hover:bg-[#EAE5DB] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create Event</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick('organizer-participants')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                      activeTab === 'organizer-participants' 
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    Participants
                  </button>
                  <button
                    onClick={() => handleNavClick('organizer-scanner')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'organizer-scanner' 
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#B6533C]" />
                    <span>Attendance</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('organizer-profile')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'organizer-profile' 
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#B6533C]" />
                    <span>Profile</span>
                  </button>
                </>
              ) : (
                /* Pending / Rejected Organizer: Restricted Navigation */
                <>
                  <button
                    onClick={() => handleNavClick('organizer-pending')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'organizer-pending'
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold'
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#B08A4A]" />
                    <span>Verification Status</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('organizer-profile')}
                    className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'organizer-profile'
                        ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold'
                        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#B6533C]" />
                    <span>Profile</span>
                  </button>
                </>
              )
            ) : (
              /* UNIVERSITY ADMINISTRATOR PANEL NAVIGATION: Dashboard, Organizer Requests, Events, Participants, Attendance, Settings */
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-dashboard' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('admin-organizer-requests')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin-organizer-requests' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B6533C]" />
                  <span>Organizer Requests</span>
                  {pendingOrgRequestsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#B08A4A] text-white font-bold">
                      {pendingOrgRequestsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('admin-moderation')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin-moderation' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  <span>Events</span>
                  {pendingEventsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#B6533C] text-white font-bold">
                      {pendingEventsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('admin-participants')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-participants' || activeTab === 'admin-users'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Participants
                </button>
                <button
                  onClick={() => handleNavClick('admin-attendance')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-attendance' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Attendance
                </button>
                <button
                  onClick={() => handleNavClick('admin-venues')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-venues' || activeTab === 'admin-audit'
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Settings
                </button>
              </>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<LogIn className="w-3.5 h-3.5" />}
                  onClick={() => handleNavClick('auth-login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => handleNavClick('auth-signup')}
                >
                  Create Account
                </Button>
              </div>
            ) : (
              <>
                {/* Notification Bell */}
                <button
                  onClick={() => {
                    if (currentUser.role === 'student') handleNavClick('student-notifications');
                    else if (currentUser.role === 'organizer') handleNavClick('organizer-profile');
                    else handleNavClick('admin-profile');
                  }}
                  className="relative p-2 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] hover:border-[#18212B] active:translate-y-[1px] transition-all cursor-pointer"
                  title="Campus Notices"
                >
                  <Bell className="w-4 h-4 text-[#18212B]" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B6533C] text-white text-[9px] font-bold flex items-center justify-center border border-[#FCFAF5]">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {/* Authenticated User Profile Menu Dropdown (Section 17) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="hidden sm:flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-[3px] border border-transparent hover:border-[#B9B4AA] hover:bg-[#EAE5DB]/60 transition-all cursor-pointer"
                    title="Account & Profile Menu"
                  >
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-[2px] border border-[#18212B] object-cover"
                    />
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold text-[#18212B] truncate max-w-[130px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[9px] font-mono font-bold text-[#B6533C] uppercase">
                        {getRoleDisplayLabel()}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#62605B]" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] shadow-[4px_4px_0_0_#18212B] py-2 z-50 animate-in fade-in duration-100">
                      {/* Profile Summary Header */}
                      <div className="px-4 py-3 border-b border-[#B9B4AA] bg-[#EAE5DB]/50 space-y-1">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={currentUser.profileImage}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-[2px] border border-[#18212B] object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#18212B] truncate">
                              {currentUser.name}
                            </div>
                            <div className="text-[10px] font-mono text-[#62605B] truncate">
                              {currentUser.email}
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-[2px] bg-[#18212B] text-[#FCFAF5] text-[9px] font-mono font-bold uppercase">
                              {getRoleDisplayLabel()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-[#B9B4AA]/60 text-[10px] font-mono text-[#62605B] space-y-0.5">
                          <div>
                            ID / Roll: <strong className="text-[#18212B]">{currentUser.rollNumber || 'DHSGSU'}</strong>
                          </div>
                          <div className="truncate">
                            Dept: <strong className="text-[#18212B]">{currentUser.department}</strong>
                          </div>
                          {(currentUser.semester || currentUser.designation) && (
                            <div>
                              {currentUser.semester ? `Semester ${currentUser.semester}` : currentUser.designation}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Profile Actions */}
                      <div className="py-1">
                        <button
                          onClick={handleViewProfile}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] flex items-center gap-2.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-[#B6533C]" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={handleViewProfile}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] flex items-center gap-2.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#64788A]" />
                          <span>Edit Profile</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-[#B9B4AA]">
                        <button
                          onClick={handleLogoutClick}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-[#A83226] hover:bg-[#FBEAEA] flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] hover:border-[#18212B] cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#B9B4AA] space-y-1.5">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('landing')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'landing' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Campus Overview
                </button>
                <button
                  onClick={() => handleNavClick('student-events')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'student-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Explore Events
                </button>
                <div className="pt-2 border-t border-[#B9B4AA] grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNavClick('auth-login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNavClick('auth-signup')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2.5 mb-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-[2px] border border-[#18212B] object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#18212B] truncate">{currentUser.name}</div>
                      <div className="text-[10px] font-mono font-bold text-[#B6533C] uppercase">
                        {getRoleDisplayLabel()} • {currentUser.rollNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {currentUser.role === 'student' && (
                  <>
                    <button
                      onClick={() => handleNavClick('student-home')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'student-home' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      onClick={() => handleNavClick('student-events')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'student-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => handleNavClick('student-my-events')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'student-my-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      My Events
                    </button>
                    <button
                      onClick={() => handleNavClick('student-passes')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold flex items-center justify-between ${
                        activeTab === 'student-passes' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      <span>My Pass</span>
                      {userConfirmedPasses > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#B6533C] text-white">
                          {userConfirmedPasses}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleNavClick('student-profile')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'student-profile' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Profile
                    </button>
                  </>
                )}

                {currentUser.role === 'organizer' && (
                  currentUser.organizerStatus === 'VERIFIED' ? (
                    <>
                      <button
                        onClick={() => handleNavClick('organizer-dashboard')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-dashboard' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleNavClick('organizer-events')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        My Events
                      </button>
                      {onCreateEvent && (
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onCreateEvent();
                          }}
                          className="w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold text-[#B6533C] hover:bg-[#EAE5DB]"
                        >
                          + Create Event
                        </button>
                      )}
                      <button
                        onClick={() => handleNavClick('organizer-participants')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-participants' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Participants
                      </button>
                      <button
                        onClick={() => handleNavClick('organizer-scanner')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-scanner' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => handleNavClick('organizer-profile')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-profile' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNavClick('organizer-pending')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-pending' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Verification Status
                      </button>
                      <button
                        onClick={() => handleNavClick('organizer-profile')}
                        className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                          activeTab === 'organizer-profile' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                        }`}
                      >
                        Profile
                      </button>
                    </>
                  )
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleNavClick('admin-dashboard')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-dashboard' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-organizer-requests')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-organizer-requests' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Organizer Requests ({pendingOrgRequestsCount})
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-moderation')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-moderation' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Events ({pendingEventsCount} Pending)
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-participants')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-participants' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Participants
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-attendance')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-attendance' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => handleNavClick('admin-venues')}
                      className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                        activeTab === 'admin-venues' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                      }`}
                    >
                      Settings
                    </button>
                  </>
                )}

                <div className="pt-2 border-t border-[#B9B4AA]">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold text-[#A83226] hover:bg-[#FBEAEA] flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
