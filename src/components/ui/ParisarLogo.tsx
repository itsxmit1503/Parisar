'use client';

import React from 'react';

interface ParisarLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'ticket' | 'seal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  inverted?: boolean;
}

export const ParisarLogo: React.FC<ParisarLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  inverted = false,
}) => {
  // Dimensions for the icon based on size prop
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  // Geometric "P" emblem representing "Parisar" (campus pathways, quadrangle, and interconnected university spaces)
  // Constructed with sharp 45-degree and 90-degree lines representing campus avenues intersecting at a central gathering quad
  const Emblem = (
    <div
      className={`${iconDimensions[size]} shrink-0 rounded-[3px] flex items-center justify-center relative overflow-hidden transition-transform ${
        inverted
          ? 'bg-[#FCFAF5] text-[#18212B] border border-[#FCFAF5] shadow-[2px_2px_0_0_#B6533C]'
          : 'bg-[#18212B] text-[#FCFAF5] border border-[#0D131A] shadow-[2px_2px_0_0_#B6533C]'
      }`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 stroke-current"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="miter"
      >
        {/* Main Vertical Spine (Campus North-South Avenue) */}
        <line x1="8" y1="5" x2="8" y2="27" />
        
        {/* Upper Loop of 'P' (Campus Quadrangle & Gathering Courtyard) */}
        <path d="M8 6H20C22.2091 6 24 7.79086 24 10V13C24 15.2091 22.2091 17 20 17H8" />
        
        {/* Intersecting Diagonal Pathway connecting into quad */}
        <line x1="8" y1="17" x2="16" y2="9" strokeWidth="1.6" className="opacity-80" />
        
        {/* Central Gathering Core Dot / Plaza Milestone */}
        <circle cx="16" cy="11.5" r="1.5" fill="#B6533C" stroke="none" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex ${className}`}>{Emblem}</div>;
  }

  if (variant === 'seal') {
    return (
      <div className={`inline-flex flex-col items-center text-center ${className}`}>
        <div className="w-14 h-14 rounded-full border-2 border-[#B08A4A] p-1 flex items-center justify-center bg-[#FCFAF5] shadow-[0_2px_4px_rgba(0,0,0,0.06)] relative">
          <div className="w-full h-full rounded-full border border-dashed border-[#B08A4A] flex items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-[#18212B] stroke-current"
              strokeWidth="2.2"
            >
              <line x1="8" y1="5" x2="8" y2="27" />
              <path d="M8 6H20C22.2091 6 24 7.79086 24 10V13C24 15.2091 22.2091 17 20 17H8" />
              <circle cx="16" cy="11.5" r="1.5" fill="#B08A4A" stroke="none" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          <div className="font-extrabold tracking-widest text-xs text-[#18212B] uppercase">PARISAR</div>
          <div className="text-[9px] font-bold text-[#B08A4A] tracking-wider uppercase font-mono">DHSGSU SAGAR</div>
        </div>
      </div>
    );
  }

  if (variant === 'ticket') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {Emblem}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-[#18212B]">PARISAR</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA]">
              DHSGSU
            </span>
          </div>
          <div className="text-[10px] text-[#62605B] font-medium leading-none">
            Dr. Harisingh Gour Vishwavidyalaya
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {Emblem}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black ${titleSizes[size]} tracking-tight ${inverted ? 'text-[#FCFAF5]' : 'text-[#18212B]'}`}>
            PARISAR
          </span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA]">
            DHSGSU
          </span>
        </div>
        <div className={`${subtitleSizes[size]} ${inverted ? 'text-[#FCFAF5]/70' : 'text-[#62605B]'} font-medium mt-0.5 leading-tight truncate`}>
          {variant === 'full' ? 'Dr. Harisingh Gour Vishwavidyalaya, Sagar' : 'Central University • Sagar (M.P.)'}
        </div>
      </div>
    </div>
  );
};
