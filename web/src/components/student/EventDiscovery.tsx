'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventCategory } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket,
  SlidersHorizontal,
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EventDiscoveryProps {
  onOpenEvent: (event: CampusEvent) => void;
  onOpenPass: (eventId: string) => void;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Workshop',
  'Seminar',
  'Cultural',
  'Competition',
  'Sports',
  'Technology',
  'Coding',
  'Entrepreneurship',
  'Academic',
  'Club',
  'Placement',
  'Other',
];

const DEPARTMENTS = [
  'All Departments',
  'Department of Computer Science & Applications (DCSA)',
  'School of Chemical & Physical Sciences',
  'Department of Technology & Engineering',
  'School of Law & Jurisprudence',
  'Department of Physical Education & Sports Board',
  'DHSGSU Innovation & Incubation Centre (IIC)',
  'University Cultural Affairs Council',
];

const VENUES = [
  'All Venues',
  'Swarna Jayanti Auditorium',
  'Turing Advanced Computing Lab (DCSA)',
  'Prof. C.V. Raman Science Lecture Theatre',
  'Gour Bhavan Senate & Conference Hall',
  'DHSGSU Sports Complex & Stadium',
  'Rabindranath Tagore Cultural Mandapam',
  'DHSGSU Innovation & Incubation Centre (IIC)',
  'Pt. Motilal Nehru Moot Court & Law Hall',
];

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({
  onOpenEvent,
  onOpenPass,
}) => {
  const { events, registrations, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'registered'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All Departments');
  const [venueFilter, setVenueFilter] = useState<string>('All Venues');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const registeredEventIds = useMemo(() => {
    return new Set(
      registrations
        .filter(r => r.userId === currentUser._id && r.status === 'CONFIRMED')
        .map(r => r.eventId)
    );
  }, [registrations, currentUser._id]);

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Students should only see approved/published public events
      if (evt.status === 'DRAFT' || evt.status === 'PENDING_REVIEW' || evt.status === 'REJECTED' || evt.status === 'CANCELLED') {
        return false;
      }

      // Category Filter (supports singular & legacy plural mapping)
      if (selectedCategory !== 'All') {
        if (evt.category !== selectedCategory && 
            !(selectedCategory === 'Workshop' && evt.category === 'Workshops') &&
            !(selectedCategory === 'Seminar' && evt.category === 'Seminars') &&
            !(selectedCategory === 'Competition' && evt.category === 'Competitions') &&
            !(selectedCategory === 'Placement' && evt.category === 'Career')) {
          return false;
        }
      }

      // Department Scope Filter
      if (departmentFilter !== 'All Departments') {
        if (evt.departmentScope && !evt.departmentScope.toLowerCase().includes(departmentFilter.toLowerCase())) {
          return false;
        }
      }

      // Venue Filter
      if (venueFilter !== 'All Venues') {
        if (!evt.venue.toLowerCase().includes(venueFilter.toLowerCase())) {
          return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesOrganizer = evt.organizerName.toLowerCase().includes(q);
        const matchesVenue = evt.venue.toLowerCase().includes(q);
        const matchesCategory = evt.category.toLowerCase().includes(q);
        const matchesTag = evt.tags.some(t => t.toLowerCase().includes(q));
        const matchesDesc = evt.description.toLowerCase().includes(q);

        if (!matchesTitle && !matchesOrganizer && !matchesVenue && !matchesCategory && !matchesTag && !matchesDesc) {
          return false;
        }
      }

      // Availability Filter
      if (availabilityFilter === 'open') {
        if (evt.registrationCount >= evt.capacity || new Date() > new Date(evt.registrationDeadline)) {
          return false;
        }
      } else if (availabilityFilter === 'registered') {
        if (!registeredEventIds.has(evt._id)) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, availabilityFilter, departmentFilter, venueFilter, registeredEventIds]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20 lg:pb-12">
      {/* 1. Events Header */}
      <div className="border-b border-[#B9B4AA] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            PARISAR • DHSGSU Events Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Campus Events
          </h1>
          <p className="text-sm text-[#62605B] mt-0.5">
            Browse verified seminars, workshops, cultural programs, and competitions across DHSGSU.
          </p>
        </div>

        <button
          onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
          className="self-start sm:self-auto min-h-[42px] px-4 py-2 rounded-[3px] bg-[#FCFAF5] border border-[#B9B4AA] text-xs font-bold text-[#18212B] shadow-[2px_2px_0_0_#18212B] flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer touch-manipulation"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#B6533C]" />
          <span>{showFiltersDrawer ? 'Hide Options' : 'More Filters'}</span>
        </button>
      </div>

      {/* 2. Search Bar (Finger-sized touch target) */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3.5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search events by title, venue, organizer, or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-medium text-[#18212B] placeholder-[#62605B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Status Quick Filter */}
        <div className="flex items-center gap-1.5 bg-[#EAE5DB] p-1 rounded-[3px] border border-[#B9B4AA] text-xs">
          <button
            onClick={() => setAvailabilityFilter('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-[2px] font-bold transition-all cursor-pointer touch-manipulation ${
              availabilityFilter === 'all' ? 'bg-[#FCFAF5] text-[#18212B] shadow-xs' : 'text-[#62605B]'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setAvailabilityFilter('open')}
            className={`min-h-[38px] px-3 py-1.5 rounded-[2px] font-bold transition-all cursor-pointer touch-manipulation ${
              availabilityFilter === 'open' ? 'bg-[#FCFAF5] text-[#2F613B] shadow-xs' : 'text-[#62605B]'
            }`}
          >
            Open Seats
          </button>
          <button
            onClick={() => setAvailabilityFilter('registered')}
            className={`min-h-[38px] px-3 py-1.5 rounded-[2px] font-bold transition-all cursor-pointer touch-manipulation ${
              availabilityFilter === 'registered' ? 'bg-[#B6533C] text-white shadow-xs' : 'text-[#62605B]'
            }`}
          >
            Registered
          </button>
        </div>
      </div>

      {/* 3. Categories (Comfortable finger-sized pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-[3px] border transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
              selectedCategory === cat
                ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Collapsible Secondary Filters (Progressive Disclosure) */}
      {showFiltersDrawer && (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div>
            <label className="text-xs font-bold text-[#18212B] block mb-1.5">
              Filter by Department / Council
            </label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#18212B] block mb-1.5">
              Filter by Campus Venue
            </label>
            <select
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {VENUES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-between gap-2">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setAvailabilityFilter('all');
                setDepartmentFilter('All Departments');
                setVenueFilter('All Venues');
              }}
              className="min-h-[44px] px-4 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB]/80 cursor-pointer touch-manipulation"
            >
              Reset Filters
            </button>
            <span className="text-xs font-mono text-[#62605B] pb-2">
              Showing <strong>{filteredEvents.length}</strong> events
            </span>
          </div>
        </div>
      )}

      {/* 4. Upcoming Events Grid (Simplified 1-2 Second Scannable Event Cards) */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map(evt => {
            const isRegistered = registeredEventIds.has(evt._id);
            const remaining = evt.capacity - evt.registrationCount;
            const isFull = remaining <= 0;

            return (
              <div
                key={evt._id}
                onClick={() => onOpenEvent(evt)}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <div>
                  {/* Event Image + Category + Registration Status */}
                  <div className="relative h-44 w-full bg-[#EAE5DB] border-b border-[#B9B4AA] overflow-hidden">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <CategoryBadge category={evt.category} />
                    </div>

                    <div className="absolute top-3 right-3">
                      {isRegistered ? (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#2F613B] text-white text-[11px] font-mono font-bold uppercase border border-[#18212B] flex items-center gap-1 shadow-xs">
                          <Ticket className="w-3 h-3" /> Registered
                        </span>
                      ) : isFull ? (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#A83226] text-white text-[11px] font-mono font-bold uppercase border border-[#18212B]">
                          Full
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#FCFAF5] text-[#18212B] text-[11px] font-mono font-bold uppercase border border-[#18212B]">
                          {remaining} Seats Open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Event Title, Date, Venue */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-base sm:text-lg text-[#18212B] line-clamp-2 leading-snug">
                      {evt.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-[#62605B]">
                      <div className="flex items-center gap-2 text-[#18212B] font-medium">
                        <Calendar className="w-4 h-4 text-[#B6533C] shrink-0" />
                        <span>
                          {new Date(evt.startTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <Clock className="w-4 h-4 text-[#64788A] shrink-0" />
                        <span>
                          {new Date(evt.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[#18212B] font-medium">
                        <MapPin className="w-4 h-4 text-[#B6533C] shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Primary vs Secondary Button Hierarchy */}
                <div
                  className="p-4 pt-3 border-t border-[#EAE5DB] bg-[#FCFAF5] flex items-center gap-2.5"
                  onClick={e => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onOpenEvent(evt)}
                  >
                    View Details
                  </Button>

                  {isRegistered ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      leftIcon={<Ticket className="w-4 h-4" />}
                      onClick={() => onOpenPass(evt._id)}
                    >
                      My Pass
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
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
      ) : (
        <div className="p-10 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center space-y-3 shadow-[2px_2px_0_0_#18212B]">
          <Calendar className="w-8 h-8 text-[#62605B] mx-auto opacity-50" />
          <h3 className="font-bold text-base text-[#18212B]">No campus events match your search</h3>
          <p className="text-sm text-[#62605B] max-w-md mx-auto">
            Reset your filters to view all upcoming events across Dr. Harisingh Gour Vishwavidyalaya.
          </p>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setAvailabilityFilter('all');
              setDepartmentFilter('All Departments');
              setVenueFilter('All Venues');
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};
