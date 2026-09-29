'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { ToastProvider } from '../components/ui/Toast';
import { DevToolbar } from '../components/layout/DevToolbar';
import { Navbar, ActiveTab } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

// Landing & Auth
import { LandingPage } from '../components/landing/LandingPage';
import { AuthModal } from '../components/auth/AuthModal';

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
import { OrganizerPendingView } from '../components/organizer/OrganizerPendingView';
import { QRScannerView } from '../components/organizer/QRScannerView';
import { ManageEventsList } from '../components/organizer/ManageEventsList';
import { ParticipantsView } from '../components/organizer/ParticipantsView';
import { CreateEventModal } from '../components/organizer/CreateEventModal';
import { AnnouncementsModal } from '../components/organizer/AnnouncementsModal';
import { CertificatesManager } from '../components/organizer/CertificatesManager';

// Admin Views
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { OrganizerRequestsView } from '../components/admin/OrganizerRequestsView';
import { UserManagement } from '../components/admin/UserManagement';
import { EventModeration } from '../components/admin/EventModeration';
import { VenueCategorySettings } from '../components/admin/VenueCategorySettings';
import { AuditLogView } from '../components/admin/AuditLogView';

// Mobile Promo
import { ApkDownloadModal } from '../components/mobile-promo/ApkDownloadModal';

import { Button } from '../components/ui/Button';
import { CampusEvent, Registration, UserRole } from '../types';

function MainApp() {
  const { currentUser, setCurrentUserId, events, registrations, allUsers } = useApp();

  // Primary state: Landing Page First as requested by specification (Section 11)
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [targetVenueId, setTargetVenueId] = useState<string | undefined>(undefined);
  const [targetEventId, setTargetEventId] = useState<string | undefined>(undefined);

  // Modals
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CampusEvent | null>(null);
  const [activePassData, setActivePassData] = useState<{ registration: Registration; event: CampusEvent } | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  // Handle opening pass by event ID
  const handleOpenPassByEventId = (eventId: string) => {
    const reg = registrations.find(r => r.eventId === eventId && r.userId === currentUser._id && r.status === 'CONFIRMED');
    const evt = events.find(e => e._id === eventId);
    if (reg && evt) {
      setActivePassData({ registration: reg, event: evt });
    }
  };

  // Handler for direct persona switching from landing page or prototype toolbar
  const handleSelectRole = (role: 'student' | 'organizer' | 'admin', userId?: string) => {
    if (userId) {
      setCurrentUserId(userId);
    }
    if (role === 'student') {
      setActiveTab('student-home');
    } else if (role === 'organizer') {
      const user = allUsers.find(u => u._id === userId) || currentUser;
      if (user.organizerStatus === 'PENDING') {
        setActiveTab('organizer-pending');
      } else {
        setActiveTab('organizer-dashboard');
      }
    } else {
      setActiveTab('admin-dashboard');
    }
  };

  const handleEnterApp = () => {
    // If user is already on a role, go to their dashboard, otherwise open auth modal
    if (currentUser.role === 'organizer') {
      if (currentUser.organizerStatus === 'PENDING') {
        setActiveTab('organizer-pending');
      } else {
        setActiveTab('organizer-dashboard');
      }
    } else if (currentUser.role === 'admin') {
      setActiveTab('admin-dashboard');
    } else {
      setActiveTab('student-home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E8] text-[#18212B] font-sans antialiased selection:bg-[#B6533C] selection:text-white">
      {/* Discreet Collapsible Prototype Testing Toolbar */}
      <DevToolbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Universal PARISAR Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onCreateEvent={() => setIsCreateEventOpen(true)}
        onSendAnnouncement={() => setIsAnnouncementsOpen(true)}
      />

      {/* Sub-bar for quick landing page return or login */}
      {activeTab === 'landing' && (
        <div className="bg-[#EAE5DB] border-b border-[#B9B4AA] py-2 px-4 text-center text-xs font-mono">
          <span className="text-[#62605B]">Dr. Harisingh Gour Vishwavidyalaya • Central University, Sagar (M.P.) • </span>
          <button 
            onClick={() => {
              setAuthInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            className="text-[#B6533C] font-bold underline hover:text-[#18212B] ml-1"
          >
            Sign In / Switch Persona
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* LANDING PAGE (Section 11: Landing Page First) */}
        {activeTab === 'landing' && (
          <LandingPage
            onEnterApp={handleEnterApp}
            onExploreEvents={() => setActiveTab('student-events')}
            onSelectRole={handleSelectRole}
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}

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
                Official compiled, signed release APK (4.6 MB) available for Dr. Harisingh Gour Vishwavidyalaya.
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
        {activeTab === 'organizer-pending' && (
          <OrganizerPendingView
            onSwitchToAdmin={() => handleSelectRole('admin', 'admin-1')}
            onSwitchToStudent={() => handleSelectRole('student', 'student-1')}
          />
        )}

        {activeTab === 'organizer-dashboard' && (
          currentUser.organizerStatus === 'PENDING' ? (
            <OrganizerPendingView
              onSwitchToAdmin={() => handleSelectRole('admin', 'admin-1')}
              onSwitchToStudent={() => handleSelectRole('student', 'student-1')}
            />
          ) : (
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
          )
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
          <QRScannerView />
        )}

        {activeTab === 'organizer-participants' && (
          <ParticipantsView initialEventId={targetEventId} />
        )}

        {activeTab === 'organizer-certificates' && (
          <CertificatesManager initialEventId={targetEventId} />
        )}

        {/* ADMINISTRATOR FLOWS */}
        {activeTab === 'admin-dashboard' && (
          <AdminDashboard
            onNavigateToModeration={() => setActiveTab('admin-moderation')}
            onNavigateToUsers={() => setActiveTab('admin-users')}
            onNavigateToVenues={() => setActiveTab('admin-venues')}
            onNavigateToAudit={() => setActiveTab('admin-audit')}
          />
        )}

        {activeTab === 'admin-organizer-requests' && (
          <OrganizerRequestsView />
        )}

        {activeTab === 'admin-moderation' && (
          <EventModeration />
        )}

        {activeTab === 'admin-users' && (
          <UserManagement />
        )}

        {activeTab === 'admin-venues' && (
          <VenueCategorySettings />
        )}

        {activeTab === 'admin-audit' && (
          <AuditLogView />
        )}
      </main>

      {/* Institutional DHSGSU Footer */}
      <Footer 
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* Global Modals */}
      {selectedEventForDetail && (
        <EventDetailModal
          event={selectedEventForDetail}
          isOpen={!!selectedEventForDetail}
          onClose={() => setSelectedEventForDetail(null)}
          onViewPass={reg => {
            const evt = selectedEventForDetail;
            setSelectedEventForDetail(null);
            if (evt) setActivePassData({ registration: reg, event: evt });
          }}
          onViewOnMap={(vId: string) => {
            setSelectedEventForDetail(null);
            setTargetVenueId(vId);
            setActiveTab('student-map');
          }}
        />
      )}

      {activePassData && (
        <EventPassModal
          registration={activePassData.registration}
          event={activePassData.event}
          isOpen={!!activePassData}
          onClose={() => setActivePassData(null)}
        />
      )}

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onSuccess={() => setIsCreateEventOpen(false)}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authInitialMode}
        onSuccess={role => {
          if (role === 'student') setActiveTab('student-home');
          else if (role === 'organizer') {
            if (currentUser.organizerStatus === 'PENDING') {
              setActiveTab('organizer-pending');
            } else {
              setActiveTab('organizer-dashboard');
            }
          } else {
            setActiveTab('admin-dashboard');
          }
        }}
      />
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
