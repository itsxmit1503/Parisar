'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Award, 
  AlertCircle, 
  Megaphone,
  CheckCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface NotificationsViewProps {
  onNavigateToPass: (eventId?: string) => void;
  onNavigateToCertificates: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onNavigateToPass,
  onNavigateToCertificates,
}) => {
  const { 
    notifications, 
    currentUser, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useApp();

  const userNotifs = notifications.filter(n => n.userId === currentUser._id);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'REGISTRATION_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-[#2F613B]" />;
      case 'VENUE_CHANGED':
        return <MapPin className="w-4 h-4 text-[#B08A4A]" />;
      case 'TIME_CHANGED':
      case 'EVENT_REMINDER':
        return <Clock className="w-4 h-4 text-[#18212B]" />;
      case 'CERTIFICATE_ISSUED':
        return <Award className="w-4 h-4 text-[#B08A4A]" />;
      case 'EVENT_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-[#A83226]" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-[#64788A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#62605B]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B9B4AA] pb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64788A] mb-1">
            Activity & Urgent Notices
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            Campus Notifications
          </h1>
          <p className="text-xs text-[#62605B] mt-0.5">
            Operational alerts regarding your passes, venue relocations, and credential grants.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            onClick={markAllNotificationsAsRead}
          >
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {userNotifs.length > 0 ? (
        <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] divide-y divide-[#B9B4AA]/60 shadow-[0_2px_4px_rgba(24,33,43,0.04)]">
          {userNotifs.map(notif => {
            const timeAgo = new Date(notif.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notif._id}
                className={`p-4 flex items-start gap-3.5 transition-colors ${
                  !notif.read ? 'bg-[#EAE5DB]/60' : 'hover:bg-[#EAE5DB]/30'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-[2px] bg-[#FCFAF5] border border-[#B9B4AA] shadow-[1px_1px_0_0_#B9B4AA] shrink-0">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs ${!notif.read ? 'text-[#18212B] font-bold' : 'text-[#62605B] font-semibold'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-[#62605B] whitespace-nowrap">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-[#62605B] mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3">
                    {!notif.read && (
                      <button
                        onClick={() => markNotificationAsRead(notif._id)}
                        className="text-[11px] font-bold text-[#B6533C] hover:underline cursor-pointer"
                      >
                        Mark as read
                      </button>
                    )}

                    {notif.type === 'REGISTRATION_CONFIRMED' && (
                      <button
                        onClick={() => onNavigateToPass(notif.eventId)}
                        className="text-[11px] font-bold text-[#18212B] hover:text-[#B6533C] hover:underline cursor-pointer"
                      >
                        View Pass →
                      </button>
                    )}

                    {notif.type === 'CERTIFICATE_ISSUED' && (
                      <button
                        onClick={onNavigateToCertificates}
                        className="text-[11px] font-bold text-[#B08A4A] hover:underline cursor-pointer"
                      >
                        View Certificate →
                      </button>
                    )}
                  </div>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#B6533C] shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are caught up with all campus event alerts."
        />
      )}
    </div>
  );
};
