'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Certificate } from '../../types';
import { 
  Award, 
  ShieldCheck, 
  ExternalLink, 
  Printer, 
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ParisarLogo } from '../ui/ParisarLogo';

export const CertificatesView: React.FC<{ onExploreEvents: () => void }> = ({ onExploreEvents }) => {
  const { certificates, currentUser } = useApp();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const userCertificates = certificates.filter(c => c.userId === currentUser._id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="border-b border-[#B9B4AA] pb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#B08A4A] mb-1">
          Academic Credentials
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
          Verified University Certificates
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Tamper-evident certificates issued following verified attendance and authorized by academic conveners.
        </p>
      </div>

      {userCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userCertificates.map(cert => (
            <div
              key={cert._id}
              className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[0_2px_4px_rgba(24,33,43,0.05)] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(24,33,43,0.08)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#B08A4A] border border-[#B9B4AA]">
                    Certificate of {cert.certificateType}
                  </span>
                  <span className="font-mono text-[11px] text-[#18212B] bg-[#EAE5DB] px-2 py-0.5 rounded-[2px] border border-[#B9B4AA]">
                    {cert.verificationCode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#18212B] leading-snug">
                  {cert.eventTitle}
                </h3>

                <div className="mt-3 space-y-1 text-xs text-[#18212B] bg-[#EAE5DB]/50 p-2.5 rounded-[3px] border border-[#B9B4AA]">
                  <div>Recipient: <strong className="text-[#18212B]">{cert.userName}</strong> ({cert.userRollNumber})</div>
                  <div>Issued: {new Date(cert.issuedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="text-[#62605B] text-[11px]">Authorized by: {cert.issueAuthorizedBy}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#B9B4AA] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#B08A4A]">
                  <ShieldCheck className="w-4 h-4 text-[#B08A4A]" />
                  <span className="font-bold text-[11px]">Cryptographically Signed</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5 text-[#B6533C]" />}
                  onClick={() => setSelectedCert(cert)}
                >
                  View Credential
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates issued yet"
          description="Certificates are generated once organizers complete events and verify your QR attendance check-in."
          actionLabel="Explore Upcoming Events"
          onAction={onExploreEvents}
        />
      )}

      {/* Formal Certificate Preview Modal */}
      {selectedCert && (
        <Modal
          isOpen={Boolean(selectedCert)}
          onClose={() => setSelectedCert(null)}
          title="Verified University Credential"
          subtitle={`Credential ID: ${selectedCert.verificationCode}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#62605B] font-mono">
                Official document issued under the authority of Dr. Harisingh Gour Vishwavidyalaya, Sagar (M.P.).
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Certificate
                </Button>
                <Button variant="dark" size="sm" onClick={() => setSelectedCert(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          {/* Certificate Frame - Tactile Academic Document */}
          <div className="bg-[#FCFAF5] border-4 border-double border-[#18212B] p-8 rounded-[3px] text-center relative shadow-[3px_3px_0_0_#18212B]">
            {/* University Crest / Emblem */}
            <div className="flex justify-center mb-3">
              <ParisarLogo variant="seal" size="md" />
            </div>

            <div className="text-sm font-bold uppercase tracking-widest text-[#B6533C]">
              Dr. Harisingh Gour Vishwavidyalaya, Sagar
            </div>
            <div className="text-[10px] text-[#62605B] uppercase tracking-wider mt-0.5">
              A Central University • Established 1946 • Formerly University of Saugor
            </div>
            <div className="text-[10px] font-bold text-[#B08A4A] uppercase tracking-wider mt-0.5">
              Office of the Dean of Students&apos; Welfare (DSW) & Academic Council
            </div>

            <div className="w-16 h-0.5 bg-[#B08A4A] mx-auto my-4"></div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#18212B] tracking-wide uppercase">
              Certificate of {selectedCert.certificateType}
            </h2>

            <p className="text-xs text-[#62605B] mt-4">
              This is to certify that
            </p>

            <div className="text-xl font-bold text-[#18212B] my-2 border-b-2 border-[#18212B] pb-1 inline-block min-w-[280px]">
              {selectedCert.userName}
            </div>

            <p className="text-xs text-[#62605B] max-w-lg mx-auto leading-relaxed mt-2">
              Enrollment / Roll Number <strong className="font-mono text-[#18212B]">{selectedCert.userRollNumber}</strong> of the 
              Department of <strong className="text-[#18212B]">{selectedCert.department}</strong> has satisfactorily completed and fulfilled 
              all verified attendance and participation requirements for the university-authorized program:
            </p>

            <div className="text-base font-bold text-[#18212B] my-4 bg-[#EAE5DB] p-3 rounded-[3px] border border-[#B9B4AA]">
              {selectedCert.eventTitle}
            </div>

            <div className="grid grid-cols-2 gap-8 text-xs pt-6 mt-4 border-t border-[#B9B4AA]">
              <div className="text-left font-mono">
                <div className="text-[10px] text-[#62605B] uppercase font-bold">Verification Hash:</div>
                <div className="font-bold text-[#18212B]">{selectedCert.verificationCode}</div>
                <div className="text-[10px] text-[#62605B] mt-0.5">
                  Issued: {new Date(selectedCert.issuedAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[9px] text-[#64788A] mt-0.5 uppercase">
                  DHSGSU PARISAR Academic Ledger
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#18212B]">{selectedCert.issueAuthorizedBy}</div>
                <div className="text-[10px] text-[#62605B]">Faculty Convener / Dean of Students&apos; Welfare</div>
                <div className="text-[10px] text-[#2F613B] font-bold mt-0.5 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#2F613B]" />
                  Cryptographically Verified Attendance
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
