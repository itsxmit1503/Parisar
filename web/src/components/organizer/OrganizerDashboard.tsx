'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Users, 
  QrCode, 
  PlusCircle, 
  MapPin, 
  ArrowRight
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface OrganizerDashboardProps {
  onCreateEvent: () => void;
  onManageEvents: () => void;
  onScanAttendance: (eventId?: string) => void;
  onViewParticipants: (eventId?: string) => void;
  onAnnouncements: (eventId?: string) => void;
  onCertificates: (eventId?: string) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  onCreateEvent,
  onManageEvents,
  onScanAttendance,
  onViewParticipants,
}) => {
  const { currentUser, events, attendance } = useApp();

  const myEvents = events.filter(e => e.organizerId === currentUser._id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 lg:pb-16">
      {/* 1. Task-Focused Organizer Header (Sections 4, 5, 10) */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 sm:p-7 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
              Verified Organizer Panel • DHSGSU
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
              {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#62605B]">
              {currentUser.designation || 'Event Organizer'} • {currentUser.department}
            </p>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<QrCode className="w-4 h-4 text-[#B6533C]" />}
              onClick={() => onScanAttendance()}
            >
              Attendance Scanner
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={onCreateEvent}
            >
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Primary Organizer Tasks (3 Clear Finger-Sized Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onCreateEvent}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Create Event</div>
            <div className="text-xs text-[#62605B]">Submit a new event proposal</div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#B6533C] text-white flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => onViewParticipants()}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Participants</div>
            <div className="text-xs text-[#62605B]">View & manage registrations</div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => onScanAttendance()}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Attendance</div>
            <div className="text-xs text-[#62605B]">Scan QR passes & check in</div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
        </button>
      </section>

      {/* 3. Upcoming Managed Events & Status (Prioritized in Sections 4 & 5) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#18212B]">
              My Managed Events ({myEvents.length})
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B]">
              Track event approval status, participant registrations, and venue attendance.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageEvents}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage All
          </Button>
        </div>

        {myEvents.length > 0 ? (
          <div className="space-y-4">
            {myEvents.map(evt => {
              const checkedInCount = attendance.filter(a => a.eventId === evt._id).length;

              return (
                <div
                  key={evt._id}
                  className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={evt.category} />
                      <EventStatusBadge status={evt.status} />
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-[#18212B] leading-snug">
                      {evt.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#62605B]">
                      <span className="flex items-center gap-1.5 font-medium text-[#18212B]">
                        <Calendar className="w-4 h-4 text-[#B6533C]" />
                        {new Date(evt.startTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })} • {new Date(evt.startTime).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#64788A]" />
                        {evt.venue}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#62605B] pt-0.5">
                      Registered: <strong className="text-[#18212B]">{evt.registrationCount} / {evt.capacity}</strong>
                      {' • '}
                      Checked In: <strong className="text-[#2F613B]">{checkedInCount}</strong>
                    </div>
                  </div>

                  {/* Secondary (Participants) + Primary (Check In / Scan) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#B9B4AA]">
                    <Button
                      variant="secondary"
                      size="md"
                      leftIcon={<Users className="w-4 h-4" />}
                      onClick={() => onViewParticipants(evt._id)}
                    >
                      Participants
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => onScanAttendance(evt._id)}
                    >
                      Check In
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center space-y-3">
            <h3 className="text-base font-bold text-[#18212B]">No events created yet</h3>
            <p className="text-xs sm:text-sm text-[#62605B] max-w-md mx-auto">
              Create your first campus event proposal to submit it for University Administrator review.
            </p>
            <Button variant="primary" size="md" onClick={onCreateEvent}>
              Create Event
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};
