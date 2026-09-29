'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Compass, 
  BookOpen, 
  Cpu, 
  Trophy,
  ExternalLink
} from 'lucide-react';
import { Badge, CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EventPassportProps {
  onViewCertificates: () => void;
  onExploreEvents: () => void;
}

export const EventPassport: React.FC<EventPassportProps> = ({
  onViewCertificates,
  onExploreEvents,
}) => {
  const { 
    currentUser, 
    getStudentPassportStats, 
    attendance, 
    events, 
    certificates 
  } = useApp();

  const stats = getStudentPassportStats();

  const userAttendance = attendance.filter(a => a.userId === currentUser._id);
  const attendedHistory = userAttendance.map(att => {
    const event = events.find(e => e._id === att.eventId);
    const cert = certificates.find(c => c.eventId === att.eventId && c.userId === currentUser._id);
    return { att, event, cert };
  }).filter(item => item.event !== undefined) as {
    att: (typeof attendance)[0];
    event: (typeof events)[0];
    cert?: (typeof certificates)[0];
  }[];

  attendedHistory.sort((a, b) => new Date(b.att.checkedInAt).getTime() - new Date(a.att.checkedInAt).getTime());

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return Compass;
      case 'Terminal': return BookOpen;
      case 'Cpu': return Cpu;
      case 'Trophy': return Trophy;
      default: return Award;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Official Record Header - Your DHSGSU Journey */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-8 shadow-[3px_3px_0_0_#18212B]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#B9B4AA]">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.profileImage}
              alt={currentUser.name}
              className="w-16 h-16 rounded-[3px] border-2 border-[#18212B] shadow-[2px_2px_0_0_#18212B] object-cover"
            />
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08A4A]">
                PARISAR • Event Passport
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#18212B] tracking-tight mt-0.5">
                Your DHSGSU Journey
              </h1>
              <div className="text-xs text-[#62605B] mt-1 space-x-2">
                <span>Student: <strong className="text-[#18212B]">{currentUser.name}</strong></span>
                <span>•</span>
                <span>Roll: <strong className="text-[#18212B] font-mono">{currentUser.rollNumber}</strong></span>
                <span>•</span>
                <span>{currentUser.department}</span>
              </div>
            </div>
          </div>

          <Button
            variant="brass"
            size="sm"
            leftIcon={<Award className="w-4 h-4 text-white" />}
            onClick={onViewCertificates}
          >
            Verified Credentials ({stats.certificatesEarned})
          </Button>
        </div>

        {/* Structured Participation Metrics Grid - Inset Tactile Ledger */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 text-center">
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{stats.totalAttended}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-[#62605B] mt-1">Events Attended</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#B6533C]">{stats.workshopsCount}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-[#62605B] mt-1">Workshops Completed</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#64788A]">{stats.competitionsCount}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-[#62605B] mt-1">Competitions</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)]">
            <div className="text-2xl font-mono font-bold text-[#B08A4A]">{stats.certificatesEarned}</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-[#62605B] mt-1">Certificates Earned</div>
          </div>
          <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_2px_rgba(24,33,43,0.05)] col-span-2 sm:col-span-1">
            <div className="text-2xl font-mono font-bold text-[#18212B]">{stats.totalHours} hrs</div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-[#62605B] mt-1">Campus Hours</div>
          </div>
        </div>
      </div>

      {/* 2. Structured Milestone Recognitions (Dignified Archival Record) */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B08A4A] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#B08A4A]" />
            <span>Academic Milestones</span>
          </div>
          <h2 className="text-base font-extrabold text-[#18212B] mt-0.5">
            Verified University Milestones & Honors
          </h2>
          <p className="text-xs text-[#62605B]">
            Formally authenticated by campus academic departments and registered societies at Dr. Harisingh Gour Vishwavidyalaya.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {stats.achievements.map(badge => {
            const Icon = getIcon(badge.iconName);
            const isUnlocked = Boolean(badge.unlockedAt);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-[3px] border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#FCFAF5] border-[#B9B4AA] shadow-[2px_2px_0_0_#B08A4A]'
                    : 'bg-[#EAE5DB]/40 border-[#B9B4AA]/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-[2px] flex items-center justify-center border ${
                        isUnlocked
                          ? 'bg-[#FAF0E6] text-[#B08A4A] border-[#B08A4A]'
                          : 'bg-[#EAE5DB] text-[#62605B] border-[#B9B4AA]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isUnlocked && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#2F613B] bg-[#EBF3ED] px-1.5 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                        Honored ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-[#18212B] leading-snug">{badge.name}</h3>
                  <p className="text-[11px] text-[#62605B] mt-1 leading-relaxed">{badge.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#B9B4AA] text-[10px] font-mono text-[#62605B]">
                  {isUnlocked && badge.unlockedAt ? (
                    <span>Issued: {new Date(badge.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  ) : (
                    <span>In progress ({badge.progress} / {badge.total})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Verified Participation History Ledger */}
      <section className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 shadow-[2px_2px_0_0_#18212B] space-y-4">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#18212B]">
              Verified Participation Timeline
            </h2>
            <p className="text-xs text-[#62605B]">
              Immutable log of confirmed optical QR entrance scans at DHSGSU facilities.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onExploreEvents}>
            Register for More Events
          </Button>
        </div>

        {attendedHistory.length > 0 ? (
          <div className="divide-y divide-[#B9B4AA]/60">
            {attendedHistory.map(({ att, event, cert }) => (
              <div
                key={att._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#EAE5DB]/40 px-2 rounded-[2px] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={event.category} />
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2F613B] bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                      <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                      Verified Present ({att.method.toUpperCase()} Scan)
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#18212B]">{event.title}</h3>
                  <div className="text-xs text-[#62605B] flex flex-wrap items-center gap-3">
                    <span>Venue: <strong className="text-[#18212B]">{event.venue}</strong></span>
                    <span>•</span>
                    <span className="font-mono">Checked In: {new Date(att.checkedInAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {cert ? (
                    <Button
                      variant="brass"
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5 text-white" />}
                      onClick={onViewCertificates}
                    >
                      Certificate Available
                    </Button>
                  ) : (
                    <span className="text-[11px] font-mono text-[#62605B] bg-[#EAE5DB] px-2.5 py-1 rounded-[2px] border border-[#B9B4AA]">
                      Credential Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-[#EAE5DB]/40 border border-[#B9B4AA] rounded-[3px] text-center space-y-2">
            <Clock className="w-8 h-8 text-[#62605B] mx-auto opacity-50" />
            <h3 className="font-bold text-sm text-[#18212B]">No attendance scanned yet</h3>
            <p className="text-xs text-[#62605B]">
              Present your PARISAR digital pass at the entrance of your next registered DHSGSU session.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
