'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Calendar,
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
      {/* 1. Review & Control Header (Sections 4, 5, 10) */}
      <div className="space-y-1 pt-1">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
          University Administrator • DHSGSU
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
          University Review & Governance
        </h1>
        <p className="text-sm text-[#62605B]">
          Verify organizer applications, approve campus event proposals, and oversee university participation.
        </p>
      </div>

      {/* 2. Primary Priority: Pending Organizer Requests & Pending Event Reviews */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Pending Organizer Requests */}
        <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 sm:p-6 shadow-[3px_3px_0_0_#18212B] flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#B08A4A]">
                <UserCheck className="w-4 h-4" />
                <span>1. Organizer Verification</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#FAF0E6] text-[#B08A4A] border border-[#B08A4A]/40 text-xs font-mono font-bold">
                {pendingOrgRequests.length} Pending
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-[#18212B]">
              Pending Organizer Requests
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Review faculty and student coordinator applications before granting organizer panel access.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToOrganizerRequests}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Review Organizer Requests ({pendingOrgRequests.length})
          </Button>
        </div>

        {/* Card 2: Pending Event Reviews */}
        <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 sm:p-6 shadow-[3px_3px_0_0_#18212B] flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#B6533C]">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Event Approvals</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#FBEFEF] text-[#B6533C] border border-[#B6533C]/40 text-xs font-mono font-bold">
                {pendingEvents.length} Pending
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-[#18212B]">
              Pending Event Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Inspect submitted seminars, workshops, and cultural proposals to approve and publish them to students.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToModeration}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Review Event Proposals ({pendingEvents.length})
          </Button>
        </div>
      </section>

      {/* 3. Participant & Attendance Overview (Prioritized in Section 4) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onNavigateToParticipants}
          className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-4 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Participants Directory</div>
            <div className="text-xs text-[#62605B]">
              {totalConfirmedRegs} active registrations across campus
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
            <div className="text-sm font-extrabold text-[#18212B]">Attendance Overview</div>
            <div className="text-xs text-[#62605B]">
              {attendance.length} verified QR turnstile check-ins
            </div>
          </div>
          <div className="w-10 h-10 rounded-[3px] bg-[#EAE5DB] text-[#2F613B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
        </button>
      </section>

      {/* 4. Event Overview List */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 sm:p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#18212B]">
              University Event Overview
            </h2>
            <p className="text-xs text-[#62605B]">
              Recent proposals and published events across DHSGSU.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
            onClick={onNavigateToModeration}
          >
            All Events ({events.length})
          </Button>
        </div>

        <div className="divide-y divide-[#B9B4AA]/60">
          {events.slice(0, 5).map(evt => (
            <div key={evt._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={evt.category} />
                  <EventStatusBadge status={evt.status} />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#18212B]">{evt.title}</h4>
                <div className="text-xs text-[#62605B]">
                  {evt.organizerName} • {evt.venue}
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
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
