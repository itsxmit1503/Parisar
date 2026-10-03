'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventStatus } from '../../types';
import { Search, AlertTriangle } from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface EventModerationProps {
  onOpenEventDetails?: (event: CampusEvent) => void;
}

export const EventModeration: React.FC<EventModerationProps> = ({ onOpenEventDetails }) => {
  const { events, adminModerateEvent, getEventConflicts } = useApp();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | EventStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const filteredEvents = events.filter(e => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.organizerName.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (eventId: string, title: string, newStatus: EventStatus, reason?: string) => {
    const res = adminModerateEvent(eventId, newStatus, reason);
    if (res.success) {
      if (newStatus === 'PUBLISHED') {
        showToast('success', `"${title}" has been approved and published to the student portal.`, 'Event Approved');
      } else if (newStatus === 'REJECTED') {
        showToast('error', `"${title}" proposal has been returned/rejected.`, 'Event Rejected');
        setRejectingEventId(null);
        setRejectionNote('');
      } else {
        showToast('info', `Status of "${title}" changed to ${newStatus}.`, 'Event Updated');
      }
    } else {
      showToast('error', res.error?.message || 'Unable to change event status.', 'Schedule Conflict / Error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
          Academic Affairs Oversight
        </div>
        <h1 className="text-2xl font-bold text-[#18212B] tracking-tight">
          Campus Event Authorization & Management
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Review submitted event proposals, detect venue schedule conflicts, and authorize official university events across DHSGSU.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search by title, organizer, or venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'ONGOING', 'DRAFT', 'REJECTED', 'COMPLETED', 'CANCELLED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-[2px] text-[11px] font-mono uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#18212B] text-[#FCFAF5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#18212B] hover:bg-[#EAE5DB] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B]'
              }`}
            >
              {st === 'PUBLISHED' ? 'APPROVED' : st === 'PENDING_REVIEW' ? 'PENDING REVIEW' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B] overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[780px]">
          <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold">Event Details & Policy</th>
              <th className="py-3 px-4 font-bold">Organizer</th>
              <th className="py-3 px-4 font-bold">Venue & Schedule Check</th>
              <th className="py-3 px-4 font-bold">Current Status</th>
              <th className="py-3 px-4 text-right font-bold">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B9B4AA]/50">
            {filteredEvents.map(evt => {
              const conflicts = getEventConflicts(evt.venueId, evt.startTime, evt.endTime, evt._id);
              const isRejecting = rejectingEventId === evt._id;

              return (
                <React.Fragment key={evt._id}>
                  <tr className="hover:bg-[#EAE5DB]/40 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <CategoryBadge category={evt.category} />
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] text-[10px] font-mono font-bold text-[#18212B]">
                          {evt.eventMode || 'OFFLINE'}
                        </span>
                        {evt.certificateRequired !== false && (
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#FAF0E6] border border-[#B08A4A]/40 text-[10px] font-mono font-bold text-[#B08A4A]">
                            Cert ≥{evt.minParticipationPercent ?? 80}%
                          </span>
                        )}
                      </div>
                      <div
                        onClick={() => onOpenEventDetails?.(evt)}
                        className="font-bold text-[#18212B] line-clamp-1 cursor-pointer hover:text-[#B6533C] hover:underline"
                      >
                        {evt.title}
                      </div>
                      <div className="text-[11px] text-[#62605B] line-clamp-1 mt-0.5">{evt.description}</div>
                      {evt.rejectionReason && (
                        <div className="text-[10px] font-mono text-[#A83226] mt-1">
                          Rejected Note: {evt.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212B]">{evt.organizerName}</div>
                      <div className="text-[11px] text-[#62605B]">{evt.organizerEmail}</div>
                    </td>

                    <td className="py-3 px-4 text-[#62605B]">
                      <div className="font-bold text-[#18212B]">{evt.venue}</div>
                      <div className="text-[11px] font-mono text-[#62605B]">
                        {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                      {conflicts.length > 0 && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#FBEAEA] border border-[#A83226]/40 text-[10px] font-mono font-bold text-[#A83226]">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Overlap: {conflicts[0].title}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <EventStatusBadge status={evt.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(evt.status === 'PENDING_REVIEW' || evt.status === 'DRAFT' || evt.status === 'REJECTED') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(evt._id, evt.title, 'PUBLISHED')}
                          >
                            Approve
                          </Button>
                        )}

                        {(evt.status === 'PENDING_REVIEW' || evt.status === 'DRAFT') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#A83226] border-[#A83226]"
                            onClick={() => {
                              setRejectingEventId(isRejecting ? null : evt._id);
                              setRejectionNote(evt.rejectionReason || '');
                            }}
                          >
                            Reject
                          </Button>
                        )}

                        {(evt.status === 'PUBLISHED' || evt.status === 'APPROVED' || evt.status === 'ONGOING') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(evt._id, evt.title, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        )}

                        {evt.status !== 'CANCELLED' && evt.status !== 'REJECTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#A83226] hover:bg-[#FBEAEA]"
                            onClick={() => handleStatusChange(evt._id, evt.title, 'CANCELLED')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isRejecting && (
                    <tr className="bg-[#FBEAEA]/60">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Provide administrative reason for returning/rejecting this event proposal..."
                            value={rejectionNote}
                            onChange={e => setRejectionNote(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-[#FCFAF5] border border-[#A83226] rounded-[2px] text-xs text-[#18212B] focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRejectingEventId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(
                                  evt._id,
                                  evt.title,
                                  'REJECTED',
                                  rejectionNote.trim() || 'Returned by DSW Administration for schedule/venue revision.'
                                )
                              }
                            >
                              Confirm Rejection
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

