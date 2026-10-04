'use client';

import React, { useState, useRef } from 'react';
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
  ShieldCheck,
  Edit3,
  Save,
  LogOut,
  Camera,
  Upload,
  Trash2,
  Lock,
  User,
  KeyRound,
  Sliders,
  Eye,
  HelpCircle,
  Send,
  AlertCircle,
} from 'lucide-react';
import { EventPassport } from './EventPassport';
import { CertificatesView } from './CertificatesView';
import { NotificationsView } from './NotificationsView';
import { Button } from '../ui/Button';
import { CategoryBadge } from '../ui/Badge';
import { UserAvatar, isCustomUploadedPhoto } from '../ui/UserAvatar';
import { useToast } from '../ui/Toast';

interface ProfileViewProps {
  initialSubTab?: 'my-events' | 'passport' | 'certificates' | 'notifications' | 'settings';
  onOpenPass: (reg: Registration, event: CampusEvent) => void;
  onExploreEvents: () => void;
  onLogout?: () => void;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

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

  const [activeSubTab, setActiveSubTab] = useState<
    'my-events' | 'passport' | 'certificates' | 'notifications' | 'settings'
  >(initialSubTab);
  const [myEventsFilter, setMyEventsFilter] = useState<
    'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  >('ALL');
  const [settingsSection, setSettingsSection] = useState<
    'PROFILE' | 'ACCOUNT' | 'PREFERENCES' | 'PRIVACY' | 'SUPPORT'
  >('PROFILE');

  const allStudentRegs = registrations.filter(r => r.userId === currentUser._id);
  const studentRegs = allStudentRegs.filter(r => r.status === 'CONFIRMED');
  const userCerts = certificates.filter(c => c.userId === currentUser._id);
  const userAttendance = attendance.filter(a => a.userId === currentUser._id);

  // Editable Profile State (Section 12)
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(
    currentUser.bio ||
      'Undergraduate student at Dr. Harisingh Gour Vishwavidyalaya, Sagar.'
  );
  const [phone, setPhone] = useState(currentUser.phone || '');

