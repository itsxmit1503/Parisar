'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusEvent, CampusLocationCategory, CampusVenue } from '../../types';
import { DHSGSU_CAMPUS_CENTER } from '../../lib/mockData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Minimal TypeScript declarations for Google Maps JS API when loaded via script tag
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    gm_authFailure?: () => void;
  }
}

interface CampusMapProps {
  initialVenueId?: string;
  onOpenEvent: (event: CampusEvent) => void;
}

type FilterCategory = 'All' | 'Event Venues' | CampusLocationCategory;

const FILTER_CATEGORIES: FilterCategory[] = [
  'All',
  'Event Venues',
  'Academic',
  'Event Venue',
  'Library',
  'Administration',
  'Sports',
  'Hostel',
  'Medical',
];

const CATEGORY_COLORS: Record<CampusLocationCategory, { bg: string; text: string; border: string; pinHex: string }> = {
  'Event Venue': { bg: 'bg-[#FBF3EF]', text: 'text-[#B6533C]', border: 'border-[#E5B8A8]', pinHex: '#B6533C' },
  'Academic': { bg: 'bg-[#EEF2F7]', text: 'text-[#213B5C]', border: 'border-[#B8C7DC]', pinHex: '#213B5C' },
  'Library': { bg: 'bg-[#F8F3E6]', text: 'text-[#7A581B]', border: 'border-[#DEC48F]', pinHex: '#9C6B19' },
  'Administration': { bg: 'bg-[#F3EEF8]', text: 'text-[#52346E]', border: 'border-[#CBB8DF]', pinHex: '#52346E' },
  'Sports': { bg: 'bg-[#ECF6F0]', text: 'text-[#1E633F]', border: 'border-[#A8D5BC]', pinHex: '#1E633F' },
  'Hostel': { bg: 'bg-[#F2F1EE]', text: 'text-[#4A4843]', border: 'border-[#C7C3BA]', pinHex: '#5A5751' },
  'Medical': { bg: 'bg-[#FDF0F0]', text: 'text-[#9E2A2B]', border: 'border-[#E5B3B4]', pinHex: '#B91C1C' },
  'Food': { bg: 'bg-[#FDF6EC]', text: 'text-[#9A5B13]', border: 'border-[#E6C89C]', pinHex: '#B45309' },
  'Other': { bg: 'bg-[#EAE5DB]', text: 'text-[#18212B]', border: 'border-[#B9B4AA]', pinHex: '#18212B' },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const CampusMap: React.FC<CampusMapProps> = ({ initialVenueId, onOpenEvent }) => {
  const { venues, events } = useApp();

  // Search & Category filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');

  // Selected Campus Location
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialVenueId || 'venue-central-library'
  );

  // Map View state (Coordinates, Zoom, MapType)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: DHSGSU_CAMPUS_CENTER.latitude,
    lng: DHSGSU_CAMPUS_CENTER.longitude,
  });
  const [zoomLevel, setZoomLevel] = useState<number>(DHSGSU_CAMPUS_CENTER.defaultZoom);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Mobile bottom sheet state
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState<boolean>(true);

  // User Geolocation state (ONLY requested when user clicks "Use My Location")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  // Google Maps JS SDK state vs Section 23 Real Google Maps Embed Fallback
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [jsMapStatus, setJsMapStatus] = useState<'unconfigured' | 'loading' | 'ready' | 'error'>(
    apiKey ? 'loading' : 'unconfigured'
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googleMapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null);

  // Published events count & map per venue
  const publishedEvents = useMemo(
    () => events.filter(e => e.status === 'PUBLISHED' || e.status === 'APPROVED'),
    [events]
  );

  const eventsByVenueId = useMemo(() => {
    const map: Record<string, CampusEvent[]> = {};
    for (const evt of publishedEvents) {
      if (!map[evt.venueId]) map[evt.venueId] = [];
      map[evt.venueId].push(evt);
    }
    return map;
  }, [publishedEvents]);

  // Sync when initialVenueId prop changes (e.g. from EventDetailModal "View on Campus Map ->")
  useEffect(() => {
    if (initialVenueId) {
      const target = venues.find(v => v.id === initialVenueId);
      if (target) {
        setSelectedVenueId(target.id);
        setActiveCategory('All');
        setSearchQuery('');
        setMobileSheetExpanded(true);
        if (target.latitude !== null && target.longitude !== null) {
          setMapCenter({ lat: target.latitude, lng: target.longitude });
          setZoomLevel(17);
        }
      }
    }
  }, [initialVenueId, venues]);

  // Filtered locations based on search query and category filter
  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter(loc => {
      // Category filter
      if (activeCategory === 'Event Venues') {
        const hasEvents = (eventsByVenueId[loc.id]?.length || 0) > 0;
        if (!loc.isEventVenue && loc.category !== 'Event Venue' && !hasEvents) {
          return false;
        }
      } else if (activeCategory !== 'All' && loc.category !== activeCategory) {
        return false;
      }

      // Search query filter (matches building name, category, description, address, or hosted event title)
      if (!q) return true;
      const hostedEvents = eventsByVenueId[loc.id] || [];
      const matchesEvent = hostedEvents.some(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.departmentScope && e.departmentScope.toLowerCase().includes(q))
      );

      return (
        loc.name.toLowerCase().includes(q) ||
        (loc.secondaryName && loc.secondaryName.toLowerCase().includes(q)) ||
        (loc.plusCode && loc.plusCode.toLowerCase().includes(q)) ||
        loc.category.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        matchesEvent
      );
    });
  }, [venues, activeCategory, searchQuery, eventsByVenueId]);

  // Locations that have verified/partially_verified coordinates for map pins
  const mappedPinLocations = useMemo(
    () =>
      filteredLocations.filter(
        (loc): loc is CampusVenue & { latitude: number; longitude: number } =>
          typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
      ),
    [filteredLocations]
  );

  const selectedLocation = useMemo(
    () => venues.find(v => v.id === selectedVenueId) || venues[0],
    [venues, selectedVenueId]
  );

  const selectedVenueEvents = useMemo(
    () => (selectedLocation ? eventsByVenueId[selectedLocation.id] || [] : []),
    [selectedLocation, eventsByVenueId]
  );

  // Select a location and center map on its real coordinates
  const handleSelectLocation = useCallback((loc: CampusVenue) => {
    setSelectedVenueId(loc.id);
    setMobileSheetExpanded(true);
    if (loc.latitude !== null && loc.longitude !== null) {
      setMapCenter({ lat: loc.latitude, lng: loc.longitude });
      setZoomLevel(17);
      if (googleMapInstanceRef.current && window.google?.maps) {
        googleMapInstanceRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
        googleMapInstanceRef.current.setZoom(17);
      }
    }
  }, []);

  // Reset map to DHSGSU Campus Center
  const handleResetCampusCenter = useCallback(() => {
    setMapCenter({
      lat: DHSGSU_CAMPUS_CENTER.latitude,
      lng: DHSGSU_CAMPUS_CENTER.longitude,
    });
    setZoomLevel(DHSGSU_CAMPUS_CENTER.defaultZoom);
    if (googleMapInstanceRef.current && window.google?.maps) {
      googleMapInstanceRef.current.panTo({
        lat: DHSGSU_CAMPUS_CENTER.latitude,
        lng: DHSGSU_CAMPUS_CENTER.longitude,
      });
      googleMapInstanceRef.current.setZoom(DHSGSU_CAMPUS_CENTER.defaultZoom);
    }
  }, []);

  // Zoom controls
  const handleZoomChange = useCallback((delta: number) => {
    setZoomLevel(prev => {
      const next = Math.min(20, Math.max(13, prev + delta));
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current.setZoom(next);
      }
      return next;
    });
  }, []);

  // Toggle Roadmap / Satellite
  const handleToggleMapType = useCallback(() => {
    setMapType(prev => {
      const next = prev === 'roadmap' ? 'satellite' : 'roadmap';
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current.setMapTypeId(next);
      }
      return next;
    });
  }, []);

  // Explicit "Use My Location" handler (Section 12: NEVER called automatically on load)
  const handleUseMyLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationStatus('error');
      setLocationMessage('Geolocation is not supported by your current browser or device.');
      return;
    }

    setLocationStatus('requesting');
    setLocationMessage('Requesting GPS location...');

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setLocationStatus('granted');

        const distKm = calculateDistanceKm(
          coords.lat,
          coords.lng,
          DHSGSU_CAMPUS_CENTER.latitude,
          DHSGSU_CAMPUS_CENTER.longitude
        );

        if (distKm <= 5) {
          // User is on or near DHSGSU campus — center on their position
          setMapCenter(coords);
          setZoomLevel(17);
          setLocationMessage(`Located on campus (${distKm.toFixed(1)} km from Central Library)`);
          if (googleMapInstanceRef.current) {
            googleMapInstanceRef.current.panTo(coords);
            googleMapInstanceRef.current.setZoom(17);
          }
        } else {
          // User is outside Sagar/DHSGSU — keep DHSGSU visible or allow centering, and show distance
          setLocationMessage(
            `Your location is ${distKm.toFixed(1)} km from DHSGSU Campus. Directions will route from your current position.`
          );
        }
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationMessage('Location permission declined. Showing DHSGSU Patharia Hills campus.');
        } else {
          setLocationStatus('error');
          setLocationMessage('Could not determine current location. Showing DHSGSU campus.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Load Google Maps JavaScript API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured
  useEffect(() => {
    if (!apiKey) {
      setJsMapStatus('unconfigured');
      return;
    }

    if (typeof window === 'undefined') return;

    // Handle Google Maps auth/billing errors gracefully by falling back to real Google Maps Embed
    window.gm_authFailure = () => {
      setJsMapStatus('error');
    };

    if (window.google?.maps?.Map) {
      setJsMapStatus('ready');
      return;
    }

    const existingScript = document.getElementById('parisar-google-maps-sdk') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setJsMapStatus('ready'));
      existingScript.addEventListener('error', () => setJsMapStatus('error'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'parisar-google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.Map) {
        setJsMapStatus('ready');
      } else {
        setJsMapStatus('error');
      }
    };
    script.onerror = () => {
      setJsMapStatus('error');
    };
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize Google Maps JS instance when SDK is ready
  useEffect(() => {
    if (jsMapStatus !== 'ready' || !mapContainerRef.current || !window.google?.maps) return;

    if (!googleMapInstanceRef.current) {
      googleMapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom: zoomLevel,
        mapTypeId: mapType,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy',
      });
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }
  }, [jsMapStatus, mapCenter, zoomLevel, mapType]);

  // Sync markers on Google Maps JS instance
  useEffect(() => {
    if (jsMapStatus !== 'ready' || !googleMapInstanceRef.current || !window.google?.maps) return;

    const gmaps = window.google.maps;
    const map = googleMapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    // Place markers only for verified/partially_verified coordinates
    for (const loc of mappedPinLocations) {
      const isSelected = loc.id === selectedVenueId;
      const catColor = CATEGORY_COLORS[loc.category]?.pinHex || '#B6533C';
      const eventCount = eventsByVenueId[loc.id]?.length || 0;

      const marker = new gmaps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map,
        title: loc.name,
        zIndex: isSelected ? 999 : eventCount > 0 ? 50 : 10,
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          fillColor: isSelected ? '#B6533C' : catColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 11 : eventCount > 0 ? 9 : 7,
        },
      });

      marker.addListener('click', () => {
        handleSelectLocation(loc);
      });

      if (isSelected && infoWindowRef.current) {
        infoWindowRef.current.setContent(
          `<div style="font-family:sans-serif;padding:4px 6px;max-width:240px;">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#B6533C;letter-spacing:0.05em;">${loc.category}</div>
            <div style="font-size:13px;font-weight:700;color:#18212B;margin-top:2px;">${loc.name}</div>
            ${
              loc.secondaryName
                ? `<div style="font-size:11px;font-weight:600;color:#213B5C;margin-top:1px;">${loc.secondaryName}</div>`
                : ''
            }
            <div style="font-size:11px;color:#62605B;margin-top:2px;">${
              eventCount > 0 ? `${eventCount} upcoming event${eventCount > 1 ? 's' : ''}` : loc.address
            }</div>
          </div>`
        );
        infoWindowRef.current.open(map, marker);
      }

      markersRef.current[loc.id] = marker;
    }

    // Place user location marker if granted
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (userLocation) {
      userMarkerRef.current = new gmaps.Marker({
        position: userLocation,
        map,
        title: 'Your Current Location',
        zIndex: 1000,
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
          scale: 8,
        },
      });
    }
  }, [jsMapStatus, mappedPinLocations, selectedVenueId, eventsByVenueId, userLocation, handleSelectLocation]);

  // Build Google Maps Directions URL and Search URL for selected location
  const getDirectionsUrl = (loc: CampusVenue): string => {
    const destination =
      loc.latitude !== null && loc.longitude !== null
        ? `${loc.latitude},${loc.longitude}`
        : loc.navigationQuery;
    const originParam = userLocation
      ? `&origin=${userLocation.lat},${userLocation.lng}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${originParam}&travelmode=walking`;
  };

  const getGoogleMapsPlaceUrl = (loc: CampusVenue): string => {
    const query =
      loc.latitude !== null && loc.longitude !== null
        ? `${loc.latitude},${loc.longitude}`
        : loc.navigationQuery;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Real Google Maps Embed URL (Section 23 Fallback when JS API key is not configured)
  const embedMapUrl = useMemo(() => {
    const mapTypeCode = mapType === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${zoomLevel}&t=${mapTypeCode}&hl=en&output=embed`;
  }, [mapCenter.lat, mapCenter.lng, zoomLevel, mapType]);

  const getVerificationBadge = (verified: CampusVenue['verified']) => {
    if (verified === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[#ECF6F0] text-[#1E633F] border border-[#A8D5BC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E633F]" />
          Verified Google Maps Pin
        </span>
      );
    }
    if (verified === 'partially_verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[#F8F3E6] text-[#7A581B] border border-[#DEC48F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9C6B19]" />
          Verified Campus Sector
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider bg-[#FDF0F0] text-[#9E2A2B] border border-[#E5B3B4]">
        Location verification required
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* =====================================================================
          HEADER & SEARCH / FILTER BAR
      ===================================================================== */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-4 sm:p-5 shadow-[2px_2px_0_0_#18212B]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#D5D0C5]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-widest bg-[#18212B] text-[#FCFAF5]">
                DHSGSU Geographic Campus Map
              </span>
              <span className="text-[11px] font-mono text-[#62605B]">
                Patharia Hills • 23.8266° N, 78.7713° E
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#18212B] tracking-tight">
              Dr. Harisingh Gour Vishwavidyalaya, Sagar
            </h1>
            <p className="text-xs sm:text-sm text-[#62605B] mt-0.5">
              University Road, Patharia Hills / Gour Nagar, Sagar, Madhya Pradesh 470003
            </p>
          </div>

          {/* Primary Map Actions: Use My Location & Reset Campus Center */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locationStatus === 'requesting'}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-bold bg-[#EEF2F7] text-[#213B5C] border border-[#B8C7DC] hover:bg-[#E1E8F2] transition-colors cursor-pointer min-h-[38px]"
            >
              <svg className="w-4 h-4 text-[#213B5C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locationStatus === 'requesting'
                ? 'Locating...'
                : locationStatus === 'granted'
                ? 'Update My Location'
                : 'Use My Location'}
            </button>

            <button
              type="button"
              onClick={handleResetCampusCenter}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-bold bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA] hover:bg-[#DFD9CD] transition-colors cursor-pointer min-h-[38px]"
            >
              <svg className="w-4 h-4 text-[#B6533C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              DHSGSU Center
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                'Dr. Harisingh Gour Vishwavidyalaya Sagar Madhya Pradesh'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-bold bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] hover:border-[#18212B] transition-colors min-h-[38px]"
            >
              Open Full Google Maps
              <svg className="w-3.5 h-3.5 text-[#62605B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* User Geolocation Status Feedback Banner */}
        {locationMessage && (
          <div
            className={`mt-3 px-3 py-2 rounded-[3px] border text-xs flex items-center justify-between gap-2 ${
              locationStatus === 'granted'
                ? 'bg-[#ECF6F0] border-[#A8D5BC] text-[#1E633F]'
                : 'bg-[#F8F3E6] border-[#DEC48F] text-[#7A581B]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current shrink-0" />
              <span>{locationMessage}</span>
            </div>
            {userLocation && (
              <button
                type="button"
                onClick={() => {
                  setMapCenter(userLocation);
                  setZoomLevel(16);
                  if (googleMapInstanceRef.current) {
                    googleMapInstanceRef.current.panTo(userLocation);
                    googleMapInstanceRef.current.setZoom(16);
                  }
                }}
                className="font-bold underline shrink-0 cursor-pointer"
              >
                Center on Me
              </button>
            )}
          </div>
        )}

        {/* Search Input + Category Filter Pills */}
        <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-[#62605B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search DHSGSU buildings, libraries, hostels, departments, or events..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F4F0E8] border border-[#B9B4AA] rounded-[3px] text-sm text-[#18212B] placeholder-[#7A756C] focus:outline-none focus:border-[#18212B] focus:bg-[#FCFAF5]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#62605B] hover:text-[#18212B] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                      : 'bg-[#F4F0E8] text-[#62605B] border-[#B9B4AA] hover:text-[#18212B] hover:bg-[#EAE5DB]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN SPLIT LAYOUT: REAL GOOGLE MAP (LEFT) + DETAILS & DIRECTORY (RIGHT)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: REAL GEOGRAPHIC GOOGLE MAP CANVAS */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] overflow-hidden flex flex-col">
          {/* Map Top Control Bar */}
          <div className="px-3.5 py-2.5 bg-[#EAE5DB] border-b border-[#B9B4AA] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B6533C] shrink-0" />
              <span className="text-xs font-bold text-[#18212B] truncate">
                {selectedLocation
                  ? `${selectedLocation.name}`
                  : 'Dr. Harisingh Gour Vishwavidyalaya Campus'}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-[#62605B]">
                ({mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)})
              </span>
            </div>

            {/* Interactive Zoom & Map/Satellite Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMapType}
                className="px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] hover:border-[#18212B] cursor-pointer"
                title="Toggle Map / Satellite View"
              >
                {mapType === 'roadmap' ? 'Satellite View' : 'Map View'}
              </button>
              <div className="inline-flex rounded-[2px] border border-[#B9B4AA] bg-[#FCFAF5] overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleZoomChange(-1)}
                  className="px-2.5 py-1 text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] cursor-pointer border-r border-[#B9B4AA]"
                  title="Zoom Out"
                >
                  −
                </button>
                <span className="px-2 py-1 text-[11px] font-mono text-[#62605B] bg-[#F4F0E8]">
                  {zoomLevel}x
                </span>
                <button
                  type="button"
                  onClick={() => handleZoomChange(1)}
                  className="px-2.5 py-1 text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] cursor-pointer border-l border-[#B9B4AA]"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Real Google Maps Viewport */}
          <div className="relative w-full h-[390px] sm:h-[460px] lg:h-[520px] bg-[#E5E3DF]">
            {jsMapStatus === 'ready' ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <iframe
                key={`${mapCenter.lat}-${mapCenter.lng}-${zoomLevel}-${mapType}`}
                title="Dr. Harisingh Gour Vishwavidyalaya Real Google Map"
                src={embedMapUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            )}

            {/* Floating Quick Action on Map: Get Directions to Selected Pin */}
            {selectedLocation && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-[#FCFAF5]/95 backdrop-blur-xs border border-[#18212B] rounded-[3px] p-2.5 shadow-[2px_2px_0_0_#18212B] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#B6533C]">
                    {selectedLocation.latitude !== null && selectedLocation.longitude !== null
                      ? `Active Pin • ${selectedLocation.category}`
                      : `Location Verification Required • ${selectedLocation.category}`}
                  </div>
                  <div className="text-xs font-bold text-[#18212B] truncate">
                    {selectedLocation.name}
                  </div>
                  {selectedLocation.secondaryName && (
                    <div className="text-[11px] font-semibold text-[#213B5C] truncate">
                      {selectedLocation.secondaryName}
                    </div>
                  )}
                  <div className="text-[11px] text-[#62605B] truncate">
                    {selectedVenueEvents.length > 0
                      ? `${selectedVenueEvents.length} upcoming event${selectedVenueEvents.length > 1 ? 's' : ''} here`
                      : selectedLocation.address}
                  </div>
                </div>
                <a
                  href={getDirectionsUrl(selectedLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-[3px] text-xs font-bold bg-[#B6533C] text-white hover:bg-[#9E442F] transition-colors shadow-[1px_1px_0_0_#18212B]"
                >
                  Directions →
                </a>
              </div>
            )}
          </div>

          {/* Verified Campus POI Quick-Select Strip (Focuses Real Google Map on Exact Building Coordinates) */}
          <div className="p-3 bg-[#F4F0E8] border-t border-[#B9B4AA]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#62605B]">
                Verified Campus Map Pins ({mappedPinLocations.length}) — Tap to Focus Map
              </span>
              <span className="text-[11px] text-[#62605B]">
                WGS84 Coordinates • Sagar, MP
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {mappedPinLocations.map(loc => {
                const isSelected = loc.id === selectedVenueId;
                const eventCount = eventsByVenueId[loc.id]?.length || 0;
                const style = CATEGORY_COLORS[loc.category] || CATEGORY_COLORS.Other;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`group shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B] shadow-[1px_1px_0_0_#B6533C]'
                        : 'bg-[#FCFAF5] text-[#18212B] border-[#B9B4AA] hover:border-[#18212B]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#B6533C' : style.pinHex }}
                    />
                    <span className="font-bold whitespace-nowrap">{loc.name}</span>
                    {eventCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-bold ${
                          isSelected
                            ? 'bg-[#B6533C] text-white'
                            : 'bg-[#FBF3EF] text-[#B6533C] border border-[#E5B8A8]'
                        }`}
                      >
                        {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 23 Transparent API Status Bar when JS API Key is not configured */}
          {jsMapStatus !== 'ready' && (
            <div className="px-3.5 py-2 bg-[#EAE5DB] border-t border-[#B9B4AA] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#62605B]">
              <span>
                <strong>Google Maps Mode:</strong> Live Google Maps Geographic View centered on verified DHSGSU coordinates. Set{' '}
                <code className="px-1 py-0.5 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] font-mono text-[10px] text-[#18212B]">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </code>{' '}
                to enable custom multi-pin JS SDK overlay.
              </span>
              {selectedLocation && (
                <a
                  href={getGoogleMapsPlaceUrl(selectedLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#213B5C] hover:underline shrink-0"
                >
                  Open Pin in Google Maps ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SELECTED LOCATION DETAILS CARD + UPCOMING EVENTS + CAMPUS DIRECTORY */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* SELECTED LOCATION DETAILS CARD (Section 10) */}
          {selectedLocation && (
            <div className="bg-[#FCFAF5] border border-[#18212B] rounded-[3px] shadow-[3px_3px_0_0_#18212B] overflow-hidden">
              {/* Mobile Collapsible Header */}
              <div className="p-4 sm:p-5 border-b border-[#D5D0C5]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${
                        CATEGORY_COLORS[selectedLocation.category]?.bg || 'bg-[#EAE5DB]'
                      } ${CATEGORY_COLORS[selectedLocation.category]?.text || 'text-[#18212B]'} ${
                        CATEGORY_COLORS[selectedLocation.category]?.border || 'border-[#B9B4AA]'
                      }`}
                    >
                      {selectedLocation.category}
                    </span>
                    {getVerificationBadge(selectedLocation.verified)}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileSheetExpanded(prev => !prev)}
                    className="lg:hidden text-xs font-bold text-[#62605B] hover:text-[#18212B] px-2 py-1 border border-[#B9B4AA] rounded-[2px]"
                  >
                    {mobileSheetExpanded ? 'Minimize' : 'Expand'}
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#18212B] leading-snug">
                  {selectedLocation.name}
                </h2>
                {selectedLocation.secondaryName && (
                  <div className="text-xs sm:text-sm font-bold text-[#213B5C] mt-0.5">
                    {selectedLocation.secondaryName}
                  </div>
                )}
                <p className="text-xs text-[#62605B] mt-1">{selectedLocation.address}</p>

                {/* Primary & Secondary Navigation Actions (Section 10 & 13) */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <a
                    href={getDirectionsUrl(selectedLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[3px] text-xs font-bold bg-[#B6533C] text-white hover:bg-[#9E442F] transition-colors shadow-[2px_2px_0_0_#18212B] min-h-[42px]"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Get Directions →
                  </a>
                  <a
                    href={getGoogleMapsPlaceUrl(selectedLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[3px] text-xs font-bold bg-[#F4F0E8] text-[#18212B] border border-[#B9B4AA] hover:border-[#18212B] transition-colors min-h-[42px]"
                  >
                    Google Maps ↗
                  </a>
                </div>
              </div>

              {/* Expandable Body */}
              <div className={`${mobileSheetExpanded ? 'block' : 'hidden lg:block'} p-4 sm:p-5 space-y-4`}>
                {/* Description & GIS Verification Metadata */}
                <div className="space-y-2.5">
                  <p className="text-xs sm:text-sm text-[#33312E] leading-relaxed">
                    {selectedLocation.description}
                  </p>

                  <div className="p-3 bg-[#F4F0E8] border border-[#D5D0C5] rounded-[3px] space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#62605B] uppercase tracking-wider">
                        WGS84 Coordinates:
                      </span>
                      <span className="font-mono font-bold text-[#18212B]">
                        {selectedLocation.latitude !== null && selectedLocation.longitude !== null
                          ? `${selectedLocation.latitude.toFixed(7)}° N, ${selectedLocation.longitude.toFixed(7)}° E`
                          : 'Location verification required'}
                      </span>
                    </div>
                    {selectedLocation.plusCode && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#62605B] uppercase tracking-wider">
                          Google Plus Code:
                        </span>
                        <span className="font-mono font-bold text-[#213B5C]">
                          {selectedLocation.plusCode} • Sagar, MP
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[#62605B] uppercase tracking-wider shrink-0">
                        GIS Source:
                      </span>
                      <span className="text-right text-[#4A4843]">{selectedLocation.source}</span>
                    </div>
                  </div>
                </div>

                {/* UPCOMING EVENTS AT THIS LOCATION (Section 11) */}
                <div className="pt-2 border-t border-[#D5D0C5]">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                      Upcoming Events at this Location ({selectedVenueEvents.length})
                    </h3>
                  </div>

                  {selectedVenueEvents.length === 0 ? (
                    <div className="p-3.5 bg-[#F4F0E8] border border-[#D5D0C5] rounded-[3px] text-xs text-[#62605B]">
                      No scheduled upcoming events at {selectedLocation.name} right now.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedVenueEvents.map(evt => {
                        const eventDate = new Date(evt.startTime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });
                        const eventTime = new Date(evt.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={evt._id}
                            className="p-3 bg-[#F4F0E8] hover:bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge variant="accent">
                                {evt.category}
                              </Badge>
                              <span className="text-[11px] font-mono text-[#62605B]">
                                {eventDate} • {eventTime}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#18212B] leading-snug">
                              {evt.title}
                            </h4>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#62605B] truncate">
                                {evt.departmentScope || evt.organizerName}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenEvent(evt)}
                              >
                                View Event →
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CAMPUS LOCATIONS DIRECTORY LIST (Verified + Unverified Directory Entries) */}
          <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] shadow-[2px_2px_0_0_#18212B] overflow-hidden">
            <div className="px-4 py-3 bg-[#EAE5DB] border-b border-[#B9B4AA] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#18212B]">
                DHSGSU Campus Directory ({filteredLocations.length})
              </h3>
              <span className="text-[11px] text-[#62605B]">
                {mappedPinLocations.length} pinned • {filteredLocations.length - mappedPinLocations.length} unverified
              </span>
            </div>

            <div className="max-h-[340px] overflow-y-auto divide-y divide-[#E2DDD2]">
              {filteredLocations.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#62605B]">
                  No DHSGSU campus locations match &ldquo;{searchQuery}&rdquo; in {activeCategory}.
                </div>
              ) : (
                filteredLocations.map(loc => {
                  const isSelected = loc.id === selectedVenueId;
                  const eventCount = eventsByVenueId[loc.id]?.length || 0;
                  const hasCoords = loc.latitude !== null && loc.longitude !== null;

                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className={`w-full text-left px-4 py-3 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected ? 'bg-[#EAE5DB]' : 'hover:bg-[#F4F0E8]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B6533C]">
                            {loc.category}
                          </span>
                          {!hasCoords && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-[#FDF0F0] border border-[#E5B3B4] rounded-[2px] text-[#9E2A2B] font-bold">
                              Location verification required
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#18212B] truncate">
                          {loc.name}
                        </div>
                        {loc.secondaryName && (
                          <div className="text-[11px] font-semibold text-[#213B5C] truncate">
                            {loc.secondaryName}
                          </div>
                        )}
                        <div className="text-[11px] text-[#62605B] truncate mt-0.5">
                          {loc.address}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {eventCount > 0 && (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-[#FBF3EF] text-[#B6533C] border border-[#E5B8A8]">
                            {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-[#213B5C]">
                          {isSelected ? 'Selected' : hasCoords ? 'View Pin →' : 'Details →'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
