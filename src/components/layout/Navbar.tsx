'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  MapPin, 
  Award, 
  Bell, 
  QrCode, 
  Users, 
  PlusCircle, 
  ShieldCheck, 
  Ticket,
  Compass,
  User,
  Menu,
  X,
  FileText,
  Building2,
  Megaphone
} from 'lucide-react';
import { ParisarLogo } from '../ui/ParisarLogo';
import { Button } from '../ui/Button';

export type ActiveTab = 
  // Landing Page (Section 11)
  | 'landing'
  // Student tabs (Section 4 & 10)
  | 'student-home' 
  | 'student-events' 
  | 'student-passes' 
  | 'student-map' 
  | 'student-profile'
  | 'student-passport' 
  | 'student-notifications'
  | 'mobile-apk'
  // Organizer tabs (Section 5, 6 & 10)
  | 'organizer-dashboard'
  | 'organizer-events'
  | 'organizer-create'
  | 'organizer-scanner'
  | 'organizer-participants'
  | 'organizer-announcements'
  | 'organizer-certificates'
  | 'organizer-pending'
  // Admin tabs (Section 8 & 10)
  | 'admin-dashboard'
  | 'admin-organizer-requests'
  | 'admin-users'
  | 'admin-moderation'
  | 'admin-venues'
  | 'admin-audit';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCreateEvent?: () => void;
  onSendAnnouncement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab,
  onCreateEvent,
  onSendAnnouncement
}) => {
  const { 
    currentUser, 
    notifications, 
    registrations 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => n.userId === currentUser._id && !n.read).length;
  const userConfirmedPasses = registrations.filter(r => r.userId === currentUser._id && r.status === 'CONFIRMED').length;

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FCFAF5] border-b border-[#B9B4AA] shadow-[0_2px_4px_rgba(24,33,43,0.04)]">
      {/* Main Brand & Tactile Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
              title="Return to PARISAR Landing Page"
            >
              <ParisarLogo size="md" variant="compact" />
            </button>
          </div>

          {/* Desktop Navigation Links with Tactile Raised / Inset States */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            {currentUser.role === 'student' && (
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
                  onClick={() => handleNavClick('student-map')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'student-map' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Map
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
            )}

            {currentUser.role === 'organizer' && (
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
                  Events
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
                  <span>Attendance (Scanner)</span>
                </button>
                <button
                  onClick={() => handleNavClick('organizer-certificates')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'organizer-certificates' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Certificates
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-dashboard' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Governance
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
                </button>
                <button
                  onClick={() => handleNavClick('admin-users')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-users' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  User Directory
                </button>
                <button
                  onClick={() => handleNavClick('admin-moderation')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-moderation' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Moderation
                </button>
                <button
                  onClick={() => handleNavClick('admin-venues')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-venues' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Venues & Facilities
                </button>
                <button
                  onClick={() => handleNavClick('admin-audit')}
                  className={`px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                    activeTab === 'admin-audit' 
                      ? 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] shadow-[inset_0_1px_2px_rgba(24,33,43,0.06)] font-bold' 
                      : 'text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/50 border border-transparent'
                  }`}
                >
                  Audit Log
                </button>
              </>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              onClick={() => {
                if (currentUser.role === 'student') handleNavClick('student-profile');
                else handleNavClick('organizer-announcements');
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

            {/* Current User Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#B9B4AA]">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="w-7 h-7 rounded-[2px] border border-[#18212B] object-cover"
              />
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-[#18212B] truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono text-[#62605B]">
                  {currentUser.role === 'student' ? (currentUser.rollNumber || 'DHSGSU Student') : currentUser.role.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] hover:border-[#18212B] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#B9B4AA] space-y-1">
            <div className="p-2 mb-2 bg-[#EAE5DB] rounded-[2px] flex items-center gap-2.5">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="w-8 h-8 rounded-[2px] border border-[#18212B] object-cover"
              />
              <div>
                <div className="text-xs font-bold text-[#18212B]">{currentUser.name}</div>
                <div className="text-[10px] font-mono text-[#62605B]">{currentUser.department}</div>
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
                  Home (Overview)
                </button>
                <button
                  onClick={() => handleNavClick('student-events')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'student-events' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Discover Events
                </button>
                <button
                  onClick={() => handleNavClick('student-passes')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold flex items-center justify-between ${
                    activeTab === 'student-passes' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  <span>My Passes</span>
                  {userConfirmedPasses > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#B6533C] text-white">
                      {userConfirmedPasses}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('student-map')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'student-map' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Campus Map
                </button>
                <button
                  onClick={() => handleNavClick('student-profile')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'student-profile' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Profile & Passport
                </button>
              </>
            )}

            {currentUser.role === 'organizer' && (
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
                  Manage Events
                </button>
                <button
                  onClick={() => handleNavClick('organizer-scanner')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'organizer-scanner' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Attendance (QR Scanner)
                </button>
                <button
                  onClick={() => handleNavClick('organizer-participants')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'organizer-participants' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Participant Roster
                </button>
                <button
                  onClick={() => handleNavClick('organizer-certificates')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'organizer-certificates' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Certificates Authority
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => handleNavClick('admin-dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'admin-dashboard' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Oversight Console
                </button>
                <button
                  onClick={() => handleNavClick('admin-users')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'admin-users' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  User Directory
                </button>
                <button
                  onClick={() => handleNavClick('admin-moderation')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'admin-moderation' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Event Moderation
                </button>
                <button
                  onClick={() => handleNavClick('admin-venues')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'admin-venues' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Venues & Facilities
                </button>
                <button
                  onClick={() => handleNavClick('admin-audit')}
                  className={`w-full text-left px-3 py-2 rounded-[2px] text-xs font-bold ${
                    activeTab === 'admin-audit' ? 'bg-[#18212B] text-white' : 'text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  Security Audit Log
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
