'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Users, 
  QrCode, 
  PlusCircle, 
  Megaphone, 
  Award, 
  Clock, 
  MapPin, 
  ArrowRight
} from 'lucide-react';
import { Badge, CategoryBadge } from '../ui/Badge';
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
  onAnnouncements,
  onCertificates,
}) => {
  const { currentUser, events, attendance } = useApp();

  const myEvents = events.filter(e => e.organizerId === currentUser._id);
  const totalRegistrations = myEvents.reduce((acc, e) => acc + e.registrationCount, 0);
  const totalCapacity = myEvents.reduce((acc, e) => acc + e.capacity, 0);

  const myEventIds = new Set(myEvents.map(e => e._id));
  const myAttendanceRecords = attendance.filter(a => myEventIds.has(a.eventId));

  const todayStr = '2026-09-30';
  const todayOps = myEvents.filter(e => e.startTime.startsWith(todayStr) && e.status !== 'CANCELLED');
  const upcomingEvents = myEvents.filter(e => new Date(e.startTime) > new Date('2026-09-30T23:59:00Z') && e.status === 'PUBLISHED');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Operations Header - Solid Tactile Panel */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-8 shadow-[4px_4px_0_0_#18212B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#B6533C] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#B6533C]"></span>
              <span>Faculty Organizer Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
              {currentUser.name}
            </h1>
            <p className="text-xs text-[#62605B] mt-0.5">
              {currentUser.designation} • {currentUser.organization || currentUser.department}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4 text-[#B6533C]" />}
              onClick={() => onScanAttendance()}
            >
              Scan Check-ins
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={onCreateEvent}
            >
              Create Event
            </Button>
          </div>
        </div>

        {/* Structured Statistics with Visual Inset Depth */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#B9B4AA] text-center">
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-bold text-[#18212B]">{myEvents.length}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Active Events</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-bold text-[#B6533C]">{totalRegistrations}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Registrations</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-bold text-[#B08A4A]">{myAttendanceRecords.length}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Verified Present</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-bold text-[#18212B]">
              {totalCapacity > 0 ? `${Math.round((totalRegistrations / totalCapacity) * 100)}%` : '0%'}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Capacity Load</div>
          </div>
        </div>
      </div>

      {/* 2. Tactile Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
          Operations Console Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onCreateEvent}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#B6533C] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Create Event</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">Draft or publish</div>
            </div>
          </button>

          <button
            onClick={onManageEvents}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-[#18212B] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Manage Events</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">{myEvents.length} listed</div>
            </div>
          </button>

          <button
            onClick={() => onScanAttendance()}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-[#B6533C] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Scan Attendance</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">Entrance feed</div>
            </div>
          </button>

          <button
            onClick={() => onViewParticipants()}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <Users className="w-5 h-5 text-[#18212B] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Participants</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">Rosters & export</div>
            </div>
          </button>

          <button
            onClick={() => onAnnouncements()}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <Megaphone className="w-5 h-5 text-[#B08A4A] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Announcements</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">Broadcast alerts</div>
            </div>
          </button>

          <button
            onClick={() => onCertificates()}
            className="p-3.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[0_2px_4px_rgba(24,33,43,0.04)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.07)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <Award className="w-5 h-5 text-[#B08A4A] mb-2" />
            <div>
              <div className="text-xs font-bold text-[#18212B]">Certificates</div>
              <div className="text-[10px] text-[#62605B] mt-0.5">Verify & issue</div>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Today's Event Operations */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212B] flex items-center gap-2">
          <span className="w-2 h-2 bg-[#B6533C] rounded-none"></span>
          <span>Today&apos;s Active Sessions ({todayOps.length})</span>
        </h2>

        {todayOps.length > 0 ? (
          <div className="space-y-3">
            {todayOps.map(evt => {
              const checkedInCount = attendance.filter(a => a.eventId === evt._id).length;
              const checkinRate = evt.registrationCount > 0 
                ? Math.round((checkedInCount / evt.registrationCount) * 100) 
                : 0;

              return (
                <div
                  key={evt._id}
                  className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[0_2px_4px_rgba(24,33,43,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={evt.category} />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#18212B] text-[#FCFAF5]">
                        Live Today
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#18212B]">{evt.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#62605B] pt-1">
                      <span className="flex items-center gap-1 text-[#18212B]">
                        <Clock className="w-3.5 h-3.5 text-[#B6533C]" />
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#18212B]">
                        <MapPin className="w-3.5 h-3.5 text-[#B6533C]" />
                        {evt.venue}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#B6533C]">
                        {checkedInCount} / {evt.registrationCount} Checked In ({checkinRate}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<QrCode className="w-4 h-4" />}
                      onClick={() => onScanAttendance(evt._id)}
                    >
                      Scan QR Pass
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewParticipants(evt._id)}
                    >
                      Roster
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center text-xs text-[#62605B]">
            No active sessions scheduled for today. Check upcoming events below.
          </div>
        )}
      </section>

      {/* 4. Upcoming Events Overview Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
            Upcoming Scheduled Events ({upcomingEvents.length})
          </h2>
          <button
            onClick={onManageEvents}
            className="text-xs font-bold text-[#18212B] hover:text-[#B6533C] flex items-center gap-1 group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] divide-y divide-[#B9B4AA]/60 shadow-[0_2px_4px_rgba(24,33,43,0.04)]">
          {upcomingEvents.slice(0, 4).map(evt => (
            <div key={evt._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={evt.category} />
                  <span className="text-xs text-[#62605B]">
                    {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#18212B]">{evt.title}</h4>
                <div className="text-xs text-[#62605B] mt-0.5">
                  Venue: <strong className="text-[#18212B]">{evt.venue}</strong> • <span className="font-mono">{evt.registrationCount}/{evt.capacity} registered</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewParticipants(evt._id)}
                >
                  Roster
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Megaphone className="w-3 h-3 text-[#B08A4A]" />}
                  onClick={() => onAnnouncements(evt._id)}
                >
                  Alert
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
