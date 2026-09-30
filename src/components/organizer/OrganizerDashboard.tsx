'use client';

import React, { useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'pending' | 'completed'>('upcoming');

  const myEvents = events.filter(e => e.organizerId === currentUser._id);

  const upcomingEvents = myEvents.filter(
    e => e.status === 'PUBLISHED' || e.status === 'APPROVED'
  );
  const pendingEvents = myEvents.filter(
    e => e.status === 'PENDING_REVIEW' || e.status === 'DRAFT'
  );
  const completedEvents = myEvents.filter(
    e => e.status === 'COMPLETED' || e.status === 'REJECTED' || e.status === 'CANCELLED'
  );

  const displayedEvents =
    statusFilter === 'upcoming'
      ? upcomingEvents
      : statusFilter === 'pending'
      ? pendingEvents
      : completedEvents;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 lg:pb-16">
      {/* 1. Greeting & Primary CTA: Create Event */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 border-b border-[#B9B4AA] pb-5">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            Organizer Dashboard · DHSGSU
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#62605B]">
            {currentUser.department}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<PlusCircle className="w-5 h-5" />}
          onClick={onCreateEvent}
          className="self-start sm:self-auto"
        >
          Create Event
        </Button>
      </section>

      {/* 2. Your Events: Upcoming / Pending Approval / Completed */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#18212B]">
            Your Events
          </h2>

          {/* Clean Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`min-h-[40px] px-4 py-2 rounded-[3px] text-xs font-bold border transition-all cursor-pointer touch-manipulation ${
                statusFilter === 'upcoming'
                  ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`min-h-[40px] px-4 py-2 rounded-[3px] text-xs font-bold border transition-all cursor-pointer touch-manipulation ${
                statusFilter === 'pending'
                  ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
              }`}
            >
              Pending Approval ({pendingEvents.length})
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`min-h-[40px] px-4 py-2 rounded-[3px] text-xs font-bold border transition-all cursor-pointer touch-manipulation ${
                statusFilter === 'completed'
                  ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
              }`}
            >
              Completed ({completedEvents.length})
            </button>
          </div>
        </div>

        {/* Event List with Contextual Participants & Attendance Actions */}
        {displayedEvents.length > 0 ? (
          <div className="space-y-4">
            {displayedEvents.map(evt => {
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
                        })} · {new Date(evt.startTime).toLocaleTimeString([], {
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
                      Participants: <strong className="text-[#18212B]">{evt.registrationCount}/{evt.capacity}</strong>
                      {' · '}
                      Checked In: <strong className="text-[#2F613B]">{checkedInCount}</strong>
                    </div>
                  </div>

                  {/* Contextual Actions: Participants + Attendance */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EAE5DB]">
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
                      Attendance
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center space-y-3">
            <h3 className="text-base font-bold text-[#18212B]">
              No {statusFilter === 'upcoming' ? 'upcoming' : statusFilter === 'pending' ? 'pending' : 'completed'} events
            </h3>
            <p className="text-xs sm:text-sm text-[#62605B] max-w-md mx-auto">
              Create a new event or view all your managed events.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button variant="secondary" size="sm" onClick={onManageEvents} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                All Managed Events
              </Button>
              <Button variant="primary" size="sm" onClick={onCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
