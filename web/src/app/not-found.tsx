'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft, Building2 } from 'lucide-react';
import { ParisarLogo } from '../components/ui/ParisarLogo';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#18212B] flex flex-col font-sans antialiased selection:bg-[#B6533C] selection:text-white">
      {/* Top University Header */}
      <header className="border-b border-[#B9B4AA] bg-[#FCFAF5] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ParisarLogo size="md" />
            <div className="hidden sm:block border-l border-[#B9B4AA] pl-3">
              <span className="text-xs font-mono font-bold text-[#18212B] block">DHSGSU • SAGAR</span>
              <span className="text-[10px] text-[#62605B] block">Dr. Harisingh Gour Vishwavidyalaya</span>
            </div>
          </Link>
          <div className="text-xs font-mono text-[#B6533C] font-bold">
            ROUTE_404_NOT_FOUND
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-8 sm:p-12 shadow-[4px_4px_0_0_#18212B] text-center space-y-6">
          <div className="w-16 h-16 rounded-[3px] bg-[#EAE5DB] border border-[#B9B4AA] text-[#B6533C] flex items-center justify-center mx-auto shadow-[2px_2px_0_0_#18212B]">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-1 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[11px] font-mono font-bold text-[#B6533C] uppercase">
              DHSGSU Campus Wayfinding Error
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#18212B] font-serif uppercase tracking-tight">
              Looks like this campus path doesn't exist.
            </h1>
            <p className="text-xs sm:text-sm text-[#62605B] leading-relaxed max-w-md mx-auto">
              The event, venue hall, or administrative portal route you requested may have moved, expired, or doesn't exist on the university network.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Home className="w-4 h-4" />}
                className="w-full"
              >
                Return to PARISAR Home
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Compass className="w-4 h-4" />}
                className="w-full"
              >
                Explore Campus Events
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-[#B9B4AA]/30 text-[11px] font-mono text-[#62605B]">
            Dr. Harisingh Gour Vishwavidyalaya, Sagar (M.P.) • Patharia Hills Campus
          </div>
        </div>
      </main>
    </div>
  );
}
