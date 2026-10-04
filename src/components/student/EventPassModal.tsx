'use client';

import React from 'react';
import { Registration, CampusEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Clock, ShieldCheck, Printer, UserCheck, Building2, Hash } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ParisarLogo } from '../ui/ParisarLogo';

interface EventPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  event: CampusEvent | null;
}

export const EventPassModal: React.FC<EventPassModalProps> = ({
  isOpen,
  onClose,
  registration,
  event,
}) => {
  if (!registration || !event) return null;

  const eventDate = new Date(event.startTime).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const eventTime = `${new Date(event.startTime).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} - ${new Date(event.endTime).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  const isPresentMarked = Boolean(registration.checkedInAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR Digital Registration Card"
      subtitle="Dr. Harisingh Gour Vishwavidyalaya • Official Registration Credential"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-[#62605B]">
            <ShieldCheck className="w-4 h-4 text-[#B08A4A]" />
            <span className="font-medium text-[11px]">Verified DHSGSU Registration Record</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print Card
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      {/* Official Digital Registration Card - Warm Ivory Surface, Ink Typography, Terracotta & Brass Accents */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[4px_4px_0_0_#18212B] rounded-[4px] p-5 text-[#18212B] relative overflow-hidden">
        {/* Card Top Branding with DHSGSU Seal */}
        <div className="flex items-start justify-between border-b-2 border-[#18212B] pb-3 mb-4">
          <ParisarLogo size="sm" variant="ticket" />
          <div className="shrink-0 flex flex-col items-end gap-1">
            {isPresentMarked ? (
              <Badge variant="success">Attendance Marked: Present ✓</Badge>
            ) : (
              <Badge variant="accent">Registration: {registration.status}</Badge>
            )}
            <span className="text-[10px] font-mono text-[#62605B]">
              Mode: {event.eventMode || 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Event Name & Category Banner */}
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08A4A]">
            Official University Event
          </div>
          <h4 className="text-base sm:text-lg font-black text-[#18212B] mt-0.5 leading-snug tracking-tight">
            {event.title}
          </h4>
          <div className="text-xs text-[#62605B] font-medium mt-1 flex flex-wrap items-center gap-3">
            <span>
              Category: <strong className="text-[#18212B]">{event.category}</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#B6533C]" />
              Organizer: <strong className="text-[#18212B]">{event.organizerName}</strong>
            </span>
          </div>
        </div>

        {/* Official Registration ID & Verification Banner */}
        <div className="p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#62605B] font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#B6533C]" /> Registration ID
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#18212B] mt-0.5 tracking-wider">
              {registration._id.toUpperCase()} ({registration.qrToken})
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
              Roster Verification
            </div>
            <div className="text-xs font-semibold text-[#2E6B4E] inline-flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" />
              {event.eventMode === 'ONLINE'
                ? 'Online Session Verified'
                : 'Organizer Roster Check-In'}
            </div>
          </div>
        </div>

        {/* Perforated Divider Line */}
        <div className="relative my-4">
          <div className="border-t-2 border-dashed border-[#B9B4AA]"></div>
          <div className="absolute -left-7 -top-2.5 w-5 h-5 rounded-full bg-[#F4F0E8] border-r-2 border-[#18212B]"></div>
          <div className="absolute -right-7 -top-2.5 w-5 h-5 rounded-full bg-[#F4F0E8] border-l-2 border-[#18212B]"></div>
        </div>

        {/* Student Identity & Schedule Logistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#EAE5DB]/60 p-3.5 rounded-[3px] border border-[#B9B4AA]">
          <div>
            <div className="text-[10px] font-mono text-[#62605B] uppercase font-bold">
              Registered Student
            </div>
            <div className="font-bold text-[#18212B] text-sm mt-0.5">
              {registration.userName}
            </div>
            <div className="text-[11px] font-mono text-[#18212B] font-semibold mt-0.5">
              Roll Number: {registration.userRollNumber}
            </div>
            <div className="text-[11px] text-[#62605B] truncate mt-0.5">
              {registration.userDepartment}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[#62605B] uppercase font-bold">
              Event Date, Time &amp; Venue
            </div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-[#18212B] text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[#62605B] text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#365B6D]" />
              <span>{eventTime}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[#18212B] text-[11px] pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Academic Policy Notice */}
        <div className="mt-3 p-2.5 bg-[#FDF7EC] border border-[#B26B16]/40 rounded-[2px] text-[10px] text-[#7D4A0D] leading-relaxed">
          <strong>University Attendance Policy:</strong> For physical events, the organizer verifies your attendance directly from the registered student roster using your Name and Roll Number ({registration.userRollNumber}). For online events, join the active event session to log verified participation ({event.minParticipationPercent ?? 80}% minimum required for certificate eligibility).
        </div>

        {/* Bottom Institutional Seal Line */}
        <div className="mt-3 pt-2 border-t border-[#B9B4AA] flex items-center justify-between text-[10px] font-mono text-[#62605B]">
          <span>Registered: {new Date(registration.registeredAt).toLocaleDateString('en-IN')}</span>
          <span>DHSGSU SAGAR (M.P.)</span>
        </div>
      </div>
    </Modal>
  );
};
