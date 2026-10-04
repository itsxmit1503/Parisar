'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  ShieldCheck, 
  ArrowRight,
  UserCheck,
  Megaphone,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

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
  onNavigateToAudit,
}) => {
  const {
    allUsers,
    events,
    organizerRequests,
    registrations,
    attendance,
    certificates,
    sendUniversityAnnouncement,
  } = useApp();
  const { showToast } = useToast();

  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL' | 'STUDENTS' | 'ORGANIZERS'>('ALL');

  const pendingOrgRequests = organizerRequests.filter(r => r.status === 'PENDING');
  const pendingEvents = events.filter(e => e.status === 'PENDING_REVIEW');
  const publishedOrOngoingEvents = events.filter(
    e => e.status === 'PUBLISHED' || e.status === 'APPROVED' || e.status === 'ONGOING'
  );
  const completedEvents = events.filter(e => e.status === 'COMPLETED');
  const totalStudents = allUsers.filter(u => u.role === 'student').length;
  const verifiedOrganizers = allUsers.filter(u => u.role === 'organizer' && u.organizerStatus === 'VERIFIED').length;
  const totalConfirmedRegs = registrations.filter(r => r.status === 'CONFIRMED').length;

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = sendUniversityAnnouncement(broadcastTitle, broadcastMessage, broadcastAudience);
    if (res.success) {
      showToast(
        'success',
        `Official DHSGSU notice dispatched to ${res.data} ${broadcastAudience.toLowerCase()} accounts.`,
        'University Broadcast Sent'
      );
      setBroadcastTitle('');
      setBroadcastMessage('');
      setShowBroadcastForm(false);
    } else {
      showToast('error', res.error?.message || 'Unable to send broadcast.', 'Broadcast Error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 lg:pb-16">
      {/* 1. Admin Dashboard Title & Broadcast CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            PARISAR · DHSGSU PROCTORIAL & DSW AUTHORITY
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#62605B]">
            University-wide event authorization, organizer verification, and campus governance.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Megaphone className="w-4 h-4 text-[#B6533C]" />}
          onClick={() => setShowBroadcastForm(!showBroadcastForm)}
        >
          {showBroadcastForm ? 'Close Broadcast' : 'University Broadcast'}
        </Button>
      </div>

      {/* University-Wide Announcement Broadcast Panel */}
      {showBroadcastForm && (
        <form
          onSubmit={handleBroadcastSubmit}
          className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-5 shadow-[3px_3px_0_0_#18212B] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                DSW Official Circular
              </span>
              <h3 className="text-base font-extrabold text-[#18212B]">
                Dispatch University-Wide Announcement
              </h3>
            </div>
            <select
              value={broadcastAudience}
              onChange={e => setBroadcastAudience(e.target.value as 'ALL' | 'STUDENTS' | 'ORGANIZERS')}
              className="px-2.5 py-1 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono font-bold text-[#18212B]"
            >
              <option value="ALL">Target: All Campus Users</option>
              <option value="STUDENTS">Target: Students Only</option>
              <option value="ORGANIZERS">Target: Organizers Only</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                Circular Subject / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Revised Proctorial Guidelines for Gour Jayanti Week"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-bold text-[#18212B] focus:outline-none focus:border-[#18212B]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                Official Circular Message *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter official university notice to be delivered to campus notification inboxes..."
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B] focus:outline-none focus:border-[#18212B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowBroadcastForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Megaphone className="w-3.5 h-3.5" />}>
              Publish Official Broadcast
            </Button>
          </div>
        </form>
      )}

      {/* Live University Governance Metrics Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-3.5 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">Campus Accounts</div>
          <div className="text-xl font-extrabold text-[#18212B] font-mono mt-0.5">
            {totalStudents} Students
          </div>
          <div className="text-[11px] text-[#2F613B] font-mono font-bold mt-0.5">
            {verifiedOrganizers} Verified Organizers
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-3.5 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">Active Events</div>
          <div className="text-xl font-extrabold text-[#18212B] font-mono mt-0.5">
            {publishedOrOngoingEvents.length} Live / Open
          </div>
          <div className="text-[11px] text-[#62605B] font-mono mt-0.5">
            {completedEvents.length} Completed · {events.length} Total
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-3.5 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">Registrations</div>
          <div className="text-xl font-extrabold text-[#18212B] font-mono mt-0.5">
            {totalConfirmedRegs} Passes
          </div>
          <div className="text-[11px] text-[#2F613B] font-mono font-bold mt-0.5">
            {attendance.length} Verified Check-ins
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-3.5 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">Credentials</div>
          <div className="text-xl font-extrabold text-[#B08A4A] font-mono mt-0.5">
            {certificates.length} Issued
          </div>
          <div className="text-[11px] text-[#62605B] font-mono mt-0.5">
            ≥80% Rule Enforced
          </div>
        </div>
      </section>

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

      {/* 4. Administrative Operations & Oversight Links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={onNavigateToParticipants}
          className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">User Directory</div>
            <div className="text-xs text-[#62605B]">
              {allUsers.length} campus accounts
            </div>
          </div>
          <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={onNavigateToAttendance}
          className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Attendance Ledger</div>
            <div className="text-xs text-[#62605B]">
              {attendance.length} verified check-ins
            </div>
          </div>
          <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] text-[#2F613B] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </button>

        <button
          onClick={onNavigateToVenues}
          className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
        >
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-[#18212B]">Venues & Categories</div>
            <div className="text-xs text-[#62605B]">
              DHSGSU POIs & rules
            </div>
          </div>
          <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </button>

        {onNavigateToAudit && (
          <button
            onClick={onNavigateToAudit}
            className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] active:translate-y-[1px] transition-all text-left flex items-center justify-between gap-3 cursor-pointer touch-manipulation"
          >
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-[#18212B]">Audit Trail</div>
              <div className="text-xs text-[#62605B]">
                Immutable system logs
              </div>
            </div>
            <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] text-[#B08A4A] border border-[#B9B4AA] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </button>
        )}
      </section>
    </div>
  );
};

