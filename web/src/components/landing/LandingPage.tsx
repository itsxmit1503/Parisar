'use client';

import React from 'react';
import { 
  Compass, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Sparkles, 
  MapPin, 
  Calendar,
  Download,
  Building2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { CampusEvent } from '../../types';

interface LandingPageProps {
  onEnterApp: () => void;
  onExploreEvents: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onOpenEvent: (event: CampusEvent) => void;
  onOpenApkModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onExploreEvents,
  onOpenEvent,
  onOpenApkModal
}) => {
  const { events, isAuthenticated, currentUser } = useApp();

  // Filter 4 featured upcoming events
  const featuredEvents = events
    .filter(e => e.status === 'PUBLISHED' || e.status === 'APPROVED')
    .slice(0, 4);

  return (
    <div className="space-y-14 sm:space-y-20 pb-16">
      {/* HERO SECTION: Clear, Uncluttered First-Time Experience */}
      <section className="relative pt-4 sm:pt-8">
        <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-12 shadow-[4px_4px_0_0_#18212B] relative overflow-hidden">
          {/* Subtle Institutional Watermark */}
          <div className="absolute top-6 right-8 opacity-5 pointer-events-none select-none hidden lg:block text-right">
            <span className="font-serif text-8xl font-black text-[#18212B]">DHSGSU</span>
            <div className="text-lg font-bold tracking-widest text-[#18212B]">ESTD. 1946 • SAGAR</div>
          </div>

          <div className="max-w-2xl space-y-6 relative z-10">
            {/* Subtle DHSGSU Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#18212B] text-xs font-mono font-bold tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Built for DHSGSU · Dr. Harisingh Gour Vishwavidyalaya</span>
            </div>

            {/* Product Identity */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-4xl sm:text-6xl font-black text-[#18212B] tracking-tight uppercase font-serif">
                  PARISAR
                </h1>
                <span className="text-2xl sm:text-4xl font-bold text-[#B6533C] font-sans">
                  परिसर
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-[#18212B] tracking-tight">
                Your Campus. Your Events. Your Community.
              </p>
            </div>

            {/* Clear Supporting Statement */}
            <p className="text-[#62605B] text-base sm:text-lg leading-relaxed">
              Discover what&apos;s happening across campus — register for seminars, workshops, cultural programs, and competitions with your official university pass.
            </p>

            {/* Primary & Secondary CTAs Only (No competing third/fourth buttons) */}
            <div className="pt-1 flex flex-wrap items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onEnterApp}
                className="text-base px-7"
              >
                {isAuthenticated ? `Enter ${currentUser.role.toUpperCase()} Panel` : 'Enter PARISAR'}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Compass className="w-4 h-4 text-[#B6533C]" />}
                onClick={onExploreEvents}
                className="text-base px-6"
              >
                Explore Events
              </Button>
            </div>

            {/* Quiet Secondary Android App Link */}
            <div className="pt-2 flex items-center gap-4 text-xs text-[#62605B]">
              <button
                onClick={onOpenApkModal}
                className="inline-flex items-center gap-1.5 font-semibold text-[#62605B] hover:text-[#18212B] underline underline-offset-4 cursor-pointer touch-manipulation py-1"
              >
                <Download className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>Download Official Android App (APK)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING CAMPUS EVENTS PREVIEW */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#18212B]">
              Upcoming Events
            </h2>
            <p className="text-sm text-[#62605B]">
              Happening soon across DHSGSU departments and auditoriums.
            </p>
          </div>
          <button 
            onClick={onExploreEvents}
            className="min-h-[40px] px-3 py-1.5 text-sm font-bold text-[#B6533C] hover:text-[#18212B] flex items-center gap-1 cursor-pointer touch-manipulation"
          >
            <span>See all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredEvents.map(event => (
            <div 
              key={event._id}
              onClick={() => onOpenEvent(event)}
              className="group cursor-pointer bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] overflow-hidden shadow-[2px_2px_0_0_#18212B] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-40 relative overflow-hidden bg-[#EAE5DB] border-b border-[#B9B4AA]">
                  <img 
                    src={event.coverImage} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 bg-[#FCFAF5] border border-[#18212B] text-[11px] font-mono font-bold text-[#18212B] uppercase">
                      {event.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <h3 className="font-bold text-base text-[#18212B] group-hover:text-[#B6533C] line-clamp-2 leading-snug">
                    {event.title}
                  </h3>

                  <div className="space-y-1 text-xs text-[#62605B]">
                    <div className="flex items-center gap-1.5 text-[#18212B] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                      <span>
                        {new Date(event.startTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })} • {new Date(event.startTime).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#64788A] shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-[#EAE5DB] bg-[#FCFAF5] flex items-center justify-between text-xs font-bold text-[#B6533C]">
                <span>View Event</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 CORE CAMPUS PILLARS (Clean & Scannable) */}
      <section className="space-y-5">
        <div className="border-b border-[#B9B4AA] pb-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18212B]">
            Campus Event Categories
          </h2>
          <p className="text-sm text-[#62605B]">
            Four core categories across Dr. Harisingh Gour Vishwavidyalaya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] space-y-2">
            <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#B6533C]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">Seminars</h3>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Academic lectures, research colloquiums, and departmental symposiums.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] space-y-2">
            <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#B08A4A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">Workshops</h3>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Hands-on computing labs, technical training, and skill clinics.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] space-y-2">
            <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#64788A]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">Cultural Events</h3>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Bundeli Lok Utsav, music, theatre, literary meets, and youth festivals.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] shadow-[2px_2px_0_0_#18212B] space-y-2">
            <div className="w-9 h-9 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#2F613B]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">Competitions</h3>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed">
              Hackathons, moot courts, debates, quizzes, and university sports.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
