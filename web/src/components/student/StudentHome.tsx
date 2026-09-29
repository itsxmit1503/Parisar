'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, Registration } from '../../types';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Ticket, 
  Sparkles, 
  Award, 
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Users,
  Compass,
  Activity
} from 'lucide-react';
import { Badge, CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ParisarLogo } from '../ui/ParisarLogo';

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
  onNavigateToPassport,
  onNavigateToMap,
  onOpenApkModal,
}) => {
  const { 
    currentUser, 
    events, 
    registrations, 
    getRecommendedEvents, 
    getStudentPassportStats,
    notifications 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const userConfirmedRegs = registrations.filter(
    r => r.userId === currentUser._id && r.status === 'CONFIRMED'
  );

  const todayDateStr = '2026-09-30';
  const todaysEvents = events.filter(e => e.startTime.startsWith(todayDateStr) && e.status === 'PUBLISHED');
  const featuredEvent = todaysEvents[0] || events.find(e => e.status === 'PUBLISHED') || events[0];
  const userRegForFeatured = userConfirmedRegs.find(r => r.eventId === featuredEvent?._id);

  const otherTodaysEvents = todaysEvents.filter(e => e._id !== featuredEvent?._id);
  const recommendedEvents = getRecommendedEvents();
  const upcomingEvents = events
    .filter(e => !e.startTime.startsWith(todayDateStr) && e.status === 'PUBLISHED')
    .slice(0, 3);
  const recentlyAddedEvents = [...events].reverse().slice(0, 3);

  const passportStats = getStudentPassportStats();
  const latestNotif = notifications.find(n => n.userId === currentUser._id && !n.read);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* 1. Refined Identity Header: PARISAR & DHSGSU */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#B9B4AA] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                PARISAR • DHSGSU
              </span>
              <span className="text-[10px] font-mono text-[#62605B]">
                • Dr. Harisingh Gour Vishwavidyalaya
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18212B] tracking-tight">
              Good morning, {currentUser.name.split(' ')[0]}.
            </h1>
            <p className="text-sm text-[#62605B] font-medium">
              Discover what&apos;s happening across DHSGSU. Your campus, events, and community in one place.
            </p>
          </div>

          {/* Quick Ticket Pill if active pass for today */}
          {userRegForFeatured && featuredEvent && (
            <div className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[3px_3px_0_0_#18212B] rounded-[4px] p-2.5 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-[2px] bg-[#B6533C] text-white flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#18212B] text-[11px] uppercase tracking-wider">Pass Ready</div>
                <div className="text-[#62605B] font-mono text-[11px]">{userRegForFeatured.qrToken}</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenPass(userRegForFeatured, featuredEvent)}
              >
                Open Pass
              </Button>
            </div>
          )}
        </div>

        {/* 2. Inset / Embossed Search Experience */}
        <div className="bg-[#EAE5DB] border border-[#B9B4AA] p-2 rounded-[4px] shadow-[inset_0_1px_3px_rgba(24,33,43,0.08)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62605B]" />
            <input
              type="text"
              placeholder="Search events across DHSGSU (e.g. Workshop, Hackathon, Swarna Jayanti)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onNavigateToEvents();
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-xs font-medium text-[#18212B] placeholder-[#62605B] shadow-inner focus:outline-none focus:border-[#18212B] transition-all"
            />
          </div>
          <Button variant="primary" size="md" onClick={onNavigateToEvents}>
            Search Events
          </Button>
        </div>

        {/* Priority Campus Notice Banner */}
        {latestNotif && (
          <div className="p-3 bg-[#FCFAF5] border-l-4 border-l-[#B6533C] border border-[#B9B4AA] rounded-[3px] shadow-[0_1px_2px_rgba(24,33,43,0.04)] text-xs flex items-start gap-2.5 text-[#18212B]">
            <AlertCircle className="w-4 h-4 text-[#B6533C] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-[#18212B]">{latestNotif.title}: </strong>
              <span className="text-[#62605B]">{latestNotif.message}</span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Featured Event (Strong Editorial Visual Anchor) */}
      {featuredEvent && (
        <section className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#B6533C] rounded-[1px]"></span>
            <span>Featured Event at DHSGSU</span>
          </div>

          <div className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[4px_4px_0_0_#18212B] rounded-[4px] overflow-hidden flex flex-col md:flex-row">
            {/* Visual Cover - Authentic Category Photography */}
            <div className="md:w-5/12 h-56 md:h-auto bg-[#EAE5DB] relative border-b md:border-b-0 md:border-r border-[#18212B] overflow-hidden">
              <img
                src={featuredEvent.coverImage}
                alt={featuredEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <CategoryBadge category={featuredEvent.category} />
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#18212B] text-[#FCFAF5]">
                  Today • Patharia Hills
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="md:w-7/12 p-6 flex flex-col justify-between">
              <div>
                <h3 
                  onClick={() => onOpenEvent(featuredEvent)}
                  className="text-xl sm:text-2xl font-extrabold text-[#18212B] hover:text-[#B6533C] cursor-pointer leading-snug tracking-tight transition-colors"
                >
                  {featuredEvent.title}
                </h3>
                <p className="text-xs text-[#62605B] mt-2 line-clamp-3 leading-relaxed">
                  {featuredEvent.description}
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-b border-[#B9B4AA] py-2.5 bg-[#EAE5DB]/40 px-2 rounded-[2px]">
                  <div className="flex items-center gap-2 text-[#18212B]">
                    <Clock className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                    <span className="font-semibold">
                      {new Date(featuredEvent.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(featuredEvent.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#18212B]">
                    <MapPin className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                    <span className="font-semibold line-clamp-1">{featuredEvent.venue}</span>
                  </div>
                </div>
              </div>

              {/* Action Strip */}
              <div className="mt-5 pt-2 flex items-center justify-between gap-3">
                <div className="text-xs text-[#62605B]">
                  <strong className="text-[#18212B] font-bold">{featuredEvent.capacity - featuredEvent.registrationCount}</strong> seats remaining
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenEvent(featuredEvent)}
                  >
                    View Details
                  </Button>
                  {userRegForFeatured ? (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Ticket className="w-3.5 h-3.5" />}
                      onClick={() => onOpenPass(userRegForFeatured, featuredEvent)}
                    >
                      Show Pass
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenEvent(featuredEvent)}
                    >
                      Register Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Happening Today (Horizontal Event Rows) */}
      {otherTodaysEvents.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Happening Today on Campus</span>
            </h2>
          </div>

          <div className="space-y-3">
            {otherTodaysEvents.map(evt => (
              <div
                key={evt._id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-4 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-[1px] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={evt.category} />
                    <span className="text-[11px] text-[#62605B] font-medium">
                      {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • {evt.venue}
                    </span>
                  </div>
                  <h4 
                    onClick={() => onOpenEvent(evt)}
                    className="text-sm font-bold text-[#18212B] hover:text-[#B6533C] cursor-pointer"
                  >
                    {evt.title}
                  </h4>
                  <p className="text-xs text-[#62605B] line-clamp-1">{evt.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onOpenEvent(evt)}>
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Recommended For You (Explainable rule-based: Picked for you based on Department & Interests) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Recommended For You</span>
            </h2>
            <p className="text-[11px] text-[#62605B] mt-0.5">
              Picked for you based on your enrollment in <span className="font-semibold text-[#18212B]">{currentUser.department}</span> and interests in <span className="font-semibold text-[#18212B]">{currentUser.interests.join(', ')}</span>.
            </p>
          </div>
          <button
            onClick={onNavigateToEvents}
            className="text-xs font-bold text-[#18212B] hover:text-[#B6533C] flex items-center gap-1 group cursor-pointer"
          >
            <span>All DHSGSU Events</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedEvents.map(evt => (
            <div
              key={evt._id}
              className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col justify-between hover:-translate-y-[1px] transition-all"
            >
              <div className="h-34 w-full bg-[#EAE5DB] relative border-b border-[#B9B4AA]">
                <img
                  src={evt.coverImage}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <CategoryBadge category={evt.category} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h4 
                    onClick={() => onOpenEvent(evt)}
                    className="font-bold text-sm text-[#18212B] hover:text-[#B6533C] cursor-pointer line-clamp-2 leading-snug"
                  >
                    {evt.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#62605B]">
                    <MapPin className="w-3 h-3 text-[#64788A] shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#B9B4AA] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#62605B]">
                    {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => onOpenEvent(evt)}>
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Upcoming Events (Section 8) */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B08A4A]" />
                <span>Upcoming Events Across DHSGSU</span>
              </h2>
              <p className="text-[11px] text-[#62605B] mt-0.5">
                Competitions, seminars, and placement sessions scheduled for this month on Patharia Hills.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToEvents}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map(evt => (
              <div
                key={evt._id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] p-4 flex flex-col justify-between space-y-3 hover:-translate-y-[1px] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={evt.category} />
                    <span className="text-[11px] font-mono font-bold text-[#B08A4A]">
                      {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4
                    onClick={() => onOpenEvent(evt)}
                    className="font-bold text-sm text-[#18212B] hover:text-[#B6533C] cursor-pointer line-clamp-2"
                  >
                    {evt.title}
                  </h4>
                  <div className="text-[11px] text-[#62605B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#64788A]" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#B9B4AA] flex items-center justify-between">
                  <span className="text-[11px] text-[#62605B]">
                    {evt.registrationCount} / {evt.capacity} registered
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => onOpenEvent(evt)}>
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Campus Activity (Archival Participation Ledger) */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 shadow-[3px_3px_0_0_#18212B] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B9B4AA] pb-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08A4A]">
              DHSGSU Event Passport
            </div>
            <h2 className="text-base font-bold text-[#18212B]">
              Your Official Campus Participation Record
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Compass className="w-3.5 h-3.5 text-[#B08A4A]" />}
            onClick={onNavigateToPassport}
          >
            Open Event Passport
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.04)]">
            <div className="text-2xl font-mono font-extrabold text-[#18212B]">{passportStats.totalAttended}</div>
            <div className="text-[10px] font-bold text-[#62605B] uppercase tracking-wider mt-0.5">Events Attended</div>
          </div>
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.04)]">
            <div className="text-2xl font-mono font-extrabold text-[#B08A4A]">{passportStats.certificatesEarned}</div>
            <div className="text-[10px] font-bold text-[#62605B] uppercase tracking-wider mt-0.5">Certificates</div>
          </div>
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.04)]">
            <div className="text-2xl font-mono font-extrabold text-[#18212B]">{passportStats.totalHours} hrs</div>
            <div className="text-[10px] font-bold text-[#62605B] uppercase tracking-wider mt-0.5">Lab & Hall Hours</div>
          </div>
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.04)]">
            <div className="text-2xl font-mono font-extrabold text-[#B6533C]">{passportStats.achievements.length}</div>
            <div className="text-[10px] font-bold text-[#62605B] uppercase tracking-wider mt-0.5">Campus Honors</div>
          </div>
        </div>
      </section>

      {/* 8. Android Companion Banner */}
      <section className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-[3px] bg-[#18212B] text-white flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#B6533C]">
            <Smartphone className="w-5 h-5 text-[#FCFAF5]" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#18212B]">PARISAR for Android</h4>
            <p className="text-xs text-[#62605B]">High-speed optical QR check-in & offline event passes for DHSGSU students.</p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenApkModal}
        >
          Download APK (42.8 MB)
        </Button>
      </section>
    </div>
  );
};
