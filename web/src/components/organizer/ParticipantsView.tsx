'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Download, 
  QrCode
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { EmptyState } from '../ui/EmptyState';

interface ParticipantsViewProps {
  initialEventId?: string;
  onNavigateToScanner?: (eventId: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  initialEventId,
  onNavigateToScanner,
}) => {
  const { events, registrations, verifyAndCheckIn } = useApp();
  const { showToast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || events[0]?._id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'pending'>('all');

  const currentEvent = events.find(e => e._id === selectedEventId) || events[0];

  const eventRegs = registrations.filter(r => r.eventId === selectedEventId && r.status === 'CONFIRMED');

  const filteredRegs = eventRegs.filter(reg => {
    const isCheckedIn = Boolean(reg.checkedInAt);
    if (statusFilter === 'checkedIn' && !isCheckedIn) return false;
    if (statusFilter === 'pending' && isCheckedIn) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        reg.userName.toLowerCase().includes(q) ||
        reg.userRollNumber.toLowerCase().includes(q) ||
        reg.userDepartment.toLowerCase().includes(q) ||
        reg.qrToken.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const checkedInCount = eventRegs.filter(r => Boolean(r.checkedInAt)).length;

  const handleManualCheckIn = (qrToken: string, userName: string) => {
    const res = verifyAndCheckIn(selectedEventId, qrToken, 'manual');
    if (res.status === 'SUCCESS') {
      showToast('success', `${userName} manually marked present.`, 'Attendance Logged');
    } else {
      showToast('error', res.message, 'Check-in Error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Roll Number', 'Department', 'Email', 'Registered At', 'Checked In At', 'Token'];
    const rows = eventRegs.map(r => [
      `"${r.userName}"`,
      `"${r.userRollNumber}"`,
      `"${r.userDepartment}"`,
      `"${r.userEmail}"`,
      `"${r.registeredAt}"`,
      `"${r.checkedInAt || 'Not Checked In'}"`,
      `"${r.qrToken}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PARISAR_Roster_DHSGSU_${currentEvent?.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Participant roster exported to CSV file.', 'Export Complete');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            Participant Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Event Participant Roster
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            View student registrations, manage manual override check-ins, and export verified records.
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
            {events.map(e => (
              <option key={e._id} value={e._id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats & Export Banner */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Registered</div>
            <div className="text-xl font-bold text-[#18212B]">{eventRegs.length} students</div>
          </div>
          <div className="border-l border-[#B9B4AA] pl-6">
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Verified Present</div>
            <div className="text-xl font-bold text-[#2F613B]">
              {checkedInCount} ({eventRegs.length > 0 ? Math.round((checkedInCount / eventRegs.length) * 100) : 0}%)
            </div>
          </div>
          <div className="border-l border-[#B9B4AA] pl-6">
            <div className="text-[10px] uppercase font-bold text-[#62605B]">Pending Check-in</div>
            <div className="text-xl font-bold text-[#B08A4A]">
              {eventRegs.length - checkedInCount}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToScanner && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<QrCode className="w-3.5 h-3.5 text-[#B6533C]" />}
              onClick={() => onNavigateToScanner(selectedEventId)}
            >
              Scan Entrance
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search by student name, roll number, department, token..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-[2px] text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#18212B] text-[#FCFAF5] border border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
            }`}
          >
            All ({eventRegs.length})
          </button>
          <button
            onClick={() => setStatusFilter('checkedIn')}
            className={`px-3 py-1 rounded-[2px] text-xs font-bold transition-all ${
              statusFilter === 'checkedIn'
                ? 'bg-[#18212B] text-[#FCFAF5] border border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
            }`}
          >
            Present ({checkedInCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-[2px] text-xs font-bold transition-all ${
              statusFilter === 'pending'
                ? 'bg-[#18212B] text-[#FCFAF5] border border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                : 'bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] hover:bg-[#EAE5DB]'
            }`}
          >
            Pending ({eventRegs.length - checkedInCount})
          </button>
        </div>
      </div>

      {/* Participants Structured Table */}
      {filteredRegs.length > 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Attendee</th>
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Pass Token</th>
                <th className="py-2.5 px-4">Verification</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B4AA]/60">
              {filteredRegs.map(reg => {
                const isCheckedIn = Boolean(reg.checkedInAt);

                return (
                  <tr key={reg._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#18212B]">
                      {reg.userName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#18212B]">
                      {reg.userRollNumber}
                    </td>
                    <td className="py-3 px-4 text-[#62605B]">
                      {reg.userDepartment}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#62605B]">
                      {reg.qrToken}
                    </td>
                    <td className="py-3 px-4">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#2F613B] bg-[#EBF3ED] px-2 py-0.5 rounded-[2px] border border-[#2F613B]/30">
                          <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#62605B] bg-[#EAE5DB] px-2 py-0.5 rounded-[2px] border border-[#B9B4AA]">
                          Awaiting Scan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isCheckedIn ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleManualCheckIn(reg.qrToken, reg.userName)}
                        >
                          Mark Present
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#62605B] font-mono">
                          {new Date(reg.checkedInAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
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
          title="No participants found"
          description="No student registrations match your current filter."
        />
      )}
    </div>
  );
};
