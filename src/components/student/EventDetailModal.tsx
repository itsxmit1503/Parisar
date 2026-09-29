'use client';

import React, { useState } from 'react';
import { CampusEvent, Registration } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Tag, 
  Ticket, 
  AlertCircle,
  Compass,
  Share2,
  CalendarPlus,
  AlertTriangle
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
  const { currentUser, registrations, registerForEvent } = useApp();
  const { showToast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const userRegistration = registrations.find(
    r => r.eventId === event._id && r.userId === currentUser._id && r.status === 'CONFIRMED'
  );

  const isRegistered = Boolean(userRegistration);
  const isFull = event.registrationCount >= event.capacity;
  const isAlmostFull = !isFull && (event.registrationCount / event.capacity >= 0.75);
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === 'CANCELLED';
  const isCompleted = event.status === 'COMPLETED';

  const handleRegister = async () => {
    setErrorMessage(null);
    setIsRegistering(true);

    try {
      await new Promise(r => setTimeout(r, 350));
      const res = registerForEvent(event._id);

      if (res.success) {
        showToast('success', `You have registered for "${event.title}". Digital pass generated.`, 'Registered Successfully');
        if (onViewPass) {
          onViewPass(res.data);
        }
      } else {
        const errorMsg = res.error.message || 'Failed to complete registration.';
        setErrorMessage(errorMsg);
        showToast('error', errorMsg, 'Registration Rejected');
      }
    } catch {
      setErrorMessage('Unexpected error during registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://parisar.dhsgsu.edu.in/events/${event._id}`);
      showToast('info', 'Event link copied to clipboard.', 'Share Link Copied');
    }
  };

  const handleAddToCalendar = () => {
    // Generate iCalendar format string for instant local calendar addition
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description.replace(/\n/g, ' ')}\nLOCATION:${event.venue} (DHSGSU Sagar)\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `DHSGSU_Event_${event._id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Calendar invitation (.ics) downloaded.', 'Added to Calendar');
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
  })} - ${new Date(event.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  const deadlineFormatted = new Date(event.registrationDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const capacityPercent = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={`Dr. Harisingh Gour Vishwavidyalaya • Organized by ${event.organizerName}`}
      maxWidth="2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCalendar}
              className="px-2.5 py-1.5 rounded-[2px] bg-[#EAE5DB] hover:bg-[#EAE5DB]/80 border border-[#B9B4AA] text-xs font-bold text-[#18212B] flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Add to Calendar</span>
            </button>
            <button
              onClick={handleShare}
              className="px-2.5 py-1.5 rounded-[2px] bg-[#EAE5DB] hover:bg-[#EAE5DB]/80 border border-[#B9B4AA] text-xs font-bold text-[#18212B] flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#64788A]" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Compass className="w-3.5 h-3.5 text-[#B6533C]" />}
                onClick={() => {
                  onClose();
                  onViewOnMap(event.venueId);
                }}
              >
                View Venue
              </Button>
            )}

            {isRegistered && userRegistration ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Ticket className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (onViewPass) onViewPass(userRegistration);
                }}
              >
                REGISTERED (View Pass)
              </Button>
            ) : isCancelled ? (
              <Button variant="secondary" size="sm" disabled>
                Event Cancelled
              </Button>
            ) : isCompleted ? (
              <Button variant="secondary" size="sm" disabled>
                Event Concluded
              </Button>
            ) : isDeadlinePassed ? (
              <Button variant="secondary" size="sm" disabled>
                Registration Closed
              </Button>
            ) : isFull ? (
              <Button variant="secondary" size="sm" disabled>
                Full (Capacity Reached)
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={isRegistering}
                onClick={handleRegister}
              >
                REGISTER NOW
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs text-[#18212B]">
        {/* Cover Photo */}
        <div className="h-52 w-full rounded-[3px] overflow-hidden border border-[#B9B4AA] relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <CategoryBadge category={event.category} />
            <EventStatusBadge status={event.status} />
          </div>
        </div>

        {/* State Banner: Useful Status Indicator */}
        {isRegistered ? (
          <div className="p-3 bg-[#FCFAF5] border-2 border-[#18212B] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#18212B]">
              <CheckCircle2 className="w-4 h-4 text-[#2F613B]" />
              <span>You are officially registered for this DHSGSU session.</span>
            </div>
            <span className="font-mono text-[11px] text-[#B6533C] font-bold">
              Pass ID: {userRegistration?.qrToken}
            </span>
          </div>
        ) : isAlmostFull ? (
          <div className="p-3 bg-[#FAF0E6] border border-[#B08A4A]/40 rounded-[3px] flex items-center gap-2 text-xs font-bold text-[#B08A4A]">
            <AlertTriangle className="w-4 h-4 text-[#B08A4A] shrink-0" />
            <span>Almost Full: Over 75% of available seats allocated. Register promptly.</span>
          </div>
        ) : isFull ? (
          <div className="p-3 bg-[#FBEAEA] border border-[#A83226]/40 rounded-[3px] flex items-center gap-2 text-xs font-bold text-[#A83226]">
            <AlertCircle className="w-4 h-4 text-[#A83226] shrink-0" />
            <span>Registration Capacity Reached (800 / 800 seats filled). Walk-in entry not permitted.</span>
          </div>
        ) : isDeadlinePassed ? (
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] flex items-center gap-2 text-xs font-bold text-[#62605B]">
            <Clock className="w-4 h-4 text-[#62605B] shrink-0" />
            <span>Registration Closed: The portal closed on {deadlineFormatted}.</span>
          </div>
        ) : (
          <div className="p-2.5 bg-[#EBF3ED] border border-[#2F613B]/30 rounded-[3px] flex items-center gap-2 text-xs font-bold text-[#2F613B]">
            <CheckCircle2 className="w-4 h-4 text-[#2F613B] shrink-0" />
            <span>Registration Open: Seats available for enrolled DHSGSU students and scholars.</span>
          </div>
        )}

        {/* Schedule & Location Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B]">Schedule</div>
            <div className="flex items-center gap-1.5 font-bold text-[#18212B]">
              <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#62605B] font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#64788A]" />
              <span>{eventTime}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B]">Campus Venue</div>
            <div className="flex items-center gap-1.5 font-bold text-[#18212B]">
              <MapPin className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>{event.venue}</span>
            </div>
            <div className="text-[#62605B] text-[11px]">
              Patharia Hills Campus, DHSGSU Sagar
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#18212B]">
            Session Overview & Curriculum
          </h4>
          <p className="text-[#18212B] leading-relaxed whitespace-pre-line text-xs font-normal">
            {event.description}
          </p>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1.5 p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#62605B]">Participant Pool Capacity:</span>
            <span className="font-bold text-[#18212B]">
              {event.registrationCount} / {event.capacity} seats ({capacityPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacityPercent >= 100
                  ? 'bg-[#A83226]'
                  : capacityPercent >= 80
                  ? 'bg-[#B08A4A]'
                  : 'bg-[#B6533C]'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-[#62605B] font-mono">
            Registration deadline: <strong className="text-[#18212B]">{deadlineFormatted}</strong>
          </div>
        </div>

        {/* Eligibility & Special Instructions */}
        {(event.eligibility || event.specialInstructions) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {event.eligibility && (
              <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px]">
                <div className="font-bold text-[10px] uppercase tracking-wider text-[#62605B]">Eligibility Criteria</div>
                <div className="text-xs text-[#18212B] mt-0.5">{event.eligibility}</div>
              </div>
            )}
            {event.specialInstructions && (
              <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px]">
                <div className="font-bold text-[10px] uppercase tracking-wider text-[#62605B]">Prerequisites / Instructions</div>
                <div className="text-xs text-[#18212B] mt-0.5">{event.specialInstructions}</div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {event.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
