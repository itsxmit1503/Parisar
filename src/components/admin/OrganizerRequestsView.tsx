'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  Building2, 
  UserCheck, 
  AlertCircle,
  Search,
  Filter,
  Users
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { OrganizerVerificationRequest } from '../../types';

export const OrganizerRequestsView: React.FC = () => {
  const { organizerRequests, adminReviewOrganizerRequest, allUsers } = useApp();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = organizerRequests.filter((req: OrganizerVerificationRequest) => {
    const matchesFilter = filterStatus === 'ALL' || req.status === filterStatus;
    const matchesSearch = 
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.universityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (requestId: string, name: string) => {
    const res = adminReviewOrganizerRequest(requestId, true, 'Approved by Dean of Students Welfare.');
    if (res.success) {
      showToast('success', `${name} has been approved as an official DHSGSU Organizer.`, 'Organizer Verified');
    }
  };

  const handleReject = (requestId: string, name: string) => {
    const res = adminReviewOrganizerRequest(requestId, false, 'Insufficient institutional justification.');
    if (res.success) {
      showToast('info', `Organizer request for ${name} has been rejected.`, 'Request Rejected');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#B6533C] uppercase tracking-wider">
            DHSGSU Administrative Governance
          </span>
          <h2 className="text-2xl font-bold text-[#18212B]">
            Organizer Verification Requests
          </h2>
          <p className="text-xs text-[#62605B] mt-1">
            Review and grant event-creation privileges to student leads and faculty conveners.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#FCFAF5] border border-[#B9B4AA] p-1 rounded-[2px] text-xs font-mono">
          {(['PENDING', 'APPROVED', 'ALL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1 font-bold rounded-[2px] transition-colors ${
                filterStatus === tab
                  ? 'bg-[#B6533C] text-white'
                  : 'text-[#62605B] hover:text-[#18212B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 bg-[#FCFAF5] border border-[#B9B4AA] px-3 py-2 rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] max-w-md">
        <Search className="w-4 h-4 text-[#62605B]" />
        <input
          type="text"
          placeholder="Search by name, roll number, or department..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs text-[#18212B] focus:outline-none w-full placeholder:text-[#62605B]"
        />
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-12 text-center shadow-[2px_2px_0_0_#18212B] space-y-2">
          <ShieldCheck className="w-8 h-8 text-[#2F613B] mx-auto" />
          <h3 className="font-bold text-base text-[#18212B]">No {filterStatus.toLowerCase()} requests</h3>
          <p className="text-xs text-[#62605B]">All organizer applications have been reviewed and processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req: OrganizerVerificationRequest) => (
            <div
              key={req.id}
              className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Applicant Dossier */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-[#18212B]">
                    {req.fullName}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]">
                    {req.universityId}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] uppercase border ${
                    req.status === 'PENDING'
                      ? 'bg-[#EAE5DB] text-[#B08A4A] border-[#B9B4AA]'
                      : req.status === 'APPROVED'
                      ? 'bg-[#2F613B]/10 text-[#2F613B] border-[#2F613B]/30'
                      : 'bg-[#B6533C]/10 text-[#B6533C] border-[#B6533C]/30'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div className="text-xs text-[#62605B] space-y-1">
                  <div>
                    <strong className="text-[#18212B]">Department:</strong> {req.department} • <strong className="text-[#18212B]">Designation:</strong> {req.designation}
                  </div>
                  <div>
                    <strong className="text-[#18212B]">University Email:</strong> {req.email} • <strong className="text-[#18212B]">Contact:</strong> {req.phone}
                  </div>
                  <div className="p-2.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px] text-[#18212B] leading-relaxed mt-2">
                    <strong className="font-mono text-[10px] text-[#62605B] uppercase block">Reason for organizing:</strong>
                    {req.reason}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#62605B] pt-1">
                  Submitted: {new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Actions for Pending Requests */}
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#B9B4AA]">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Check className="w-4 h-4" />}
                    onClick={() => handleApprove(req.id, req.fullName)}
                  >
                    Approve Organizer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<X className="w-4 h-4" />}
                    onClick={() => handleReject(req.id, req.fullName)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
