'use client';

import React from 'react';
import { 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  Calendar, 
  Users, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Sparkles, 
  MapPin, 
  Clock,
  Download,
  Building2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ParisarLogo } from '../ui/ParisarLogo';
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
  onLogin,
  onSignup,
  onOpenEvent,
  onOpenApkModal
}) => {
  const { events, isAuthenticated, currentUser } = useApp();

  // Filter 4 featured events representing the 4 core pillars
  const featuredEvents = events
    .filter(e => e.status === 'PUBLISHED' || e.status === 'APPROVED')
    .slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-12">
        <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-12 shadow-[4px_4px_0_0_#18212B] relative overflow-hidden">
          {/* Subtle Institutional Watermark */}
          <div className="absolute top-4 right-6 opacity-5 pointer-events-none select-none hidden lg:block text-right">
            <span className="font-serif text-8xl font-black text-[#18212B]">DHSGSU</span>
            <div className="text-xl font-bold tracking-widest text-[#18212B]">ESTD. 1946 • SAGAR</div>
          </div>

          <div className="max-w-3xl space-y-6 relative z-10">
            {/* University Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#B6533C] text-xs font-mono font-bold uppercase tracking-wider shadow-[1px_1px_0_0_#18212B]">
              <Building2 className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Dr. Harisingh Gour Vishwavidyalaya • Central University</span>
            </div>

            {/* Product Identity & Wordmark */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black text-[#18212B] tracking-tight uppercase font-serif">
                PARISAR <span className="text-[#B6533C] font-normal text-3xl sm:text-5xl font-sans">(परिसर)</span>
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-[#B6533C] tracking-tight">
                Your Campus. Your Events. Your Community.
              </p>
            </div>

            {/* Value Proposition */}
            <p className="text-[#62605B] text-base sm:text-lg leading-relaxed max-w-2xl font-sans">
              Discover, register and participate in events happening across DHSGSU. 
              The dedicated digital campus platform built exclusively for Dr. Harisingh Gour Vishwavidyalaya, Sagar, Madhya Pradesh.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onEnterApp}
                className="text-base px-8 py-3.5"
              >
                {isAuthenticated ? `Enter ${currentUser.role.toUpperCase()} Panel` : 'Enter PARISAR'}
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onSignup}
                  className="text-base px-6 py-3.5"
                >
                  Create Account
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Compass className="w-4 h-4" />}
                onClick={onExploreEvents}
                className="text-base px-6 py-3.5"
              >
                Explore Events
              </Button>
              <Button
                variant="ghost"
                size="lg"
                leftIcon={<Download className="w-4 h-4 text-[#B6533C]" />}
                onClick={onOpenApkModal}
                className="text-sm px-4 py-3.5 border border-[#B9B4AA]"
              >
                Android App (APK)
              </Button>
            </div>

            {/* Verified Campus Stats Bar */}
            <div className="pt-6 border-t border-[#B9B4AA]/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[#62605B]">CAMPUS LOCATION</span>
                <div className="text-sm font-bold text-[#18212B]">Patharia Hills, Sagar</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">AUTHORITY</span>
                <div className="text-sm font-bold text-[#18212B]">DSW Verified</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">ARCHITECTURE</span>
                <div className="text-sm font-bold text-[#18212B]">Role-Separated Panels</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">CHECK-IN</span>
                <div className="text-sm font-bold text-[#18212B]">Optical QR Pass</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAMPUS ACCESS & ROLES OVERVIEW (Non-clickable informational overview + Auth CTA) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#B9B4AA] pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">Role-Based Campus Governance</span>
            <h2 className="text-2xl font-bold text-[#18212B]">Dedicated Interfaces for the DHSGSU Community</h2>
          </div>
          {!isAuthenticated && (
            <button
              onClick={onLogin}
              className="text-xs font-mono font-bold text-[#B6533C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#18212B] uppercase">
                  1. Student
                </span>
                <span className="text-xs font-mono text-[#2F613B] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Campus Participant
                </span>
              </div>
              <h3 className="font-bold text-lg text-[#18212B]">
                Discover & Participate
              </h3>
              <p className="text-xs text-[#62605B] mt-2 leading-relaxed">
                Browse approved seminars, workshops, cultural events, and competitions. Register with your roll number and carry your digital QR event pass.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/40 text-[11px] font-mono text-[#62605B]">
              Navigation: Home • Events • My Events • My Pass • Profile
            </div>
          </div>

          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#B08A4A] uppercase">
                  2. Organizer
                </span>
                <span className="text-xs font-mono text-[#B08A4A] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Requires Verification
                </span>
              </div>
              <h3 className="font-bold text-lg text-[#18212B]">
                Convene University Events
              </h3>
              <p className="text-xs text-[#62605B] mt-2 leading-relaxed">
                Verified faculty conveners and student leads submit event proposals, manage participant rosters, and operate the optical QR attendance turnstile.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/40 text-[11px] font-mono text-[#62605B]">
              Verified Access: Dashboard • My Events • Create • Participants • Attendance
            </div>
          </div>

          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#B6533C] uppercase">
                  3. Administrator
                </span>
                <span className="text-xs font-mono text-[#B6533C] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> DSW Authority
                </span>
              </div>
              <h3 className="font-bold text-lg text-[#18212B]">
                Institutional Oversight
              </h3>
              <p className="text-xs text-[#62605B] mt-2 leading-relaxed">
                Pre-authorized university administrators vet organizer credential requests, authorize official event submissions, and audit campus-wide participation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/40 text-[11px] font-mono text-[#62605B]">
              Controlled Portal: Organizer Requests • Events • Participants • Attendance
            </div>
          </div>
        </div>
      </section>

      {/* 4 CORE EVENT CATEGORIES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#B9B4AA] pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">Required Core Pillars</span>
            <h2 className="text-2xl font-bold text-[#18212B]">Four Pillars of DHSGSU Campus Life</h2>
          </div>
          <span className="text-xs font-mono text-[#62605B]">Non-Negotiable University Categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] space-y-2.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#B6533C] shadow-[1px_1px_0_0_#18212B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">1. Seminars</h3>
            <p className="text-xs text-[#62605B] leading-relaxed">
              Founders memorial conferences, national research symposiums, and visiting academic lectures across faculties.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] space-y-2.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#B08A4A] shadow-[1px_1px_0_0_#18212B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">2. Workshops</h3>
            <p className="text-xs text-[#62605B] leading-relaxed">
              Practical computing studios, hands-on scientific instrumentation, GIS drone mapping, and laboratory clinics.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] space-y-2.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#64788A] shadow-[1px_1px_0_0_#18212B]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">3. Cultural Events</h3>
            <p className="text-xs text-[#62605B] leading-relaxed">
              Bundeli Lok Utsav, traditional theatrical drama, folk music, youth festival assemblies, and literary meets.
            </p>
          </div>

          <div className="p-5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] space-y-2.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#EAE5DB] border border-[#B9B4AA] flex items-center justify-center text-[#2F613B] shadow-[1px_1px_0_0_#18212B]">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#18212B]">4. Competitions</h3>
            <p className="text-xs text-[#62605B] leading-relaxed">
              CodeSprint hackathons, Pt. Motilal Nehru Moot Courts, parliamentary debates, and stadium athletics championships.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED UPCOMING CAMPUS EVENTS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#B9B4AA] pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">Campus Schedule</span>
            <h2 className="text-2xl font-bold text-[#18212B]">Featured University Events</h2>
          </div>
          <button 
            onClick={onExploreEvents}
            className="text-xs font-bold font-mono text-[#B6533C] hover:underline flex items-center gap-1"
          >
            <span>View All Campus Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredEvents.map(event => (
            <div 
              key={event._id}
              onClick={() => onOpenEvent(event)}
              className="group cursor-pointer bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B] hover:shadow-[4px_4px_0_0_#18212B] hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="h-36 relative overflow-hidden bg-[#EAE5DB]">
                <img 
                  src={event.coverImage} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-[#FCFAF5] border border-[#B9B4AA] text-[10px] font-mono font-bold text-[#18212B] uppercase shadow-[1px_1px_0_0_#18212B]">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#18212B] group-hover:text-[#B6533C] line-clamp-2 transition-colors">
                    {event.title}
                  </h4>
                  <div className="text-[11px] text-[#62605B] flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#B9B4AA]/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#62605B] flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{event.registrationCount}/{event.capacity} seats</span>
                  </span>
                  <span className="text-[#B6533C] font-bold group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW PARISAR WORKS: THE VERIFICATION & TRUST CYCLE */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-10 shadow-[3px_3px_0_0_#18212B] space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">Institutional Integrity</span>
          <h2 className="text-2xl font-bold text-[#18212B]">Built for Trust: The DHSGSU Verification Model</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#62605B]">
          <div className="p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] space-y-2">
            <div className="font-bold text-[#18212B] text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#B6533C] text-white flex items-center justify-center text-[10px] font-mono">1</span>
              <span>Organizer Vetting</span>
            </div>
            <p className="leading-relaxed">
              Organizers cannot instantly publish events. Any student or faculty organizer submits their university ID, department, and justification for review by the Dean of Students Welfare.
            </p>
          </div>

          <div className="p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] space-y-2">
            <div className="font-bold text-[#18212B] text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#B08A4A] text-white flex items-center justify-center text-[10px] font-mono">2</span>
              <span>Event Authorization</span>
            </div>
            <p className="leading-relaxed">
              Every proposed seminar, workshop, or competition must be reviewed by university administration before it becomes publicly discoverable across the campus network.
            </p>
          </div>

          <div className="p-4 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] space-y-2">
            <div className="font-bold text-[#18212B] text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2F613B] text-white flex items-center justify-center text-[10px] font-mono">3</span>
              <span>Optical Attendance</span>
            </div>
            <p className="leading-relaxed">
              Registered students carry tamper-proof digital passes with recessed QR tokens. Turnstile entry prevents duplicates, verifies eligibility, and validates genuine participation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
