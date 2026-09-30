'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
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
  onNavigateToVenues,
}) => {
  const { allUsers, events, organizerRequests, registrations, attendance } = useApp();

  const studentsCount = allUsers.filter(u => u.role === 'student').length;
  const verifiedOrganizersCount = allUsers.filter(u => u.role === 'organizer' && u.organizerStatus === 'VERIFIED').length;
  const pendingOrgRequests = organizerRequests.filter(r => r.status === 'PENDING').length;
  const pendingEventsCount = events.filter(e => e.status === 'PENDING_REVIEW').length;
  const totalConfirmedRegs = registrations.filter(r => r.status === 'CONFIRMED').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* University Governance Header */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[3px] p-6 sm:p-8 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#B6533C]"></span>
              <span>University Administrator Panel • DHSGSU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
              University Governance & Verification Console
            </h1>
            <p className="text-xs text-[#62605B] mt-0.5">
              Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar — Organizer Verification, Event Approval, and Campus Attendance Oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={onNavigateToOrganizerRequests}
            >
              Organizer Requests ({pendingOrgRequests} Pending)
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4 text-[#B6533C]" />}
              onClick={onNavigateToModeration}
            >
              Event Approvals ({pendingEventsCount} Pending)
            </Button>
          </div>
        </div>

        {/* University-Level Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#B9B4AA] text-center">
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-2xl font-mono font-bold text-[#B08A4A]">{pendingOrgRequests}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Pending Organizers</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-2xl font-mono font-bold text-[#B6533C]">{pendingEventsCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Pending Event Reviews</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-2xl font-mono font-bold text-[#2F613B]">{verifiedOrganizersCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Verified Organizers</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{studentsCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Registered Students</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] col-span-2 sm:col-span-1">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{attendance.length} / {totalConfirmedRegs}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Verified Check-Ins</div>
          </div>
        </div>
      </div>

      {/* Admin Modules Navigation Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B]">
          University Administration Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={onNavigateToOrganizerRequests}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-5 h-5 text-[#B6533C]" />
                {pendingOrgRequests > 0 && (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#FAF0E6] text-[#B08A4A] border border-[#B08A4A]/40 text-[10px] font-mono font-bold">
                    {pendingOrgRequests} Awaiting Review
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[#18212B]">1. Organizer Verification Requests</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Inspect applicant credentials, department authorization, and approve or reject organizer privileges.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Review Organizer Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToModeration}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-[#18212B]" />
                {pendingEventsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#FBEFEF] text-[#B6533C] border border-[#B6533C]/40 text-[10px] font-mono font-bold">
                    {pendingEventsCount} Pending Approval
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[#18212B]">2. Event Proposals & Approvals</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Review submitted campus events, verify venue allocations, and publish official events to students.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Review Submitted Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToParticipants}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <Users className="w-5 h-5 text-[#18212B] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">3. Campus Participants & Users</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Oversee university student accounts, verified organizers, and departmental participation records.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>View Participant Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToAttendance}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <QrCode className="w-5 h-5 text-[#2F613B] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">4. Overall Attendance Ledger</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Inspect verified QR turnstile check-ins across all university seminars, workshops, and cultural events.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Inspect Attendance Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToVenues}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between sm:col-span-2 lg:col-span-2"
          >
            <div>
              <Building2 className="w-5 h-5 text-[#64788A] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">5. Campus Venues, Categories & Platform Settings</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Configure DHSGSU auditoriums (Golden Jubilee Hall, Gour Sabhagar, Abhimanch), capacities, and official event categories.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Open Platform Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Campus Events & Approval Status Table */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B]">
              Recent Event Proposals & Published Schedule
            </h2>
            <p className="text-xs text-[#62605B] mt-0.5">
              Live status across all DHSGSU departments and faculties.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToModeration}
          >
            Manage All Events
          </Button>
        </div>

        <div className="divide-y divide-[#B9B4AA]/60 text-xs">
          {events.slice(0, 6).map(evt => (
            <div key={evt._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={evt.category} />
                  <EventStatusBadge status={evt.status} />
                </div>
                <h4 className="text-sm font-bold text-[#18212B]">{evt.title}</h4>
                <div className="text-[#62605B]">
                  Organizer: <strong className="text-[#18212B]">{evt.organizerName}</strong> • Venue: {evt.venue}
                </div>
              </div>

              <div className="text-right shrink-0 font-mono">
                <div className="font-bold text-[#18212B]">
                  {evt.registrationCount} / {evt.capacity} Registered
                </div>
                <div className="text-[11px] text-[#62605B]">
                  Date: {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
