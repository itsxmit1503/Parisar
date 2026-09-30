'use client';

import React, { useState } from 'react';
import {
  Clock,
  Building2,
  XCircle,
  CheckCircle2,
  Send,
  LogOut,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/Toast';
import { OrganizerVerificationRequest } from '../../types';

interface OrganizerPendingViewProps {
  onLogout: () => void;
}

export const OrganizerPendingView: React.FC<OrganizerPendingViewProps> = ({
  onLogout,
}) => {
  const { currentUser, organizerRequests, resubmitOrganizerVerification } = useApp();
  const { showToast } = useToast();

  // Locate this user's verification request
  const myRequest: OrganizerVerificationRequest =
    organizerRequests.find(
      (r: OrganizerVerificationRequest) =>
        r.userId === currentUser._id || r.email === currentUser.email
    ) || {
      id: 'req-current',
      userId: currentUser._id,
      fullName: currentUser.name,
      universityId: currentUser.rollNumber || 'Y23122018',
      department: currentUser.department,
      designation: currentUser.designation || 'Faculty / Society Event Convener',
      email: currentUser.email,
      phone: currentUser.phone || '+91 98260 00000',
      reason:
        'Application submitted for organizing academic and departmental events under DHSGSU guidelines.',
      status: currentUser.organizerStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
      submittedAt: currentUser.createdAt,
      reviewRemarks:
        currentUser.organizerStatus === 'REJECTED'
          ? 'Requires formal endorsement letter from Head of Department and a designated faculty advisor.'
          : undefined,
    };

  const isRejected =
    currentUser.organizerStatus === 'REJECTED' || myRequest.status === 'REJECTED';

  const [isEditingReapply, setIsEditingReapply] = useState(false);
  const [newReason, setNewReason] = useState(myRequest.reason);
  const [newDesignation, setNewDesignation] = useState(myRequest.designation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) {
      showToast('error', 'Please provide an updated justification and faculty endorsement reference.', 'Required Field');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = resubmitOrganizerVerification(newReason, newDesignation);
      setIsSubmitting(false);
      if (res.success) {
        setIsEditingReapply(false);
        showToast(
          'success',
          'Your updated organizer verification request has been submitted for DHSGSU review.',
          'Request Resubmitted'
        );
      } else {
        showToast('error', res.error.message, 'Submission Failed');
      }
    }, 350);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-6">
      {/* Institutional Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-mono text-[#62605B]">
        <div className="flex items-center gap-2">
          <span>PARISAR</span>
          <span>/</span>
          <span>ORGANIZER VERIFICATION</span>
          <span>/</span>
          <span className={isRejected ? 'text-[#A83226] font-bold' : 'text-[#B08A4A] font-bold'}>
            {isRejected ? 'Status: Rejected' : 'Status: Pending Review'}
          </span>
        </div>

        <span className="hidden sm:inline">Dr. Harisingh Gour Vishwavidyalaya</span>
      </div>

      {/* Main Verification Status Card */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-8 shadow-[4px_4px_0_0_#18212B] space-y-6">
        {/* Status Banner Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-6">
          <div className="flex items-center gap-3.5">
            {isRejected ? (
              <div className="w-12 h-12 rounded-[3px] bg-[#FDF0EE] border border-[#E9BFB8] text-[#A83226] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#18212B]">
                <XCircle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-[3px] bg-[#FBF4E8] border border-[#E5D2AF] text-[#B08A4A] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#18212B]">
                <Clock className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B6533C]">
                ORGANIZER VERIFICATION
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#18212B] tracking-tight">
                {isRejected ? 'Status: Rejected' : 'Status: Pending Review'}
              </h1>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-[2px] text-xs font-mono font-bold uppercase border ${
              isRejected
                ? 'bg-[#FDF0EE] text-[#A83226] border-[#E9BFB8]'
                : 'bg-[#FBF4E8] text-[#8F5E15] border-[#E5D2AF]'
            }`}
          >
            {isRejected ? 'Verification Rejected' : 'Request Submitted • Pending'}
          </div>
        </div>

        {/* Status Explanation */}
        {!isRejected ? (
          <div className="space-y-3 text-xs sm:text-sm text-[#18212B] leading-relaxed bg-[#EAE5DB]/50 p-4 rounded-[3px] border border-[#B9B4AA]">
            <p className="font-bold text-sm">
              Your organizer request is currently being reviewed by DHSGSU.
            </p>
            <p className="text-[#62605B]">
              Your request has been submitted for university verification to the{' '}
              <strong className="text-[#18212B]">
                Office of the Dean of Students&apos; Welfare (DSW)
              </strong>
              . Organizer access — including the Organizer Dashboard, Create Event, Participant Rosters, and QR Attendance Scanner — will be activated automatically after approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs sm:text-sm text-[#A83226] leading-relaxed bg-[#FDF0EE] p-4 rounded-[3px] border-l-4 border-l-[#A83226] border border-[#E9BFB8]">
            <div className="font-bold flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Your organizer verification request was not approved.</span>
            </div>
            <p className="text-[#18212B]">
              <strong>Administrative Remarks:</strong>{' '}
              {myRequest.reviewRemarks ||
                'Insufficient departmental authorization or missing faculty convener endorsement.'}
            </p>
            <p className="text-xs text-[#62605B]">
              You may submit a revised verification request below with updated departmental justification.
            </p>
          </div>
        )}

        {/* Verification Timeline Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#EBF3ED] border border-[#B8D5C0] rounded-[2px] flex items-center gap-2.5 text-[#2F613B]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-[10px] uppercase opacity-75">Step 1</div>
              <div className="font-bold">Request Submitted</div>
            </div>
          </div>

          <div
            className={`p-3 border rounded-[2px] flex items-center gap-2.5 ${
              isRejected
                ? 'bg-[#FDF0EE] border-[#E9BFB8] text-[#A83226]'
                : 'bg-[#FBF4E8] border-[#E5D2AF] text-[#8F5E15]'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 shrink-0" />
            )}
            <div>
              <div className="text-[10px] uppercase opacity-75">Step 2</div>
              <div className="font-bold">
                {isRejected ? 'Status: Rejected' : 'Status: Pending'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] flex items-center gap-2.5 text-[#62605B]">
            <Building2 className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-[10px] uppercase opacity-75">Step 3</div>
              <div className="font-bold">Organizer Panel Access</div>
            </div>
          </div>
        </div>

        {/* Submitted Application Dossier */}
        <div className="bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[3px] p-5 space-y-3 text-xs">
          <div className="font-bold text-[#18212B] flex items-center justify-between uppercase font-mono tracking-wider text-[11px] border-b border-[#B9B4AA] pb-2">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#B6533C]" />
              <span>Submitted Verification Dossier</span>
            </span>
            <span className="text-[10px] text-[#62605B]">
              {new Date(myRequest.submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[#62605B] font-mono text-[10px] uppercase">Full Name</span>
              <div className="font-bold text-[#18212B] mt-0.5">{myRequest.fullName}</div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px] uppercase">
                University ID / Roll / Employee ID
              </span>
              <div className="font-bold text-[#18212B] font-mono mt-0.5">
                {myRequest.universityId}
              </div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px] uppercase">Department</span>
              <div className="font-bold text-[#18212B] mt-0.5">{myRequest.department}</div>
            </div>
            <div>
              <span className="text-[#62605B] font-mono text-[10px] uppercase">
                Semester / Designation
              </span>
              <div className="font-bold text-[#18212B] mt-0.5">{myRequest.designation}</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#62605B] font-mono text-[10px] uppercase">
                Reason for Organizing
              </span>
              <div className="text-[#18212B] mt-0.5 leading-relaxed bg-[#FCFAF5] p-2.5 rounded-[2px] border border-[#B9B4AA]">
                {myRequest.reason}
              </div>
            </div>
          </div>
        </div>

        {/* Re-application Form for Rejected Organizers (Section 12) */}
        {isRejected && (
          <div className="pt-2 border-t border-[#B9B4AA]">
            {!isEditingReapply ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-[#62605B]">
                  Have you obtained your Departmental / Faculty Convener endorsement?
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => setIsEditingReapply(true)}
                >
                  Submit New Verification Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResubmit} className="space-y-4 bg-[#EAE5DB]/40 p-4 rounded-[3px] border border-[#B9B4AA]">
                <div className="text-xs font-mono font-bold uppercase text-[#18212B]">
                  Submit Revised Organizer Verification Request
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Updated Designation / Faculty Advisor Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                    Updated Justification & Departmental Endorsement Details *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newReason}
                    onChange={e => setNewReason(e.target.value)}
                    placeholder="Provide complete details of the official university event and faculty advisor approval..."
                    className="w-full p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingReapply(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Submit Revised Application
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#B9B4AA] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#62605B]">
            Signed in as <strong className="text-[#18212B]">{currentUser.email}</strong>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="w-3.5 h-3.5 text-[#A83226]" />}
            onClick={onLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
