'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Registration, CampusEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Printer,
  UserCheck,
  Building2,
  Hash,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { ParisarLogo } from '../ui/ParisarLogo';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';

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
  const { attendance, generateTemporaryAttendanceQr } = useApp();
  const { showToast } = useToast();

  const [tempQrDataUrl, setTempQrDataUrl] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Countdown timer for 60-second temporary QR
  useEffect(() => {
    if (!expiresAtMs) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diffSec = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setSecondsRemaining(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [expiresAtMs]);

  // Reset temporary QR state when modal closes or event changes
  useEffect(() => {
    if (!isOpen) {
      setTempQrDataUrl(null);
      setTempToken(null);
      setExpiresAtMs(null);
      setSecondsRemaining(0);
      setQrError(null);
    }
  }, [isOpen, event?._id]);

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

  const matchedAtt = attendance.find(
    a => a.eventId === event._id && (a.registrationId === registration._id || a.userId === registration.userId)
  );
  const isPresentMarked = Boolean(registration.checkedInAt || (matchedAtt && matchedAtt.status !== 'ABSENT'));
  const isOfflineOrHybrid = (event.eventMode || 'OFFLINE') !== 'ONLINE';
  // Only show QR section when the organizer's attendance session is open
  const isSessionActive =
    event.attendanceSessionStatus === 'OPEN' ||
    event.attendanceSessionStatus === 'ACTIVE';

  const handleSubmitAttendanceQr = async () => {
    setQrError(null);
    setIsGeneratingQr(true);
    const res = await generateTemporaryAttendanceQr(event._id);
    setIsGeneratingQr(false);

    if (!res.success) {
      setQrError(res.error.message);
      showToast('error', res.error.message, 'Attendance QR Unavailable');
      return;
    }

    try {
      // Primary: try canvas-based PNG data URL
      let dataUrl: string;
      try {
        dataUrl = await QRCode.toDataURL(res.data.token, {
          width: 240,
          margin: 2,
          color: { dark: '#18212B', light: '#FCFAF5' },
        });
      } catch {
        // Fallback: generate SVG string and convert to data URL
        const svgStr = await QRCode.toString(res.data.token, {
          type: 'svg',
          margin: 2,
          color: { dark: '#18212B', light: '#FCFAF5' },
        });
        dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
      }
      setTempQrDataUrl(dataUrl);
      setTempToken(res.data.token);
      setExpiresAtMs(new Date(res.data.expiresAt).getTime());
      showToast(
        'success',
        'Temporary 60-second attendance QR generated. Show this to the event organizer.',
        'Attendance QR Active (60s)'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setQrError(`Could not render QR image: ${msg}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR Registration & Attendance Pass"
      subtitle="Dr. Harisingh Gour Vishwavidyalaya • Official Event Credential"
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
              Print Pass
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
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

        {/* ============================================================ */}
        {/* OFFLINE EVENT: TEMPORARY 60-SECOND STUDENT ATTENDANCE QR      */}
        {/* ============================================================ */}
        {isOfflineOrHybrid && (
          <div className="mb-4 p-4 bg-[#EAE5DB] border-2 border-[#18212B] rounded-[4px] text-center space-y-3">
            {isPresentMarked ? (
              <div className="py-3 space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-[#2F613B] mx-auto" />
                <div className="text-sm font-extrabold text-[#2F613B]">
                  ✓ Attendance Recorded
                </div>
                <p className="text-xs text-[#62605B]">
                  Your physical attendance for this event has been verified and locked.
                </p>
              </div>
            ) : !isSessionActive ? (
              /* Attendance session not yet open */
              <div className="py-3 space-y-1.5">
                <Clock className="w-7 h-7 text-[#B08A4A] mx-auto" />
                <div className="text-sm font-bold text-[#18212B]">
                  Attendance Has Not Started Yet
                </div>
                <p className="text-xs text-[#62605B] max-w-sm mx-auto">
                  The organizer will open the attendance session at the event venue. This pass will become active for QR generation once the session is open.
                </p>
              </div>
            ) : tempQrDataUrl && secondsRemaining > 0 ? (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#18212B] text-[#FCFAF5] rounded-[2px] text-[10px] font-mono font-bold uppercase">
                  <Clock className="w-3 h-3 text-[#B6533C]" />
                  <span>One-Time QR Expires In: {secondsRemaining}s</span>
                </div>

                <div className="bg-[#FCFAF5] p-3 border-2 border-[#18212B] rounded-[4px] inline-block mx-auto shadow-[2px_2px_0_0_#18212B]">
                  <img
                    src={tempQrDataUrl}
                    alt="Temporary 60s Attendance QR"
                    className="w-48 h-48 mx-auto block"
                  />
                </div>

                <p className="text-[11px] text-[#18212B] font-medium">
                  Present this QR code to the Event Organizer scanner. Valid for{' '}
                  <strong>{secondsRemaining} seconds</strong> and single-use only.
                </p>

                {tempToken && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#62605B]">
                    <span className="truncate max-w-[200px]">Token: {tempToken}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(tempToken);
                        showToast('info', 'Temporary token copied for scanner testing.', 'Copied');
                      }}
                      className="px-1.5 py-0.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded text-[#18212B] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Session is OPEN but no QR generated yet (or QR expired) */
              <div className="space-y-2.5 py-1">
                <div className="text-xs font-extrabold uppercase font-mono text-[#18212B] flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#B6533C]" />
                  <span>
                    {tempToken && secondsRemaining === 0
                      ? 'Temporary Attendance QR Expired'
                      : 'Attendance Session Open — Generate QR Now'}
                  </span>
                </div>
                <p className="text-xs text-[#62605B] max-w-sm mx-auto leading-relaxed">
                  {tempToken && secondsRemaining === 0
                    ? 'Your previous 60-second QR token has expired. Generate a fresh attendance QR for the organizer to scan.'
                    : 'The organizer has started the attendance session. Generate your one-time 60-second QR code and show it to the organizer.'}
                </p>
                {qrError && (
                  <div className="text-[11px] font-bold text-[#A83226] bg-[#FDF0EE] p-2 rounded border border-[#E9BFB8]">
                    {qrError}
                  </div>
                )}
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isGeneratingQr}
                  leftIcon={
                    tempToken ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )
                  }
                  onClick={handleSubmitAttendanceQr}
                >
                  {tempToken ? 'Generate New 60s Attendance QR' : 'Generate Attendance QR'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Official Registration ID Banner */}
        <div className="p-3 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#62605B] font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#B6533C]" /> Registration ID
            </div>
            <div className="font-mono text-xs font-bold text-[#18212B] mt-0.5">
              {registration._id.toUpperCase()}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-mono uppercase text-[#62605B] font-bold">
              Verification Mode
            </div>
            <div className="text-xs font-semibold text-[#2E6B4E] inline-flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5" />
              {event.eventMode === 'ONLINE'
                ? 'Online 2-Min Checkpoints'
                : '60s Dynamic Student QR'}
            </div>
          </div>
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

        {/* Bottom Institutional Seal Line */}
        <div className="mt-3 pt-2 border-t border-[#B9B4AA] flex items-center justify-between text-[10px] font-mono text-[#62605B]">
          <span>Registered: {new Date(registration.registeredAt).toLocaleDateString('en-IN')}</span>
          <span>DHSGSU SAGAR (M.P.)</span>
        </div>
      </div>
    </Modal>
  );
};
