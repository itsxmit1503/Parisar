'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode
} from 'lucide-react';
import { Badge, CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

interface MyPassesViewProps {
  onOpenPass: (registration: Registration, event: CampusEvent) => void;
  onExploreEvents: () => void;
}

export const MyPassesView: React.FC<MyPassesViewProps> = ({ onOpenPass, onExploreEvents }) => {
  const { registrations, events, currentUser, cancelRegistration } = useApp();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'active' | 'attended' | 'cancelled'>('active');

  const userRegs = registrations.filter(r => r.userId === currentUser._id);

  const enrichedRegs = userRegs.map(reg => {
    const event = events.find(e => e._id === reg.eventId);
    return { reg, event };
  }).filter(item => item.event !== undefined) as { reg: Registration; event: CampusEvent }[];

  const filtered = enrichedRegs.filter(({ reg }) => {
    if (filter === 'cancelled') return reg.status === 'CANCELLED';
    if (filter === 'attended') return Boolean(reg.checkedInAt);
    return reg.status === 'CONFIRMED' && !reg.checkedInAt;
  });

  const handleCancelRegistration = (regId: string, eventTitle: string) => {
    if (confirm(`Are you sure you want to cancel your pass for "${eventTitle}"? Your seat will be returned to the open DHSGSU student pool.`)) {
      const res = cancelRegistration(regId);
      if (res.success) {
        showToast('info', `Registration for "${eventTitle}" cancelled.`, 'Pass Revoked');
      } else {
        showToast('error', res.error?.message || 'Failed to cancel registration.', 'Cancellation Error');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="border-b border-[#B9B4AA] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            PARISAR • DHSGSU Credentials
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            My Digital Event Passes
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Your single-use, verified optical QR passes for Dr. Harisingh Gour Vishwavidyalaya sessions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onExploreEvents}>
          Explore Events Catalog
        </Button>
      </div>

      {/* Filter Tabs - Tactile buttons */}
      <div className="flex items-center gap-1.5 border-b border-[#B9B4AA] pb-2 overflow-x-auto">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-[3px] text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
            filter === 'active'
              ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
              : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          Active Passes ({enrichedRegs.filter(i => i.reg.status === 'CONFIRMED' && !i.reg.checkedInAt).length})
        </button>
        <button
          onClick={() => setFilter('attended')}
          className={`px-3 py-1.5 rounded-[3px] text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
            filter === 'attended'
              ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
              : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          Attended & Verified ({enrichedRegs.filter(i => Boolean(i.reg.checkedInAt)).length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3 py-1.5 rounded-[3px] text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
            filter === 'cancelled'
              ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
              : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
          }`}
        >
          Cancelled Passes ({enrichedRegs.filter(i => i.reg.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Passes Grid */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(({ reg, event }) => {
            const isCheckedIn = Boolean(reg.checkedInAt);
            const isCancelled = reg.status === 'CANCELLED';

            const eventDate = new Date(event.startTime).toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const eventTime = `${new Date(event.startTime).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })} - ${new Date(event.endTime).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}`;

            return (
              <div
                key={reg._id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={event.category} />
                    {isCheckedIn ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2F613B] bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                        <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                        Attendance Verified
                      </span>
                    ) : isCancelled ? (
                      <Badge variant="error">Pass Revoked</Badge>
                    ) : (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA]">
                        Pass Confirmed
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#18212B] leading-snug">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#62605B]">
                    <div className="flex items-center gap-1.5 font-mono text-[#18212B]">
                      <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
                      <span>{eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#64788A]" />
                      <span>{eventTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B6533C]" />
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  {/* Token Box */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono uppercase text-[#62605B]">Pass Token:</span>
                    <span className="font-mono text-xs font-bold text-[#18212B] bg-[#EAE5DB] px-2 py-0.5 rounded-[2px] border border-[#B9B4AA]">
                      {reg.qrToken}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-[#B9B4AA] pt-3 md:pt-0 md:pl-5">
                  {!isCancelled && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<QrCode className="w-3.5 h-3.5" />}
                      onClick={() => onOpenPass(reg, event)}
                    >
                      {isCheckedIn ? 'View Pass' : 'Show Digital Pass'}
                    </Button>
                  )}

                  {!isCheckedIn && !isCancelled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#A83226] hover:bg-[#FBEAEA]"
                      onClick={() => handleCancelRegistration(reg._id, event.title)}
                    >
                      Cancel Pass
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title={
            filter === 'active'
              ? 'No active event passes'
              : filter === 'attended'
              ? 'No attended events yet'
              : 'No cancelled passes'
          }
          description="Register for upcoming workshops, national symposiums, and cultural events across DHSGSU."
          actionLabel="Discover Events"
          onAction={onExploreEvents}
        />
      )}
    </div>
  );
};
