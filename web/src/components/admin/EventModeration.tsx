'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventStatus } from '../../types';
import { Search } from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface EventModerationProps {
  onOpenEventDetails?: (event: CampusEvent) => void;
}

export const EventModeration: React.FC<EventModerationProps> = ({ onOpenEventDetails }) => {
  const { events, adminModerateEvent } = useApp();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | EventStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleStatusChange = (eventId: string, title: string, newStatus: EventStatus) => {
    const res = adminModerateEvent(eventId, newStatus);
    if (res.success) {
      showToast('success', `Status of "${title}" changed to ${newStatus}.`, 'Event Moderated');
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
          Campus Event Moderation
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Review event proposals, verify facility reservations, and ensure adherence to university code of conduct.
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

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-[2px] text-[11px] font-mono uppercase tracking-wider font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#18212B] text-[#FCFAF5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#18212B] hover:bg-[#EAE5DB] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold">Event Details</th>
              <th className="py-3 px-4 font-bold">Organizer</th>
              <th className="py-3 px-4 font-bold">Venue & Schedule</th>
              <th className="py-3 px-4 font-bold">Current Status</th>
              <th className="py-3 px-4 text-right font-bold">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B9B4AA]/50">
            {filteredEvents.map(evt => (
              <tr key={evt._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                <td className="py-3 px-4 max-w-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CategoryBadge category={evt.category} />
                  </div>
                  <div 
                    onClick={() => onOpenEventDetails?.(evt)}
                    className="font-bold text-[#18212B] line-clamp-1 cursor-pointer hover:text-[#B6533C] hover:underline"
                  >
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-[#62605B] line-clamp-1 mt-0.5">{evt.description}</div>
                </td>

                <td className="py-3 px-4">
                  <div className="font-bold text-[#18212B]">{evt.organizerName}</div>
                  <div className="text-[11px] text-[#62605B]">{evt.organizerEmail}</div>
                </td>

                <td className="py-3 px-4 text-[#62605B]">
                  <div className="font-bold text-[#18212B]">{evt.venue}</div>
                  <div className="text-[11px] font-mono text-[#62605B]">
                    {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <EventStatusBadge status={evt.status} />
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {evt.status === 'DRAFT' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(evt._id, evt.title, 'PUBLISHED')}
                      >
                        Approve & Publish
                      </Button>
                    )}

                    {evt.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(evt._id, evt.title, 'COMPLETED')}
                      >
                        Mark Completed
                      </Button>
                    )}

                    {evt.status !== 'CANCELLED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#A83226] hover:bg-[#FBEAEA]"
                        onClick={() => handleStatusChange(evt._id, evt.title, 'CANCELLED')}
                      >
                        Cancel Event
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
