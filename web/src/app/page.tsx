'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { ToastProvider } from '../components/ui/Toast';
import { DevToolbar } from '../components/layout/DevToolbar';
import { Navbar, ActiveTab } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

// Student Views
import { StudentHome } from '../components/student/StudentHome';
import { EventDiscovery } from '../components/student/EventDiscovery';
import { MyPassesView } from '../components/student/MyPassesView';
import { CampusMap } from '../components/student/CampusMap';
import { EventPassport } from '../components/student/EventPassport';
import { CertificatesView } from '../components/student/CertificatesView';
import { NotificationsView } from '../components/student/NotificationsView';
import { EventDetailModal } from '../components/student/EventDetailModal';
import { EventPassModal } from '../components/student/EventPassModal';
import { ProfileView } from '../components/student/ProfileView';

// Organizer Views
import { OrganizerDashboard } from '../components/organizer/OrganizerDashboard';
import { QRScannerView } from '../components/organizer/QRScannerView';
import { ManageEventsList } from '../components/organizer/ManageEventsList';
import { ParticipantsView } from '../components/organizer/ParticipantsView';
import { CreateEventModal } from '../components/organizer/CreateEventModal';
import { AnnouncementsModal } from '../components/organizer/AnnouncementsModal';
import { CertificatesManager } from '../components/organizer/CertificatesManager';

// Admin Views
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { UserManagement } from '../components/admin/UserManagement';
import { EventModeration } from '../components/admin/EventModeration';
import { VenueCategorySettings } from '../components/admin/VenueCategorySettings';
import { AuditLogView } from '../components/admin/AuditLogView';

// Mobile Promo
import { ApkDownloadModal } from '../components/mobile-promo/ApkDownloadModal';

import { Button } from '../components/ui/Button';
import { CampusEvent, Registration } from '../types';

