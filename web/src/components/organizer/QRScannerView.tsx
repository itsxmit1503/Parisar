'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScanVerificationResult } from '../../types';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertOctagon, 
  History,
  Loader2,
  Play,
  Square,
  Clock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface QRScannerViewProps {
  onNavigateToParticipants?: (eventId: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onNavigateToParticipants }) => {
  const {
    events,
    verifyAndCheckIn,
    attendance,
    startAttendanceSession,
    closeAttendanceSession,
    updateParticipantParticipation,
  } = useApp();
  const { showToast } = useToast();

  const organizerEvents = events.filter(
    e => e.status === 'PUBLISHED' || e.status === 'APPROVED' || e.status === 'ONGOING' || e.status === 'COMPLETED'
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(
    organizerEvents[0]?._id || events[0]?._id || ''
  );

  const [inputToken, setInputToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanVerificationResult | null>(null);
  const [lastErrorSubType, setLastErrorSubType] = useState<'INVALID' | 'NOT_FOUND' | null>(null);

  const currentEvent = events.find(e => e._id === selectedEventId) || events[0];
  const currentEventAttendance = attendance.filter(a => a.eventId === selectedEventId);

  const totalEventMins = currentEvent
    ? Math.max(
        15,
        Math.round(
          (new Date(currentEvent.endTime).getTime() - new Date(currentEvent.startTime).getTime()) / 60000
        )
      )
    : 60;
  const minPercent = currentEvent?.minParticipationPercent ?? 80;
  const requiredMins = Math.ceil((totalEventMins * minPercent) / 100);

  const handleVerify = (tokenToVerify: string, method: 'qr' | 'manual' = 'qr', subType?: 'INVALID' | 'NOT_FOUND') => {
    if (!tokenToVerify.trim()) return;
    setIsScanning(true);
    setLastResult(null);

    setTimeout(() => {
      const res = verifyAndCheckIn(selectedEventId, tokenToVerify.trim(), method);
      setLastResult(res);
      setLastErrorSubType(subType || (tokenToVerify.includes('NOTFOUND') ? 'NOT_FOUND' : 'INVALID'));
      setIsScanning(false);
      setInputToken('');
    }, 280);
  };

  const handleStartSession = () => {
    if (!currentEvent) return;
    const res = startAttendanceSession(currentEvent._id);
    if (res.success) {
      showToast('success', `Live attendance session started for "${currentEvent.title}".`, 'Session Active');
    } else {
      showToast('error', res.error?.message || 'Unable to start session.', 'Action Failed');
    }
  };

  const handleCloseSession = () => {
    if (!currentEvent) return;
    const res = closeAttendanceSession(currentEvent._id);
    if (res.success) {
      showToast(
        'success',
        `Attendance session closed and participation threshold (${minPercent}%) evaluated.`,
        'Session Finalized'
      );
    } else {
      showToast('error', res.error?.message || 'Unable to close session.', 'Action Failed');
    }
  };

  const handleAddDuration = (attendanceId: string, currentMins: number, deltaMins: number) => {
    if (!currentEvent) return;
    const nextMins = Math.min(totalEventMins, Math.max(0, currentMins + deltaMins));
    const res = updateParticipantParticipation(attendanceId, nextMins);
    if (res.success) {
      showToast('info', `Updated participation duration to ${nextMins}/${totalEventMins} mins.`, 'Duration Updated');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            Entrance Control & Turnstile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            QR Attendance & Session Console
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Validate attendee digital passes, manage live attendance sessions, and enforce minimum participation thresholds.
          </p>
        </div>

        {/* Target Event Selector - Tactile Inset Box */}
        <div className="flex items-center gap-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] px-3 py-1.5 shadow-[2px_2px_0_0_#18212B]">
          <span className="text-xs font-mono font-bold uppercase text-[#62605B]">Session:</span>
          <select
            value={selectedEventId}
            onChange={e => {
              setSelectedEventId(e.target.value);
              setLastResult(null);
            }}
            className="text-xs font-bold text-[#18212B] bg-transparent focus:outline-none cursor-pointer max-w-[240px] truncate"
          >
            {events
              .filter(e => e.status !== 'DRAFT')
              .map(e => (
                <option key={e._id} value={e._id}>
                  {e.title} ({e.venue})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Live Attendance Session Lifecycle Banner */}
      {currentEvent && (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-[2px] bg-[#18212B] text-[#FCFAF5] text-[10px] font-mono font-bold uppercase">
                Mode: {currentEvent.eventMode || 'OFFLINE'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase border ${
                  currentEvent.attendanceSessionStatus === 'ACTIVE'
                    ? 'bg-[#EBF3ED] text-[#2F613B] border-[#2F613B]/40'
                    : currentEvent.attendanceSessionStatus === 'CLOSED'
                    ? 'bg-[#EAE5DB] text-[#18212B] border-[#B9B4AA]'
                    : 'bg-[#FAF0E6] text-[#B08A4A] border-[#B08A4A]/40'
                }`}
              >
                Session: {currentEvent.attendanceSessionStatus || 'NOT_STARTED'}
              </span>
              <span className="text-[11px] font-mono text-[#62605B]">
                <Clock className="w-3 h-3 inline mr-1 text-[#B6533C]" />
                Duration: <strong>{totalEventMins} mins</strong> • Min Certificate Threshold: <strong>{minPercent}% ({requiredMins} mins)</strong>
              </span>
            </div>
            <p className="text-xs text-[#62605B]">
              Registration alone does not grant attendance or certificates. Students must be scanned or validate live participation ≥ {minPercent}%.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentEvent.attendanceSessionStatus !== 'ACTIVE' && currentEvent.status !== 'COMPLETED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={handleStartSession}
              >
                Start Attendance Session
              </Button>
            )}
            {currentEvent.attendanceSessionStatus === 'ACTIVE' && (
              <Button
                variant="brass"
                size="sm"
                leftIcon={<Square className="w-3.5 h-3.5" />}
                onClick={handleCloseSession}
              >
                Close Session & Finalize
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner Viewport & Camera Bezel - 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#B6533C]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#18212B]">
                  Optical Scanner Feed
                </span>
              </div>
              {isScanning ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#FAF0E6] text-[#B08A4A] border border-[#B08A4A]/40 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Scanning Pass...
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B]/30">
                  Ready for Pass
                </span>
              )}
            </div>

            {/* Viewfinder Canvas - Precision Academic Hardware Bezel */}
            <div className="relative w-full h-64 bg-[#18212B] rounded-[3px] overflow-hidden flex flex-col items-center justify-center p-4 border-2 border-[#18212B] shadow-[inset_0_3px_8px_rgba(0,0,0,0.7)]">
              {/* Target Scan Reticle */}
              <div className="relative w-44 h-44 border-2 border-[#64788A]/60 rounded-[2px] flex items-center justify-center">
                {/* Corner Marks */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#B6533C]"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#B6533C]"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#B6533C]"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#B6533C]"></div>

                {/* Precision Alignment Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-8 h-[1px] bg-[#FCFAF5]"></div>
                  <div className="h-8 w-[1px] bg-[#FCFAF5]"></div>
                </div>

                {/* Animated Terracotta Scan Line */}
                <div className="w-full h-0.5 bg-[#B6533C] shadow-[0_0_8px_#B6533C] animate-bounce"></div>
              </div>

              <div className="text-[11px] text-[#EAE5DB] font-mono mt-3">
                {isScanning ? 'Verifying cryptographic token against event roster...' : 'Align student QR pass inside optical reticle'}
              </div>
            </div>

            {/* Manual Token Entry Form */}
            <div className="space-y-2 pt-2 border-t border-[#B9B4AA]">
              <label className="text-xs font-bold text-[#18212B] block">
                Manual Pass Token Entry
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. PARISAR-PASS-DL-CS042"
                  value={inputToken}
                  onChange={e => setInputToken(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleVerify(inputToken, 'manual');
                  }}
                  className="flex-1 px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono font-bold text-[#18212B] placeholder-[#62605B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#18212B]"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isScanning}
                  onClick={() => handleVerify(inputToken, 'manual')}
                >
                  Verify Token
                </Button>
              </div>
            </div>

            {/* Quick Verification Test Triggers (Section 23.7: Valid, Already Checked In, Wrong Event, Registration Not Found, Invalid) */}
            <div className="bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] p-3.5 space-y-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-xs font-mono font-bold text-[#18212B] flex items-center justify-between">
                <span>Turnstile Verification Test Passes</span>
                <span className="text-[10px] text-[#62605B] font-normal">Click to verify pass states:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleVerify('PARISAR-PASS-DL-CS042', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#2F613B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#2F613B] text-[11px]">1. Valid Pass</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Amit Sharma (Y23141042)</div>
                </button>

                <button
                  onClick={() => handleVerify('PARISAR-PASS-DL-CS088', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#B08A4A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#B08A4A] text-[11px]">2. Already Checked In</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Rohan Mehra (Duplicate Scan)</div>
                </button>

                <button
                  onClick={() => handleVerify('PARISAR-PASS-UT-EC118', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#B6533C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#B6533C] text-[11px]">3. Wrong Event</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Pass for Abhivyakti Youth Fest</div>
                </button>

                <button
                  onClick={() => handleVerify('PARISAR-NOTFOUND-000', 'qr', 'NOT_FOUND')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#A83226] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#A83226] text-[11px]">4. Registration Not Found / Invalid</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Unregistered or Invalid QR</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feedback & Verification Results - 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          {/* Verification Result Banner - Tactile Solid Panel */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#18212B]">
              Scanner Output & Decision
            </h3>

            {isScanning ? (
              <div className="p-6 bg-[#FAF0E6] border-2 border-[#B08A4A] rounded-[3px] text-center space-y-2">
                <Loader2 className="w-6 h-6 text-[#B08A4A] animate-spin mx-auto" />
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B08A4A]">
                  SCANNING & VERIFYING PASS...
                </div>
                <p className="text-[11px] font-mono text-[#62605B]">
                  Checking DHSGSU Event Roster & Attendance Ledger
                </p>
              </div>
            ) : lastResult ? (
              <div
                className={`p-4 rounded-[3px] border-2 text-xs space-y-2.5 shadow-[2px_2px_0_0_#18212B] ${
                  lastResult.status === 'SUCCESS'
                    ? 'bg-[#EBF3ED] border-[#2F613B] text-[#2F613B]'
                    : lastResult.status === 'DUPLICATE'
                    ? 'bg-[#FAF0E6] border-[#B08A4A] text-[#B08A4A]'
                    : lastResult.status === 'WRONG_EVENT'
                    ? 'bg-[#FBEFEF] border-[#B6533C] text-[#B6533C]'
                    : 'bg-[#FBEAEA] border-[#A83226] text-[#A83226]'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm tracking-tight">
                  {lastResult.status === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  {lastResult.status === 'DUPLICATE' && <AlertTriangle className="w-5 h-5 shrink-0" />}
                  {lastResult.status === 'WRONG_EVENT' && <AlertOctagon className="w-5 h-5 shrink-0" />}
                  {lastResult.status === 'INVALID' && <XCircle className="w-5 h-5 shrink-0" />}

                  <span>
                    {lastResult.status === 'SUCCESS' && 'VALID — ATTENDANCE CONFIRMED'}
                    {lastResult.status === 'DUPLICATE' && 'ALREADY CHECKED IN'}
                    {lastResult.status === 'WRONG_EVENT' && 'WRONG EVENT PASS'}
                    {lastResult.status === 'INVALID' && (
                      lastErrorSubType === 'NOT_FOUND'
                        ? 'REGISTRATION NOT FOUND'
                        : 'INVALID PASS TOKEN'
                    )}
                  </span>
                </div>

                <p className="leading-relaxed font-bold text-[#18212B]">
                  {lastResult.message}
                </p>

                {'attendee' in lastResult && lastResult.attendee && (
                  <div className="pt-2 border-t border-current/20 space-y-1 text-[#18212B] font-mono text-[11px]">
                    <div>Attendee: <strong>{lastResult.attendee.name}</strong></div>
                    <div>Roll: <strong>{lastResult.attendee.rollNumber}</strong></div>
                    <div>Department: {lastResult.attendee.department}</div>
                    {'checkedInAt' in lastResult && lastResult.checkedInAt && (
                      <div className="text-[#B08A4A] font-bold mt-1">
                        First scanned: {new Date(lastResult.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-center text-xs text-[#62605B] font-mono">
                Scanner idle. Ready for attendee QR pass.
              </div>
            )}
          </div>

          {/* Session Attendance & Participation Duration Summary */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#18212B] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>Verified Present ({currentEventAttendance.length})</span>
              </h4>
              {onNavigateToParticipants && (
                <button
                  onClick={() => onNavigateToParticipants(selectedEventId)}
                  className="text-xs font-bold text-[#B6533C] hover:underline cursor-pointer"
                >
                  Full Roster →
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {currentEventAttendance.length > 0 ? (
                currentEventAttendance.map(att => {
                  const pMins = att.participatedMinutes ?? totalEventMins;
                  const pPct = att.participationPercent ?? Math.round((pMins / totalEventMins) * 100);
                  const isEligible = att.eligibleForCertificate ?? pPct >= minPercent;

                  return (
                    <div
                      key={att._id}
                      className="p-2.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#18212B]">{att.userName}</div>
                          <div className="text-[11px] text-[#62605B] font-mono">
                            {att.userRollNumber} • {att.userDepartment}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#2F613B] font-bold bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                            {new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#B9B4AA]/60 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#18212B]">
                            {pMins}/{totalEventMins}m ({pPct}%)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-[2px] font-bold ${
                              isEligible
                                ? 'bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B]/30'
                                : 'bg-[#FAF0E6] text-[#B08A4A] border border-[#B08A4A]/40'
                            }`}
                          >
                            {isEligible ? `Eligible ≥${minPercent}%` : `Below ${minPercent}%`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddDuration(att._id, pMins, 15)}
                            className="px-1.5 py-0.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] font-bold text-[#18212B] hover:border-[#18212B] cursor-pointer"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDuration(att._id, pMins, totalEventMins)}
                            className="px-1.5 py-0.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] font-bold text-[#2F613B] hover:border-[#2F613B] cursor-pointer"
                          >
                            100%
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#62605B] font-mono">
                  No participants checked in for this session yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

