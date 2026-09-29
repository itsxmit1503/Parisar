'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, ChevronDown, ChevronUp, UserCheck, Wrench } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface DevToolbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DevToolbar: React.FC<DevToolbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, setCurrentUserId, allUsers, resetPrototypeData } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCurrentUserId(selectedId);

    const user = allUsers.find(u => u._id === selectedId);
    if (user?.role === 'organizer') {
      setActiveTab('organizer-dashboard');
    } else if (user?.role === 'admin') {
      setActiveTab('admin-dashboard');
    } else {
      setActiveTab('student-home');
    }
  };

  return (
    <aside aria-label="Prototype testing controls" className="bg-[#18212B] text-[#FCFAF5] border-b border-[#0D131A] text-xs font-sans select-none transition-all z-50">
      {/* Minimized Quick Bar */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B6533C]"></span>
          <span className="font-semibold text-[#B9B4AA] tracking-wide uppercase text-[10px]">
            PARISAR Simulator • DHSGSU
          </span>
          <span className="text-[#62605B]">•</span>
          <span className="text-[#FCFAF5] font-medium hidden sm:inline">
            Active: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#222E3C] hover:bg-[#2D3D4F] text-[#EAE5DB] border border-[#334457] transition-all cursor-pointer"
          >
            <Wrench className="w-3 h-3 text-[#B08A4A]" />
            <span>{isExpanded ? 'Hide Controls' : 'Switch Persona / Reset'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Drawer */}
      {isExpanded && (
        <div className="bg-[#121922] border-t border-[#222E3C] px-4 py-3 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="persona-select" className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B9B4AA] uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-[#B6533C]" />
              <span>DHSGSU Testing Persona:</span>
            </label>
            <select
              id="persona-select"
              aria-label="Active Testing Persona"
              value={currentUser._id}
              onChange={handleRoleChange}
              className="bg-[#222E3C] text-white text-xs font-semibold px-3 py-1.5 rounded-[3px] border border-[#334457] focus:outline-none focus:border-[#B6533C] cursor-pointer"
            >
              <option value="student-1">Student: Amit Sharma (DCSA - Roll: Y23141042)</option>
              <option value="student-2">Student: Priya Patel (EC - Roll: Y23122018)</option>
              <option value="student-3">Student: Rohan Mehra (DCSA - Roll: Y23141088)</option>
              <option value="org-1">Organizer: Dr. Alok Sahay (DCSA Faculty Convener)</option>
              <option value="org-2">Organizer: Prof. R.K. Trivedi (Dean, Technology)</option>
              <option value="admin-1">Administrator: Prof. S.P. Gautam (Dean of Students' Welfare)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#62605B] hidden md:inline">
              Simulated changes persist in browser localStorage
            </span>
            <button
              onClick={() => {
                if (confirm('Reset PARISAR prototype storage to original DHSGSU seed data?')) {
                  resetPrototypeData();
                  setIsExpanded(false);
                }
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-[3px] text-xs font-semibold bg-[#222E3C] text-[#EAE5DB] hover:text-white hover:bg-[#A83226] border border-[#334457] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset DHSGSU Seed Data</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