function MainApp() {
  const { currentUser, events, registrations } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('student-home');
  const [targetVenueId, setTargetVenueId] = useState<string | undefined>(undefined);
  const [targetEventId, setTargetEventId] = useState<string | undefined>(undefined);

  // Modals
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CampusEvent | null>(null);
  const [activePassData, setActivePassData] = useState<{ registration: Registration; event: CampusEvent } | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Handle opening pass by event ID
  const handleOpenPassByEventId = (eventId: string) => {
    const reg = registrations.find(r => r.eventId === eventId && r.userId === currentUser._id && r.status === 'CONFIRMED');
    const evt = events.find(e => e._id === eventId);
    if (reg && evt) {
      setActivePassData({ registration: reg, event: evt });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E8] text-[#18212B] font-sans antialiased selection:bg-[#B6533C] selection:text-white">
      {/* Discreet Collapsible Prototype Testing Toolbar */}
      <DevToolbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Universal PARISAR Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* STUDENT FLOWS */}
        {activeTab === 'student-home' && (
          <StudentHome
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onNavigateToEvents={() => setActiveTab('student-events')}
            onNavigateToPassport={() => setActiveTab('student-passport')}
            onNavigateToMap={vId => {
              setTargetVenueId(vId);
              setActiveTab('student-map');
            }}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}

        {activeTab === 'student-events' && (
          <EventDiscovery
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
            onOpenPass={handleOpenPassByEventId}
          />
        )}

        {activeTab === 'student-passes' && (
          <MyPassesView
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onExploreEvents={() => setActiveTab('student-events')}
          />
        )}

        {activeTab === 'student-map' && (
          <CampusMap
            initialVenueId={targetVenueId}
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
          />
        )}

        {activeTab === 'student-passport' && (
          <EventPassport
            onViewCertificates={() => setActiveTab('student-passes')}
            onExploreEvents={() => setActiveTab('student-events')}
          />
        )}

        {activeTab === 'student-notifications' && (
          <NotificationsView
            onNavigateToPass={eventId => {
              if (eventId) handleOpenPassByEventId(eventId);
              else setActiveTab('student-passes');
            }}
            onNavigateToCertificates={() => setActiveTab('student-passport')}
          />
        )}

        {activeTab === 'student-profile' && (
          <ProfileView
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onExploreEvents={() => setActiveTab('student-events')}
          />
        )}

        {activeTab === 'mobile-apk' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-8 shadow-[2px_2px_0_0_#18212B] text-center space-y-4">
              <div className="w-16 h-16 rounded-[3px] bg-[#EAE5DB] text-[#B6533C] border border-[#B9B4AA] flex items-center justify-center mx-auto shadow-[2px_2px_0_0_#18212B]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#18212B]">PARISAR Official Android Client • DHSGSU</h2>
              <p className="text-sm text-[#62605B] max-w-lg mx-auto">
                The mobile companion is built natively in React Native & Expo. Download the APK directly or scan the QR code to install.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsApkModalOpen(true)}
                >
                  Open APK Download & QR Installer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ORGANIZER FLOWS */}
        {activeTab === 'organizer-dashboard' && (
          <OrganizerDashboard
            onCreateEvent={() => setIsCreateEventOpen(true)}
            onManageEvents={() => setActiveTab('organizer-events')}
            onScanAttendance={eId => {
              if (eId) setTargetEventId(eId);
              setActiveTab('organizer-scanner');
            }}
            onViewParticipants={eId => {
              if (eId) setTargetEventId(eId);
              setActiveTab('organizer-participants');
            }}
            onAnnouncements={eId => {
              if (eId) setTargetEventId(eId);
              setIsAnnouncementsOpen(true);
            }}
            onCertificates={eId => {
              if (eId) setTargetEventId(eId);
              setActiveTab('organizer-certificates');
            }}
          />
        )}

        {activeTab === 'organizer-events' && (
          <ManageEventsList
            onCreateEvent={() => setIsCreateEventOpen(true)}
            onScanAttendance={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-scanner');
            }}
            onViewParticipants={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-participants');
            }}
            onAnnouncements={eId => {
              setTargetEventId(eId);
              setIsAnnouncementsOpen(true);
            }}
            onCertificates={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-certificates');
            }}
          />
        )}

        {activeTab === 'organizer-scanner' && (
          <QRScannerView
            onNavigateToParticipants={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-participants');
            }}
          />
        )}

        {activeTab === 'organizer-participants' && (
          <ParticipantsView
            initialEventId={targetEventId}
            onNavigateToScanner={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-scanner');
            }}
          />
        )}

        {activeTab === 'organizer-announcements' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-6 shadow-[2px_2px_0_0_#18212B] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#18212B]">Broadcast Announcements</h2>
                <p className="text-xs text-[#62605B] mt-0.5">Send alerts for room relocations, schedule delays, or cancellations.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAnnouncementsOpen(true)}
              >
                Send New Alert
              </Button>
            </div>
            <div className="bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] p-4 text-xs text-[#62605B] text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
              Select an event to dispatch announcements to all registered student inboxes.
            </div>
          </div>
        )}

        {activeTab === 'organizer-certificates' && (
          <CertificatesManager initialEventId={targetEventId} />
        )}

        {/* ADMIN FLOWS */}
        {activeTab === 'admin-dashboard' && (
          <AdminDashboard
            onNavigateToUsers={() => setActiveTab('admin-users')}
            onNavigateToModeration={() => setActiveTab('admin-moderation')}
            onNavigateToVenues={() => setActiveTab('admin-venues')}
            onNavigateToAudit={() => setActiveTab('admin-audit')}
          />
        )}

        {activeTab === 'admin-users' && <UserManagement />}

        {activeTab === 'admin-moderation' && (
          <EventModeration
            onOpenEventDetails={(evt: CampusEvent) => setSelectedEventForDetail(evt)}
          />
        )}

        {activeTab === 'admin-venues' && <VenueCategorySettings />}

        {activeTab === 'admin-audit' && <AuditLogView />}
      </main>

      {/* Reusable Universal Modals */}
      <EventDetailModal
        isOpen={Boolean(selectedEventForDetail)}
        onClose={() => setSelectedEventForDetail(null)}
        event={selectedEventForDetail}
        onViewPass={reg => {
          setSelectedEventForDetail(null);
          if (selectedEventForDetail) {
            setActivePassData({ registration: reg, event: selectedEventForDetail });
          }
        }}
        onViewOnMap={vId => {
          setTargetVenueId(vId);
          setActiveTab('student-map');
        }}
      />

      <EventPassModal
        isOpen={Boolean(activePassData)}
        onClose={() => setActivePassData(null)}
        registration={activePassData?.registration || null}
        event={activePassData?.event || null}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onSuccess={newEvent => {
          setActiveTab('organizer-events');
        }}
      />

      <AnnouncementsModal
        isOpen={isAnnouncementsOpen}
        onClose={() => setIsAnnouncementsOpen(false)}
        defaultEventId={targetEventId}
      />

      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* University Footer */}
      <Footer onOpenApkModal={() => setIsApkModalOpen(true)} />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AppProvider>
  );
}
