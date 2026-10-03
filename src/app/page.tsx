'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { ToastProvider } from '../components/ui/Toast';
import { DevToolbar } from '../components/layout/DevToolbar';
import { Navbar, ActiveTab } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

// Landing & Full-Page Authentication
import { LandingPage } from '../components/landing/LandingPage';
import { AuthView } from '../components/auth/AuthView';

// Student Views
import { StudentHome } from '../components/student/StudentHome';
import { EventDiscovery } from '../components/student/EventDiscovery';
import { MyPassesView } from '../components/student/MyPassesView';
import { CampusMap } from '../components/student/CampusMap';
import { EventPassport } from '../components/student/EventPassport';
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
import { AdminAttendanceView } from '../components/admin/AdminAttendanceView';

// Shared Authenticated Profile View (Organizer & Admin)
import { RoleProfileView } from '../components/profile/RoleProfileView';

// Mobile Promo
import { ApkDownloadModal } from '../components/mobile-promo/ApkDownloadModal';

import { Button } from '../components/ui/Button';
import { CampusEvent, Registration, User, UserRole } from '../types';

const PATH_TO_TAB_MAP: Record<string, ActiveTab> = {
  '/': 'landing',
  '/login': 'auth-login',
  '/signup': 'auth-signup',
  '/admin/login': 'auth-admin',
  '/student': 'student-home',
  '/student/events': 'student-events',
  '/student/map': 'student-map',
  '/student/my-events': 'student-my-events',
  '/student/my-pass': 'student-passes',
  '/student/profile': 'student-profile',
  '/organizer': 'organizer-dashboard',
  '/organizer/pending': 'organizer-pending',
  '/organizer/events': 'organizer-events',
  '/organizer/events/create': 'organizer-create',
  '/organizer/participants': 'organizer-participants',
  '/organizer/attendance': 'organizer-scanner',
  '/organizer/profile': 'organizer-profile',
  '/admin': 'admin-dashboard',
  '/admin/organizer-requests': 'admin-organizer-requests',
  '/admin/events': 'admin-moderation',
  '/admin/participants': 'admin-participants',
  '/admin/attendance': 'admin-attendance',
  '/admin/settings': 'admin-venues',
};

interface MainAppProps {
  initialTab?: ActiveTab;
}

