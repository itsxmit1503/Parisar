'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AdminDashboardProps {
  onNavigateToUsers: () => void;
  onNavigateToModeration: () => void;
  onNavigateToVenues: () => void;
  onNavigateToAudit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToUsers,
  onNavigateToModeration,
  onNavigateToVenues,
  onNavigateToAudit,
}) => {
  const { allUsers, events, certificates } = useApp();

  const studentsCount = allUsers.filter(u => u.role === 'student').length;
  const organizersCount = allUsers.filter(u => u.role === 'organizer').length;
  const draftEvents = events.filter(e => e.status === 'DRAFT').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[3px] p-6 sm:p-8 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#B6533C]"></span>
              <span>University Governance Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
              Platform Oversight Console
            </h1>
            <p className="text-xs text-[#62605B] mt-0.5">
              Dr. Harisingh Gour Vishwavidyalaya (DHSGSU) Central Event Ecosystem Governance & Compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4 text-[#B6533C]" />}
              onClick={onNavigateToModeration}
            >
              Moderation ({draftEvents} Pending)
            </Button>
            <Button
              variant="dark"
              size="sm"
              leftIcon={<Users className="w-4 h-4" />}
              onClick={onNavigateToUsers}
            >
              User Directory
            </Button>
          </div>
        </div>

        {/* University-Level Metrics (Section 32) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#B9B4AA] text-center">
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{studentsCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Active Students</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#B6533C]">{organizersCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Authorized Organizers</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{events.length}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">University Events</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#B08A4A]">{certificates.length}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#62605B] mt-0.5">Issued Credentials</div>
          </div>
        </div>
      </div>

      {/* Admin Modules Navigation Cards - Tactile Objects */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B]">
          Administrative Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={onNavigateToUsers}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <Users className="w-5 h-5 text-[#18212B] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">User Directory</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Verify faculty coordinators, promote organizers, and oversee student records.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Open Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToModeration}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <ShieldCheck className="w-5 h-5 text-[#B6533C] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">Event Moderation</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Approve event proposals, enforce code of conduct, and moderate campus gatherings.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Review Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToVenues}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <Building2 className="w-5 h-5 text-[#64788A] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">Venues & Categories</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Maintain campus lecture halls, lab allocations, and academic classifications.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Configure Facilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={onNavigateToAudit}
            className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <FileText className="w-5 h-5 text-[#B08A4A] mb-2" />
              <h3 className="text-sm font-bold text-[#18212B]">Security & Audit Log</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                Inspect immutable entrance scan timestamps and academic credential signatures.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#B6533C]">
              <span>Inspect Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* University Event Ecosystem Overview Table */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B]">
              Recent Campus Events Across All Faculties
            </h2>
            <p className="text-xs text-[#62605B] mt-0.5">
              Live status across Engineering & Technology, Sciences, Arts & Humanities, Law, and Commerce.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToModeration}
          >
            Full Moderation Console
          </Button>
        </div>

        <div className="divide-y divide-[#B9B4AA]/60 text-xs">
          {events.slice(0, 5).map(evt => (
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
                  Starts: {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
