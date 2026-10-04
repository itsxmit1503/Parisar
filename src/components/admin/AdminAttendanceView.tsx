'use client';

import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Lock,
  MapPin,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';

export const AdminAttendanceView: React.FC = () => {
  const {
    events,
    registrations,
    attendance,
    markRosterAttendance,
    closeAttendanceSession,
    issueCertificatesForEvent,
  } = useApp();
  const { showToast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?._id || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedEvent = events.find(e => e._id === selectedEventId);

  const eventRoster = useMemo(() => {
    const baseRegs =
      selectedEventId === 'ALL'
        ? registrations.filter(r => r.status === 'CONFIRMED')
        : registrations.filter(r => r.eventId === selectedEventId && r.status === 'CONFIRMED');

    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseRegs;

    return baseRegs.filter(r => {
      const evtTitle = events.find(e => e._id === r.eventId)?.title.toLowerCase() || '';
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userRollNumber.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.userDepartment.toLowerCase().includes(q) ||
        evtTitle.includes(q)
      );
    });
  }, [registrations, selectedEventId, searchQuery, events]);

  const presentCount = useMemo(() => {
    return eventRoster.filter(r => {
      const att = attendance.find(
        a => a.eventId === r.eventId && (a.registrationId === r._id || a.userId === r.userId)
      );
      return Boolean(att && att.status !== 'ABSENT');
    }).length;
  }, [eventRoster, attendance]);

  const turnoutPercent =
    eventRoster.length > 0 ? Math.round((presentCount / eventRoster.length) * 100) : 0;

  const handleAdminOverride = (
    eventId: string,
    registrationId: string,
    status: 'PRESENT' | 'ABSENT',
    studentName: string
  ) => {
    const res = markRosterAttendance(eventId, registrationId, status);
    if (res.success) {
      showToast(
        'success',
        `Admin Override: ${studentName} marked ${
          status === 'PRESENT' ? 'Present' : 'Absent'
        }. Action recorded in Audit Log.`,
        'Administrative Override'
      );
    } else {
      showToast('error', res.error?.message || 'Override failed.');
    }
  };

  const handleExportAttendance = () => {
    const headers = [
      'Event Title',
      'Event Mode',
      'Student Name',
      'Roll Number',
      'Department',
      'Attendance Status',
      'Verification Method',
      'Timestamp',
    ];
    const rows = eventRoster.map(r => {
      const evt = events.find(e => e._id === r.eventId);
      const att = attendance.find(
        a => a.eventId === r.eventId && (a.registrationId === r._id || a.userId === r.userId)
      );
      const isPresent = Boolean(att && att.status !== 'ABSENT');
      return [
        `"${evt?.title || r.eventId}"`,
        `"${evt?.eventMode || 'OFFLINE'}"`,
        `"${r.userName}"`,
        `"${r.userRollNumber}"`,
        `"${r.userDepartment}"`,
        isPresent ? 'PRESENT' : 'ABSENT',
        `"${(att?.method || (isPresent ? 'roster' : 'unmarked')).toUpperCase()}"`,
        `"${att?.checkedInAt || 'Not Marked'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PARISAR_DHSGSU_Attendance_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'University attendance ledger exported to CSV.', 'Export Complete');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            DHSGSU Administrative Oversight &amp; Audited Override
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            University Attendance &amp; Certificate Governance
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Inspect offline roster attendance and online session duration logs. University Administrators can perform audited overrides on finalized events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedEvent && (
            <>
              {selectedEvent.attendanceSessionStatus !== 'FINALIZED' &&
                selectedEvent.attendanceSessionStatus !== 'CLOSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Lock className="w-3.5 h-3.5 text-[#B6533C]" />}
                    onClick={() => {
                      closeAttendanceSession(selectedEvent._id);
                      showToast(
                        'success',
                        `Attendance finalized for "${selectedEvent.title}".`
                      );
                    }}
                  >
                    Finalize Event Attendance
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Award className="w-3.5 h-3.5 text-[#2E6B4E]" />}
                onClick={() => {
                  const res = issueCertificatesForEvent(selectedEvent._id);
                  if (res.success) {
                    showToast('success', `Issued ${res.data} verified certificates.`);
                  } else {
                    showToast('warning', res.error?.message || 'No new certificates issued.');
                  }
                }}
              >
                Issue Verified Certificates
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportAttendance}
          >
            Export Attendance CSV
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
            Confirmed Roster
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#18212B] mt-1">
            {eventRoster.length}
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#2F613B]">
            Verified Present
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#2F613B] mt-1">
            {presentCount}
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#A83226]">
            Absent / Unmarked
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#A83226] mt-1">
            {Math.max(0, eventRoster.length - presentCount)}
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#B6533C]">
            Verified Turnout Ratio
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#B6533C] mt-1">
            {turnoutPercent}%
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3.5 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search by student name, roll number, email, department, or event..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-[#62605B]">Event:</span>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-bold text-[#18212B] focus:outline-none focus:border-[#18212B] max-w-[300px] truncate"
          >
            <option value="ALL">All Campus Events ({registrations.length})</option>
            {events.map(e => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.attendanceSessionStatus || 'NOT_STARTED'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Event Finalization Banner */}
      {selectedEvent && (
        <div className="p-3.5 bg-[#EAE5DB]/80 border border-[#B9B4AA] rounded-[3px] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#B6533C]" />
            <span>
              <strong>{selectedEvent.title}</strong> • Mode:{' '}
              <strong>{selectedEvent.eventMode || 'OFFLINE'}</strong> • Session Status:{' '}
              <strong>{selectedEvent.attendanceSessionStatus || 'NOT_STARTED'}</strong>
            </span>
          </div>
          {(selectedEvent.attendanceSessionStatus === 'FINALIZED' ||
            selectedEvent.attendanceSessionStatus === 'CLOSED') && (
            <Badge variant="warning">
              Finalized (Organizer Locked — Admin Override Permitted)
            </Badge>
          )}
        </div>
      )}

      {/* Attendance Roster & Override Table */}
      {eventRoster.length > 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B] overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Student Participant</th>
                <th className="py-3 px-4 font-bold">Roll Number</th>
                <th className="py-3 px-4 font-bold">Event &amp; Venue</th>
                <th className="py-3 px-4 font-bold">Verification Method &amp; Duration</th>
                <th className="py-3 px-4 text-right font-bold">Admin Roster Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B4AA]/60">
              {eventRoster.map(reg => {
                const evt = events.find(e => e._id === reg.eventId);
                const att = attendance.find(
                  a =>
                    a.eventId === reg.eventId &&
                    (a.registrationId === reg._id || a.userId === reg.userId)
                );
                const isPresent = Boolean(att && att.status !== 'ABSENT');

                return (
                  <tr key={reg._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212B]">{reg.userName}</div>
                      <div className="text-[11px] text-[#62605B]">{reg.userDepartment}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#18212B]">
                      {reg.userRollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212B] line-clamp-1">
                        {evt?.title || reg.eventId}
                      </div>
                      <div className="text-[11px] text-[#62605B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#B6533C]" />
                        <span>{evt?.venue || 'Campus Venue'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isPresent && att ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[2px] bg-[#EBF3ED] text-[#2F613B] border border-[#B8D5C0]">
                            <CheckCircle2 className="w-3 h-3" />
                            {att.method === 'admin_override'
                              ? 'Admin Override'
                              : att.method === 'online_session'
                              ? `Online Session (${att.participationPercent ?? 100}%)`
                              : 'Offline Roster'}
                          </span>
                          <div className="text-[10px] font-mono text-[#62605B]">
                            {new Date(att.checkedInAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#62605B] border border-[#B9B4AA]">
                          Absent / Unmarked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdminOverride(
                              reg.eventId,
                              reg._id,
                              'PRESENT',
                              reg.userName
                            )
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                            isPresent
                              ? 'bg-[#2F613B] text-white'
                              : 'bg-[#EAE5DB] text-[#18212B] hover:bg-[#2F613B] hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Present
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAdminOverride(
                              reg.eventId,
                              reg._id,
                              'ABSENT',
                              reg.userName
                            )
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                            !isPresent
                              ? 'bg-[#A83226] text-white'
                              : 'bg-[#EAE5DB] text-[#62605B] hover:bg-[#A83226] hover:text-white'
                          }`}
                        >
                          <XCircle className="w-3 h-3" /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No roster records match your filter"
          description="Select an event or clear your search query to inspect participant attendance."
        />
      )}
    </div>
  );
};
