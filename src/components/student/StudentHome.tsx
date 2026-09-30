'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Ticket
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';

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
  const [selectedPill, setSelectedPill] = useState<'All' | 'Seminar' | 'Workshop' | 'Cultural' | 'Competition'>('All');

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

  // Filter upcoming events by search and compact category pill
  const displayedEvents = publishedEvents
    .filter(evt => {
      if (selectedPill !== 'All') {
        const catMatch =
          evt.category === selectedPill ||
          (selectedPill === 'Seminar' && evt.category === 'Seminars') ||
          (selectedPill === 'Workshop' && evt.category === 'Workshops') ||
          (selectedPill === 'Competition' && evt.category === 'Competitions');
        if (!catMatch) return false;
      }

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
      {/* 1. Greeting + Supporting Text + ONE Primary Search Field */}
      <section className="space-y-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            PARISAR · DHSGSU
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm sm:text-base text-[#62605B]">
            Find something happening on campus.
          </p>
        </div>

        {/* Single Clean Search Input */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#62605B]" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-sm sm:text-base font-medium text-[#18212B] placeholder-[#62605B] shadow-[2px_2px_0_0_#18212B] focus:outline-none focus:border-[#18212B] transition-all"
            />
          </div>

          {/* Optional Compact Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['All', 'Seminar', 'Workshop', 'Cultural', 'Competition'] as const).map(pill => (
              <button
                key={pill}
                onClick={() => setSelectedPill(pill)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-[3px] text-xs font-bold border transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
                  selectedPill === pill
                    ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                    : 'bg-[#EAE5DB]/70 text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. YOUR NEXT EVENT (Compact card when student has a registered upcoming event) */}
      {nextRegisteredReg && nextRegisteredEvent && (
        <section className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#62605B]">
            YOUR NEXT EVENT
          </div>

          <div
            onClick={() => onOpenPass(nextRegisteredReg, nextRegisteredEvent)}
            className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[3px_3px_0_0_#18212B] rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer active:translate-y-[1px] transition-all"
          >
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-[#18212B] leading-snug">
                {nextRegisteredEvent.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#62605B]">
                <span className="font-medium text-[#18212B]">
                  {new Date(nextRegisteredEvent.startTime).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })} · {new Date(nextRegisteredEvent.startTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span>·</span>
                <span>{nextRegisteredEvent.venue}</span>
              </div>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                onOpenPass(nextRegisteredReg, nextRegisteredEvent);
              }}
              className="self-start sm:self-center min-h-[42px] px-4 py-2 rounded-[3px] bg-[#B6533C] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer touch-manipulation shrink-0"
            >
              <Ticket className="w-4 h-4" />
              <span>View Pass →</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. UPCOMING EVENTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#18212B]">
            Upcoming Events
          </h2>
          <button
            onClick={onNavigateToEvents}
            className="min-h-[40px] px-3 py-1.5 text-sm font-bold text-[#B6533C] hover:text-[#18212B] flex items-center gap-1 cursor-pointer touch-manipulation"
          >
            <span>See all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEvents.map(evt => {
            const myReg = userConfirmedRegs.find(r => r.eventId === evt._id);
            const isFull = evt.registrationCount >= evt.capacity;
            const isClosed = new Date() > new Date(evt.registrationDeadline);

            return (
              <div
                key={evt._id}
                onClick={() => onOpenEvent(evt)}
                className="group bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between cursor-pointer active:translate-y-[1px] transition-all"
              >
                {/* Event Image + Category + Useful Status Badge */}
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
                    {(myReg || isFull || isClosed) && (
                      <div className="absolute top-3 right-3">
                        {myReg ? (
                          <span className="px-2.5 py-1 rounded-[2px] bg-[#2F613B] text-white text-[11px] font-bold shadow-sm">
                            Registered
                          </span>
                        ) : isClosed ? (
                          <span className="px-2.5 py-1 rounded-[2px] bg-[#18212B] text-white text-[11px] font-bold shadow-sm">
                            Closed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-[2px] bg-[#A83226] text-white text-[11px] font-bold shadow-sm">
                            Full
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Title, Date/Time, Venue */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#18212B] group-hover:text-[#B6533C] leading-snug line-clamp-2 transition-colors">
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
                          })} · {new Date(evt.startTime).toLocaleTimeString([], {
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

                {/* ONE Primary Action on Card: View Event -> */}
                <div className="px-4 sm:px-5 py-3.5 bg-[#FCFAF5] border-t border-[#EAE5DB] flex items-center justify-between text-sm font-bold text-[#B6533C] group-hover:bg-[#EAE5DB]/40 transition-colors">
                  <span>View Event</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
