'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Registration, CampusEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Clock, ShieldCheck, Printer } from 'lucide-react';
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (registration && registration.qrToken) {
      QRCode.toDataURL(registration.qrToken, {
        width: 220,
        margin: 1,
        color: {
          dark: '#18212B',
          light: '#FCFAF5',
        },
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [registration]);

  if (!registration || !event) return null;

  const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const eventTime = `${new Date(event.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} - ${new Date(event.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  const isCheckedIn = Boolean(registration.checkedInAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR Digital Event Pass"
      subtitle="Dr. Harisingh Gour Vishwavidyalaya • Official Entrance Credential"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-[#62605B]">
            <ShieldCheck className="w-4 h-4 text-[#B08A4A]" />
            <span className="font-medium text-[11px]">DHSGSU Cryptographic Token</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => window.print()}
            >
              Print Pass
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      {/* Physical Ticket Pass styling - WARM IVORY SURFACE, INK TYPOGRAPHY, TERRACOTTA & BRASS ACCENTS */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] shadow-[4px_4px_0_0_#18212B] rounded-[4px] p-5 text-[#18212B] relative overflow-hidden">
        {/* Pass Top Branding with DHSGSU Seal */}
        <div className="flex items-start justify-between border-b-2 border-[#18212B] pb-3 mb-4">
          <ParisarLogo size="sm" variant="ticket" />
          <div className="shrink-0">
            {isCheckedIn ? (
              <Badge variant="success">
                Checked In ✓
              </Badge>
            ) : (
              <Badge variant="accent">
                Valid Pass
              </Badge>
            )}
          </div>
        </div>

        {/* Event Title Banner */}
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08A4A]">
            Event Session
          </div>
          <h4 className="text-base sm:text-lg font-black text-[#18212B] mt-0.5 leading-snug tracking-tight">
            {event.title}
          </h4>
          <div className="text-xs text-[#62605B] font-medium mt-0.5">
            Category: <span className="text-[#18212B] font-bold">{event.category}</span>
          </div>
        </div>

        {/* Distinct Inset Region for QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] shadow-[inset_0_1px_3px_rgba(24,33,43,0.08)] mb-4">
          <div className="p-2.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[0_2px_4px_rgba(24,33,43,0.06)]">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Event Pass QR Code"
                className="w-40 h-40 object-contain"
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center bg-[#FCFAF5] text-[#62605B] text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>
          <div className="font-mono text-xs font-bold text-[#18212B] mt-2.5 tracking-wider bg-[#FCFAF5] px-2.5 py-0.5 border border-[#B9B4AA] rounded-[2px]">
            {registration.qrToken}
          </div>
          <div className="text-[10px] text-[#62605B] mt-1 font-medium">
            Present at DHSGSU entrance optical turnstile
          </div>
        </div>

        {/* Perforated Divider Line with Left and Right Cutouts */}
        <div className="relative my-4">
          <div className="border-t-2 border-dashed border-[#B9B4AA]"></div>
          <div className="absolute -left-7 -top-2.5 w-5 h-5 rounded-full bg-[#F4F0E8] border-r-2 border-[#18212B]"></div>
          <div className="absolute -right-7 -top-2.5 w-5 h-5 rounded-full bg-[#F4F0E8] border-l-2 border-[#18212B]"></div>
        </div>

        {/* Attendee Details & Logistics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-[#EAE5DB]/60 p-3 rounded-[3px] border border-[#B9B4AA]">
          <div>
            <div className="text-[10px] font-mono text-[#62605B] uppercase font-bold">Attendee</div>
            <div className="font-bold text-[#18212B] text-sm mt-0.5">{registration.userName}</div>
            <div className="text-[11px] font-mono text-[#62605B]">Roll: {registration.userRollNumber}</div>
            <div className="text-[11px] text-[#62605B] truncate">{registration.userDepartment}</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[#62605B] uppercase font-bold">Session Schedule</div>
            <div className="flex items-center gap-1 font-mono font-bold text-[#18212B] text-[11px]">
              <Calendar className="w-3 h-3 text-[#B6533C]" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[#62605B] text-[11px]">
              <Clock className="w-3 h-3 text-[#64788A]" />
              <span>{eventTime}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#18212B] text-[11px] pt-0.5">
              <MapPin className="w-3 h-3 text-[#B6533C] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Bottom Institutional Seal Line */}
        <div className="mt-3 pt-2 border-t border-[#B9B4AA] flex items-center justify-between text-[10px] font-mono text-[#62605B]">
          <span>Issued: {new Date(registration.registeredAt).toLocaleDateString()}</span>
          <span>DHSGSU SAGAR (M.P.)</span>
        </div>
      </div>
    </Modal>
  );
};
