'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import { 
  Calendar, 
  Award, 
  Bell, 
  Compass, 
  Settings, 
  CheckCircle2, 
  MapPin, 
  QrCode,
  Edit3,
  Save,
  LogOut
} from 'lucide-react';
import { EventPassport } from './EventPassport';
import { CertificatesView } from './CertificatesView';
import { NotificationsView } from './NotificationsView';
import { Button } from '../ui/Button';
import { CategoryBadge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

interface ProfileViewProps {
  initialSubTab?: 'my-events' | 'passport' | 'certificates' | 'notifications' | 'settings';
  onOpenPass: (reg: Registration, event: CampusEvent) => void;
  onExploreEvents: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialSubTab = 'my-events',
  onOpenPass,
  onExploreEvents,
  onLogout,
}) => {
  const {
    currentUser,
    registrations,
    events,
    certificates,
    attendance,
    currentDeviceId,
    currentPlatform,
    updateUserProfile,
    verifyOrReplaceDevice,
    revokeDevice,
    cancelRegistration,
    logout,
  } = useApp();
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'my-events' | 'passport' | 'certificates' | 'notifications' | 'settings'>(initialSubTab);
  const [myEventsFilter, setMyEventsFilter] = useState<'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const allStudentRegs = registrations.filter(r => r.userId === currentUser._id);
  const studentRegs = allStudentRegs.filter(r => r.status === 'CONFIRMED');
  const userCerts = certificates.filter(c => c.userId === currentUser._id);
  const userAttendance = attendance.filter(a => a.userId === currentUser._id);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department);
  const [semester, setSemester] = useState<number>(currentUser.semester || 6);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');

  // Settings State for Profile Form
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationSms, setNotificationSms] = useState(true);
  const [notificationDelays, setNotificationDelays] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateUserProfile({
      name: name.trim(),
      department: department.trim(),
      semester,
      phone: phone.trim(),
      ...(newPassword.trim() ? { passwordHash: newPassword.trim() } : {}),
    });
    setNewPassword('');
    setIsEditingProfile(false);
    showToast('success', 'Your DHSGSU student profile details have been saved.');
  };

  const handleSaveSettings = () => {
    setSavedMessage('Preferences updated successfully.');
    showToast('success', 'Your campus notification preferences have been updated.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleLogoutClick = () => {
    logout();
    if (onLogout) onLogout();
  };

  const categorizedRegs = allStudentRegs.filter(reg => {
    const evt = events.find(e => e._id === reg.eventId);
    if (!evt) return false;
    if (myEventsFilter === 'CANCELLED') {
      return reg.status === 'CANCELLED' || evt.status === 'CANCELLED';
    }
    if (reg.status === 'CANCELLED') return myEventsFilter === 'ALL';
    if (myEventsFilter === 'ONGOING') {
      return evt.status === 'ONGOING' || evt.attendanceSessionStatus === 'ACTIVE';
    }
    if (myEventsFilter === 'COMPLETED') {
      return evt.status === 'COMPLETED' || Boolean(reg.checkedInAt);
    }
    if (myEventsFilter === 'UPCOMING') {
      return evt.status === 'PUBLISHED' && !reg.checkedInAt;
    }
    return true;
  });

  const registeredDevices = currentUser.registeredDevices || [
    {
      deviceId: currentDeviceId,
      platform: currentPlatform,
      deviceName: currentPlatform === 'mobile' ? 'PARISAR Android Mobile Client' : 'PARISAR Web Client',
      verifiedAt: currentUser.createdAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Student Identity Card - Editorial Tactile Raised Card */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-8 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Student Photo with Sharp Tactile Border */}
            <div className="relative">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[3px] border-2 border-[#18212B] object-cover shadow-[2px_2px_0_0_#18212B]"
              />
              <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-[2px] bg-[#B6533C] text-white text-[9px] font-mono font-bold tracking-wider uppercase border border-[#18212B]">
                Student
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                  Dr. Harisingh Gour Vishwavidyalaya
                </span>
                <span className="text-[10px] font-mono text-[#62605B]">• Sagar, M.P.</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
                {currentUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#62605B]">
                <span className="font-mono text-[#18212B] font-bold">
                  University ID / Roll: {currentUser.rollNumber || 'N/A'}
                </span>
                <span>•</span>
                <span>{currentUser.department}</span>
                {currentUser.semester && (
                  <>
                    <span>•</span>
                    <span>Semester {currentUser.semester}</span>
                  </>
                )}
              </div>

              {/* Action Buttons: Edit Profile & Logout */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveSubTab('settings');
                    setIsEditingProfile(true);
                  }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  onClick={handleLogoutClick}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Academic Ledger Stats */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-[#B9B4AA] pt-4 md:pt-0 md:pl-6">
            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#18212B]">
                {userAttendance.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Attended
              </div>
            </div>

            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#B08A4A]">
                {userCerts.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Certificates
              </div>
            </div>

            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#B6533C]">
                {studentRegs.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Passes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#B9B4AA] scrollbar-none">
        <button
          onClick={() => setActiveSubTab('my-events')}
          className={`px-4 py-2 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'my-events'
              ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
              : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Events ({studentRegs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('passport')}
          className={`px-4 py-2 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'passport'
              ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
              : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Participation History</span>
        </button>

        <button
          onClick={() => setActiveSubTab('certificates')}
          className={`px-4 py-2 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'certificates'
              ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
              : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certificates ({userCerts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
              : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
              : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Profile & Preferences</span>
        </button>
      </div>

      {/* Tab 1: My Events (Categorized: Upcoming, Ongoing, Completed, Cancelled) */}
      {activeSubTab === 'my-events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#18212B]">My Registered Campus Events</h2>
              <p className="text-xs text-[#62605B]">Track your upcoming registrations, ongoing sessions, completed attendance, and cancelled passes.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onExploreEvents}>
              Explore More Events
            </Button>
          </div>

          {/* Lifecycle Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setMyEventsFilter(f)}
                className={`px-3 py-1.5 rounded-[3px] text-[11px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  myEventsFilter === f
                    ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                    : 'bg-[#EAE5DB] text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {categorizedRegs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorizedRegs.map(reg => {
                const event = events.find(e => e._id === reg.eventId);
                if (!event) return null;

                const isCheckedIn = Boolean(reg.checkedInAt);
                const attRec = userAttendance.find(a => a.eventId === event._id);
                const isCancelledReg = reg.status === 'CANCELLED' || event.status === 'CANCELLED';

                return (
                  <div
                    key={reg._id}
                    className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col justify-between space-y-4 hover:-translate-y-[1px] transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <CategoryBadge category={event.category} />
                        {isCancelledReg ? (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#A83226] bg-[#FBEFEF] px-2 py-0.5 rounded-[2px] border border-[#A83226]/30">
                            Cancelled
                          </span>
                        ) : isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2F613B] bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                            <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                            Attendance Verified ({attRec?.participationPercent ?? 100}%)
                          </span>
                        ) : event.status === 'ONGOING' ? (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#B26B16] bg-[#FDF7EC] px-2 py-0.5 rounded-[2px] border border-[#B26B16]/30">
                            Ongoing • Session Live
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#B6533C] bg-[#FBEFEF] px-2 py-0.5 rounded-[2px] border border-[#B6533C]/30">
                            Upcoming • Pass Ready
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-[#18212B] leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-1 text-xs text-[#62605B]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
                          <span>{new Date(event.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#64788A]" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#B9B4AA] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-[#62605B]">
                        Pass ID: <strong className="text-[#18212B]">{reg.qrToken}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCancelledReg && !isCheckedIn && event.status !== 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const res = cancelRegistration(reg._id);
                              if (res.success) {
                                showToast('info', 'Registration cancelled.');
                              } else {
                                showToast('error', res.error.message);
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        {!isCancelledReg && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<QrCode className="w-3.5 h-3.5" />}
                            onClick={() => onOpenPass(reg, event)}
                          >
                            View Event Pass
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-center space-y-3">
              <Calendar className="w-8 h-8 text-[#62605B] mx-auto opacity-50" />
              <h3 className="font-bold text-sm text-[#18212B]">No events found in this category</h3>
              <p className="text-xs text-[#62605B] max-w-sm mx-auto">
                Discover seminars, workshops, cultural events, and competitions happening across DHSGSU.
              </p>
              <Button variant="primary" size="sm" onClick={onExploreEvents}>
                Explore Campus Events
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Event Passport / Participation History */}
      {activeSubTab === 'passport' && (
        <EventPassport
          onViewCertificates={() => setActiveSubTab('certificates')}
          onExploreEvents={onExploreEvents}
        />
      )}

      {/* Tab 3: Certificates */}
      {activeSubTab === 'certificates' && (
        <CertificatesView onExploreEvents={onExploreEvents} />
      )}

      {/* Tab 4: Notifications */}
      {activeSubTab === 'notifications' && (
        <NotificationsView
          onNavigateToPass={() => setActiveSubTab('my-events')}
          onNavigateToCertificates={() => setActiveSubTab('certificates')}
        />
      )}

      {/* Tab 5: Profile & Settings */}
      {activeSubTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#18212B]">Student Profile & Preferences</h2>
                <p className="text-xs text-[#62605B] mt-0.5">Manage your DHSGSU student details, verified devices, and operational alerts.</p>
              </div>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {savedMessage && (
              <div className="p-3 bg-[#EBF3ED] border border-[#2F613B]/30 rounded-[2px] text-xs font-bold text-[#2F613B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{savedMessage}</span>
              </div>
            )}

            {/* Profile Information (View or Edit) */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-3 border-t border-[#B9B4AA]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#B6533C]">
                  Edit Student Profile & Password
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-bold text-[#18212B] focus:outline-none focus:border-[#18212B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">University ID / Roll Number</label>
                    <input
                      type="text"
                      value={currentUser.rollNumber || ''}
                      disabled
                      className="w-full px-3 py-2 bg-[#EAE5DB]/50 border border-[#B9B4AA] rounded-[2px] font-mono text-[#62605B] cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B] focus:outline-none focus:border-[#18212B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">Semester</label>
                    <select
                      value={semester}
                      onChange={e => setSemester(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B] focus:outline-none focus:border-[#18212B]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">Contact Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98260 12345"
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#18212B]">Change Password (Optional)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 pt-3 border-t border-[#B9B4AA]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                  Academic Enrollment Record
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                    <div className="text-[10px] text-[#62605B] uppercase font-bold">Full Student Name</div>
                    <div className="font-bold text-[#18212B] mt-0.5">{currentUser.name}</div>
                  </div>
                  <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                    <div className="text-[10px] text-[#62605B] uppercase font-bold">University ID / Roll Number</div>
                    <div className="font-mono font-bold text-[#18212B] mt-0.5">{currentUser.rollNumber}</div>
                  </div>
                  <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                    <div className="text-[10px] text-[#62605B] uppercase font-bold">Academic Department</div>
                    <div className="font-semibold text-[#18212B] mt-0.5">{currentUser.department}</div>
                  </div>
                  <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                    <div className="text-[10px] text-[#62605B] uppercase font-bold">University Email Address</div>
                    <div className="font-mono text-[#18212B] mt-0.5">{currentUser.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Device & Session Binding (1 Web + 1 Mobile Rule) */}
            <div className="space-y-3 pt-3 border-t border-[#B9B4AA]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                    Verified Device & Session Binding (1 Web + 1 Mobile Limit)
                  </div>
                  <p className="text-[11px] text-[#62605B] mt-0.5">
                    To prevent proxy attendance, each PARISAR account binds at most 1 verified Web session and 1 verified Android Mobile device.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      verifyOrReplaceDevice('web', 'PARISAR Web Browser');
                      showToast('success', 'Current Web Browser verified and bound to your account.');
                    }}
                  >
                    Verify Web Device
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      verifyOrReplaceDevice('mobile', 'PARISAR Android App');
                      showToast('success', 'Android Mobile Device slot verified and updated.');
                    }}
                  >
                    Bind Mobile Slot
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {registeredDevices.map(dev => (
                  <div
                    key={dev.deviceId}
                    className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#18212B] text-[#FCFAF5] text-[9px] font-mono font-bold uppercase">
                          {dev.platform}
                        </span>
                        <span className="font-bold text-[#18212B]">{dev.deviceName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#62605B] mt-1">
                        ID: {dev.deviceId} • Verified {new Date(dev.verifiedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        revokeDevice(dev.deviceId);
                        showToast('info', `Revoked ${dev.deviceName}.`);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-[#A83226] bg-[#FBEFEF] border border-[#A83226]/30 rounded-[2px] cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3 pt-3 border-t border-[#B9B4AA]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                Campus Operational Alerts & Delivery Channels
              </div>
              <div className="space-y-2.5 text-xs text-[#18212B]">
                <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationEmail}
                    onChange={e => setNotificationEmail(e.target.checked)}
                    className="w-4 h-4 accent-[#B6533C] rounded-[2px]"
                  />
                  <div>
                    <div className="font-bold">Email Confirmations & Pass Generation</div>
                    <div className="text-[#62605B] text-[11px]">Send QR pass token directly to {currentUser.email}</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationDelays}
                    onChange={e => setNotificationDelays(e.target.checked)}
                    className="w-4 h-4 accent-[#B6533C] rounded-[2px]"
                  />
                  <div>
                    <div className="font-bold">Urgent Room Relocations & Schedule Delays</div>
                    <div className="text-[#62605B] text-[11px]">Immediate in-app and SMS alerts when lecture halls change on Patharia Hills</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSms}
                    onChange={e => setNotificationSms(e.target.checked)}
                    className="w-4 h-4 accent-[#B6533C] rounded-[2px]"
                  />
                  <div>
                    <div className="font-bold">SMS Notifications to Registered Mobile</div>
                    <div className="text-[#62605B] text-[11px]">Send dispatch notices to {currentUser.phone || '+91 98260 12345'}</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#B9B4AA] flex items-center justify-between">
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleLogoutClick}
              >
                Logout of PARISAR
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSettings}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
