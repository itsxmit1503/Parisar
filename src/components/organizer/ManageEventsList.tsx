'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventStatus } from '../../types';
import { 
  Calendar, 
  MapPin, 
  Users, 
  QrCode, 
  Megaphone, 
  Award, 
  PlusCircle, 
  Search, 
  Clock
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';

interface ManageEventsListProps {
  onCreateEvent: () => void;
  onScanAttendance: (eventId: string) => void;
  onViewParticipants: (eventId: string) => void;
  onAnnouncements: (eventId: string) => void;
  onCertificates: (eventId: string) => void;
}

export const ManageEventsList: React.FC<ManageEventsListProps> = ({
  onCreateEvent,
  onScanAttendance,
  onViewParticipants,
  onAnnouncements,
  onCertificates,
}) => {
  const { events, currentUser, updateEvent } = useApp();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | EventStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const myEvents = events.filter(e => e.organizerId === currentUser._id || currentUser.role === 'admin');

  const filteredEvents = myEvents.filter(e => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSubmitForReview = (eventId: string, title: string) => {
    const res = updateEvent(eventId, { status: 'PENDING_REVIEW' });
    if (res.success) {
      showToast('info', `"${title}" has been submitted to the University Administrator for review.`, 'Submitted for Review');
    }
  };

  const handleCancelEvent = (eventId: string, title: string) => {
    if (confirm(`Are you sure you want to cancel "${title}"? All registered students will be notified.`)) {
      const res = updateEvent(eventId, { status: 'CANCELLED' });
      if (res.success) {
        showToast('error', `"${title}" cancelled. Registered attendees notified.`, 'Event Cancelled');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            Organizer Event Lifecycle
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            My Events
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Manage event proposals, submit drafts for administrative authorization, and coordinate entrance scanning.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={onCreateEvent}
        >
          Create Event
        </Button>
      </div>

      {/* Filter Tabs & Search - Tactile Controls */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['ALL', 'PUBLISHED', 'PENDING_REVIEW', 'DRAFT', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#18212B] text-[#FCFAF5] border border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                  : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px]'
              }`}
            >
              {st === 'PUBLISHED' ? 'APPROVED' : st === 'PENDING_REVIEW' ? 'PENDING REVIEW' : st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search managed events..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B] w-full md:w-56 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>
      </div>

      {/* Events Table / Card List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-3.5">
          {filteredEvents.map(evt => {
            const capPercent = Math.min(100, Math.round((evt.registrationCount / evt.capacity) * 100));

            return (
              <div
                key={evt._id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={evt.category} />
                    <EventStatusBadge status={evt.status} />
                  </div>

                  <h3 className="text-base font-bold text-[#18212B] leading-snug">
                    {evt.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#18212B] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                      <span>{new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#64788A] shrink-0" />
                      <span>{new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                      <span className="font-bold">{evt.venue}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="max-w-md pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#62605B]">
                      <span>Registration Pool</span>
                      <span className="font-bold text-[#18212B]">
                        {evt.registrationCount} / {evt.capacity} ({capPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EAE5DB] rounded-[1px] h-1.5 overflow-hidden border border-[#B9B4AA]">
                      <div
                        className={`h-full ${
                          capPercent >= 100
                            ? 'bg-[#A83226]'
                            : capPercent >= 80
                            ? 'bg-[#B08A4A]'
                            : 'bg-[#B6533C]'
                        }`}
                        style={{ width: `${capPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-[#B9B4AA] pt-3 lg:pt-0 lg:pl-5">
                  {(evt.status === 'DRAFT' || evt.status === 'REJECTED') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitForReview(evt._id, evt.title)}
                    >
                      Submit for Review
                    </Button>
                  )}

                  {evt.status === 'PENDING_REVIEW' && (
                    <span className="px-3 py-1.5 rounded-[2px] bg-[#FBF4E8] border border-[#E5D2AF] text-[11px] font-mono font-bold text-[#8F5E15]">
                      Awaiting DSW Approval
                    </span>
                  )}

                  {(evt.status === 'PUBLISHED' || evt.status === 'APPROVED') && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<QrCode className="w-3.5 h-3.5" />}
                      onClick={() => onScanAttendance(evt._id)}
                    >
                      Scan Attendance
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Users className="w-3.5 h-3.5 text-[#18212B]" />}
                    onClick={() => onViewParticipants(evt._id)}
                  >
                    Participants ({evt.registrationCount})
                  </Button>

                  {(evt.status === 'PUBLISHED' || evt.status === 'APPROVED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Megaphone className="w-3.5 h-3.5 text-[#B08A4A]" />}
                      onClick={() => onAnnouncements(evt._id)}
                    >
                      Alert
                    </Button>
                  )}

                  {evt.status === 'COMPLETED' && (
                    <Button
                      variant="brass"
                      size="sm"
                      leftIcon={<Award className="w-3.5 h-3.5 text-[#FCFAF5]" />}
                      onClick={() => onCertificates(evt._id)}
                    >
                      Issue Certs
                    </Button>
                  )}

                  {evt.status !== 'CANCELLED' && evt.status !== 'COMPLETED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#A83226] hover:bg-[#FBEAEA]"
                      onClick={() => handleCancelEvent(evt._id, evt.title)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No events match this filter"
          description="Create your first event or adjust the status filter."
          actionLabel="Create Event"
          onAction={onCreateEvent}
        />
      )}
    </div>
  );
};
