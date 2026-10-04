'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Search,
  Play,
  Lock,
  RotateCcw,
  Users,
  UserCheck,
  UserX,
  Percent,
  Calendar,
  MapPin,
  Globe,
  ShieldAlert,
  Award,
  Clock,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import { useToast } from '../ui/Toast';

interface QRScannerViewProps {
  onNavigateToParticipants?: (eventId: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  onNavigateToParticipants,
}) => {
  const {
    events,
    registrations,
    attendance,
    currentUser,
    allUsers,
    startAttendanceSession,
    closeAttendanceSession,
    markRosterAttendance,
    markAllRosterPresent,
    resetRosterAttendance,
    updateParticipantParticipation,
    issueCertificatesForEvent,
  } = useApp();
  const { showToast } = useToast();

  // Organizer sees their own events; Admin sees all active/completed events
  const organizerEvents = useMemo(() => {
    const relevant = events.filter(
      e =>
        (currentUser.role === 'admin' || e.organizerId === currentUser._id) &&
        e.status !== 'DRAFT' &&
        e.status !== 'REJECTED'
    );
    return relevant.length > 0 ? relevant : events;
  }, [events, currentUser]);

  const [selectedEventId, setSelectedEventId] = useState<string>(
    organizerEvents[0]?._id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const selectedEvent = events.find(e => e._id === selectedEventId) || organizerEvents[0];

  const isFinalized =
    selectedEvent?.attendanceSessionStatus === 'FINALIZED' ||
    selectedEvent?.attendanceSessionStatus === 'CLOSED';
  const isOpen =
    selectedEvent?.attendanceSessionStatus === 'OPEN' ||
    selectedEvent?.attendanceSessionStatus === 'ACTIVE';
  const isAdmin = currentUser.role === 'admin';
  const isLockedForCurrentUser = isFinalized && !isAdmin;

  // All confirmed registrations for the selected event
  const eventRegistrations = useMemo(() => {
    if (!selectedEvent) return [];
    return registrations.filter(
      r => r.eventId === selectedEvent._id && r.status === 'CONFIRMED'
    );
  }, [registrations, selectedEvent]);

  // Attendance lookup map by registrationId and userId
  const eventAttendanceMap = useMemo(() => {
    const map = new Map<string, (typeof attendance)[number]>();
    if (!selectedEvent) return map;
    attendance
      .filter(a => a.eventId === selectedEvent._id)
      .forEach(a => {
        if (a.registrationId) map.set(a.registrationId, a);
        map.set(a.userId, a);
      });
    return map;
  }, [attendance, selectedEvent]);

  // Compute roster statistics
  const stats = useMemo(() => {
    const totalRegistered = eventRegistrations.length;
    let presentCount = 0;
    eventRegistrations.forEach(reg => {
      const att = eventAttendanceMap.get(reg._id) || eventAttendanceMap.get(reg.userId);
      if (att && att.status !== 'ABSENT') {
        presentCount += 1;
      }
    });
    const absentCount = Math.max(0, totalRegistered - presentCount);
    const attendancePercent =
      totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

    return {
      totalRegistered,
      presentCount,
      absentCount,
      attendancePercent,
    };
  }, [eventRegistrations, eventAttendanceMap]);

  // Filter roster by search (name, roll number, email) and status
  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eventRegistrations.filter(reg => {
      const att = eventAttendanceMap.get(reg._id) || eventAttendanceMap.get(reg.userId);
      const isPresent = Boolean(att && att.status !== 'ABSENT');

      if (filterStatus === 'PRESENT' && !isPresent) return false;
      if (filterStatus === 'ABSENT' && isPresent) return false;

      if (!q) return true;
      return (
        reg.userName.toLowerCase().includes(q) ||
        reg.userRollNumber.toLowerCase().includes(q) ||
        reg.userEmail.toLowerCase().includes(q) ||
        reg.userDepartment.toLowerCase().includes(q)
      );
    });
  }, [eventRegistrations, eventAttendanceMap, searchQuery, filterStatus]);

  const handleStartAttendance = () => {
    if (!selectedEvent) return;
    const res = startAttendanceSession(selectedEvent._id);
    if (res.success) {
      showToast(
        'success',
        `Attendance session opened for "${selectedEvent.title}". You may now mark participants Present or Absent.`
      );
    } else {
      showToast('error', res.error?.message || 'Could not start attendance session.');
    }
  };

  const handleMarkParticipant = (registrationId: string, status: 'PRESENT' | 'ABSENT', studentName: string) => {
    if (!selectedEvent) return;
    const res = markRosterAttendance(selectedEvent._id, registrationId, status);
    if (res.success) {
      showToast(
        status === 'PRESENT' ? 'success' : 'info',
        `${studentName} marked ${status === 'PRESENT' ? 'Present' : 'Absent'}${
          isFinalized && isAdmin ? ' (University Admin Override logged)' : ''
        }.`
      );
    } else {
      showToast('error', res.error?.message || 'Unable to update attendance.');
    }
  };

  const handleMarkAllPresent = () => {
    if (!selectedEvent) return;
    const res = markAllRosterPresent(selectedEvent._id);
    if (res.success) {
      showToast('success', `All ${res.data} registered participants marked Present.`);
    } else {
      showToast('error', res.error?.message || 'Could not mark all present.');
    }
  };

  const handleResetAttendance = () => {
    if (!selectedEvent) return;
    const res = resetRosterAttendance(selectedEvent._id);
    if (res.success) {
      showToast('info', 'Attendance selections reset to unmarked state.');
    } else {
      showToast('error', res.error?.message || 'Could not reset attendance.');
    }
  };

  const handleConfirmFinalize = () => {
    if (!selectedEvent) return;
    const res = closeAttendanceSession(selectedEvent._id);
    setShowFinalizeModal(false);
    if (res.success) {
      showToast(
        'success',
        `Attendance finalized for "${selectedEvent.title}". Normal organizer edits are now locked.`
      );
    } else {
      showToast('error', res.error?.message || 'Failed to finalize attendance.');
    }
  };

  const handleIssueCertificates = () => {
    if (!selectedEvent) return;
    const res = issueCertificatesForEvent(selectedEvent._id);
    if (res.success) {
      showToast('success', `Issued ${res.data} verified participation certificates!`);
    } else {
      showToast('warning', res.error?.message || 'Could not issue certificates.');
    }
  };

  const handleExportAttendanceCsv = () => {
    if (!selectedEvent) return;
    const headers = [
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Attendance Status',
      'Verification Method',
      'Participated Minutes',
      'Participation %',
      'Certificate Eligible',
      'Timestamp',
    ];
    const rows = eventRegistrations.map(reg => {
      const att = eventAttendanceMap.get(reg._id) || eventAttendanceMap.get(reg.userId);
      const isPresent = Boolean(att && att.status !== 'ABSENT');
      return [
        `"${reg.userName}"`,
        `"${reg.userRollNumber}"`,
        `"${reg.userEmail}"`,
        `"${reg.userDepartment}"`,
        isPresent ? 'PRESENT' : 'ABSENT',
        att?.method || (isPresent ? 'roster' : 'N/A'),
        att?.participatedMinutes ?? (isPresent ? 180 : 0),
        `${att?.participationPercent ?? (isPresent ? 100 : 0)}%`,
        att?.eligibleForCertificate ? 'ELIGIBLE' : isPresent ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
        att?.checkedInAt ? new Date(att.checkedInAt).toLocaleString('en-IN') : 'Not Marked',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PARISAR_Attendance_${selectedEvent.title.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Official attendance register exported as CSV.');
  };

  if (!selectedEvent) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 text-center">
        <p className="text-[#4E5A67]">No events available for attendance management.</p>
      </div>
    );
  }

  const finalizedByUser = selectedEvent.attendanceFinalizedBy
    ? allUsers.find(u => u._id === selectedEvent.attendanceFinalizedBy)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Header & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 pb-5 border-b border-[#D8D0C2]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2E6B4E]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#B6533C] font-semibold">
              {selectedEvent.eventMode === 'ONLINE'
                ? 'Online Session Participation & Roster'
                : 'Official Roster-Based Attendance Console'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#18212B]">
            Event Attendance Management
          </h1>
          <p className="text-sm text-[#4E5A67] mt-1">
            Mark and finalize participant attendance directly from the verified university registration roster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[260px]">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7A8591] mb-1">
              Select Event
            </label>
            <select
              aria-label="Select Event for Attendance"
              value={selectedEvent._id}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FCFAF5] border border-[#D8D0C2] text-sm font-medium text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {organizerEvents.map(evt => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.eventMode || 'OFFLINE'})
                </option>
              ))}
            </select>
          </div>
          {onNavigateToParticipants && (
            <div className="pt-5">
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigateToParticipants(selectedEvent._id)}
              >
                <SlidersHorizontal className="w-4 h-4" /> Full Participant Ledger
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Event Banner & Session Status */}
      <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h2 className="text-xl font-serif font-bold text-[#18212B]">
                {selectedEvent.title}
              </h2>
              {isFinalized ? (
                <Badge variant="neutral">
                  <Lock className="w-3 h-3 mr-1 inline" /> Attendance Finalized
                </Badge>
              ) : isOpen ? (
                <Badge variant="success">Attendance Open</Badge>
              ) : (
                <Badge variant="warning">Attendance Not Started</Badge>
              )}
              <Badge variant={selectedEvent.eventMode === 'ONLINE' ? 'info' : 'neutral'}>
                {selectedEvent.eventMode || 'OFFLINE'} EVENT
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#4E5A67]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B6533C]" />
                {new Date(selectedEvent.startTime).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {selectedEvent.eventMode === 'ONLINE' ? (
                  <Globe className="w-3.5 h-3.5 text-[#365B6D]" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#2E6B4E]" />
                )}
                {selectedEvent.venue}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#B08A4A]" />
                Min Threshold: {selectedEvent.minParticipationPercent ?? 80}%
              </span>
            </div>

            {isFinalized && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EAE3D5] border border-[#D8D0C2] text-xs text-[#18212B]">
                <Lock className="w-3.5 h-3.5 text-[#B6533C] shrink-0" />
                <span>
                  Finalized on{' '}
                  <strong>
                    {selectedEvent.attendanceFinalizedAt || selectedEvent.attendanceClosedAt
                      ? new Date(
                          (selectedEvent.attendanceFinalizedAt ||
                            selectedEvent.attendanceClosedAt)!
                        ).toLocaleString('en-IN')
                      : 'Record Locked'}
                  </strong>
                  {finalizedByUser ? ` by ${finalizedByUser.name}` : ''}.{' '}
                  {isAdmin
                    ? 'As University Administrator, your overrides are recorded in the Audit Log.'
                    : 'Normal organizer edits are locked.'}
                </span>
              </div>
            )}
          </div>

          {/* Primary Session & Bulk Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isOpen && !isFinalized && (
              <Button variant="primary" size="md" onClick={handleStartAttendance}>
                <Play className="w-4 h-4" /> Start Attendance
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              disabled={isLockedForCurrentUser || eventRegistrations.length === 0}
              onClick={handleMarkAllPresent}
            >
              <UserCheck className="w-4 h-4" /> Mark All Present
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isLockedForCurrentUser || stats.presentCount === 0}
              onClick={handleResetAttendance}
            >
              <RotateCcw className="w-4 h-4" /> Reset / Undo
            </Button>

            {!isFinalized && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowFinalizeModal(true)}
              >
                <Lock className="w-4 h-4" /> Close Attendance
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleIssueCertificates}>
              <Award className="w-4 h-4" /> Issue Certificates
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportAttendanceCsv}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Live Summary Cards: Registered, Present, Absent, Attendance % */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#7A8591] mb-1">
            <span>Registered</span>
            <Users className="w-4 h-4 text-[#18212B]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#18212B]">
            {stats.totalRegistered}
          </p>
          <p className="text-[11px] text-[#7A8591] mt-0.5">Confirmed Roster</p>
        </div>

        <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#2E6B4E] mb-1">
            <span>Present</span>
            <UserCheck className="w-4 h-4 text-[#2E6B4E]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#2E6B4E]">
            {stats.presentCount}
          </p>
          <p className="text-[11px] text-[#7A8591] mt-0.5">Verified Attendees</p>
        </div>

        <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#B93829] mb-1">
            <span>Absent</span>
            <UserX className="w-4 h-4 text-[#B93829]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#B93829]">
            {stats.absentCount}
          </p>
          <p className="text-[11px] text-[#7A8591] mt-0.5">Unmarked / Absent</p>
        </div>

        <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#B08A4A] mb-1">
            <span>Attendance %</span>
            <Percent className="w-4 h-4 text-[#B08A4A]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#18212B]">
            {stats.attendancePercent}%
          </p>
          <p className="text-[11px] text-[#7A8591] mt-0.5">Turnout Ratio</p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl p-4 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7A8591] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, roll number, or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#F4F0E8] border border-[#D8D0C2] text-sm text-[#18212B] placeholder-[#7A8591] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#EAE3D5] p-1 rounded-lg">
          {(['ALL', 'PRESENT', 'ABSENT'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-[#18212B] text-[#FCFAF5] shadow-xs'
                  : 'text-[#4E5A67] hover:text-[#18212B]'
              }`}
            >
              {st === 'ALL'
                ? `All (${stats.totalRegistered})`
                : st === 'PRESENT'
                ? `Present (${stats.presentCount})`
                : `Absent (${stats.absentCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Participant Roster Table / List */}
      <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-[#EAE3D5]/60 border-b border-[#D8D0C2] flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#18212B]">
            Registered Students List ({filteredRoster.length})
          </span>
          {selectedEvent.eventMode !== 'OFFLINE' && (
            <span className="text-xs font-mono text-[#365B6D]">
              Online Session Auto-Threshold: {selectedEvent.minParticipationPercent ?? 80}% Duration
            </span>
          )}
        </div>

        {filteredRoster.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-[#7A8591] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-[#18212B]">
              No matching students found in the registration roster
            </p>
            <p className="text-xs text-[#7A8591] mt-1">
              Try clearing your search query or switching the status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D8D0C2]">
            {filteredRoster.map(reg => {
              const att =
                eventAttendanceMap.get(reg._id) || eventAttendanceMap.get(reg.userId);
              const isPresent = Boolean(att && att.status !== 'ABSENT');
              const studentObj = allUsers.find(u => u._id === reg.userId);
              const partPct = att?.participationPercent ?? (isPresent ? 100 : 0);
              const partMins = att?.participatedMinutes ?? 0;
              const reqMins = att?.requiredMinutes ?? 144;
              const isEligible =
                att?.eligibleForCertificate ??
                (isPresent && partPct >= (selectedEvent.minParticipationPercent ?? 80));

              return (
                <div
                  key={reg._id}
                  className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isPresent ? 'bg-[#2E6B4E]/[0.04]' : 'hover:bg-[#F4F0E8]/60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <UserAvatar
                      name={reg.userName}
                      profileImage={studentObj?.profileImage}
                      size="md"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#18212B] text-sm">
                          {reg.userName}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#EAE3D5] text-[#18212B] font-medium">
                          {reg.userRollNumber}
                        </span>
                        {isPresent ? (
                          <Badge variant="success">PRESENT</Badge>
                        ) : (
                          <Badge variant="neutral">ABSENT</Badge>
                        )}
                        {att?.method === 'admin_override' && (
                          <Badge variant="warning">ADMIN OVERRIDE</Badge>
                        )}
                        {att?.method === 'online_session' && (
                          <Badge variant="info">ONLINE SESSION</Badge>
                        )}
                      </div>

                      <div className="text-xs text-[#4E5A67] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{reg.userDepartment}</span>
                        <span>•</span>
                        <span className="font-mono">{reg.userEmail}</span>
                        {att?.checkedInAt && isPresent && (
                          <>
                            <span>•</span>
                            <span className="text-[#2E6B4E] font-mono">
                              Marked at{' '}
                              {new Date(att.checkedInAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Online / Hybrid Session Duration Telemetry */}
                      {selectedEvent.eventMode !== 'OFFLINE' && att && isPresent && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#F4F0E8] border border-[#D8D0C2] text-[#18212B]">
                            Verified Duration: {partMins} mins (Required: {reqMins} mins)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              isEligible
                                ? 'bg-[#2E6B4E]/15 text-[#2E6B4E]'
                                : 'bg-[#B93829]/15 text-[#B93829]'
                            }`}
                          >
                            {partPct}% —{' '}
                            {isEligible ? 'CERTIFICATE ELIGIBLE' : 'BELOW THRESHOLD'}
                          </span>
                          {!isLockedForCurrentUser && (
                            <button
                              type="button"
                              onClick={() =>
                                updateParticipantParticipation(
                                  att._id,
                                  (att.participatedMinutes || 60) + 45
                                )
                              }
                              className="px-2 py-0.5 rounded bg-[#18212B] text-[#FCFAF5] hover:bg-[#2E6B4E] transition-colors"
                            >
                              +45m Verified Duration
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Present / Absent Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isLockedForCurrentUser}
                      onClick={() =>
                        handleMarkParticipant(reg._id, 'PRESENT', reg.userName)
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        isPresent
                          ? 'bg-[#2E6B4E] text-white shadow-xs'
                          : 'bg-[#F4F0E8] text-[#18212B] border border-[#D8D0C2] hover:border-[#2E6B4E] hover:text-[#2E6B4E]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Present
                    </button>

                    <button
                      type="button"
                      disabled={isLockedForCurrentUser}
                      onClick={() =>
                        handleMarkParticipant(reg._id, 'ABSENT', reg.userName)
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        !isPresent
                          ? 'bg-[#B93829] text-white shadow-xs'
                          : 'bg-[#F4F0E8] text-[#4E5A67] border border-[#D8D0C2] hover:border-[#B93829] hover:text-[#B93829]'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Finalize Attendance Confirmation Modal (Section 4) */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18212B]/60 backdrop-blur-xs">
          <div className="bg-[#FCFAF5] border border-[#D8D0C2] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#B6533C]/15 flex items-center justify-center text-[#B6533C]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#18212B]">
                  Finalize Event Attendance?
                </h3>
                <p className="text-xs font-mono text-[#7A8591]">
                  {selectedEvent.title}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#EAE3D5]/70 border border-[#D8D0C2] text-xs text-[#18212B] leading-relaxed mb-4">
              <strong>
                Attendance will be finalized for this event. Normal organizer edits will no longer be allowed.
              </strong>
              <p className="mt-1.5 text-[#4E5A67]">
                Present: <strong>{stats.presentCount}</strong> | Absent:{' '}
                <strong>{stats.absentCount}</strong> ({stats.attendancePercent}% turnout).
                After finalization, only University Administration can perform an audited override.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinalizeModal(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmFinalize}>
                <Lock className="w-3.5 h-3.5" /> Finalize & Lock Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
