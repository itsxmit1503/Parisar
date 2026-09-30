'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, EventCategory } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  Filter, 
  Ticket,
  SlidersHorizontal,
  Building
} from 'lucide-react';
import { CategoryBadge, EventStatusBadge } from '../ui/Badge';
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
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'registered' | 'almost-full'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');
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
      // Students should only see approved/published public events (Section 15)
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
      } else if (availabilityFilter === 'almost-full') {
        const ratio = evt.registrationCount / evt.capacity;
        if (ratio < 0.75 || ratio >= 1) return false;
      }

      // Date Filter
      if (dateFilter === 'today') {
        const todayStr = '2026-09-30';
        if (!evt.startTime.startsWith(todayStr)) return false;
      } else if (dateFilter === 'upcoming') {
        if (new Date(evt.startTime) < new Date('2026-09-30T00:00:00Z')) return false;
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, availabilityFilter, dateFilter, departmentFilter, venueFilter, registeredEventIds]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Title */}
      <div className="border-b border-[#B9B4AA] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            PARISAR • DHSGSU Events Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Discover Campus Events
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Explore workshops, national symposiums, hackathons, and cultural gatherings across Dr. Harisingh Gour Vishwavidyalaya.
          </p>
        </div>

        <button
          onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-[3px] bg-[#FCFAF5] border border-[#B9B4AA] text-xs font-bold text-[#18212B] shadow-[2px_2px_0_0_#18212B] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B6533C]" />
          <span>{showFiltersDrawer ? 'Hide Filters' : 'Advanced Filters'}</span>
        </button>
      </div>

      {/* Category Tabs - Tactile Physical Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-[3px] border transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Search Bar & Quick Toggles */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3.5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search by topic, speaker, laboratory, or tag (e.g., PyTorch, Swarna Jayanti, Moot Court)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] placeholder-[#62605B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Date & Availability Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Segment */}
          <div className="flex items-center gap-1 bg-[#EAE5DB] p-1 rounded-[2px] border border-[#B9B4AA] text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${dateFilter === 'all' ? 'bg-[#FCFAF5] text-[#18212B] shadow-xs' : 'text-[#62605B]'}`}
            >
              All Dates
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${dateFilter === 'today' ? 'bg-[#B6533C] text-white shadow-xs' : 'text-[#62605B]'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${dateFilter === 'upcoming' ? 'bg-[#FCFAF5] text-[#18212B] shadow-xs' : 'text-[#62605B]'}`}
            >
              Upcoming
            </button>
          </div>

          {/* Status Segment */}
          <div className="flex items-center gap-1 bg-[#EAE5DB] p-1 rounded-[2px] border border-[#B9B4AA] text-xs">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${availabilityFilter === 'all' ? 'bg-[#FCFAF5] text-[#18212B] shadow-xs' : 'text-[#62605B]'}`}
            >
              All
            </button>
            <button
              onClick={() => setAvailabilityFilter('open')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${availabilityFilter === 'open' ? 'bg-[#FCFAF5] text-[#2F613B] shadow-xs' : 'text-[#62605B]'}`}
            >
              Open
            </button>
            <button
              onClick={() => setAvailabilityFilter('registered')}
              className={`px-2 py-0.5 rounded-[2px] font-bold ${availabilityFilter === 'registered' ? 'bg-[#B6533C] text-white shadow-xs' : 'text-[#62605B]'}`}
            >
              My Passes
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Dropdown Filters Drawer (Department, Venue, Almost Full) */}
      {showFiltersDrawer && (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B] block mb-1">
              Filter by Department / Council
            </label>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B] block mb-1">
              Filter by Campus Venue
            </label>
            <select
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
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
                setDateFilter('all');
                setDepartmentFilter('All Departments');
                setVenueFilter('All Venues');
              }}
              className="px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-bold text-[#62605B] hover:text-[#18212B] hover:bg-[#EAE5DB]/80 cursor-pointer"
            >
              Reset All Filters
            </button>
            <span className="text-xs font-mono text-[#62605B]">
              Showing <strong>{filteredEvents.length}</strong> events
            </span>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map(evt => {
            const isRegistered = registeredEventIds.has(evt._id);
            const remaining = evt.capacity - evt.registrationCount;
            const capPercent = Math.min(100, Math.round((evt.registrationCount / evt.capacity) * 100));

            return (
              <div
                key={evt._id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between hover:-translate-y-[1px] transition-all"
              >
                <div>
                  {/* Category Image Cover */}
                  <div className="relative h-44 w-full bg-[#EAE5DB] border-b border-[#B9B4AA] overflow-hidden">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <CategoryBadge category={evt.category} />
                      <EventStatusBadge status={evt.status} />
                    </div>

                    {isRegistered && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-[2px] bg-[#B6533C] text-white text-[10px] font-mono font-bold tracking-wider uppercase border border-[#18212B] flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span>Registered</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 
                      onClick={() => onOpenEvent(evt)}
                      className="font-bold text-base text-[#18212B] hover:text-[#B6533C] cursor-pointer line-clamp-2 leading-snug tracking-tight"
                    >
                      {evt.title}
                    </h3>

                    <p className="text-xs text-[#62605B] line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="space-y-1.5 pt-1.5 text-xs text-[#62605B]">
                      <div className="flex items-center gap-2 text-[#18212B]">
                        <Calendar className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                        <span className="font-mono text-[11px] font-semibold">
                          {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-[#64788A] shrink-0" />
                        <span className="font-mono text-[11px]">
                          {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                        <span className="truncate font-semibold text-[#18212B]">{evt.venue}</span>
                      </div>

                      <div className="text-[11px] text-[#62605B]">
                        Organizer: <strong className="text-[#18212B]">{evt.organizerName}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Strip with Capacity Indicator & Actions */}
                <div className="p-4 pt-2 border-t border-[#B9B4AA] bg-[#FCFAF5] space-y-3">
                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#62605B]">
                      <span>DHSGSU Allocation</span>
                      <span className="font-bold text-[#18212B]">
                        {evt.registrationCount} / {evt.capacity} seats ({capPercent}%)
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

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenEvent(evt)}
                    >
                      Details
                    </Button>

                    {isRegistered ? (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Ticket className="w-3.5 h-3.5" />}
                        onClick={() => onOpenPass(evt._id)}
                      >
                        View Pass
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={remaining <= 0}
                        onClick={() => onOpenEvent(evt)}
                      >
                        {remaining <= 0 ? 'Full' : 'Register'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] text-center space-y-3 shadow-[2px_2px_0_0_#18212B]">
          <Calendar className="w-8 h-8 text-[#62605B] mx-auto opacity-50" />
          <h3 className="font-bold text-base text-[#18212B]">No campus events match your active filters</h3>
          <p className="text-xs text-[#62605B] max-w-md mx-auto">
            Try resetting your department or category filters to discover upcoming sessions across Dr. Harisingh Gour Vishwavidyalaya.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setAvailabilityFilter('all');
              setDateFilter('all');
              setDepartmentFilter('All Departments');
              setVenueFilter('All Venues');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
