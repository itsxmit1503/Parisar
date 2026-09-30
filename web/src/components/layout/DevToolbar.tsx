'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, ChevronDown, ChevronUp, UserCheck, Wrench } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface DevToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

/**
 * Developer-only testing toolbar.
 * Hidden from normal product UI (Sections 2 & 18).
 * Can only be revealed by adding ?dev=true to the URL or pressing Ctrl+Shift+D.
 */
export const DevToolbar: React.FC<DevToolbarProps> = ({ setActiveTab }) => {
  const { currentUser, setCurrentUserId, allUsers, resetPrototypeData } = useApp();
  const [isDevModeEnabled, setIsDevModeEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true' || params.get('dev') === '1') {
        setIsDevModeEnabled(true);
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault();
          setIsDevModeEnabled(prev => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Never show in normal product experience
  if (!isDevModeEnabled) {
    return null;
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCurrentUserId(selectedId);

    const user = allUsers.find(u => u._id === selectedId);
    if (user?.role === 'organizer') {
      if (user.organizerStatus !== 'VERIFIED') {
        setActiveTab('organizer-pending');
      } else {
        setActiveTab('organizer-dashboard');
      }
    } else if (user?.role === 'admin') {
      setActiveTab('admin-dashboard');
    } else {
      setActiveTab('student-home');
    }
  };

  return (
    <aside aria-label="Developer testing controls" className="bg-[#18212B] text-[#FCFAF5] border-b border-[#0D131A] text-xs font-sans select-none transition-all z-50">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B6533C]"></span>
          <span className="font-semibold text-[#B9B4AA] tracking-wide uppercase text-[10px]">
            PARISAR Developer Testing Mode (Ctrl+Shift+D)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#222E3C] hover:bg-[#2D3D4F] text-[#EAE5DB] border border-[#334457] transition-all cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-[#B08A4A]" />
            <span>{isExpanded ? 'Hide Dev Controls' : 'Dev Controls'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-[#121922] border-t border-[#222E3C] px-4 py-3 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="persona-select" className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B9B4AA] uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>Test Account:</span>
            </label>
            <select
              id="persona-select"
              aria-label="Active Testing Account"
              value={currentUser._id}
              onChange={handleRoleChange}
              className="bg-[#222E3C] text-white text-xs font-semibold px-3 py-1.5 rounded-[3px] border border-[#334457] focus:outline-none focus:border-[#B6533C] cursor-pointer"
            >
              <option value="student-1">Student: Amit Sharma (Y23141042)</option>
              <option value="student-2">Pending Organizer: Priya Patel (Y23122018)</option>
              <option value="student-3">Rejected Organizer: Rohan Mehra (Y23141088)</option>
              <option value="org-1">Verified Organizer: Dr. Alok Sahay (EMP-DCSA-104)</option>
              <option value="admin-1">Administrator: Prof. S.P. Gautam (ADMIN-DSW-001)</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (confirm('Reset PARISAR localStorage to original DHSGSU seed data?')) {
                resetPrototypeData();
                setIsExpanded(false);
                setActiveTab('landing');
              }
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-[3px] text-xs font-semibold bg-[#222E3C] text-[#EAE5DB] hover:text-white hover:bg-[#A83226] border border-[#334457] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Seed Data</span>
          </button>
        </div>
      )}
    </aside>
  );
};
