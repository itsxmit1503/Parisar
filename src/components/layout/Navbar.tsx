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
  Clock,
  Home,
  Calendar,
  Ticket,
  LayoutDashboard,
  Users
} from 'lucide-react';
import { ParisarLogo } from '../ui/ParisarLogo';
import { Button } from '../ui/Button';

export type ActiveTab = 
  // Landing & Auth Pages
  | 'landing'
  | 'auth-login'
  | 'auth-signup'
  | 'auth-admin'
  // Student Panel (Home, Events, My Events, My Pass, Profile)
  | 'student-home' 
  | 'student-events' 
  | 'student-my-events'
  | 'student-passes' 
  | 'student-map' 
  | 'student-profile'
  | 'student-passport' 
  | 'student-notifications'
  | 'mobile-apk'
  // Organizer Panel (Dashboard, My Events, Create Event, Participants, Attendance, Profile)
  | 'organizer-dashboard'
  | 'organizer-events'
  | 'organizer-create'
  | 'organizer-scanner'
  | 'organizer-participants'
  | 'organizer-announcements'
  | 'organizer-certificates'
  | 'organizer-profile'
  | 'organizer-pending'
  // Admin Panel (Dashboard, Organizer Requests, Events, Participants, Attendance, Settings)
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

  const desktopNavBtnClass = (isActive: boolean) =>
    `min-h-[40px] px-3.5 py-2 rounded-[3px] text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation ${
      isActive
        ? 'bg-[#18212B] text-[#FCFAF5] border border-[#18212B] font-bold shadow-[2px_2px_0_0_#B6533C]'
        : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/70 font-semibold border border-transparent'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FCFAF5] border-b border-[#B9B4AA] shadow-[0_2px_4px_rgba(24,33,43,0.04)] pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Platform Tag */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleNavClick(isAuthenticated ? (currentUser.role === 'admin' ? 'admin-dashboard' : currentUser.role === 'organizer' ? (currentUser.organizerStatus === 'VERIFIED' ? 'organizer-dashboard' : 'organizer-pending') : 'student-home') : 'landing')}
                className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer touch-manipulation py-1"
                title="PARISAR — Dr. Harisingh Gour Vishwavidyalaya"
              >
                <ParisarLogo size="md" variant="compact" />
              </button>
            </div>

            {/* Desktop Navigation Links — Role-Separated with Comfortable Touch Targets */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavClick('landing')}
                    className={desktopNavBtnClass(activeTab === 'landing')}
                  >
                    Campus Overview
                  </button>
                  <button
                    onClick={() => handleNavClick('student-events')}
                    className={desktopNavBtnClass(activeTab === 'student-events')}
                  >
                    <Compass className="w-4 h-4 text-[#B6533C]" />
                    <span>Explore Events</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('student-map')}
                    className={desktopNavBtnClass(activeTab === 'student-map')}
                  >
                    Campus Map
                  </button>
                </>
              ) : currentUser.role === 'student' ? (
                /* STUDENT DESKTOP NAVIGATION: Home, Events, My Events, My Pass, Profile */
                <>
                  <button
                    onClick={() => handleNavClick('student-home')}
                    className={desktopNavBtnClass(activeTab === 'student-home')}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleNavClick('student-events')}
                    className={desktopNavBtnClass(activeTab === 'student-events')}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => handleNavClick('student-my-events')}
                    className={desktopNavBtnClass(activeTab === 'student-my-events')}
                  >
                    My Events
                  </button>
                  <button
                    onClick={() => handleNavClick('student-passes')}
                    className={desktopNavBtnClass(activeTab === 'student-passes')}
                  >
                    <span>My Pass</span>
                    {userConfirmedPasses > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#B6533C] text-white font-bold leading-none">
                        {userConfirmedPasses}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick('student-profile')}
                    className={desktopNavBtnClass(activeTab === 'student-profile' || activeTab === 'student-passport')}
                  >
                    <User className="w-4 h-4 text-[#B6533C]" />
                    <span>Profile</span>
                  </button>
                </>
              ) : currentUser.role === 'organizer' ? (
                currentUser.organizerStatus === 'VERIFIED' ? (
                  /* VERIFIED ORGANIZER DESKTOP NAVIGATION */
                  <>
                    <button
                      onClick={() => handleNavClick('organizer-dashboard')}
                      className={desktopNavBtnClass(activeTab === 'organizer-dashboard')}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavClick('organizer-events')}
                      className={desktopNavBtnClass(activeTab === 'organizer-events')}
                    >
                      My Events
                    </button>
                    {onCreateEvent && (
                      <button
                        onClick={onCreateEvent}
                        className="min-h-[40px] px-3.5 py-2 rounded-[3px] text-xs sm:text-sm bg-[#B6533C] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] font-bold transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Create Event</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleNavClick('organizer-participants')}
                      className={desktopNavBtnClass(activeTab === 'organizer-participants')}
                    >
                      Participants
                    </button>
                    <button
                      onClick={() => handleNavClick('organizer-scanner')}
                      className={desktopNavBtnClass(activeTab === 'organizer-scanner')}
                    >
                      <QrCode className="w-4 h-4 text-[#B6533C]" />
                      <span>Attendance</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('organizer-profile')}
                      className={desktopNavBtnClass(activeTab === 'organizer-profile')}
                    >
                      <User className="w-4 h-4 text-[#B6533C]" />
                      <span>Profile</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNavClick('organizer-pending')}
                      className={desktopNavBtnClass(activeTab === 'organizer-pending')}
                    >
                      <Clock className="w-4 h-4 text-[#B08A4A]" />
                      <span>Verification Status</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('organizer-profile')}
                      className={desktopNavBtnClass(activeTab === 'organizer-profile')}
                    >
                      <User className="w-4 h-4 text-[#B6533C]" />
                      <span>Profile</span>
                    </button>
                  </>
                )
              ) : (
                /* UNIVERSITY ADMINISTRATOR DESKTOP NAVIGATION */
                <>
                  <button
                    onClick={() => handleNavClick('admin-dashboard')}
                    className={desktopNavBtnClass(activeTab === 'admin-dashboard')}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-organizer-requests')}
                    className={desktopNavBtnClass(activeTab === 'admin-organizer-requests')}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#B6533C]" />
                    <span>Organizer Requests</span>
                    {pendingOrgRequestsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#B08A4A] text-white font-bold leading-none">
                        {pendingOrgRequestsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-moderation')}
                    className={desktopNavBtnClass(activeTab === 'admin-moderation')}
                  >
                    <span>Events</span>
                    {pendingEventsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#B6533C] text-white font-bold leading-none">
                        {pendingEventsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-participants')}
                    className={desktopNavBtnClass(activeTab === 'admin-participants' || activeTab === 'admin-users')}
                  >
                    Participants
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-attendance')}
                    className={desktopNavBtnClass(activeTab === 'admin-attendance')}
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => handleNavClick('admin-venues')}
                    className={desktopNavBtnClass(activeTab === 'admin-venues' || activeTab === 'admin-audit')}
                  >
                    Settings
                  </button>
                </>
              )}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2.5">
              {!isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2">
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
                      className="hidden sm:inline-flex"
                    >
                      Create Account
                    </Button>
                  </div>
                  {/* Mobile Menu Hamburger for Logged-Out Visitors */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] cursor-pointer touch-manipulation"
                    aria-label="Toggle Menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                <>
                  {/* Notification Bell — Adequate 44x44 Touch Area */}
                  <button
                    onClick={() => {
                      if (currentUser.role === 'student') handleNavClick('student-notifications');
                      else if (currentUser.role === 'organizer') handleNavClick('organizer-profile');
                      else handleNavClick('admin-profile');
                    }}
                    className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] hover:border-[#18212B] active:translate-y-[1px] transition-all cursor-pointer touch-manipulation"
                    title="Campus Notices"
                  >
                    <Bell className="w-4 h-4 text-[#18212B]" />
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B6533C] text-white text-[10px] font-bold flex items-center justify-center border border-[#FCFAF5]">
                        {unreadNotifs}
                      </span>
                    )}
                  </button>

                  {/* Authenticated User Profile Menu Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="min-h-[44px] flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-[3px] border border-[#B9B4AA] bg-[#EAE5DB]/50 hover:bg-[#EAE5DB] transition-all cursor-pointer touch-manipulation"
                      title="Account & Profile Menu"
                    >
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-[2px] border border-[#18212B] object-cover"
                      />
                      <div className="hidden sm:block text-left leading-tight">
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
                      <div className="absolute right-0 mt-2 w-72 bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] shadow-[4px_4px_0_0_#18212B] py-2 z-50">
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
                          </div>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={handleViewProfile}
                            className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] flex items-center gap-2.5 cursor-pointer"
                          >
                            <User className="w-4 h-4 text-[#B6533C]" />
                            <span>View Profile</span>
                          </button>
                          <button
                            onClick={handleViewProfile}
                            className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] flex items-center gap-2.5 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 text-[#64788A]" />
                            <span>Edit Profile</span>
                          </button>
                        </div>

                        <div className="pt-1 border-t border-[#B9B4AA]">
                          <button
                            onClick={handleLogoutClick}
                            className="w-full min-h-[44px] px-4 py-2.5 text-left text-xs font-bold text-[#A83226] hover:bg-[#FBEAEA] flex items-center gap-2.5 cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logged-out Mobile Drawer */}
          {!isAuthenticated && mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-[#B9B4AA] space-y-2">
              <button
                onClick={() => handleNavClick('landing')}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-[3px] text-sm font-bold ${
                  activeTab === 'landing' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                }`}
              >
                Campus Overview
              </button>
              <button
                onClick={() => handleNavClick('student-events')}
                className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-[3px] text-sm font-bold ${
                  activeTab === 'student-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                }`}
              >
                Explore Events
              </button>
              <div className="pt-2 border-t border-[#B9B4AA] grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => handleNavClick('auth-login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => handleNavClick('auth-signup')}
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR (Sections 6, 14, 15) */}
      {isAuthenticated && (
        <nav
          aria-label="Primary Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF5] border-t-2 border-[#18212B] shadow-[0_-2px_10px_rgba(24,33,43,0.08)] pb-safe"
        >
          {currentUser.role === 'student' && (
            /* STUDENT MOBILE BOTTOM NAV: Home, Events, My Events, My Pass, Profile */
            <div className="grid grid-cols-5 h-16 px-1">
              <button
                onClick={() => handleNavClick('student-home')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'student-home'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[11px] leading-none">Home</span>
              </button>

              <button
                onClick={() => handleNavClick('student-events')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'student-events'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <Compass className="w-5 h-5" />
                <span className="text-[11px] leading-none">Events</span>
              </button>

              <button
                onClick={() => handleNavClick('student-my-events')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'student-my-events'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[11px] leading-none">My Events</span>
              </button>

              <button
                onClick={() => handleNavClick('student-passes')}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'student-passes'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <Ticket className="w-5 h-5" />
                <span className="text-[11px] leading-none">My Pass</span>
                {userConfirmedPasses > 0 && (
                  <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-[#B6533C] text-white text-[9px] font-bold flex items-center justify-center">
                    {userConfirmedPasses}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('student-profile')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'student-profile' || activeTab === 'student-passport'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[11px] leading-none">Profile</span>
              </button>
            </div>
          )}

          {currentUser.role === 'organizer' && (
            currentUser.organizerStatus === 'VERIFIED' ? (
              /* ORGANIZER MOBILE BOTTOM NAV: Dashboard, Events, Create, Participants, Profile */
              <div className="grid grid-cols-5 h-16 px-1">
                <button
                  onClick={() => handleNavClick('organizer-dashboard')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-dashboard'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavClick('organizer-events')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-events'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Events</span>
                </button>

                <button
                  onClick={() => onCreateEvent && onCreateEvent()}
                  className="flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 bg-[#B6533C] text-white font-bold border border-[#18212B] shadow-[1px_1px_0_0_#18212B] active:translate-y-[1px] transition-all cursor-pointer touch-manipulation"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Create</span>
                </button>

                <button
                  onClick={() => handleNavClick('organizer-participants')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-participants' || activeTab === 'organizer-scanner'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Participants</span>
                </button>

                <button
                  onClick={() => handleNavClick('organizer-profile')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-profile'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Profile</span>
                </button>
              </div>
            ) : (
              /* PENDING / REJECTED ORGANIZER MOBILE BOTTOM NAV */
              <div className="grid grid-cols-2 h-16 px-2">
                <button
                  onClick={() => handleNavClick('organizer-pending')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-1 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-pending'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Verification Status</span>
                </button>
                <button
                  onClick={() => handleNavClick('organizer-profile')}
                  className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-1 transition-all cursor-pointer touch-manipulation ${
                    activeTab === 'organizer-profile'
                      ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                      : 'text-[#62605B] active:bg-[#EAE5DB]'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Profile</span>
                </button>
              </div>
            )
          )}

          {currentUser.role === 'admin' && (
            /* ADMIN MOBILE BOTTOM NAV: Dashboard, Requests, Events, Attendance, Profile */
            <div className="grid grid-cols-5 h-16 px-1">
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[11px] leading-none">Dashboard</span>
              </button>

              <button
                onClick={() => handleNavClick('admin-organizer-requests')}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'admin-organizer-requests'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[11px] leading-none">Requests</span>
                {pendingOrgRequestsCount > 0 && (
                  <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-[#B08A4A] text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingOrgRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('admin-moderation')}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'admin-moderation'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[11px] leading-none">Events</span>
                {pendingEventsCount > 0 && (
                  <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-[#B6533C] text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingEventsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('admin-attendance')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'admin-attendance' || activeTab === 'admin-participants'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-[11px] leading-none">Attendance</span>
              </button>

              <button
                onClick={() => handleNavClick('admin-profile')}
                className={`flex flex-col items-center justify-center gap-1 rounded-[3px] my-1 mx-0.5 transition-all cursor-pointer touch-manipulation ${
                  activeTab === 'admin-profile' || activeTab === 'admin-venues'
                    ? 'bg-[#18212B] text-[#FCFAF5] font-bold shadow-[1px_1px_0_0_#B6533C]'
                    : 'text-[#62605B] active:bg-[#EAE5DB]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[11px] leading-none">Profile</span>
              </button>
            </div>
          )}
        </nav>
      )}
    </>
  );
};
