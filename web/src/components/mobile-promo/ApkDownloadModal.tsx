'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { 
  Smartphone, 
  Download, 
  ShieldCheck, 
  Layers, 
  Camera, 
  WifiOff, 
  Bell, 
  FileCode2
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  React.useEffect(() => {
    // Generate QR code pointing to simulated APK download endpoint
    QRCode.toDataURL('https://parisar.dhsgsu.edu.in/downloads/android/parisar-v1.0.0.apk', {
      width: 180,
      margin: 1,
      color: { dark: '#18212B', light: '#FCFAF5' },
    })
      .then(url => setQrCodeUrl(url))
      .catch(console.error);
  }, []);

  const handleDownload = () => {
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === null) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadProgress(null);
            showToast('success', 'PARISAR-v1.0.0-release.apk download initiated.', 'APK Download Complete');
            const link = document.createElement('a');
            link.href = '/downloads/parisar-v1.0.0-release.apk';
            link.download = 'parisar-v1.0.0-release.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARISAR for Android • DHSGSU"
      subtitle="Official mobile client built with React Native & Expo (Two Clients, One Platform)"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[#62605B] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B08A4A]" />
            <span>Signed with DHSGSU Android Release Keystore</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-[#18212B]">
        {/* Banner with Download Button and QR Code */}
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA] text-[11px] font-mono font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Official Release • Version 1.0.0</span>
            </div>

            <h4 className="text-base font-bold text-[#18212B] leading-snug">
              Direct Android APK Distribution • Dr. Harisingh Gour Vishwavidyalaya
            </h4>

            <p className="text-[#62605B] leading-relaxed text-xs">
              Install PARISAR directly on any Android device running Android 9.0+. 
              Uses the same centralized DHSGSU backend and authentication as the web portal.
            </p>

            <div className="pt-1">
              {downloadProgress !== null ? (
                <div className="space-y-1.5 max-w-xs">
                  <div className="flex items-center justify-between text-[11px] text-[#62605B] font-mono font-bold">
                    <span>Downloading APK...</span>
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
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownload}
                >
                  Download APK (42.8 MB)
                </Button>
              )}
            </div>
          </div>

          {/* QR code to scan from phone */}
          <div className="flex flex-col items-center justify-center p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] shrink-0">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Scan to download APK" className="w-32 h-32 border border-[#B9B4AA] rounded-[2px]" />
            ) : (
              <div className="w-32 h-32 bg-[#FCFAF5] flex items-center justify-center text-[#62605B]">
                Loading QR...
              </div>
            )}
            <div className="text-[10px] text-[#62605B] font-mono font-bold mt-1.5">
              Scan with phone to install
            </div>
          </div>
        </div>

        {/* Platform Strategy Explanation (Section 7 & 10) */}
        <div className="p-4 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] space-y-2 shadow-[2px_2px_0_0_#18212B]">
          <div className="font-bold text-[#18212B] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#B6533C]" />
            <span>Platform Strategy: Dual Clients, Single Source of Truth</span>
          </div>
          <p className="text-[#62605B] leading-relaxed">
            The web portal and the Android application are <strong>not separate products</strong>. Both communicate through the same versioned REST API (<code className="font-mono text-[11px] bg-[#EAE5DB] border border-[#B9B4AA] px-1 py-0.5 rounded-[2px] text-[#18212B]">/api/v1</code>) and share the exact same MongoDB database. Actions taken on the mobile app update the web interface in real time and vice versa.
          </p>
        </div>

        {/* Native Mobile Capabilities */}
        <div>
          <div className="font-mono font-bold text-[#18212B] mb-2 uppercase tracking-wider text-[11px]">
            Mobile-Native Capabilities
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <Camera className="w-4 h-4 text-[#B6533C] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Hardware Camera QR Scanning</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">High-speed barcode scanner for rapid door check-ins.</div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-[#64788A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Offline Pass Storage</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">Digital event passes remain available even during basement cellular blackouts.</div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-[#B08A4A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Urgent Push Notifications</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">Immediate push alerts when venues change or sessions are delayed.</div>
              </div>
            </div>

            <div className="p-3 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] flex items-start gap-2.5">
              <FileCode2 className="w-4 h-4 text-[#18212B] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#18212B]">Native Android Gestures</div>
                <div className="text-[#62605B] text-[11px] mt-0.5">Bottom navigation, edge-to-edge rendering, and hardware back-button handling.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