export function MainApp({ initialTab = 'landing' }: MainAppProps) {
  const { currentUser, isAuthenticated, events, registrations } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [targetVenueId, setTargetVenueId] = useState<string | undefined>(undefined);
  const [targetEventId, setTargetEventId] = useState<string | undefined>(undefined);

  // Modals
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CampusEvent | null>(null);
  const [activePassData, setActivePassData] = useState<{ registration: Registration; event: CampusEvent } | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Sync initial URL pathname or ?tab= query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as ActiveTab | null;
      if (tabParam) {
        setActiveTab(tabParam);
        return;
      }
      const cleanPath = window.location.pathname.replace(/\/$/, '') || '/';
      if (PATH_TO_TAB_MAP[cleanPath] && initialTab === 'landing') {
        const mappedTab = PATH_TO_TAB_MAP[cleanPath];
        if (mappedTab === 'organizer-create') {
          setActiveTab('organizer-events');
          setIsCreateEventOpen(true);
        } else {
          setActiveTab(mappedTab);
        }
      }
    }
  }, [initialTab]);

  // Handle opening pass by event ID
  const handleOpenPassByEventId = (eventId: string) => {
    const reg = registrations.find(r => r.eventId === eventId && r.userId === currentUser._id && r.status === 'CONFIRMED');
    const evt = events.find(e => e._id === eventId);
    if (reg && evt) {
      setActivePassData({ registration: reg, event: evt });
    }
  };

  // Route user to their role-specific panel
  const navigateToRoleHome = (role: UserRole, organizerStatus?: User['organizerStatus']) => {
    if (role === 'student') {
      setActiveTab('student-home');
    } else if (role === 'organizer') {
      if (organizerStatus && organizerStatus !== 'VERIFIED') {
        setActiveTab('organizer-pending');
      } else {
        setActiveTab('organizer-dashboard');
      }
    } else if (role === 'admin') {
      setActiveTab('admin-dashboard');
    }
  };

  const handleEnterApp = () => {
    if (!isAuthenticated) {
      setActiveTab('auth-login');
      return;
    }
    navigateToRoleHome(currentUser.role, currentUser.organizerStatus);
  };

  // Determine effective tab enforcing Protected Routes & Strict Role Separation (Sections 16 & 20)
  const getEffectiveTab = (): ActiveTab => {
    // Publicly accessible tabs even when logged out
    const publicTabs: ActiveTab[] = [
      'landing',
      'auth-login',
      'auth-signup',
      'auth-admin',
      'student-events',
      'student-map',
      'mobile-apk',
    ];

    if (!isAuthenticated) {
      if (publicTabs.includes(activeTab)) {
        return activeTab;
      }
      // Unauthenticated access to any protected panel redirects to Login
      if (activeTab.startsWith('admin-')) return 'auth-admin';
      return 'auth-login';
    }

    // Authenticated user visiting auth pages -> redirect to their role panel
    if (activeTab === 'auth-login' || activeTab === 'auth-signup' || activeTab === 'auth-admin') {
      if (currentUser.role === 'student') return 'student-home';
      if (currentUser.role === 'organizer') {
        return currentUser.organizerStatus === 'VERIFIED' ? 'organizer-dashboard' : 'organizer-pending';
      }
      return 'admin-dashboard';
    }

    // Role-based panel enforcement
    if (currentUser.role === 'student') {
      if (activeTab.startsWith('organizer-') || activeTab.startsWith('admin-')) {
        return 'student-home';
      }
      return activeTab;
    }

    if (currentUser.role === 'organizer') {
      if (activeTab.startsWith('admin-') || activeTab === 'student-home' || activeTab === 'student-my-events' || activeTab === 'student-passes' || activeTab === 'student-profile') {
        return currentUser.organizerStatus === 'VERIFIED' ? 'organizer-dashboard' : 'organizer-pending';
      }
      // Pending or Rejected Organizer cannot access full organizer tools
      if (currentUser.organizerStatus !== 'VERIFIED') {
        if (activeTab === 'organizer-profile' || activeTab === 'landing' || activeTab === 'student-events' || activeTab === 'student-map') {
          return activeTab;
        }
        return 'organizer-pending';
      }
      return activeTab;
    }

    if (currentUser.role === 'admin') {
      if (activeTab.startsWith('organizer-') || activeTab === 'student-home' || activeTab === 'student-my-events' || activeTab === 'student-passes' || activeTab === 'student-profile') {
        return 'admin-dashboard';
      }
      return activeTab;
    }

    return activeTab;
  };

  const effectiveTab = getEffectiveTab();

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E8] text-[#18212B] font-sans antialiased selection:bg-[#B6533C] selection:text-white">
      {/* Developer-only toolbar (hidden in normal product UI unless ?dev=true or Ctrl+Shift+D) */}
      <DevToolbar activeTab={effectiveTab} setActiveTab={setActiveTab} />

      {/* Universal PARISAR Navigation Bar */}
      <Navbar 
        activeTab={effectiveTab} 
        setActiveTab={setActiveTab}
        onCreateEvent={() => {
          if (currentUser.role === 'organizer' && currentUser.organizerStatus === 'VERIFIED') {
            setIsCreateEventOpen(true);
          }
        }}
        onSendAnnouncement={() => setIsAnnouncementsOpen(true)}
        onLogout={() => setActiveTab('landing')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-24 lg:pb-12">
        {/* LANDING PAGE */}
        {effectiveTab === 'landing' && (
          <LandingPage
            onEnterApp={handleEnterApp}
            onLogin={() => setActiveTab('auth-login')}
            onSignup={() => setActiveTab('auth-signup')}
            onExploreEvents={() => setActiveTab('student-events')}
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        )}

        {/* FULL-PAGE AUTHENTICATION VIEWS (Login / Signup / Controlled Admin Login) */}
        {(effectiveTab === 'auth-login' || effectiveTab === 'auth-signup' || effectiveTab === 'auth-admin') && (
          <AuthView
            initialMode={
              effectiveTab === 'auth-signup'
                ? 'signup'
                : effectiveTab === 'auth-admin'
                ? 'admin-login'
                : 'login'
            }
            onSuccess={(user: User) => {
              navigateToRoleHome(user.role, user.organizerStatus);
            }}
            onBackToLanding={() => setActiveTab('landing')}
          />
        )}

        {/* STUDENT PANEL VIEWS */}
        {effectiveTab === 'student-home' && (
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

        {effectiveTab === 'student-events' && (
          <EventDiscovery
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
            onOpenPass={handleOpenPassByEventId}
          />
        )}

        {effectiveTab === 'student-my-events' && (
          <ProfileView
            initialSubTab="my-events"
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onExploreEvents={() => setActiveTab('student-events')}
            onLogout={() => setActiveTab('landing')}
          />
        )}

        {effectiveTab === 'student-passes' && (
          <MyPassesView
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onExploreEvents={() => setActiveTab('student-events')}
          />
        )}

        {effectiveTab === 'student-map' && (
          <CampusMap
            initialVenueId={targetVenueId}
            onOpenEvent={evt => setSelectedEventForDetail(evt)}
          />
        )}

        {effectiveTab === 'student-passport' && (
          <EventPassport
            onViewCertificates={() => setActiveTab('student-passes')}
            onExploreEvents={() => setActiveTab('student-events')}
          />
        )}

        {effectiveTab === 'student-notifications' && (
          <NotificationsView
            onNavigateToPass={eventId => {
              if (eventId) handleOpenPassByEventId(eventId);
              else setActiveTab('student-passes');
            }}
            onNavigateToCertificates={() => setActiveTab('student-passport')}
          />
        )}

        {effectiveTab === 'student-profile' && (
          <ProfileView
            initialSubTab="settings"
            onOpenPass={(reg, evt) => setActivePassData({ registration: reg, event: evt })}
            onExploreEvents={() => setActiveTab('student-events')}
            onLogout={() => setActiveTab('landing')}
          />
        )}

        {effectiveTab === 'mobile-apk' && (
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

        {/* ORGANIZER PANEL VIEWS */}
        {effectiveTab === 'organizer-pending' && (
          <OrganizerPendingView
            onLogout={() => setActiveTab('landing')}
          />
        )}

        {effectiveTab === 'organizer-dashboard' && (
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

        {effectiveTab === 'organizer-events' && (
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

        {effectiveTab === 'organizer-scanner' && (
          <QRScannerView
            onNavigateToParticipants={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-participants');
            }}
          />
        )}

        {effectiveTab === 'organizer-participants' && (
          <ParticipantsView
            initialEventId={targetEventId}
            onNavigateToScanner={eId => {
              setTargetEventId(eId);
              setActiveTab('organizer-scanner');
            }}
          />
        )}

        {effectiveTab === 'organizer-certificates' && (
          <CertificatesManager initialEventId={targetEventId} />
        )}

        {effectiveTab === 'organizer-profile' && (
          <RoleProfileView onLogout={() => setActiveTab('landing')} />
        )}

        {/* UNIVERSITY ADMINISTRATOR PANEL VIEWS */}
        {effectiveTab === 'admin-dashboard' && (
          <AdminDashboard
            onNavigateToOrganizerRequests={() => setActiveTab('admin-organizer-requests')}
            onNavigateToModeration={() => setActiveTab('admin-moderation')}
            onNavigateToParticipants={() => setActiveTab('admin-participants')}
            onNavigateToAttendance={() => setActiveTab('admin-attendance')}
            onNavigateToVenues={() => setActiveTab('admin-venues')}
            onNavigateToUsers={() => setActiveTab('admin-users')}
            onNavigateToAudit={() => setActiveTab('admin-audit')}
          />
        )}

        {effectiveTab === 'admin-organizer-requests' && (
          <OrganizerRequestsView />
        )}

        {effectiveTab === 'admin-moderation' && (
          <EventModeration onOpenEventDetails={evt => setSelectedEventForDetail(evt)} />
        )}

        {(effectiveTab === 'admin-participants' || effectiveTab === 'admin-users') && (
          <UserManagement />
        )}

        {effectiveTab === 'admin-attendance' && (
          <AdminAttendanceView />
        )}

        {effectiveTab === 'admin-venues' && (
          <VenueCategorySettings />
        )}

        {effectiveTab === 'admin-audit' && (
          <AuditLogView />
        )}

        {effectiveTab === 'admin-profile' && (
          <RoleProfileView onLogout={() => setActiveTab('landing')} />
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
    </div>
  );
}

export function ParisarRouteApp({ initialTab = 'landing' }: { initialTab?: ActiveTab }) {
  return (
    <AppProvider>
      <ToastProvider>
        <MainApp initialTab={initialTab} />
      </ToastProvider>
    </AppProvider>
  );
}

export default function Home() {
  return <ParisarRouteApp initialTab="landing" />;
}
