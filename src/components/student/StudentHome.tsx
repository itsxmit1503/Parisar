'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Ticket, 
  CheckCircle2
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface StudentHomeProps {
  onOpenEvent: (event: CampusEvent) => void;
  onOpenPass: (registration: Registration, event: CampusEvent) => void;
  onNavigateToEvents: () => void;
  onNavigateToPassport: () => void;
  onNavigateToMap: (venueId?: string) => void;
  onOpenApkModal: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  onOpenEvent,
  onOpenPass,
  onNavigateToEvents,
}) => {
  const { currentUser, events, registrations } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Only approved/published events are visible to students
  const publishedEvents = events.filter(
    e => e.status === 'PUBLISHED' || e.status === 'APPROVED'
  );

  // Student's confirmed registrations
  const userConfirmedRegs = registrations.filter(
    r => r.userId === currentUser._id && r.status === 'CONFIRMED'
  );

  // Next registered event for quick pass access
  const nextRegisteredReg = userConfirmedRegs[0];
  const nextRegisteredEvent = nextRegisteredReg
    ? publishedEvents.find(e => e._id === nextRegisteredReg.eventId) || events.find(e => e._id === nextRegisteredReg.eventId)
    : undefined;

  // Filter upcoming events if user types in search box
  const displayedEvents = publishedEvents
    .filter(evt => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 lg:pb-16">
      {/* 1. Clear Purpose Header & Search (Sections 4, 5, 12) */}
      <section className="space-y-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            PARISAR • DHSGSU
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Hello, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#62605B]">
            Find and register for upcoming seminars, workshops, cultural events, and competitions across campus.
          </p>
        </div>

        {/* Comfortable Touch Search Bar */}
        <div className="bg-[#EAE5DB] border border-[#B9B4AA] p-2.5 rounded-[4px] shadow-[inset_0_1px_3px_rgba(24,33,43,0.08)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62605B]" />
            <input
              type="text"
              placeholder="Search by event name, category, or venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !searchQuery.trim()) onNavigateToEvents();
              }}
              className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-sm font-medium text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B] transition-all"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onNavigateToEvents}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Browse All Events
          </Button>
        </div>
      </section>

      {/* 2. My Next Registered Event & My Pass (Prioritized in Section 4) */}
      {nextRegisteredReg && nextRegisteredEvent && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B]">
            My Next Registered Event
          </h2>

          <div className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[3px_3px_0_0_#18212B] rounded-[4px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={nextRegisteredEvent.category} />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B]/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Registered • Pass Ready
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-[#18212B] leading-snug">
                {nextRegisteredEvent.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#62605B]">
                <span className="flex items-center gap-1.5 font-medium text-[#18212B]">
                  <Calendar className="w-4 h-4 text-[#B6533C]" />
                  {new Date(nextRegisteredEvent.startTime).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })} • {new Date(nextRegisteredEvent.startTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#64788A]" />
                  {nextRegisteredEvent.venue}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => onOpenEvent(nextRegisteredEvent)}
              >
                View Details
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Ticket className="w-4 h-4" />}
                onClick={() => onOpenPass(nextRegisteredReg, nextRegisteredEvent)}
              >
                My Pass
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Upcoming Campus Events — Scannable in 1–2 Seconds (Section 7) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#18212B]">
              Upcoming Campus Events
            </h2>
            <p className="text-xs sm:text-sm text-[#62605B]">
              Tap an event to view details or register for your digital pass.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onNavigateToEvents}>
            See All ({publishedEvents.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEvents.map(evt => {
            const myReg = userConfirmedRegs.find(r => r.eventId === evt._id);
            const isFull = evt.registrationCount >= evt.capacity;

            return (
              <div
                key={evt._id}
                onClick={() => onOpenEvent(evt)}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between cursor-pointer active:translate-y-[1px] transition-all"
              >
                {/* 1. Event Image + Category + Registration Status */}
                <div>
                  <div className="h-44 w-full bg-[#EAE5DB] relative border-b border-[#B9B4AA]">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <CategoryBadge category={evt.category} />
                    </div>
                    <div className="absolute top-3 right-3">
                      {myReg ? (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#2F613B] text-white text-[11px] font-bold shadow-sm">
                          Registered
                        </span>
                      ) : isFull ? (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#A83226] text-white text-[11px] font-bold shadow-sm">
                          Full
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#18212B]/90 text-[#FCFAF5] text-[11px] font-bold">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Event Title, Date, Venue (No dense paragraphs) */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="font-extrabold text-base text-[#18212B] leading-snug line-clamp-2">
                      {evt.title}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-[#62605B] pt-1">
                      <div className="flex items-center gap-2 font-medium text-[#18212B]">
                        <Calendar className="w-4 h-4 text-[#B6533C] shrink-0" />
                        <span>
                          {new Date(evt.startTime).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })} • {new Date(evt.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#64788A] shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Clear Button Hierarchy: Secondary (View Details) + Primary (Register / My Pass) */}
                <div
                  className="px-4 sm:px-5 py-3.5 bg-[#EAE5DB]/50 border-t border-[#B9B4AA] flex items-center justify-between gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenEvent(evt)}
                  >
                    View Details
                  </Button>

                  {myReg ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Ticket className="w-3.5 h-3.5" />}
                      onClick={() => onOpenPass(myReg, evt)}
                    >
                      My Pass
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isFull}
                      onClick={() => onOpenEvent(evt)}
                    >
                      {isFull ? 'Full' : 'Register'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