  // Profile Photo Upload / Preview / Crop State (Sections 11 & 14)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Account Password State (Section 13 - ACCOUNT)
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Preferences State (Section 13 - PREFERENCES)
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi'>(
    currentUser.preferredLanguage || 'en'
  );
  const [emailConfirmations, setEmailConfirmations] = useState(
    currentUser.notificationPreferences?.emailConfirmations ?? true
  );
  const [eventReminders, setEventReminders] = useState(
    currentUser.notificationPreferences?.eventReminders ?? true
  );
  const [venueChanges, setVenueChanges] = useState(
    currentUser.notificationPreferences?.venueChanges ?? true
  );
  const [certificateAlerts, setCertificateAlerts] = useState(
    currentUser.notificationPreferences?.certificateAlerts ?? true
  );

  // Privacy State (Section 13 - PRIVACY)
  const [showProfileToOrganizers, setShowProfileToOrganizers] = useState(
    currentUser.privacyPreferences?.showProfileToOrganizers ?? true
  );
  const [showPassportPublicly, setShowPassportPublicly] = useState(
    currentUser.privacyPreferences?.showPassportPublicly ?? false
  );

  // Support Report Form State (Section 13 - SUPPORT)
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // Validate, square center-crop, and compress selected image file via HTML5 Canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError(
        'Invalid file format. Only JPEG, PNG, and WebP image files are permitted.'
      );
      showToast(
        'error',
        'Only JPEG, PNG, and WebP image files are allowed.',
        'Invalid File Type'
      );
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setPhotoError('Image file exceeds the 2.5 MB maximum upload size limit.');
      showToast('error', 'Image exceeds 2.5 MB limit.', 'File Too Large');
      return;
    }

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 64 || img.height < 64) {
          setPhotoError(
            'Image dimensions are too small. Minimum required resolution is 64×64 pixels.'
          );
          setIsProcessingPhoto(false);
          return;
        }

        // Square center-crop to 320x320 canvas
        const canvas = document.createElement('canvas');
        const targetSize = 320;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setPhotoError('Browser canvas context unavailable.');
          setIsProcessingPhoto(false);
          return;
        }

        const minSide = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minSide) / 2);
        const sy = Math.floor((img.height - minSide) / 2);

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPhotoPreview(croppedDataUrl);
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setPhotoError('Failed to decode image file. Please select a valid photo.');
        setIsProcessingPhoto(false);
      };
      img.src = String(reader.result);
    };
    reader.onerror = () => {
      setPhotoError('Could not read the selected file.');
      setIsProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!photoPreview) return;
    const res = updateUserProfile({ profileImage: photoPreview });
    if (res.success) {
      setPhotoPreview(null);
      setPhotoError(null);
      showToast(
        'success',
        'Profile photo updated across Web and Android sessions.',
        'Photo Saved'
      );
    } else {
      showToast('error', res.error?.message || 'Could not save photo.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
    updateUserProfile({ profileImage: '' });
    showToast(
      'info',
      'Profile photo removed. Restored deterministic initials avatar.',
      'Photo Removed'
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Full Name cannot be empty.');
      return;
    }
    const res = updateUserProfile({
      name: name.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
    });
    if (res.success) {
      showToast(
        'success',
        'Your DHSGSU student profile details have been saved.',
        'Profile Updated'
      );
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      showToast('error', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }
    updateUserProfile({ passwordHash: newPassword.trim() });
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmNewPassword('');
    showToast('success', 'Your account password has been updated.', 'Password Updated');
  };

  const handleSavePreferences = () => {
    updateUserProfile({
      preferredLanguage,
      notificationPreferences: {
        emailConfirmations,
        eventReminders,
        venueChanges,
        certificateAlerts,
      },
    });
    showToast('success', 'Language and notification preferences saved.', 'Preferences Saved');
  };

  const handleSavePrivacy = () => {
    updateUserProfile({
      privacyPreferences: {
        showProfileToOrganizers,
        showPassportPublicly,
      },
    });
    showToast('success', 'Privacy & visibility settings updated.', 'Privacy Updated');
  };

  const handleSubmitSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showToast('error', 'Please enter both a subject and a description.');
      return;
    }
    setSupportSubject('');
    setSupportMessage('');
    showToast(
      'success',
      'Your support request has been logged with the DHSGSU DSW Helpdesk.',
      'Request Submitted'
    );
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
      return (
        evt.status === 'ONGOING' ||
        evt.attendanceSessionStatus === 'OPEN' ||
        evt.attendanceSessionStatus === 'ACTIVE'
      );
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
      deviceName:
        currentPlatform === 'mobile'
          ? 'PARISAR Android Mobile Client'
          : 'PARISAR Web Client',
      verifiedAt: currentUser.createdAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
  ];

  const hasUploadedPhoto = isCustomUploadedPhoto(currentUser.profileImage);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Student Identity Card - Editorial Tactile Raised Card */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-8 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Deterministic Initials Avatar or Custom Uploaded Photo */}
            <div className="relative">
              <UserAvatar
                name={currentUser.name}
                profileImage={photoPreview || currentUser.profileImage}
                size="xl"
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
                  Roll Number: {currentUser.rollNumber || 'N/A'}
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
              {currentUser.bio && (
                <p className="text-xs text-[#4E5A67] max-w-xl pt-0.5">{currentUser.bio}</p>
              )}

              {/* Action Buttons: Edit Profile & Logout */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveSubTab('settings');
                    setSettingsSection('PROFILE');
                  }}
                >
                  Customize Profile &amp; Photo
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
            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#18212B]">
                {userAttendance.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Attended
              </div>
            </div>

            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#B08A4A]">
                {userCerts.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Certificates
              </div>
            </div>

            <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-[#B6533C]">
                {studentRegs.length}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#62605B] mt-0.5">
                Registrations
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
          <span>Profile &amp; Settings</span>
        </button>
      </div>

      {/* Tab 1: My Events */}
      {activeSubTab === 'my-events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#18212B]">
                My Registered Campus Events
              </h2>
              <p className="text-xs text-[#62605B]">
                Track your upcoming registrations, ongoing sessions, verified attendance, and digital registration cards.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onExploreEvents}>
              Explore More Events
            </Button>
          </div>

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
                const isCancelledReg =
                  reg.status === 'CANCELLED' || event.status === 'CANCELLED';

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
                            Present ({attRec?.participationPercent ?? 100}%)
                          </span>
                        ) : event.status === 'ONGOING' ? (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#B26B16] bg-[#FDF7EC] px-2 py-0.5 rounded-[2px] border border-[#B26B16]/30">
                            Ongoing • Session Live
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold uppercase text-[#B6533C] bg-[#FBEFEF] px-2 py-0.5 rounded-[2px] border border-[#B6533C]/30">
                            Confirmed Registration
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-[#18212B] leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-1 text-xs text-[#62605B]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
                          <span>
                            {new Date(event.startTime).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(event.startTime).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#64788A]" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#B9B4AA] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-[#62605B]">
                        Registration ID:{' '}
                        <strong className="text-[#18212B]">
                          {reg._id.toUpperCase()}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCancelledReg &&
                          !isCheckedIn &&
                          event.status !== 'COMPLETED' && (
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
                            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                            onClick={() => onOpenPass(reg, event)}
                          >
                            Registration Card
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
              <h3 className="font-bold text-sm text-[#18212B]">
                No events found in this category
              </h3>
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

      {/* Tab 2: Event Passport */}
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

      {/* Tab 5: Student Profile & Settings — 5 Structured Sections (Sections 10–15) */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Navigation Menu for the 5 Required Settings Sections */}
          <div className="lg:col-span-3 space-y-1.5">
            {(
              [
                { id: 'PROFILE', label: '1. Profile & Photo', icon: User },
                { id: 'ACCOUNT', label: '2. Account & Devices', icon: KeyRound },
                { id: 'PREFERENCES', label: '3. Preferences', icon: Sliders },
                { id: 'PRIVACY', label: '4. Privacy & Data', icon: Eye },
                { id: 'SUPPORT', label: '5. Help & Support', icon: HelpCircle },
              ] as const
            ).map(item => {
              const Icon = item.icon;
              const isActive = settingsSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettingsSection(item.id)}
                  className={`w-full px-4 py-3 rounded-[3px] text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#18212B] text-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
                      : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] hover:bg-[#EAE5DB]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="lg:col-span-9 space-y-6">
            {/* SECTION 1: PROFILE (Photo Customization, Editable Fields, Locked University Record) */}
            {settingsSection === 'PROFILE' && (
              <div className="space-y-6">
                {/* Profile Photo Upload / Crop / Remove Card */}
                <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#18212B]">
                      Student Profile Photo
                    </h3>
                    <p className="text-xs text-[#62605B] mt-0.5">
                      Upload a real profile photo or use your deterministic university initials avatar. Supported formats: JPEG, PNG, WebP (Max 2.5 MB).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px]">
                    <UserAvatar
                      name={currentUser.name}
                      profileImage={photoPreview || currentUser.profileImage}
                      size="xl"
                    />

                    <div className="space-y-2.5 flex-1">
                      <div className="text-xs font-semibold text-[#18212B]">
                        {photoPreview
                          ? 'Previewing cropped 320×320 profile photo (Click Save Photo to apply)'
                          : hasUploadedPhoto
                          ? 'Custom profile photo active'
                          : `Default Initials Avatar Active (${currentUser.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()})`}
                      </div>

                      {/* Hidden File & Camera Inputs */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="user"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={isProcessingPhoto}
                          leftIcon={<Upload className="w-3.5 h-3.5" />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {hasUploadedPhoto ? 'Change Photo' : 'Upload Photo'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Camera className="w-3.5 h-3.5" />}
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          Take Photo
                        </Button>

                        {photoPreview && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Save className="w-3.5 h-3.5" />}
                            onClick={handleSavePhoto}
                          >
                            Save Photo
                          </Button>
                        )}

                        {(hasUploadedPhoto || photoPreview) && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={handleRemovePhoto}
                          >
                            Remove Photo
                          </Button>
                        )}
                      </div>

                      {photoError && (
                        <div className="text-xs text-[#A83226] font-semibold flex items-center gap-1.5 pt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{photoError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable Student Profile Fields */}
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-[#18212B]">
                      Editable Profile Details
                    </h3>
                    <p className="text-xs text-[#62605B] mt-0.5">
                      Customize your display name, biography, and contact number.
                    </p>
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
                      <label className="font-bold text-[#18212B]">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98260 12345"
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-[#18212B]">Bio / About</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        maxLength={280}
                        placeholder="Short academic bio or campus club involvement..."
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B] focus:outline-none focus:border-[#18212B]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Save Profile Details
                    </Button>
                  </div>
                </form>

                {/* Locked University-Verified Fields (Section 12) */}
                <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-[#B6533C]">
                        <Lock className="w-3.5 h-3.5" /> Locked Institutional Identity
                      </div>
                      <h3 className="text-base font-bold text-[#18212B] mt-0.5">
                        University-Verified Enrollment Record
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#EBF3ED] border border-[#2F613B]/30 text-[10px] font-mono font-bold text-[#2F613B]">
                      VERIFIED STUDENT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
                      <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
                        Roll Number (Locked)
                      </div>
                      <div className="font-mono font-bold text-[#18212B] mt-0.5">
                        {currentUser.rollNumber || 'Y22CS101'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
                      <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
                        University (Locked)
                      </div>
                      <div className="font-bold text-[#18212B] mt-0.5">
                        Dr. Harisingh Gour Vishwavidyalaya, Sagar
                      </div>
                    </div>

                    <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
                      <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
                        Department (Locked)
                      </div>
                      <div className="font-semibold text-[#18212B] mt-0.5">
                        {currentUser.department}
                      </div>
                    </div>

                    <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
                      <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
                        Semester &amp; Student ID (Locked)
                      </div>
                      <div className="font-mono text-[#18212B] mt-0.5">
                        Semester {currentUser.semester || 6} • ID: {currentUser._id}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FDF7EC] border border-[#B26B16]/40 rounded-[2px] text-[11px] text-[#7D4A0D]">
                    <strong>Institutional Governance Policy:</strong> University-verified academic fields (Roll Number, University, Department, Semester, and Verification Status) cannot be edited directly by students. Contact University Administration (Office of the DSW) for official record corrections.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: ACCOUNT (Change Password, Device Management, Login Sessions, Logout) */}
            {settingsSection === 'ACCOUNT' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleSavePassword}
                  className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-[#18212B]">Change Password</h3>
                    <p className="text-xs text-[#62605B] mt-0.5">
                      Update the password used for your PARISAR student account ({currentUser.email}).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#18212B]">Current Password</label>
                      <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={e => setCurrentPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#18212B]">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#18212B]">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" size="sm">
                      Update Password
                    </Button>
                  </div>
                </form>

                {/* Device Management & Login Sessions */}
                <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#18212B]">
                        Device Management &amp; Active Login Sessions
                      </h3>
                      <p className="text-xs text-[#62605B] mt-0.5">
                        Each student account is restricted to 1 Web session and 1 Android Mobile device to prevent proxy attendance.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          verifyOrReplaceDevice('web', 'PARISAR Web Browser');
                          showToast('success', 'Current Web Browser verified.');
                        }}
                      >
                        Verify Web Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          verifyOrReplaceDevice('mobile', 'PARISAR Android App');
                          showToast('success', 'Android Mobile slot verified.');
                        }}
                      >
                        Bind Android Slot
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {registeredDevices.map(dev => (
                      <div
                        key={dev.deviceId}
                        className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#18212B] text-[#FCFAF5] text-[9px] font-mono font-bold uppercase">
                              {dev.platform}
                            </span>
                            <span className="font-bold text-[#18212B]">
                              {dev.deviceName}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#62605B] mt-1">
                            Device ID: {dev.deviceId} • Active{' '}
                            {new Date(dev.lastActiveAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            revokeDevice(dev.deviceId);
                            showToast('info', `Revoked ${dev.deviceName}.`);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-[#A83226] bg-[#FBEFEF] border border-[#A83226]/30 rounded-[2px] cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#B9B4AA] flex items-center justify-between">
                    <span className="text-xs text-[#62605B]">
                      Signed in as <strong>{currentUser.email}</strong>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      leftIcon={<LogOut className="w-3.5 h-3.5" />}
                      onClick={handleLogoutClick}
                    >
                      Logout of PARISAR
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: PREFERENCES (Language & Real In-App/Email Notifications — No Fake SMS) */}
            {settingsSection === 'PREFERENCES' && (
              <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#18212B]">
                    Language &amp; Notification Preferences
                  </h3>
                  <p className="text-xs text-[#62605B] mt-0.5">
                    Configure your preferred portal language and campus notification alerts.
                  </p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-[#18212B] block">
                    Preferred Portal Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value as 'en' | 'hi')}
                    className="w-full sm:w-72 px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-bold text-[#18212B]"
                  >
                    <option value="en">English (Academic Default)</option>
                    <option value="hi">हिन्दी (Hindi — परिसर)</option>
                  </select>
                </div>

                <div className="space-y-2.5 text-xs text-[#18212B] pt-2 border-t border-[#B9B4AA]">
                  <div className="font-bold uppercase tracking-wider text-[#62605B] text-[11px]">
                    In-App &amp; University Email Notification Channels
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailConfirmations}
                      onChange={e => setEmailConfirmations(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold">
                        Registration Confirmations &amp; Digital Cards
                      </div>
                      <div className="text-[#62605B] text-[11px]">
                        Receive registration confirmation alerts for {currentUser.email}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventReminders}
                      onChange={e => setEventReminders(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold">
                        Live Attendance Session &amp; Event Reminders
                      </div>
                      <div className="text-[#62605B] text-[11px]">
                        Notify me when an organizer opens event attendance or an online session starts
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={venueChanges}
                      onChange={e => setVenueChanges(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold">
                        Venue Relocations &amp; Schedule Updates
                      </div>
                      <div className="text-[#62605B] text-[11px]">
                        Immediate in-app alerts when an auditorium or hall changes on Patharia Hills
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certificateAlerts}
                      onChange={e => setCertificateAlerts(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold">Certificate Issuance Alerts</div>
                      <div className="text-[#62605B] text-[11px]">
                        Notify me when verified participation certificates are issued to my Passport
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION 4: PRIVACY (Visibility & Data Policy) */}
            {settingsSection === 'PRIVACY' && (
              <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#18212B]">
                    Privacy &amp; Institutional Data Governance
                  </h3>
                  <p className="text-xs text-[#62605B] mt-0.5">
                    Control how your student profile and participation history are shared within Dr. Harisingh Gour Vishwavidyalaya.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center gap-3 p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProfileToOrganizers}
                      onChange={e => setShowProfileToOrganizers(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold text-[#18212B]">
                        Show Profile Photo &amp; Bio to Verified Event Organizers
                      </div>
                      <div className="text-[#62605B] text-[11px]">
                        Your Name, Roll Number, and Department are always visible on official rosters for events you register for.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassportPublicly}
                      onChange={e => setShowPassportPublicly(e.target.checked)}
                      className="w-4 h-4 accent-[#B6533C]"
                    />
                    <div>
                      <div className="font-bold text-[#18212B]">
                        Allow Public Verification of Earned Certificates
                      </div>
                      <div className="text-[#62605B] text-[11px]">
                        Enables employers and faculty to verify your certificate authenticity via `/verify/certificate/[certificateId]`.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-[#EAE5DB]/50 border border-[#B9B4AA] rounded-[2px] text-xs text-[#4E5A67] space-y-1.5 leading-relaxed">
                  <div className="font-bold text-[#18212B]">
                    PARISAR Data &amp; Privacy Policy (DHSGSU Sagar)
                  </div>
                  <p>
                    1. Student enrollment records, attendance rosters, and certificate ledgers are maintained strictly for official university co-curricular credit and NAAC documentation.
                  </p>
                  <p>
                    2. PARISAR does not use third-party advertising trackers or external AI facial recognition.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" onClick={handleSavePrivacy}>
                    Save Privacy Settings
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION 5: SUPPORT (Help Center, Contact University, Report a Problem) */}
            {settingsSection === 'SUPPORT' && (
              <div className="space-y-6">
                <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
                  <h3 className="text-base font-bold text-[#18212B]">
                    University Help Center &amp; DSW Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] space-y-1">
                      <div className="font-mono font-bold uppercase text-[#B6533C] text-[10px]">
                        Office of the Dean of Students&apos; Welfare (DSW)
                      </div>
                      <div className="font-bold text-[#18212B]">
                        Dr. Harisingh Gour Vishwavidyalaya
                      </div>
                      <div className="text-[#62605B]">
                         Administrative Block, Patharia Hills, Sagar (M.P.) — 470003
                      </div>
                      <div className="font-mono text-[#18212B] pt-1">
                        Email: dsw@dhsgsu.edu.in
                      </div>
                    </div>

                    <div className="p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] space-y-1">
                      <div className="font-mono font-bold uppercase text-[#2E6B4E] text-[10px]">
                        Attendance &amp; Certificate Corrections
                      </div>
                      <div className="font-bold text-[#18212B]">
                        How Attendance Disputes Work
                      </div>
                      <div className="text-[#62605B]">
                        Once an event organizer finalizes attendance, normal edits are locked. If you attended an event and were marked absent in error, submit a request below for an audited DSW Administrative Override.
                      </div>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmitSupportTicket}
                  className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-[#18212B]">
                      Report a Problem / Contact University Administration
                    </h3>
                    <p className="text-xs text-[#62605B] mt-0.5">
                      Submit an official support ticket regarding profile corrections, attendance verification, or technical issues.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#18212B]">Issue Category / Subject</label>
                      <input
                        type="text"
                        value={supportSubject}
                        onChange={e => setSupportSubject(e.target.value)}
                        placeholder="e.g., Request for Department Correction or Event Attendance Review"
                        required
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#18212B]">Detailed Description</label>
                      <textarea
                        rows={3}
                        value={supportMessage}
                        onChange={e => setSupportMessage(e.target.value)}
                        placeholder="Include your Roll Number, Event Title (if applicable), and details..."
                        required
                        className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Submit Support Request
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
