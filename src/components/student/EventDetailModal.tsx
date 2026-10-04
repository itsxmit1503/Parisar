'use client';

import React, { useState } from 'react';
import { CampusEvent, Registration } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CategoryBadge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Ticket, 
  AlertCircle,
  Compass,
  Share2,
  CalendarPlus,
  User,
  Award,
  Radio,
  XCircle
} from 'lucide-react';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CampusEvent | null;
  onViewPass?: (registration: Registration) => void;
  onViewOnMap?: (venueId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  onViewPass,
  onViewOnMap,
}) => {
  const {
    currentUser,
    registrations,
    attendance,
    venues,
    registerForEvent,
    cancelRegistration,
    joinOnlineEventSession,
    triggerOnlineCheckpoint,
    verifyOnlineCheckpoint,
  } = useApp();
  const { showToast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckpointBusy, setIsCheckpointBusy] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<{
    checkpointId: string;
    checkpointNumber: number;
    expiresAt: string;
  } | null>(null);
  const [checkpointSecondsLeft, setCheckpointSecondsLeft] = useState<number>(0);

  // Live 2-minute countdown timer for active online checkpoint
  React.useEffect(() => {
    if (!activeCheckpoint) {
      setCheckpointSecondsLeft(0);
      return;
    }
    const updateTimer = () => {
      const expiresMs = new Date(activeCheckpoint.expiresAt).getTime();
      const diffSec = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
      setCheckpointSecondsLeft(diffSec);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeCheckpoint]);

  if (!event) return null;

  const matchedVenue = venues.find(v => v.id === event.venueId);
  const directionsDestination =
    matchedVenue && matchedVenue.latitude !== null && matchedVenue.longitude !== null
      ? `${matchedVenue.latitude},${matchedVenue.longitude}`
      : matchedVenue?.navigationQuery || `${event.venue} Dr Harisingh Gour Vishwavidyalaya Sagar`;
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDestination)}&travelmode=walking`;

  const userRegistration = registrations.find(
    r => r.eventId === event._id && r.userId === currentUser._id && r.status === 'CONFIRMED'
  );
  const userAttendance = attendance.find(
    a => a.eventId === event._id && a.userId === currentUser._id
  );

  const isRegistered = Boolean(userRegistration);
  const isFull = event.registrationCount >= event.capacity;
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === 'CANCELLED';
  const isCompleted = event.status === 'COMPLETED';
  const remainingSeats = Math.max(0, event.capacity - event.registrationCount);

  const durationMinutes = Math.max(
    30,
    Math.min(
      720,
      Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60)) || 180
    )
  );
  const minPct = event.minParticipationPercent ?? 80;
  const requiredMinutes = Math.ceil((durationMinutes * minPct) / 100);
  const eventMode = event.eventMode || 'OFFLINE';
  const isSessionActive =
    event.attendanceSessionStatus === 'OPEN' ||
    event.attendanceSessionStatus === 'ACTIVE' ||
    event.status === 'ONGOING';

  const requiredCheckpoints = event.onlinePolicy?.requiredCheckpoints ?? 2;
  const totalCheckpoints = event.onlinePolicy?.totalCheckpoints ?? 3;
  const verifiedCheckpointsCount = userAttendance?.verifiedCheckpoints?.length ?? 0;

  const handleRegister = async () => {
    setIsRegistering(true);

    try {
      await new Promise(r => setTimeout(r, 300));
      const res = registerForEvent(event._id);

      if (res.success) {
        showToast('success', `You are registered for "${event.title}".`, 'Registered');
        if (onViewPass) {
          onViewPass(res.data);
        }
      } else {
        const errorMsg = res.error.message || 'Failed to complete registration.';
        showToast('error', errorMsg, 'Registration Error');
      }
    } catch {
      showToast('error', 'Unexpected error during registration.', 'Error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = () => {
    if (!userRegistration) return;
    const res = cancelRegistration(userRegistration._id);
    if (res.success) {
      showToast('info', `Your registration for "${event.title}" has been cancelled.`, 'Registration Cancelled');
    } else {
      showToast('error', res.error.message, 'Cannot Cancel');
    }
  };

  const handleJoinOnlineEvent = async () => {
    setIsCheckpointBusy(true);
    const res = await joinOnlineEventSession(event._id);
    if (res.success) {
      showToast(
        'success',
        'Initial Check-In recorded! Complete 2-minute participation checkpoints during the session.',
        'Joined Online Session'
      );
      // Automatically activate first 2-minute checkpoint if none active
      const cpRes = await triggerOnlineCheckpoint(event._id);
      if (cpRes.success) {
        setActiveCheckpoint({
          checkpointId: cpRes.data.checkpointId || cpRes.data.id,
          checkpointNumber: cpRes.data.checkpointNumber,
          expiresAt: cpRes.data.expiresAt,
        });
      }
    } else {
      showToast('error', res.error.message, 'Cannot Join Session');
    }
    setIsCheckpointBusy(false);
  };

  const handleTriggerNextCheckpoint = async () => {
    setIsCheckpointBusy(true);
    const cpRes = await triggerOnlineCheckpoint(event._id);
    setIsCheckpointBusy(false);
    if (cpRes.success) {
      setActiveCheckpoint({
        checkpointId: cpRes.data.checkpointId || cpRes.data.id,
        checkpointNumber: cpRes.data.checkpointNumber,
        expiresAt: cpRes.data.expiresAt,
      });
      showToast(
        'info',
        `Checkpoint #${cpRes.data.checkpointNumber} activated! Confirm participation within 2 minutes.`,
        '2-Minute Checkpoint Active'
      );
    } else {
      showToast('error', cpRes.error.message, 'Checkpoint Error');
    }
  };

  const handleConfirmCheckpoint = async () => {
    setIsCheckpointBusy(true);
    const res = await verifyOnlineCheckpoint(event._id, activeCheckpoint?.checkpointId);
    setIsCheckpointBusy(false);
    if (res.success) {
      setActiveCheckpoint(null);
      showToast(
        'success',
        `Participation confirmed (${res.data.verifiedCheckpointsCount}/${res.data.requiredCheckpoints} required checkpoints verified).`,
        'Checkpoint Verified ✓'
      );
    } else {
      showToast('error', res.error.message, 'Verification Expired');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://parisar-eight.vercel.app/student/events`);
      showToast('info', 'Event link copied to clipboard.', 'Link Copied');
    }
  };

  const handleAddToCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description.replace(/\n/g, ' ')}\nLOCATION:${event.venue} (DHSGSU Sagar)\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `DHSGSU_Event_${event._id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Calendar event downloaded.', 'Added to Calendar');
  };

  const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const eventTime = `${new Date(event.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} – ${new Date(event.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      subtitle="PARISAR · DHSGSU"
      maxWidth="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Quiet Tertiary Actions */}
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                onClick={() => {
                  onClose();
                  onViewOnMap(event.venueId);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-[3px] bg-[#EAE5DB] hover:bg-[#EAE5DB]/80 border border-[#B9B4AA] text-xs font-bold text-[#18212B] flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Compass className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>View on Campus Map →</span>
              </button>
            )}
            <button
              onClick={handleAddToCalendar}
              className="min-h-[40px] px-3 py-1.5 rounded-[3px] bg-[#EAE5DB] hover:bg-[#EAE5DB]/80 border border-[#B9B4AA] text-xs font-bold text-[#18212B] flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Calendar</span>
            </button>
            <button
              onClick={handleShare}
              className="min-h-[40px] px-3 py-1.5 rounded-[3px] bg-[#EAE5DB] hover:bg-[#EAE5DB]/80 border border-[#B9B4AA] text-xs font-bold text-[#18212B] flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <Share2 className="w-3.5 h-3.5 text-[#64788A]" />
              <span>Share</span>
            </button>
          </div>

          {/* Primary Decision CTA: Register OR Registered + View Pass + Cancel */}
          <div className="flex items-center gap-2 ml-auto">
            {isRegistered && userRegistration ? (
              <>
                {!userRegistration.checkedInAt && !isCompleted && (
                  <button
                    type="button"
                    onClick={handleCancelRegistration}
                    className="min-h-[40px] px-3 py-1.5 rounded-[3px] bg-[#FBEFEF] hover:bg-[#F7DFDF] border border-[#A83226]/40 text-xs font-bold text-[#A83226] flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Registration</span>
                  </button>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B]/30 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registered</span>
                </span>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Ticket className="w-4 h-4" />}
                  onClick={() => {
                    if (onViewPass) onViewPass(userRegistration);
                  }}
                >
                  View Pass
                </Button>
              </>
            ) : isCancelled ? (
              <Button variant="secondary" size="md" disabled>
                Cancelled
              </Button>
            ) : isCompleted ? (
              <Button variant="secondary" size="md" disabled>
                Completed
              </Button>
            ) : isDeadlinePassed ? (
              <Button variant="secondary" size="md" disabled>
                Closed
              </Button>
            ) : isFull ? (
              <Button variant="secondary" size="md" disabled>
                Full
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isRegistering}
                onClick={handleRegister}
                className="px-6"
              >
                Register
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-sm text-[#18212B]">
        {/* 1. Event Image + Category + Event Mode */}
        <div className="h-52 w-full rounded-[4px] overflow-hidden border border-[#B9B4AA] relative bg-[#EAE5DB]">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <CategoryBadge category={event.category} />
            <span className="px-2 py-0.5 rounded-[2px] bg-[#18212B]/90 text-[#FCFAF5] text-[10px] font-mono font-bold uppercase tracking-wider">
              {eventMode}
            </span>
          </div>
        </div>

        {/* 2. Event Title & Department Scope */}
        <div className="space-y-1">
          {event.departmentScope && (
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B6533C]">
              {event.departmentScope}
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18212B] leading-snug">
            {event.title}
          </h2>
        </div>

        {/* 3. Date, Time, Venue + Campus Map Connection */}
        <div className="p-4 bg-[#EAE5DB]/70 border border-[#B9B4AA] rounded-[4px] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 font-semibold text-[#18212B]">
            <Calendar className="w-4 h-4 text-[#B6533C] shrink-0" />
            <span>{eventDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#18212B]">
            <Clock className="w-4 h-4 text-[#64788A] shrink-0" />
            <span>{eventTime} ({durationMinutes} mins)</span>
          </div>
          <div className="pt-1 border-t border-[#D5D0C5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#B6533C] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">{matchedVenue?.name || event.venue}</div>
                {matchedVenue?.address && (
                  <div className="text-[11px] text-[#62605B]">{matchedVenue.address}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6 sm:pl-0">
              {onViewOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewOnMap(event.venueId);
                  }}
                  className="px-2.5 py-1.5 rounded-[3px] bg-[#18212B] text-[#FCFAF5] hover:bg-[#2A3747] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  View on Campus Map →
                </button>
              )}
              <a
                href={googleDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-[3px] bg-[#FCFAF5] text-[#B6533C] border border-[#B9B4AA] hover:border-[#B6533C] text-xs font-bold transition-colors whitespace-nowrap"
              >
                Directions ↗
              </a>
            </div>
          </div>
        </div>

        {/* 4. Attendance Status & Online Session Participation Widget */}
        {isRegistered && (
          <div className="p-4 bg-[#EBF3ED] border border-[#2F613B]/40 rounded-[4px] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 text-[#2F613B] ${isSessionActive ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2F613B]">
                  {eventMode === 'OFFLINE'
                    ? 'Offline Event — Dynamic 60s Student QR Attendance'
                    : isSessionActive
                    ? `Live Online Session Open (${eventMode})`
                    : `Online Session Checkpoints (${eventMode})`}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#18212B]">
                {eventMode === 'OFFLINE'
                  ? userAttendance
                    ? 'PRESENT ✓'
                    : 'Awaiting QR Scan'
                  : `Checkpoints: ${verifiedCheckpointsCount} / ${requiredCheckpoints} Required`}
              </span>
            </div>

            {eventMode === 'OFFLINE' ? (
              <div className="text-xs text-[#18212B] leading-relaxed space-y-2">
                <p>
                  This is a physical campus event at <strong>{event.venue}</strong>. Open your registration pass and click <strong>Submit Attendance</strong> to generate a temporary 60-second one-time QR code for the organizer to scan.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11px]">
                  <span>
                    Status:{' '}
                    <strong className={userAttendance ? 'text-[#2F613B]' : 'text-[#B26B16]'}>
                      {userAttendance ? 'PRESENT (VERIFIED BY ORGANIZER SCAN)' : 'REGISTERED — READY TO SUBMIT ATTENDANCE'}
                    </strong>
                  </span>
                  {!userAttendance && userRegistration && onViewPass && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Ticket className="w-3.5 h-3.5" />}
                      onClick={() => onViewPass(userRegistration)}
                    >
                      Submit Attendance (60s QR)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#18212B] leading-relaxed">
                  <strong>Online Attendance Policy (No QR):</strong> Complete Initial Check-In (<strong>Join Event</strong>) and confirm at least <strong>{requiredCheckpoints} of {totalCheckpoints}</strong> random 2-minute participation checkpoints during the session to earn certificate eligibility.
                </p>

                {userAttendance && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-[#FCFAF5] border border-[#B9B4AA] text-[11px] font-mono">
                    <div>
                      <span className="text-[#62605B] block">Initial Check-In</span>
                      <strong className="text-[#2F613B]">
                        {userAttendance.initialCheckInDone !== false ? 'VERIFIED ✓' : 'PENDING'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62605B] block">Checkpoints</span>
                      <strong className="text-[#18212B]">
                        {verifiedCheckpointsCount} of {requiredCheckpoints} Required
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62605B] block">Participation</span>
                      <strong className="text-[#18212B]">
                        {userAttendance.participationPercent ?? 0}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62605B] block">Certificate Status</span>
                      <strong
                        className={
                          userAttendance.eligibleForCertificate
                            ? 'text-[#2F613B]'
                            : 'text-[#A83226]'
                        }
                      >
                        {userAttendance.eligibleForCertificate ? 'ELIGIBLE ✓' : 'INCOMPLETE'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Active 2-Minute Checkpoint Prompt (Section 17) */}
                {activeCheckpoint && checkpointSecondsLeft > 0 && (
                  <div className="p-4 bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] shadow-[3px_3px_0_0_#B6533C] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B6533C]">
                        Attendance Verification (Checkpoint #{activeCheckpoint.checkpointNumber})
                      </span>
                      <span className="px-2 py-0.5 bg-[#18212B] text-[#FCFAF5] font-mono text-[11px] font-bold rounded-[2px]">
                        Expires in {Math.floor(checkpointSecondsLeft / 60)}:
                        {String(checkpointSecondsLeft % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#18212B]">
                      Please confirm your participation. This verification expires in 2 minutes.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isCheckpointBusy}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={handleConfirmCheckpoint}
                    >
                      Confirm Participation
                    </Button>
                  </div>
                )}

                {activeCheckpoint && checkpointSecondsLeft === 0 && (
                  <div className="p-3 bg-[#FDF0EE] border border-[#A83226] rounded-[3px] text-xs font-bold text-[#A83226]">
                    This verification checkpoint has expired (2-minute window elapsed).
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] font-mono font-bold text-[#2F613B]">
                    {userAttendance?.eligibleForCertificate
                      ? `✓ Required Checkpoints Completed (${verifiedCheckpointsCount}/${requiredCheckpoints}) — Eligible for Certificate`
                      : `Complete ${requiredCheckpoints} of ${totalCheckpoints} 2-minute checkpoints`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!userAttendance ? (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isCheckpointBusy}
                        onClick={handleJoinOnlineEvent}
                      >
                        Join Event (Initial Check-In)
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={isCheckpointBusy}
                        onClick={handleTriggerNextCheckpoint}
                      >
                        Trigger Next 2-Min Checkpoint
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 5. Short Description & Rules */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#62605B]">
            About This Event
          </h4>
          <p className="text-sm text-[#18212B] leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {(event.eligibility || event.specialInstructions) && (
          <div className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] space-y-2 text-xs">
            {event.eligibility && (
              <div>
                <span className="font-mono font-bold uppercase text-[#62605B]">Eligibility: </span>
                <span className="text-[#18212B] font-medium">{event.eligibility}</span>
              </div>
            )}
            {event.specialInstructions && (
              <div>
                <span className="font-mono font-bold uppercase text-[#62605B]">Rules & Instructions: </span>
                <span className="text-[#18212B] font-medium">{event.specialInstructions}</span>
              </div>
            )}
          </div>
        )}

        {/* 6. Organizer, Registration Status, & Certificate Requirement */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase text-[#62605B]">
              Organizer
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#18212B] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#B6533C] shrink-0" />
              <span>{event.organizerName}</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase text-[#62605B]">
              Certificate Policy
            </div>
            <div className="text-xs font-bold text-[#18212B] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#B08A4A] shrink-0" />
              <span>
                {event.certificateRequired !== false
                  ? `Min ${minPct}% (${requiredMinutes}m)`
                  : 'No Certificate'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] space-y-1">
            <div className="text-[11px] font-mono font-bold uppercase text-[#62605B]">
              Registration Status
            </div>
            {isRegistered ? (
              <div className="text-xs sm:text-sm font-bold text-[#2F613B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Registered · Pass Ready</span>
              </div>
            ) : isFull ? (
              <div className="text-xs sm:text-sm font-bold text-[#A83226] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Full ({event.capacity} seats)</span>
              </div>
            ) : isDeadlinePassed ? (
              <div className="text-xs sm:text-sm font-bold text-[#62605B]">
                Closed
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-[#2F613B]">
                Open · {remainingSeats} seats left
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
