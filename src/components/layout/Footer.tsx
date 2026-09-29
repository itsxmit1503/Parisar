import React from 'react';
import { Smartphone, Shield, Database, Server, Globe, MapPin } from 'lucide-react';
import { ParisarLogo } from '../ui/ParisarLogo';

export const Footer: React.FC<{ onOpenApkModal: () => void }> = ({ onOpenApkModal }) => {
  return (
    <footer className="bg-[#FCFAF5] border-t-2 border-[#18212B] mt-16 text-[#62605B] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <ParisarLogo size="md" variant="full" />
            
            <p className="text-[#62605B] leading-relaxed max-w-md text-xs">
              <strong className="text-[#18212B]">PARISAR (परिसर)</strong> is the centralized university event-management and student companion platform for{' '}
              <strong className="text-[#18212B]">Dr. Harisingh Gour Vishwavidyalaya</strong> (A Central University, Sagar, Madhya Pradesh).
            </p>

            <div className="text-[11px] font-medium text-[#B6533C]">
              &ldquo;Your Campus. Your Events. Your Community.&rdquo;
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#62605B] pt-1">
              <span className="flex items-center gap-1 font-medium">
                <Shield className="w-3.5 h-3.5 text-[#B6533C]" />
                University Registrar & DSW Verified
              </span>
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#64788A]" />
                Patharia Hills, Sagar (M.P.)
              </span>
            </div>
          </div>

          {/* Platform Strategy */}
          <div>
            <h4 className="font-bold text-[#18212B] mb-2.5 uppercase tracking-wider text-[11px]">
              Platform Architecture
            </h4>
            <ul className="space-y-1.5 text-[#62605B]">
              <li className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#18212B]" />
                <span>Web Portal (Next.js 16 / TypeScript)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>Mobile Companion (React Native Expo)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#64788A]" />
                <span>Centralized REST API (/api/v1)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#B08A4A]" />
                <span>DHSGSU Central Database (Single Source)</span>
              </li>
            </ul>
          </div>

          {/* Quick Download / Access */}
          <div>
            <h4 className="font-bold text-[#18212B] mb-2.5 uppercase tracking-wider text-[11px]">
              Android Companion
            </h4>
            <p className="text-[#62605B] mb-3 text-xs leading-relaxed">
              Official DHSGSU Android APK available for optical turnstile QR scanning and offline credentials.
            </p>
            <button
              onClick={onOpenApkModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[#18212B] text-[#FCFAF5] font-semibold text-xs border border-[#18212B] shadow-[2px_2px_0_0_#18212B] hover:bg-[#252525] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#B08A4A]" />
              <span>Get Android APK</span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-[#B9B4AA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#62605B] text-[11px]">
          <div>
            © {new Date().getFullYear()} PARISAR • Dr. Harisingh Gour Vishwavidyalaya, Sagar (M.P.). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#18212B] font-bold">Modern Neo-Skeuomorphic UI • Zero Glassmorphism</span>
            <span className="font-mono text-[#62605B]">DHSGSU-v2.6</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
