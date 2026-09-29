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
  History
} from 'lucide-react';
import { Button } from '../ui/Button';

interface QRScannerViewProps {
  onNavigateToParticipants?: (eventId: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onNavigateToParticipants }) => {
  const { events, verifyAndCheckIn, attendance } = useApp();

  const organizerEvents = events.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    organizerEvents[0]?._id || events[0]?._id || ''
  );

  const [inputToken, setInputToken] = useState('');
  const [lastResult, setLastResult] = useState<ScanVerificationResult | null>(null);

  const currentEventAttendance = attendance.filter(a => a.eventId === selectedEventId);

  const handleVerify = (tokenToVerify: string, method: 'qr' | 'manual' = 'qr') => {
    if (!tokenToVerify.trim()) return;
    const res = verifyAndCheckIn(selectedEventId, tokenToVerify.trim(), method);
    setLastResult(res);
    setInputToken('');
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
            QR Attendance Scanner
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Validate attendee digital passes, prevent duplicate entry, and record verified attendance.
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B]/30">
                Ready for Pass
              </span>
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
                Align student QR pass inside optical reticle
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
                  onClick={() => handleVerify(inputToken, 'manual')}
                >
                  Verify Token
                </Button>
              </div>
            </div>

            {/* One-Click Scenario Simulator (Section 19: All 4 States) */}
            <div className="bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] p-3.5 space-y-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="text-xs font-mono font-bold text-[#18212B] flex items-center justify-between">
                <span>DHSGSU Turnstile Scenario Simulator</span>
                <span className="text-[10px] text-[#62605B] font-normal">Click to test pass states:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleVerify('PARISAR-PASS-DL-CS042', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#2F613B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#2F613B] text-[11px]">1. Valid Pass Test</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Amit Sharma (Y23141042)</div>
                </button>

                <button
                  onClick={() => handleVerify('PARISAR-PASS-DL-CS088', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#B08A4A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#B08A4A] text-[11px]">2. Duplicate Scan Test</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Rohan Mehra (Already In)</div>
                </button>

                <button
                  onClick={() => handleVerify('PARISAR-PASS-UT-EC118', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#B6533C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#B6533C] text-[11px]">3. Wrong Event Pass</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Pass for Youth Festival</div>
                </button>

                <button
                  onClick={() => handleVerify('FAKE-PARISAR-TOKEN-999', 'qr')}
                  className="p-2 text-left bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] shadow-[1px_1px_0_0_#18212B] hover:border-[#A83226] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <div className="font-bold text-[#A83226] text-[11px]">4. Invalid Token Test</div>
                  <div className="text-[10px] text-[#62605B] font-mono truncate">Counterfeit or Expired</div>
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

            {lastResult ? (
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
                    {lastResult.status === 'SUCCESS' && 'ATTENDANCE CONFIRMED'}
                    {lastResult.status === 'DUPLICATE' && 'DUPLICATE SCAN DETECTED'}
                    {lastResult.status === 'WRONG_EVENT' && 'PASS FOR DIFFERENT EVENT'}
                    {lastResult.status === 'INVALID' && 'COUNTERFEIT / INVALID PASS'}
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

          {/* Session Attendance Summary */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3">
            <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#18212B] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>Verified Present ({currentEventAttendance.length})</span>
              </h4>
              {onNavigateToParticipants && (
                <button
                  onClick={() => onNavigateToParticipants(selectedEventId)}
                  className="text-xs font-bold text-[#B6533C] hover:underline"
                >
                  Full Roster →
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {currentEventAttendance.map(att => (
                <div
                  key={att._id}
                  className="p-2.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#18212B]">{att.userName}</div>
                    <div className="text-[11px] text-[#62605B] font-mono">{att.userRollNumber} • {att.userDepartment}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#2F613B] font-bold bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                      {new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
