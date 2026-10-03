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
          Infrastructure & GIS Configuration
        </div>
        <h1 className="text-2xl font-bold text-[#18212B] tracking-tight">
          DHSGSU Campus Locations & Categories
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Verified geographic campus facilities, academic departments, and standardized university event classifications for Dr. Harisingh Gour Vishwavidyalaya, Sagar.
        </p>
      </div>

      {/* Venues Grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#18212B] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#B6533C]" />
          <span>Configured DHSGSU Campus Locations ({venues.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map(venue => {
            const hasCoordinates = venue.latitude !== null && venue.longitude !== null;
            const mapsUrl = hasCoordinates
              ? `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.navigationQuery)}`;

            return (
              <div
                key={venue.id}
                className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#18212B]">{venue.name}</h3>
                    {venue.secondaryName && (
                      <div className="text-xs font-bold text-[#213B5C] mt-0.5">{venue.secondaryName}</div>
                    )}
                    <div className="text-xs text-[#62605B] mt-0.5">{venue.address}</div>
                  </div>
                  <Badge variant="default">{venue.category}</Badge>
                </div>

                <p className="text-xs text-[#33312E] leading-relaxed">{venue.description}</p>

                <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#18212B]">Verification Status:</span>
                    <span className="font-mono text-[11px] uppercase font-bold text-[#B6533C]">
                      {venue.verified === 'unverified' ? 'Location verification required' : venue.verified}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#18212B]">WGS84 Coordinates:</span>
                    <span className="font-mono text-[11px] text-[#62605B]">
                      {hasCoordinates
                        ? `${venue.latitude!.toFixed(7)}° N, ${venue.longitude!.toFixed(7)}° E`
                        : 'Location verification required'}
                    </span>
                  </div>
                  {venue.plusCode && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#18212B]">Google Plus Code:</span>
                      <span className="font-mono text-[11px] text-[#213B5C] font-bold">
                        {venue.plusCode} • Sagar, MP
                      </span>
                    </div>
                  )}
                  <div className="text-[11px] text-[#62605B] pt-1 border-t border-[#D5D0C5]">
                    <span className="font-bold text-[#18212B]">Source: </span>
                    {venue.source}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#213B5C] hover:underline"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            );
          })}
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
