'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventCategory } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EventDiscoveryProps {
  onOpenEvent: (event: CampusEvent) => void;
  onOpenPass: (eventId: string) => void;
}

const PRIMARY_CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Seminar',
  'Workshop',
  'Cultural',
  'Competition',
  'Sports',
  'Placement',
  'Coding',
];

const DEPARTMENTS = [
  'All Departments',
  'Department of Computer Science and Applications',
  'Faculty of Science & Academic Council',
  'Department of General and Applied Geography',
  'Department of Law',
  'Department of Physical Education & Sports',
  'Department of Commerce',
  'Department of Physics',
  'Department of Hindi',
  'Training & Placement Cell, DHSGSU',
  'University Cultural Affairs Council',
];

const VENUES = [
  'All Venues',
  'Abhimanch Sabhagar',
  'Department of Computer Science and Applications',
  'Abdul Gani Khan Stadium',
  'Jawaharlal Nehru Central Library',
  'Administrative Building',
  'Department of General and Applied Geography',
  'Department of Law',
  'Department of Commerce',
  'Department of Physics',
  'Department of Hindi',
];

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({
  onOpenEvent,
}) => {
  const { events, registrations, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'registered'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All Departments');
  const [venueFilter, setVenueFilter] = useState<string>('All Venues');
  const [dateFilter, setDateFilter] = useState<string>('');
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
      // Students should only see approved/published/ongoing/completed public events
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

      // Date Filter
      if (dateFilter) {
        const evtDateStr = new Date(evt.startTime).toISOString().split('T')[0];
        if (evtDateStr !== dateFilter) {
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
  }, [events, selectedCategory, searchQuery, availabilityFilter, departmentFilter, venueFilter, dateFilter, registeredEventIds]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 lg:pb-12">
      {/* 1. Events Page Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            PARISAR · DHSGSU
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Campus Events
          </h1>
        </div>

        <button
          onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
          className="min-h-[42px] px-3.5 py-2 rounded-[3px] bg-[#FCFAF5] border border-[#B9B4AA] text-xs font-bold text-[#18212B] shadow-[1px_1px_0_0_#18212B] flex items-center gap-2 cursor-pointer touch-manipulation"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#B6533C]" />
          <span>{showFiltersDrawer ? 'Hide Filters' : 'Filters'}</span>
        </button>
      </div>

      {/* 2. Primary Search Field + Compact Category Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search events by title, department, venue, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full min-h-[48px] pl-11 pr-4 py-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-sm sm:text-base font-medium text-[#18212B] placeholder-[#62605B] shadow-[2px_2px_0_0_#18212B] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Compact Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRIMARY_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-[3px] border transition-all whitespace-nowrap cursor-pointer touch-manipulation ${
                selectedCategory === cat
                  ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                  : 'bg-[#EAE5DB]/70 text-[#62605B] border-[#B9B4AA] hover:text-[#18212B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Additional Filters Drawer */}
      {showFiltersDrawer && (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-4 shadow-[2px_2px_0_0_#18212B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-[#18212B] block mb-1.5">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B]"
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
              Venue
            </label>
            <select
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B]"
            >
              {VENUES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#18212B] block mb-1.5">
              Event Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#18212B] block mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={availabilityFilter}
                onChange={e => setAvailabilityFilter(e.target.value as 'all' | 'open' | 'registered')}
                className="flex-1 min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-semibold text-[#18212B]"
              >
                <option value="all">All Events</option>
                <option value="open">Open Seats Only</option>
                <option value="registered">Registered Only</option>
              </select>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setAvailabilityFilter('all');
                  setDepartmentFilter('All Departments');
                  setVenueFilter('All Venues');
                  setDateFilter('');
                }}
                className="min-h-[44px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-xs font-bold text-[#18212B] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Upcoming Events Grid — Clean Single-Action Cards */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map(evt => {
            const isRegistered = registeredEventIds.has(evt._id);
            const isFull = evt.registrationCount >= evt.capacity;
            const isClosed = new Date() > new Date(evt.registrationDeadline);

            return (
              <div
                key={evt._id}
                onClick={() => onOpenEvent(evt)}
                className="group bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between cursor-pointer active:translate-y-[1px] transition-all"
              >
                <div>
                  {/* Event Image + Category + Useful Status Badge */}
                  <div className="relative h-44 w-full bg-[#EAE5DB] border-b border-[#B9B4AA] overflow-hidden">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <CategoryBadge category={evt.category} />
                    </div>

                    {(isRegistered || isFull || isClosed) && (
                      <div className="absolute top-3 right-3">
                        {isRegistered ? (
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

                  {/* Body: Event Title, Date/Time, Venue */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#18212B] group-hover:text-[#B6533C] line-clamp-2 leading-snug transition-colors">
                      {evt.title}
                    </h3>

                    <div className="space-y-1.5 text-xs sm:text-sm text-[#62605B] pt-1">
                      <div className="flex items-center gap-2 text-[#18212B] font-medium">
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

                {/* One Primary Action: View Event -> */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-[#EAE5DB] bg-[#FCFAF5] flex items-center justify-between text-sm font-bold text-[#B6533C] group-hover:bg-[#EAE5DB]/40 transition-colors">
                  <span>View Event</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center space-y-3 shadow-[2px_2px_0_0_#18212B]">
          <Calendar className="w-8 h-8 text-[#62605B] mx-auto opacity-50" />
          <h3 className="font-bold text-base text-[#18212B]">No events match your search</h3>
          <p className="text-sm text-[#62605B] max-w-md mx-auto">
            Reset your filters to view all upcoming campus events.
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
