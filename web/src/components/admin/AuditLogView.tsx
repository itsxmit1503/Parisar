'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';

export const AuditLogView: React.FC = () => {
  const { registrations, attendance, certificates, events } = useApp();

  // Construct realistic audit trail
  const logs = [
    ...attendance.map(a => ({
      id: `audit-att-${a._id}`,
      action: 'ATTENDANCE_CHECKIN_VERIFIED',
      details: `Attendee ${a.userName} (${a.userRollNumber}) successfully verified via ${a.method.toUpperCase()} scanner for event "${events.find(e => e._id === a.eventId)?.title || a.eventId}".`,
      timestamp: a.checkedInAt,
      actor: `Organizer ID: ${a.checkedInBy}`,
      severity: 'SUCCESS',
    })),
    ...registrations.map(r => ({
      id: `audit-reg-${r._id}`,
      action: 'REGISTRATION_PASS_ISSUED',
      details: `Generated digital event pass with secure QR token [${r.qrToken}] for student ${r.userName} (${r.userRollNumber}).`,
      timestamp: r.registeredAt,
      actor: `User: ${r.userEmail}`,
      severity: 'INFO',
    })),
    ...certificates.map(c => ({
      id: `audit-cert-${c._id}`,
      action: 'CERTIFICATE_CRYPTOGRAPHIC_SEAL',
      details: `Cryptographic academic certificate generated with verification code [${c.verificationCode}] authorized by "${c.issueAuthorizedBy}".`,
      timestamp: c.issuedAt,
      actor: 'Authority Engine',
      severity: 'SUCCESS',
    })),
  ];

  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
          Security & Operational Integrity
        </div>
        <h1 className="text-2xl font-bold text-[#18212B] tracking-tight">
          System Audit Log
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Tamper-evident log of attendance verifications, pass generation, and academic credential issuance.
        </p>
      </div>

      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold">Event Timestamp</th>
              <th className="py-3 px-4 font-bold">Audit Action</th>
              <th className="py-3 px-4 font-bold">Execution Details</th>
              <th className="py-3 px-4 text-right font-bold">Actor / Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B9B4AA]/50 font-mono">
            {logs.slice(0, 25).map(log => (
              <tr key={log.id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                <td className="py-3 px-4 text-[#62605B] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={log.severity === 'SUCCESS' ? 'success' : 'info'}>
                    {log.action}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-sans text-[#18212B] text-xs leading-relaxed max-w-md">
                  {log.details}
                </td>
                <td className="py-3 px-4 text-right text-[#62605B] text-[11px]">
                  {log.actor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
