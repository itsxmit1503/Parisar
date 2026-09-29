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
  onSelectRole: (role: 'student' | 'organizer' | 'admin', userId?: string) => void;
  onOpenEvent: (event: CampusEvent) => void;
  onOpenApkModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onExploreEvents,
  onSelectRole,
  onOpenEvent,
  onOpenApkModal
}) => {
  const { events } = useApp();

  // Filter 4 featured events representing the 4 core pillars
  const featuredEvents = events
    .filter(e => e.status === 'PUBLISHED')
    .slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-12">
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-12 shadow-[4px_4px_0_0_#18212B] relative overflow-hidden">
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
              The dedicated digital campus platform built exclusively for Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar. 
              Discover, register, and participate in verified university seminars, practical workshops, cultural celebrations, and academic competitions.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onEnterApp}
                className="text-base px-8 py-3.5"
              >
                Enter PARISAR
              </Button>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Compass className="w-4 h-4" />}
                onClick={onExploreEvents}
                className="text-base px-6 py-3.5"
              >
                Explore Events
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Download className="w-4 h-4 text-[#B6533C]" />}
                onClick={onOpenApkModal}
                className="text-base px-6 py-3.5"
              >
                Android App (v1.0.0 APK)
              </Button>
            </div>

            {/* Verified Campus Stats Bar */}
            <div className="pt-6 border-t border-[#B9B4AA]/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[#62605B]">CAMPUS REACH</span>
                <div className="text-sm font-bold text-[#18212B]">Patharia Hills, Sagar</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">GOVERNANCE</span>
                <div className="text-sm font-bold text-[#18212B]">DSW Authorized</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">ACCESS ROLES</span>
                <div className="text-sm font-bold text-[#18212B]">3 Distinct Panels</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#62605B]">TICKETING</span>
                <div className="text-sm font-bold text-[#18212B]">Optical QR Pass</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ROLE SELECTOR FOR EVALUATION & DEMO */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#B9B4AA] pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">Interactive Persona Switcher</span>
            <h2 className="text-2xl font-bold text-[#18212B]">Experience PARISAR by University Role</h2>
          </div>
          <p className="text-xs text-[#62605B] max-w-md">
            Click any authentic university role below to immediately enter their dedicated interface and test workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Persona 1: Student */}
          <div 
            onClick={() => onSelectRole('student', 'student-1')}
            className="group cursor-pointer bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] hover:shadow-[4px_4px_0_0_#18212B] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#18212B] uppercase">
                Role 1: Student
              </span>
              <span className="text-xs font-mono text-[#2F613B] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Participant
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#18212B] group-hover:text-[#B6533C] transition-colors">
              Amit Sharma
            </h3>
            <p className="text-xs text-[#62605B] mt-1 font-mono">
              Roll: Y23141042 • B.Tech CSE (6th Sem)
            </p>
            <p className="text-xs text-[#18212B] mt-3 leading-relaxed">
              Discover seminars & workshops, register in 1-click, and access your tactile QR Event Pass.
            </p>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/30 flex items-center justify-between text-xs font-bold text-[#B6533C]">
              <span>Enter Student Panel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Persona 2: Verified Organizer */}
          <div 
            onClick={() => onSelectRole('organizer', 'org-1')}
            className="group cursor-pointer bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] hover:shadow-[4px_4px_0_0_#18212B] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#B08A4A] uppercase">
                Role 2: Organizer
              </span>
              <span className="text-xs font-mono text-[#B08A4A] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> DSW Verified
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#18212B] group-hover:text-[#B6533C] transition-colors">
              Dr. Alok Sahay
            </h3>
            <p className="text-xs text-[#62605B] mt-1 font-mono">
              Faculty Convener • Dept. of Computer Science
            </p>
            <p className="text-xs text-[#18212B] mt-3 leading-relaxed">
              Propose official events, manage registered attendee rosters, and scan entry QR passes.
            </p>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/30 flex items-center justify-between text-xs font-bold text-[#B08A4A]">
              <span>Enter Organizer Panel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Persona 3: University Administrator */}
          <div 
            onClick={() => onSelectRole('admin', 'admin-1')}
            className="group cursor-pointer bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] hover:shadow-[4px_4px_0_0_#18212B] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] text-[11px] font-mono font-bold text-[#B6533C] uppercase">
                Role 3: Administrator
              </span>
              <span className="text-xs font-mono text-[#B6533C] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Executive Proctor
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#18212B] group-hover:text-[#B6533C] transition-colors">
              Prof. S.P. Gautam
            </h3>
            <p className="text-xs text-[#62605B] mt-1 font-mono">
              Dean of Students Welfare (DSW)
            </p>
            <p className="text-xs text-[#18212B] mt-3 leading-relaxed">
              Verify organizer credential applications, review & authorize event proposals, audit campus attendance.
            </p>
            <div className="mt-4 pt-3 border-t border-[#B9B4AA]/30 flex items-center justify-between text-xs font-bold text-[#B6533C]">
              <span>Enter Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
