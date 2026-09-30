'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight,
  QrCode,
  UserCheck
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AdminDashboardProps {
  onNavigateToOrganizerRequests: () => void;
  onNavigateToModeration: () => void;
  onNavigateToParticipants: () => void;
  onNavigateToAttendance: () => void;
  onNavigateToVenues: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToOrganizerRequests,
  onNavigateToModeration,
  onNavigateToParticipants,
  onNavigateToAttendance,
}) => {
  const { events, organizerRequests, registrations, attendance } = useApp();

  const pendingOrgRequests = organizerRequests.filter(r => r.status === 'PENDING');
  const pendingEvents = events.filter(e => e.status === 'PENDING_REVIEW');
  const totalConfirmedRegs = registrations.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 lg:pb-16">
      {/* 1. Admin Dashboard Title */}
      <div className="space-y-1 pt-1">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
          PARISAR · DHSGSU
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-[#62605B]">
          Needs your attention
        </p>
      </div>

      {/* 2. Needs Your Attention: Organizer Requests & Events Pending Review */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Action 1: Organizer Requests */}
        <div
          onClick={onNavigateToOrganizerRequests}
          className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 sm:p-6 shadow-[3px_3px_0_0_#18212B] flex flex-col justify-between space-y-4 cursor-pointer active:translate-y-[1px] transition-all"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#B08A4A]">
                <UserCheck className="w-4 h-4" />
                <span>Organizer Verification</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#FAF0E6] text-[#B08A4A] border border-[#B08A4A]/40 text-xs font-mono font-bold">
                {pendingOrgRequests.length} Pending
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#18212B]">
              {pendingOrgRequests.length} Organizer {pendingOrgRequests.length === 1 ? 'Request' : 'Requests'}
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B]">
              Approve or reject coordinator applications before granting organizer access.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToOrganizerRequests}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Review Organizer Requests
          </Button>
        </div>

        {/* Action 2: Events Pending Review */}
        <div
          onClick={onNavigateToModeration}
          className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 sm:p-6 shadow-[3px_3px_0_0_#18212B] flex flex-col justify-between space-y-4 cursor-pointer active:translate-y-[1px] transition-all"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#B6533C]">
                <ShieldCheck className="w-4 h-4" />
                <span>Event Submissions</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#FBEFEF] text-[#B6533C] border border-[#B6533C]/40 text-xs font-mono font-bold">
                {pendingEvents.length} Pending
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#18212B]">
              {pendingEvents.length} {pendingEvents.length === 1 ? 'Event' : 'Events'} Pending Review
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B]">
              Review submitted event proposals to publish them to the campus directory.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToModeration}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Review Event Submissions
          </Button>
        </div>
      </section>

      {/* 3. Recent Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#18212B]">
            Recent Events
          </h2>
          <button
            onClick={onNavigateToModeration}
            className="min-h-[40px] px-3 py-1.5 text-sm font-bold text-[#B6533C] hover:text-[#18212B] flex items-center gap-1 cursor-pointer touch-manipulation"
          >
            <span>Manage all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] divide-y divide-[#EAE5DB]">
          {events.slice(0, 4).map(evt => (
            <div key={evt._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={evt.category} />
                  <EventStatusBadge status={evt.status} />
                </div>
                <h4 className="text-base font-bold text-[#18212B]">{evt.title}</h4>
                <div className="text-xs sm:text-sm text-[#62605B]">
                  {evt.organizerName} · {evt.venue}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="text-xs font-mono font-bold text-[#18212B]">
                  {evt.registrationCount}/{evt.capacity} Registered
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onNavigateToModeration}
                >
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Participants & Attendance */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onNavigateToParticipants}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-4 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-base font-extrabold text-[#18212B]">Participants</div>
            <div className="text-xs sm:text-sm text-[#62605B]">
              {totalConfirmedRegs} registered participants
            </div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={onNavigateToAttendance}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-4 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-base font-extrabold text-[#18212B]">Attendance</div>
            <div className="text-xs sm:text-sm text-[#62605B]">
              {attendance.length} verified check-ins
            </div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#EAE5DB] text-[#2F613B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
        </button>
      </section>
    </div>
  );
};
