'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Calendar, User, Building2 } from 'lucide-react';
import { Certificate } from '../../../../types';
import { ParisarLogo } from '../../../../components/ui/ParisarLogo';

export default function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = use(params);
  const decodedId = decodeURIComponent(certificateId || '');
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/v1/certificates?code=${encodeURIComponent(decodedId)}`)
      .then(r => r.json())
      .then(res => {
        if (!mounted) return;
        if (res.success && res.data?.certificate) {
          setCert(res.data.certificate);
        } else {
          setErrorMsg(res.error?.message || `No authentic DHSGSU certificate matches "${decodedId}".`);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setErrorMsg('Unable to reach the PARISAR Certificate Verification Registry.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [decodedId]);

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#18212B] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ParisarLogo size="md" />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#18212B]">
                PARISAR • Credential Registry
              </h1>
              <p className="text-xs text-[#62605B]">
                Dr. Harisingh Gour Vishwavidyalaya, Sagar (M.P.)
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B6533C] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </Link>
        </div>

        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-xl p-6 sm:p-8 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm font-medium text-[#62605B]">
              Verifying credential <span className="font-mono font-bold text-[#18212B]">{decodedId}</span> against DHSGSU Registry...
            </div>
          ) : cert ? (
            <div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#2E6B4E]/10 border border-[#2E6B4E]/30 mb-6">
                <CheckCircle2 className="w-7 h-7 text-[#2E6B4E] shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6B4E] block">
                    Authentic University Credential Verified
                  </span>
                  <p className="text-sm font-bold text-[#18212B]">
                    Certificate ID: <span className="font-mono">{cert.verificationCode}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-b border-[#D8D2C5] py-5 my-5">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#B6533C] mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#62605B]">
                      Recipient Student
                    </p>
                    <p className="text-base font-extrabold text-[#18212B]">{cert.userName}</p>
                    <p className="text-xs font-mono text-[#62605B]">
                      Roll No: {cert.userRollNumber} • {cert.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-[#B08A4A] mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#62605B]">
                      Official Campus Event
                    </p>
                    <p className="text-base font-bold text-[#18212B]">{cert.eventTitle}</p>
                    <p className="text-xs text-[#62605B]">
                      Credential Type: {cert.certificateType} • Verified Participation:{' '}
                      {cert.participationPercent ?? 100}%
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-[#64788A] mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#62605B]">
                      Issuing Authority
                    </p>
                    <p className="text-sm font-semibold text-[#18212B]">{cert.issueAuthorizedBy}</p>
                    <p className="text-xs text-[#62605B]">
                      {cert.academicAuthority || "Office of the Dean of Students' Welfare (DSW), DHSGSU"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#62605B] mt-1 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#62605B]">
                      Issue Timestamp
                    </p>
                    <p className="text-xs font-mono text-[#18212B]">
                      {new Date(cert.issuedAt).toLocaleString('en-IN', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#62605B]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#2E6B4E]">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically Recorded in PARISAR Ledger
                </span>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded bg-[#18212B] text-[#FCFAF5] font-bold hover:bg-[#B6533C] transition-colors"
                >
                  Print Verification Record
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <XCircle className="w-12 h-12 text-[#B43E2B] mx-auto mb-3" />
              <h2 className="text-lg font-bold text-[#18212B] mb-1">
                Credential Verification Failed
              </h2>
              <p className="text-sm text-[#62605B] max-w-md mx-auto mb-5">{errorMsg}</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B6533C] text-white text-xs font-bold"
              >
                Return to PARISAR Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
