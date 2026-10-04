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
    joinOrValidateOnlineAttendance,
  } = useApp();
  const { showToast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleValidateSessionAttendance = (addMins = 60, leaveSession = false) => {
    const res = joinOrValidateOnlineAttendance(event._id, addMins, leaveSession);
    if (res.success) {
      showToast(
        'success',
        leaveSession
          ? `Online session ended. Final verified duration: ${res.data.participatedMinutes}/${res.data.totalEventMinutes} min (${res.data.participationPercent}%).`
          : `Online session active: ${res.data.participatedMinutes}/${res.data.totalEventMinutes} min (${res.data.participationPercent}%).`,
        leaveSession ? 'Left Online Event' : 'Online Session Verified'
      );
    } else {
      showToast('error', res.error.message, 'Attendance Error');
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
                    ? 'Offline Venue Roster Attendance'
                    : isSessionActive
                    ? `Live Online Session Open (${eventMode})`
                    : `Online Session Attendance (${eventMode})`}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#18212B]">
                {userAttendance
                  ? `${userAttendance.participatedMinutes ?? durationMinutes}/${durationMinutes} min (${userAttendance.participationPercent ?? 100}%)`
                  : eventMode === 'OFFLINE'
                  ? 'Pending Roster Check'
                  : `0/${durationMinutes} min (0%)`}
              </span>
            </div>

            {eventMode === 'OFFLINE' ? (
              <div className="text-xs text-[#18212B] leading-relaxed space-y-1.5">
                <p>
                  This is a physical campus event at <strong>{event.venue}</strong>. The event organizer marks attendance directly from the official registered student roster using your Name and Roll Number (<strong>{userRegistration?.userRollNumber}</strong>).
                </p>
                <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                  <span>
                    Status:{' '}
                    <strong className={userAttendance ? 'text-[#2F613B]' : 'text-[#B26B16]'}>
                      {userAttendance ? 'PRESENT (VERIFIED ON ROSTER)' : 'REGISTERED — AWAITING ROSTER MARK'}
                    </strong>
                  </span>
                  <span>
                    Certificate Eligibility:{' '}
                    <strong>{userAttendance ? 'ELIGIBLE ✓' : 'REQUIRES PRESENT MARK'}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#18212B] leading-relaxed">
                  Join the authenticated online event session below. The server tracks your session timestamps (`joinedAt` → `leftAt`) and verified participation duration. Certificate eligibility requires <strong>{minPct}% ({requiredMinutes} mins)</strong> of the {durationMinutes}-minute session.
                </p>

                {userAttendance && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-[#FCFAF5] border border-[#B9B4AA] text-[11px] font-mono">
                    <div>
                      <span className="text-[#62605B] block">Joined</span>
                      <strong className="text-[#18212B]">
                        {new Date(userAttendance.checkedInAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62605B] block">Left / Status</span>
                      <strong className="text-[#18212B]">
                        {userAttendance.checkedOutAt
                          ? new Date(userAttendance.checkedOutAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : userAttendance.sessionStatus || 'ACTIVE'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62605B] block">Verified Duration</span>
                      <strong className="text-[#18212B]">
                        {userAttendance.participatedMinutes ?? 0} / {requiredMinutes} mins
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
                        {userAttendance.eligibleForCertificate ? 'ELIGIBLE ✓' : 'NOT ELIGIBLE'}
                      </strong>
                    </div>
                  </div>
                )}

                {isSessionActive && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] font-mono font-bold text-[#2F613B]">
                      {userAttendance?.eligibleForCertificate
                        ? '✓ Minimum Duration Threshold Reached (Eligible for Certificate)'
                        : `Required: ${requiredMinutes} mins (${minPct}% of ${durationMinutes} mins)`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!userAttendance ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleValidateSessionAttendance(75, false)}
                        >
                          JOIN EVENT
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleValidateSessionAttendance(75, false)}
                          >
                            Continue Session (+75m Verified)
                          </Button>
                          {userAttendance.sessionStatus !== 'COMPLETED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleValidateSessionAttendance(0, true)}
                            >
                              Leave Event
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
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
