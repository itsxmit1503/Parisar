'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  Smartphone,
  Download,
  ShieldCheck,
  Layers,
  UserCheck,
  WifiOff,
  Bell,
  FileCode2,
  ExternalLink,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIRECT_APK_PATH = '/downloads/parisar-v2.0.0-release.apk';
const GITHUB_RELEASE_URL = 'https://github.com/itsxmit1503/Parisar/releases';

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const handleDownload = () => {
    setDownloadProgress(20);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === null) return 20;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadProgress(null);
            showToast(
              'success',
              'PARISAR v3.0.0 Official Android APK download started.',
              'APK Download Initiated'
            );
            const link = document.createElement('a');
            link.href = DIRECT_APK_PATH;
            link.download = 'parisar-v3.0.0-release.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 250);
          return 100;
        }
        return prev + 40;
      });
    }, 180);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR for Android • DHSGSU"
      subtitle="Official mobile client for Dr. Harisingh Gour Vishwavidyalaya (Two Clients, One Platform)"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[#62605B] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B08A4A]" />
            <span>Signed with DHSGSU Android Release Keystore (v3.0.0)</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-[#18212B]">
        {/* Banner with Download Button */}
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA] text-[11px] font-mono font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Latest Official Release • Version 3.0.0</span>
            </div>

            <h4 className="text-base font-bold text-[#18212B] leading-snug">
              Direct Android APK Distribution • Dr. Harisingh Gour Vishwavidyalaya
            </h4>

            <p className="text-[#62605B] leading-relaxed text-xs">
              Install PARISAR v3.0.0 directly on any Android device running Android 8.0+.
              Includes Role-Based Authentication (Student, Verified Organizer, University Administrator), Digital Registration Cards, Roster-Based Offline Attendance, and Online Session Duration Tracking.
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {downloadProgress !== null ? (
                <div className="space-y-1.5 w-full max-w-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#62605B] font-mono font-bold">
                    <span>Downloading parisar-v3.0.0-release.apk...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] h-2.5 overflow-hidden">
                    <div
                      className="bg-[#B6533C] h-full transition-all"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownload}
                  >
                    Download Android APK
                  </Button>
                  <a
                    href={GITHUB_RELEASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-[#EAE5DB] hover:bg-[#DFD9CE] text-[#18212B] border border-[#B9B4AA] font-bold text-xs transition-all"
                  >
                    <span>View GitHub Releases</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B6533C]" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Native Android Package Summary Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shrink-0 text-center w-44">
            <Smartphone className="w-10 h-10 text-[#18212B] mb-2" />
            <div className="font-mono text-xs font-bold text-[#18212B]">
              in.edu.dhsgsu.parisar
            </div>
            <div className="text-[10px] text-[#62605B] font-mono mt-1">
              Min SDK 26 • Target 34
            </div>
          </div>
        </div>

        {/* Platform Strategy Explanation */}
        <div className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] space-y-2 shadow-[2px_2px_0_0_#18212B]">
          <div className="font-bold text-[#18212B] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#B6533C]" />
            <span>Platform Strategy: Dual Clients, Single Source of Truth</span>
          </div>
          <p className="text-[#62605B] leading-relaxed">
            The web portal and the Android application are <strong>not separate products</strong>. Both communicate through the same versioned REST API (
            <code className="font-mono text-[11px] bg-[#EAE5DB] border border-[#B9B4AA] px-1 py-0.5 rounded-[2px] text-[#18212B]">
              /api/v1
            </code>
            ) and share the same university data store.
          </p>
        </div>

        {/* Native Mobile Capabilities */}
        <div>
          <div className="font-mono font-bold text-[#18212B] mb-2 uppercase tracking-wider text-[11px]">
            Mobile-Native Capabilities
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-[#B6533C] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">
                  Roster &amp; Online Session Attendance
                </div>
                <div className="text-[#62605B] text-[11px] mt-0.5">
                  Organizers mark present/absent directly on the roster; students join authenticated online sessions.
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-[#64788A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">
                  Offline Registration Card Storage
                </div>
                <div className="text-[#62605B] text-[11px] mt-0.5">
                  Digital registration cards remain available even during auditorium cellular blackouts.
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-[#B08A4A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Urgent Campus Alerts</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">
                  Immediate alerts when venues change or attendance sessions open.
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <FileCode2 className="w-4 h-4 text-[#18212B] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Native Android Bridge</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">
                  Pull-to-refresh, offline SharedPreferences cache, and hardware back-button handling.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
