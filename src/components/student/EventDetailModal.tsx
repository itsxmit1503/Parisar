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
  User
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
  const { currentUser, registrations, venues, registerForEvent } = useApp();
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

  const isRegistered = Boolean(userRegistration);
  const isFull = event.registrationCount >= event.capacity;
  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isCancelled = event.status === 'CANCELLED';
  const isCompleted = event.status === 'COMPLETED';
  const remainingSeats = Math.max(0, event.capacity - event.registrationCount);

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

          {/* Primary Decision CTA: Register OR Registered + View Pass */}
          <div className="flex items-center gap-2.5 ml-auto">
            {isRegistered && userRegistration ? (
              <>
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
        {/* 1. Event Image + Category */}
        <div className="h-52 w-full rounded-[4px] overflow-hidden border border-[#B9B4AA] relative bg-[#EAE5DB]">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <CategoryBadge category={event.category} />
          </div>
        </div>

        {/* 2. Event Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#18212B] leading-snug">
          {event.title}
        </h2>

        {/* 3. Date, Time, Venue + Campus Map Connection */}
        <div className="p-4 bg-[#EAE5DB]/70 border border-[#B9B4AA] rounded-[4px] space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 font-semibold text-[#18212B]">
            <Calendar className="w-4 h-4 text-[#B6533C] shrink-0" />
            <span>{eventDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#18212B]">
            <Clock className="w-4 h-4 text-[#64788A] shrink-0" />
            <span>{eventTime}</span>
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

        {/* 4. Short Description */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#62605B]">
            About This Event
          </h4>
          <p className="text-sm text-[#18212B] leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* 5. Organizer & 6. Registration Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                <span>Full ({event.capacity} seats filled)</span>
              </div>
            ) : isDeadlinePassed ? (
              <div className="text-xs sm:text-sm font-bold text-[#62605B]">
                Closed
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-[#2F613B]">
                Open · {remainingSeats} seats available
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
