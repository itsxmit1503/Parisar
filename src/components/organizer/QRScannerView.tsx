'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Camera,
  QrCode,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import { useToast } from '../ui/Toast';
import { ScanVerificationResult } from '../../types';

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
    scanTemporaryAttendanceQr,
    triggerOnlineCheckpoint,
    markRosterAttendance,
    markAllRosterPresent,
    resetRosterAttendance,
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

  // In-App Camera Scanner State (Offline Events — Section 15)
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isScanningToken, setIsScanningToken] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanVerificationResult | null>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const lastScannedTokenRef = useRef<string>('');

  const selectedEvent = events.find(e => e._id === selectedEventId) || organizerEvents[0];

  const isFinalized =
    selectedEvent?.attendanceSessionStatus === 'FINALIZED' ||
    selectedEvent?.attendanceSessionStatus === 'CLOSED';
  const isOpen =
    selectedEvent?.attendanceSessionStatus === 'OPEN' ||
    selectedEvent?.attendanceSessionStatus === 'ACTIVE';
  const isAdmin = currentUser.role === 'admin';
  const isLockedForCurrentUser = isFinalized && !isAdmin;
  const isOnlineEvent = selectedEvent?.eventMode === 'ONLINE';

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as {
          stop: () => Promise<void>;
          clear: () => void;
        };
        await scanner.stop();
        scanner.clear();
      } catch {
        // ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleProcessScannedToken = async (rawToken: string) => {
    if (!selectedEvent || !rawToken.trim()) return;
    setIsScanningToken(true);
    const result = await scanTemporaryAttendanceQr(selectedEvent._id, rawToken.trim());
    setIsScanningToken(false);
    setLastScanResult(result);

    if (result.status === 'SUCCESS') {
      showToast('success', result.message, 'Attendance Marked');
      setManualTokenInput('');
    } else {
      showToast('warning', result.message, 'Scan Validation Notice');
    }
  };

  const startCamera = async () => {
    if (!selectedEvent) return;
    setScannerOpen(true);
    setCameraError(null);
    setLastScanResult(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // Wait a tick for #parisar-qr-reader DOM element
      await new Promise(r => setTimeout(r, 100));
      const scanner = new Html5Qrcode('parisar-qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        decodedText => {
          if (decodedText && decodedText !== lastScannedTokenRef.current) {
            lastScannedTokenRef.current = decodedText;
            handleProcessScannedToken(decodedText);
            setTimeout(() => {
              lastScannedTokenRef.current = '';
            }, 3000);
          }
        },
        () => {
          // ignore frame parse errors while scanning
        }
      );
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setCameraError('Camera permission denied. Allow camera access or paste the temporary QR token below.');
      } else {
        setCameraError('Camera unavailable on this device. You can verify the student 60s token below.');
      }
      setCameraActive(false);
    }
  };

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

  // Recent check-ins list
  const recentCheckIns = useMemo(() => {
    if (!selectedEvent) return [];
    return attendance
      .filter(a => a.eventId === selectedEvent._id && a.status !== 'ABSENT')
      .sort(
        (a, b) =>
          new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
      )
      .slice(0, 5);
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
        `Attendance session opened for "${selectedEvent.title}".`
      );
    } else {
      showToast('error', res.error?.message || 'Could not start attendance session.');
    }
  };

  const handleTriggerOnlineCheckpoint = async () => {
    if (!selectedEvent) return;
    const res = await triggerOnlineCheckpoint(selectedEvent._id);
    if (res.success) {
      showToast(
        'success',
        `Activated Checkpoint #${res.data.checkpointNumber} (valid for 2 minutes). Registered online students must confirm participation now.`,
        '2-Minute Checkpoint Activated'
      );
    } else {
      showToast('error', res.error.message, 'Checkpoint Error');
    }
  };

  const handleMarkParticipant = (
    registrationId: string,
    status: 'PRESENT' | 'ABSENT',
    studentName: string
  ) => {
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
    stopCamera();
    setScannerOpen(false);
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
        att?.method || (isPresent ? 'qr' : 'N/A'),
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
              {isOnlineEvent
                ? 'Online Session 2-Minute Checkpoint Console'
                : 'Offline Dynamic 60s QR Scanner & Roster Console'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#18212B]">
            Event Attendance Management
          </h1>
          <p className="text-sm text-[#4E5A67] mt-1">
            {isOnlineEvent
              ? 'Manage online session check-ins and trigger 2-minute live participation verification checkpoints.'
              : 'Scan student 60-second temporary attendance QR codes or manage the registered participant roster.'}
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
              onChange={e => {
                stopCamera();
                setScannerOpen(false);
                setLastScanResult(null);
                setSelectedEventId(e.target.value);
              }}
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
              <Badge variant={isOnlineEvent ? 'info' : 'neutral'}>
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
                {isOnlineEvent ? (
                  <Globe className="w-3.5 h-3.5 text-[#365B6D]" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#2E6B4E]" />
                )}
                {selectedEvent.venue}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#B08A4A]" />
                {isOnlineEvent
                  ? `Checkpoints Required: ${selectedEvent.onlinePolicy?.requiredCheckpoints ?? 2} of ${selectedEvent.onlinePolicy?.totalCheckpoints ?? 3}`
                  : 'Temporary Student QR: 60s Expiry'}
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

          {/* Primary Session, Scanner & Checkpoint Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isOpen && !isFinalized && (
              <Button variant="primary" size="md" onClick={handleStartAttendance}>
                <Play className="w-4 h-4" /> Start Attendance
              </Button>
            )}

            {!isOnlineEvent && !isFinalized && (
              <Button
                variant={scannerOpen ? 'dark' : 'primary'}
                size="md"
                onClick={() => {
                  if (scannerOpen) {
                    stopCamera();
                    setScannerOpen(false);
                  } else {
                    if (!isOpen) handleStartAttendance();
                    startCamera();
                  }
                }}
              >
                <Camera className="w-4 h-4" />
                {scannerOpen ? 'Close Scanner' : 'Open Scanner'}
              </Button>
            )}

            {selectedEvent.eventMode !== 'OFFLINE' && !isFinalized && (
              <Button
                variant="primary"
                size="md"
                onClick={handleTriggerOnlineCheckpoint}
              >
                <Radio className="w-4 h-4" /> Trigger 2-Min Checkpoint
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
              <RotateCcw className="w-4 h-4" /> Reset
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

      {/* ============================================================ */}
      {/* IN-APP ORGANIZER CAMERA SCANNER (OFFLINE EVENTS — SEC 15)    */}
      {/* ============================================================ */}
      {scannerOpen && !isOnlineEvent && (
        <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-xl p-5 mb-6 shadow-[4px_4px_0_0_#18212B]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Camera Viewport + Manual Token Fallback */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#B6533C]" />
                  <h3 className="text-base font-extrabold text-[#18212B]">
                    Organizer In-App Attendance Scanner
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#2F613B]">
                  {cameraActive ? '● CAMERA ACTIVE' : '● READY TO VERIFY'}
                </span>
              </div>

              <div className="bg-[#18212B] rounded-lg overflow-hidden border border-[#18212B]">
                <div
                  id="parisar-qr-reader"
                  style={{ width: '100%', minHeight: cameraActive ? 280 : 0 }}
                />

                {!cameraActive && (
                  <div className="p-6 text-center space-y-2">
                    <Camera className="w-10 h-10 text-[#B6533C] mx-auto" />
                    <p className="text-xs text-[#FCFAF5]">
                      {cameraError ||
                        'Point camera at the student’s 60-second temporary attendance QR code.'}
                    </p>
                    <Button variant="primary" size="sm" onClick={startCamera}>
                      <Camera className="w-4 h-4" /> Start Camera
                    </Button>
                  </div>
                )}
              </div>

              {/* Token Verification Input for Desktop / Web Testing */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleProcessScannedToken(manualTokenInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Or paste student 60s temporary QR token (PAT_...)"
                  value={manualTokenInput}
                  onChange={e => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#F4F0E8] border border-[#D8D0C2] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isScanningToken}
                >
                  Verify Token
                </Button>
              </form>
            </div>

            {/* Right: Scan Result Display + Recent Check-Ins */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#62605B]">
                Live Scan Verification Result
              </div>

              {lastScanResult ? (
                <div
                  className={`p-4 rounded-lg border-2 space-y-2 ${
                    lastScanResult.status === 'SUCCESS'
                      ? 'bg-[#EBF3ED] border-[#2F613B] text-[#2F613B]'
                      : lastScanResult.status === 'ALREADY_PRESENT' ||
                        lastScanResult.status === 'DUPLICATE'
                      ? 'bg-[#FBF4E8] border-[#B08A4A] text-[#8F5E15]'
                      : 'bg-[#FDF0EE] border-[#A83226] text-[#A83226]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-extrabold text-sm">
                    {lastScanResult.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    <span>{lastScanResult.message}</span>
                  </div>

                  {lastScanResult.registration && (
                    <div className="text-xs text-[#18212B] font-mono pt-1 border-t border-current/20">
                      <div>
                        Student: <strong>{lastScanResult.registration.userName}</strong>
                      </div>
                      <div>
                        Roll No: <strong>{lastScanResult.registration.userRollNumber}</strong>
                      </div>
                      <div>Dept: {lastScanResult.registration.userDepartment}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#EAE5DB]/60 border border-[#B9B4AA] text-xs text-[#62605B]">
                  Scan a student&apos;s 60-second temporary QR code. The scanner validates registration, event match, 60s expiry, and one-time token use, then stays open for the next student.
                </div>
              )}

              {/* Recent Check-Ins */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#62605B]">
                  Recent Check-Ins ({recentCheckIns.length})
                </div>
                {recentCheckIns.length === 0 ? (
                  <div className="text-xs text-[#7A8591]">No students checked in yet.</div>
                ) : (
                  <div className="space-y-1.5">
                    {recentCheckIns.map(rec => (
                      <div
                        key={rec._id}
                        className="px-3 py-2 bg-[#F4F0E8] border border-[#D8D0C2] rounded-md flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#18212B]">{rec.userName}</span>{' '}
                          <span className="font-mono text-[#62605B]">
                            ({rec.userRollNumber})
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#2F613B] font-bold">
                          {new Date(rec.checkedInAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            Registered Participants ({filteredRoster.length})
          </span>
          {selectedEvent.eventMode !== 'OFFLINE' && (
            <span className="text-xs font-mono text-[#365B6D]">
              Online Checkpoint Policy: {selectedEvent.onlinePolicy?.requiredCheckpoints ?? 2} of{' '}
              {selectedEvent.onlinePolicy?.totalCheckpoints ?? 3} Checkpoints (2-Min Window)
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
              const verifiedCps = att?.verifiedCheckpoints?.length ?? 0;
              const reqCps = selectedEvent.onlinePolicy?.requiredCheckpoints ?? 2;
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
                        {att?.method === 'qr' && (
                          <Badge variant="info">60S QR VERIFIED</Badge>
                        )}
                        {att?.method === 'admin_override' && (
                          <Badge variant="warning">ADMIN OVERRIDE</Badge>
                        )}
                        {att?.method === 'online_session' && (
                          <Badge variant="info">ONLINE CHECKPOINTS</Badge>
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

                      {/* Online / Hybrid Checkpoint Telemetry */}
                      {selectedEvent.eventMode !== 'OFFLINE' && att && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#F4F0E8] border border-[#D8D0C2] text-[#18212B]">
                            Checkpoints Verified: {verifiedCps} / {reqCps} Required
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              isEligible
                                ? 'bg-[#2E6B4E]/15 text-[#2E6B4E]'
                                : 'bg-[#B93829]/15 text-[#B93829]'
                            }`}
                          >
                            {partPct}% —{' '}
                            {isEligible ? 'CERTIFICATE ELIGIBLE' : 'INCOMPLETE CHECKPOINTS'}
                          </span>
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

      {/* Finalize Attendance Confirmation Modal */}
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
                <Lock className="w-3.5 h-3.5" /> Finalize &amp; Lock Attendance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
