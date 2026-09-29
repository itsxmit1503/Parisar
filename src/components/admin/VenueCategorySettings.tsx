'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, Tag } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const VenueCategorySettings: React.FC = () => {
  const { venues } = useApp();

  const categories = [
    { name: 'Workshop', description: 'Hands-on practical sessions and technical laboratories.' },
    { name: 'Seminar', description: 'Faculty, guest, and national science symposiums and keynotes.' },
    { name: 'Cultural', description: 'Youth festivals, Bundeli folk dance, music, and dramatic arts.' },
    { name: 'Competition', description: 'Inter-departmental academic tournaments, quizzes, and debates.' },
    { name: 'Sports', description: 'Stadium athletics, university tournaments, and fitness meets.' },
    { name: 'Technology', description: 'Emerging tech exhibitions, IoT demonstrations, and system showcases.' },
    { name: 'Coding', description: 'Hackathons, algorithmic sprints, and open-source sprints.' },
    { name: 'Entrepreneurship', description: 'Incubation pitch sessions, startup bootcamps, and venture panels.' },
    { name: 'Academic', description: 'Curricular enrichment studios, faculty research seminars, and symposiums.' },
    { name: 'Club', description: 'Astronomy club observations, photography walks, and literary societies.' },
    { name: 'Placement', description: 'Corporate recruitment drives, mock interviews, and career clinics.' },
    { name: 'Other', description: 'Official administrative briefings, convocations, and civic assemblies.' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
          Infrastructure Configuration
        </div>
        <h1 className="text-2xl font-bold text-[#18212B] tracking-tight">
          Campus Venues & Categories
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Manage physical campus facilities, room allocations, and standardized university event classifications.
        </p>
      </div>

      {/* Venues Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#B6533C]" />
          <span>Configured Campus Facilities ({venues.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map(venue => (
            <div
              key={venue.id}
              className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#18212B]">{venue.name}</h3>
                  <div className="text-xs text-[#62605B] mt-0.5">{venue.building} • {venue.floor}</div>
                </div>
                <Badge variant="default">Capacity: {venue.capacity}</Badge>
              </div>

              <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs space-y-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="font-bold text-[#18212B]">Wayfinding Directions:</div>
                <p className="text-[#62605B] leading-relaxed">{venue.directions}</p>
              </div>

              <div>
                <div className="text-xs font-bold text-[#18212B] mb-1.5">Amenities:</div>
                <div className="flex flex-wrap gap-1.5">
                  {venue.features.map(f => (
                    <span
                      key={f}
                      className="text-[11px] px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#B08A4A]" />
          <span>Standardized Event Categories</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.name} className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 shadow-[2px_2px_0_0_#18212B]">
              <h3 className="text-sm font-bold text-[#18212B]">{c.name}</h3>
              <p className="text-xs text-[#62605B] mt-1 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
