'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent } from '../../types';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  Compass,
  ArrowRight,
  Building2
} from 'lucide-react';
import { CategoryBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CampusMapProps {
  initialVenueId?: string;
  onOpenEvent: (event: CampusEvent) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({ initialVenueId, onOpenEvent }) => {
  const { venues, events } = useApp();

  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialVenueId || venues[0]?.id || 'venue-swarna-jayanti'
  );
  const [zoomLevel, setZoomLevel] = useState(100);

  const selectedVenue = venues.find(v => v.id === selectedVenueId) || venues[0];

  const venueEvents = events.filter(
    e => e.venueId === selectedVenue.id && e.status !== 'DRAFT' && e.status !== 'CANCELLED'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="border-b border-[#B9B4AA] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
            PARISAR • DHSGSU Wayfinding & Facilities
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Campus Venue Map & Navigation
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Architectural schematic of auditoriums, laboratories, and halls across Patharia Hills, Sagar (M.P.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#62605B]">Campus Elevation:</span>
          <span className="text-xs font-mono font-bold text-[#18212B] bg-[#FCFAF5] border border-[#B9B4AA] px-2 py-0.5 rounded-[2px] shadow-[1px_1px_0_0_#18212B]">
            520m (Patharia Hills)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Campus Map Canvas - 7 Columns */}
        <div className="lg:col-span-7 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-4 sm:p-5 shadow-[2px_2px_0_0_#18212B] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#64788A]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                Dr. Harisingh Gour Vishwavidyalaya Campus Map
              </span>
            </div>

            {/* Tactile Map Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="w-7 h-7 bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] rounded-[2px] flex items-center justify-center hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(90, prev - 10))}
                className="w-7 h-7 bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B] rounded-[2px] flex items-center justify-center hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Map Canvas - Tactile Architectural Blueprint */}
          <div className="relative w-full h-[440px] bg-[#EAE5DB] border-2 border-[#18212B] rounded-[4px] overflow-hidden select-none shadow-[inset_0_2px_4px_rgba(24,33,43,0.06)]">
            {/* Campus Roadways & Zones */}
            <div className="absolute inset-0 bg-[#EAE5DB]">
              {/* Patharia Hills Central Avenue Ring Road */}
              <div className="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 bg-[#DFD9CD] border-t-2 border-b-2 border-[#B9B4AA]">
                <div className="w-full h-full border-t border-dashed border-[#B9B4AA] mt-8"></div>
              </div>
              <div className="absolute top-0 bottom-0 left-1/2 w-16 -translate-x-1/2 bg-[#DFD9CD] border-l-2 border-r-2 border-[#B9B4AA]">
                <div className="h-full w-full border-l border-dashed border-[#B9B4AA] ml-8"></div>
              </div>

              {/* DCSA / Computer Science Block */}
              <div className="absolute top-6 left-6 w-40 h-28 bg-[#FCFAF5] border-2 border-[#18212B] shadow-[2px_2px_0_0_#18212B] rounded-[3px] p-2 text-[10px] text-[#18212B] font-bold">
                <div className="text-[#B6533C] text-[9px] uppercase tracking-wider font-mono">DCSA WING</div>
                <div>Turing Computing Lab</div>
                <div className="text-[9px] text-[#62605B] font-normal mt-1">AI & Cyber Labs</div>
              </div>

              {/* Central Administration & Swarna Jayanti */}
              <div className="absolute top-1/3 left-1/3 w-52 h-34 bg-[#FCFAF5] border-2 border-[#18212B] shadow-[2px_2px_0_0_#18212B] rounded-[3px] p-2 text-[10px] text-[#18212B] font-bold">
                <div className="text-[#B6533C] text-[9px] uppercase tracking-wider font-mono">CENTRAL COMPLEX</div>
                <div>Swarna Jayanti Auditorium</div>
                <div className="text-[9px] text-[#62605B] font-normal">Gour Memorial Hall</div>
              </div>

              {/* Science Block 1 (C.V. Raman) */}
              <div className="absolute top-6 right-6 w-42 h-26 bg-[#FCFAF5] border-2 border-[#18212B] shadow-[2px_2px_0_0_#18212B] rounded-[3px] p-2 text-[10px] text-[#18212B] font-bold">
                <div className="text-[#B08A4A] text-[9px] uppercase tracking-wider font-mono">SCIENCE BLOCK 1</div>
                <div>Prof. C.V. Raman Theatre</div>
                <div className="text-[9px] text-[#62605B] font-normal">Physics & Chemistry</div>
              </div>

              {/* Central Library & Innovation Centre (IIC) */}
              <div className="absolute bottom-6 left-16 w-48 h-26 bg-[#FCFAF5] border-2 border-[#18212B] shadow-[2px_2px_0_0_#18212B] rounded-[3px] p-2 text-[10px] text-[#18212B] font-bold">
                <div className="text-[#64788A] text-[9px] uppercase tracking-wider font-mono">CENTRAL LIBRARY</div>
                <div>Innovation & Incubation Hub</div>
                <div className="text-[9px] text-[#62605B] font-normal">J.N. Library Quadrangle</div>
              </div>

              {/* Sports Arena & Stadium */}
              <div className="absolute bottom-6 right-8 w-44 h-26 bg-[#EBF3ED] border-2 border-[#2F613B] shadow-[2px_2px_0_0_#18212B] rounded-[3px] p-2 text-[10px] text-[#2F613B] font-bold">
                <div className="text-[9px] uppercase tracking-wider font-mono">ATHLETIC ENCLAVE</div>
                <div>DHSGSU Sports Stadium</div>
                <div className="text-[9px] font-normal text-[#2F613B]/80">400m Track & Turf</div>
              </div>
            </div>

            {/* Venue Markers - Tactile physical pins */}
            {venues.map(v => {
              const isSelected = v.id === selectedVenueId;
              const hasEvents = events.some(e => e.venueId === v.id && e.status === 'PUBLISHED');

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenueId(v.id)}
                  style={{
                    left: `${v.coordinates.x}%`,
                    top: `${v.coordinates.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all cursor-pointer ${
                    isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                  }`}
                  aria-label={v.name}
                >
                  <div
                    className={`px-2 py-1 rounded-[2px] border-2 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0_0_#18212B] transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#B6533C] text-white border-[#18212B]'
                        : hasEvents
                        ? 'bg-[#FCFAF5] text-[#18212B] border-[#18212B]'
                        : 'bg-[#EAE5DB] text-[#62605B] border-[#B9B4AA]'
                    }`}
                  >
                    <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[#B6533C]'}`} />
                    <span>{v.name.split(' ')[0]}</span>
                    {hasEvents && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B08A4A]"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Facility Details & Upcoming Sessions - 5 Columns */}
        <div className="lg:col-span-5 space-y-4">
          {/* Facility Specification Card */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3.5">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                Selected Campus Venue
              </div>
              <h3 className="text-xl font-extrabold text-[#18212B] leading-tight">
                {selectedVenue.name}
              </h3>
              <p className="text-xs text-[#62605B] font-medium">
                {selectedVenue.building} • {selectedVenue.floor}
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                <div className="text-[10px] text-[#62605B] uppercase font-bold">Total Capacity</div>
                <div className="font-bold text-[#18212B] text-sm mt-0.5">{selectedVenue.capacity} Persons</div>
              </div>
              <div className="p-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
                <div className="text-[10px] text-[#62605B] uppercase font-bold">Upcoming Events</div>
                <div className="font-bold text-[#B6533C] text-sm mt-0.5">{venueEvents.length} Sessions</div>
              </div>
            </div>

            {/* Turn-by-Turn Wayfinding Instructions */}
            <div className="space-y-1.5 p-3.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#18212B] flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#B6533C]" />
                <span>Wayfinding Directions</span>
              </div>
              <p className="text-xs text-[#18212B] leading-relaxed">
                {selectedVenue.directions}
              </p>
            </div>

            {/* Amenities & Features */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B]">
                Hall Features & Equipment
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedVenue.features.map(f => (
                  <span
                    key={f}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions Scheduled in this Hall */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#18212B] border-b border-[#B9B4AA] pb-2">
              Scheduled Sessions in {selectedVenue.name}
            </h4>

            {venueEvents.length > 0 ? (
              <div className="space-y-2.5">
                {venueEvents.map(evt => (
                  <div
                    key={evt._id}
                    onClick={() => onOpenEvent(evt)}
                    className="p-3 bg-[#EAE5DB]/60 hover:bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={evt.category} />
                      <span className="font-mono text-[10px] text-[#62605B]">
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-[#18212B] group-hover:text-[#B6533C] transition-colors line-clamp-1">
                      {evt.title}
                    </h5>

                    <div className="flex items-center justify-between text-[11px] text-[#62605B]">
                      <span>{new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span className="font-bold text-[#18212B] flex items-center gap-0.5">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-center text-xs text-[#62605B] font-mono">
                No active events currently scheduled in this facility.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
