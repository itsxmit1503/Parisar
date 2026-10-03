'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  CheckCircle2, 
  Users
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';

export const CertificatesManager: React.FC<{ initialEventId?: string }> = ({ initialEventId }) => {
  const { events, attendance, certificates, issueCertificatesForEvent, currentUser } = useApp();
  const { showToast } = useToast();

  const completedEvents = events.filter(
    e => e.status === 'COMPLETED' || e.organizerId === currentUser._id || currentUser.role === 'admin'
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || completedEvents[0]?._id || ''
  );
  const [isIssuing, setIsIssuing] = useState(false);

  const currentEvent = events.find(e => e._id === selectedEventId) || completedEvents[0];
  const minThreshold = currentEvent?.minParticipationPercent ?? 80;
  const totalEventMins = currentEvent
    ? Math.max(
        15,
        Math.round(
          (new Date(currentEvent.endTime).getTime() - new Date(currentEvent.startTime).getTime()) / 60000
        )
      )
    : 60;

  const verifiedAttendees = attendance.filter(a => a.eventId === selectedEventId);
  const issuedCerts = certificates.filter(c => c.eventId === selectedEventId);
  const issuedUserIds = new Set(issuedCerts.map(c => c.userId));
  const eligibleAttendees = verifiedAttendees.filter(a => {
    const pct = a.participationPercent ?? 100;
    return pct >= minThreshold && a.eligibleForCertificate !== false;
  });
  const pendingCount = eligibleAttendees.filter(a => !issuedUserIds.has(a.userId)).length;

  const handleIssueCertificates = () => {
    setIsIssuing(true);
    try {
      const res = issueCertificatesForEvent(selectedEventId);
      if (res.success) {
        showToast(
          'success',
          `Issued ${res.data} tamper-evident certificates to eligible attendees (≥${minThreshold}% participation).`,
          'Certificates Issued'
        );
      } else {
        showToast('error', res.error?.message || 'Failed to issue certificates.', 'Issuance Rejected');
      }
    } catch {
      showToast('error', 'Unexpected error during certificate batch generation.', 'Error');
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B08A4A] mb-1">
            Academic Credentials Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Certificate Issuance Console
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Issue cryptographically verified university certificates exclusively to attendees who meet the ≥{minThreshold}% participation requirement.
          </p>
        </div>

        {/* Event selector */}
        <div className="flex items-center gap-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] px-3 py-1.5 shadow-[2px_2px_0_0_#18212B]">
          <span className="text-xs font-mono font-bold uppercase text-[#62605B]">Event:</span>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="text-xs font-bold text-[#18212B] bg-transparent focus:outline-none cursor-pointer max-w-[260px] truncate"
          >
            {completedEvents.map(e => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issuance Action Banner - Inset Stats & Tactile Button */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-8 text-xs font-mono">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Verified Attendees</div>
            <div className="text-2xl font-bold text-[#18212B]">{verifiedAttendees.length} present</div>
          </div>
          <div className="border-l border-[#B9B4AA] pl-8">
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Eligible (≥{minThreshold}%)</div>
            <div className="text-2xl font-bold text-[#2F613B]">{eligibleAttendees.length} qualified</div>
          </div>
          <div className="border-l border-[#B9B4AA] pl-8">
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Issued Credentials</div>
            <div className="text-2xl font-bold text-[#2F613B]">{issuedCerts.length} active</div>
          </div>
          <div className="border-l border-[#B9B4AA] pl-8">
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Pending Issuance</div>
            <div className="text-2xl font-bold text-[#B08A4A]">{pendingCount} eligible</div>
          </div>
        </div>

        <Button
          variant="brass"
          size="md"
          leftIcon={<Award className="w-4 h-4" />}
          isLoading={isIssuing}
          disabled={pendingCount === 0}
          onClick={handleIssueCertificates}
        >
          {pendingCount > 0 ? `Issue All (${pendingCount}) Credentials` : 'All Eligible Certificates Issued ✓'}
        </Button>
      </div>

      {/* Attendees Table with Certificate Status */}
      {verifiedAttendees.length > 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B] overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[740px]">
            <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Verified Attendee</th>
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Participation & Threshold</th>
                <th className="py-2.5 px-4">Eligibility Status</th>
                <th className="py-2.5 px-4 text-right">Verification Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B4AA]/60">
              {verifiedAttendees.map(att => {
                const cert = certificates.find(c => c.eventId === selectedEventId && c.userId === att.userId);
                const hasCert = Boolean(cert);
                const pMins = att.participatedMinutes ?? totalEventMins;
                const pPct = att.participationPercent ?? 100;
                const isEligible = pPct >= minThreshold && att.eligibleForCertificate !== false;

                return (
                  <tr key={att._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#18212B]">{att.userName}</td>
                    <td className="py-3 px-4 font-mono text-[#18212B]">{att.userRollNumber}</td>
                    <td className="py-3 px-4 text-[#62605B]">{att.userDepartment}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#18212B] bg-[#EAE5DB] px-2 py-0.5 rounded-[2px] border border-[#B9B4AA]">
                        <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                        {pMins}/{totalEventMins}m ({pPct}%) • {att.method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {hasCert ? (
                        <span className="text-[10px] font-mono font-bold uppercase text-[#2F613B] bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                          Issued ✓
                        </span>
                      ) : isEligible ? (
                        <span className="text-[10px] font-mono font-bold uppercase text-[#B08A4A] bg-[#FAF0E6] px-2 py-0.5 rounded-[2px] border border-[#B08A4A]/30">
                          Eligible (≥{minThreshold}%) • Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase text-[#A83226] bg-[#FBEAEA] px-2 py-0.5 rounded-[2px] border border-[#A83226]/30">
                          Ineligible (&lt;{minThreshold}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-[#18212B] font-bold">
                      {cert ? cert.verificationCode : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No verified attendance records found"
          description="Certificates can only be issued after attendance has been scanned and recorded at the event."
        />
      )}
    </div>
  );
};

