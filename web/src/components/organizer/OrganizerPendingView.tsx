'use client';

import React from 'react';
import { ShieldAlert, Clock, ArrowRight, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { OrganizerVerificationRequest } from '../../types';

interface OrganizerPendingViewProps {
  onSwitchToAdmin: () => void;
  onSwitchToStudent: () => void;
}

export const OrganizerPendingView: React.FC<OrganizerPendingViewProps> = ({
  onSwitchToAdmin,
  onSwitchToStudent
}) => {
  const { currentUser, adminReviewOrganizerRequest, organizerRequests } = useApp();

  // Find this user's pending request
  const myRequest = organizerRequests.find((r: OrganizerVerificationRequest) => r.userId === currentUser._id || r.email === currentUser.email) || {
    id: 'req-current',
    fullName: currentUser.name,
    universityId: currentUser.rollNumber || 'Y23122018',
    department: currentUser.department,
    designation: currentUser.designation || 'Student Organizer',
    reason: 'Application submitted for organizing academic and departmental events under DHSGSU guidelines.',
    status: 'PENDING',
    submittedAt: currentUser.createdAt
  };

  const handleSimulateApprove = () => {
    // Approve current request directly in prototype
    adminReviewOrganizerRequest(myRequest.id, true, 'Approved via verification simulator for testing.');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-6">
      {/* Institutional Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#62605B]">
        <span>PARISAR</span>
        <span>/</span>
        <span>Organizer Governance</span>
        <span>/</span>
        <span className="text-[#B6533C] font-bold">Verification Pending</span>
      </div>

      {/* Main Notice Card */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-8 shadow-[4px_4px_0_0_#18212B] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#B08A4A] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#18212B]">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-[#B08A4A] uppercase tracking-wider">
                Status: Pending DHSGSU Review
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#18212B]">
                Organizer Access Not Yet Approved
              </h2>
            </div>
          </div>

          <div className="px-3 py-1 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono font-bold text-[#18212B]">
            DHSGSU Rule § 6.2
          </div>
        </div>

        {/* Institutional Explanation */}
        <div className="space-y-3 text-xs sm:text-sm text-[#62605B] leading-relaxed">
          <p>
            In accordance with Dr. Harisingh Gour Vishwavidyalaya event policies, 
            <strong> student and faculty organizers must be formally verified</strong> before creating official campus events or managing attendees.
          </p>
          <p>
            This prevents fake or spam events from appearing in the university calendar. 
            Your organizer application has been forwarded to the <strong>Office of the Dean of Students Welfare (DSW)</strong> at Gour Bhavan.
          </p>
        </div>

        {/* Submitted Application Dossier */}
        <div className="bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] p-4 space-y-3 text-xs">
          <div className="font-bold text-[#18212B] flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
            <Building2 className="w-4 h-4 text-[#B6533C]" />
            <span>Submitted Verification Application</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[#62605B] font-mono text-[10px]">APPLICANT NAME</span>
              <div className="font-bold text-[#18212B]">{myRequest.fullName}</div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px]">UNIVERSITY ID / ROLL NO</span>
              <div className="font-bold text-[#18212B] font-mono">{myRequest.universityId}</div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px]">DEPARTMENT</span>
              <div className="font-bold text-[#18212B]">{myRequest.department}</div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px]">DESIGNATION / ROLE</span>
              <div className="font-bold text-[#18212B]">{myRequest.designation}</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#62605B] font-mono text-[10px]">STATED REASON FOR ORGANIZING</span>
              <div className="text-[#18212B] mt-0.5 leading-relaxed">{myRequest.reason}</div>
            </div>
          </div>
        </div>

        {/* Demonstration Actions */}
        <div className="pt-4 border-t border-[#B9B4AA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={handleSimulateApprove}
            >
              Simulate Instant Admin Approval (Demo)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToAdmin}
            >
              Log In as Administrator to Review
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchToStudent}
          >
            Continue as Student Participant →
          </Button>
        </div>
      </div>
    </div>
  );
};
