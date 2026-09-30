'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge, CategoryBadge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';

export const AdminAttendanceView: React.FC = () => {
  const { events, registrations, attendance } = useApp();
  const { showToast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAttendance = attendance.filter(att => {
    if (selectedEventId !== 'ALL' && att.eventId !== selectedEventId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const evtTitle = events.find(e => e._id === att.eventId)?.title.toLowerCase() || '';
      return (
        att.userName.toLowerCase().includes(q) ||
        att.userRollNumber.toLowerCase().includes(q) ||
        att.userDepartment.toLowerCase().includes(q) ||
        evtTitle.includes(q)
      );
    }
    return true;
  });

  const totalConfirmedRegs =
    selectedEventId === 'ALL'
      ? registrations.filter(r => r.status === 'CONFIRMED').length
      : registrations.filter(r => r.eventId === selectedEventId && r.status === 'CONFIRMED').length;

  const turnoutPercent =
    totalConfirmedRegs > 0
      ? Math.round((filteredAttendance.length / totalConfirmedRegs) * 100)
      : 0;

  const handleExportAttendance = () => {
    const headers = ['Event Title', 'Student Name', 'Roll Number', 'Department', 'Check-in Timestamp', 'Verification Method'];
    const rows = filteredAttendance.map(a => {
      const evt = events.find(e => e._id === a.eventId);
      return [
        `"${evt?.title || a.eventId}"`,
        `"${a.userName}"`,
        `"${a.userRollNumber}"`,
        `"${a.userDepartment}"`,
        `"${a.checkedInAt}"`,
        `"${a.method.toUpperCase()}"`,
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
            DHSGSU Administrative Oversight
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            University Attendance Overview
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Real-time turnstile check-in records and participation verification across all campus venues.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={handleExportAttendance}
        >
          Export Attendance CSV
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
            Total Verified Check-Ins
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#2F613B] mt-1">
            {filteredAttendance.length}
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
            Confirmed Registrations Pool
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#18212B] mt-1">
            {totalConfirmedRegs}
          </div>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
          <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
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
            placeholder="Search by student name, roll number, department, or event..."
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
            className="px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-bold text-[#18212B] focus:outline-none focus:border-[#18212B] max-w-[260px] truncate"
          >
            <option value="ALL">All Campus Events ({attendance.length})</option>
            {events.map(e => (
              <option key={e._id} value={e._id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      {filteredAttendance.length > 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B] overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Student Participant</th>
                <th className="py-3 px-4 font-bold">Roll Number</th>
                <th className="py-3 px-4 font-bold">Event & Venue</th>
                <th className="py-3 px-4 font-bold">Check-In Time</th>
                <th className="py-3 px-4 text-right font-bold">Verification Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B4AA]/60">
              {filteredAttendance.map(att => {
                const evt = events.find(e => e._id === att.eventId);
                return (
                  <tr key={att._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212B]">{att.userName}</div>
                      <div className="text-[11px] text-[#62605B]">{att.userDepartment}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#18212B]">
                      {att.userRollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18212B] line-clamp-1">
                        {evt?.title || att.eventId}
                      </div>
                      <div className="text-[11px] text-[#62605B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#B6533C]" />
                        <span>{evt?.venue || 'Campus Venue'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#18212B]">
                      {new Date(att.checkedInAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(att.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[2px] bg-[#EBF3ED] text-[#2F613B] border border-[#B8D5C0]">
                        <CheckCircle2 className="w-3 h-3" />
                        {att.method === 'qr' ? 'Optical QR Scan' : 'Manual Override'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={QrCode}
          title="No attendance records match your filter"
          description="Checked-in participants will appear here automatically as organizers scan student QR passes at the venue entrance."
        />
      )}
    </div>
  );
};
