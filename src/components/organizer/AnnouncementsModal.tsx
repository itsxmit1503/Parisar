'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { AlertCircle, Send } from 'lucide-react';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  defaultEventId,
}) => {
  const { events, currentUser, sendAnnouncement, registrations } = useApp();
  const { showToast } = useToast();

  const myEvents = events.filter(e => e.organizerId === currentUser._id || currentUser.role === 'admin');

  const [selectedEventId, setSelectedEventId] = useState<string>(
    defaultEventId || myEvents[0]?._id || ''
  );
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const attendeesCount = registrations.filter(r => r.eventId === selectedEventId && r.status === 'CONFIRMED').length;

  const handleSend = () => {
    setErrorMsg(null);
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Announcement subject and message body are required.');
      return;
    }

    setIsSending(true);

    try {
      const res = sendAnnouncement(selectedEventId, title.trim(), message.trim());
      if (res.success) {
        showToast('success', `Announcement dispatched to ${res.data} registered students.`, 'Broadcast Dispatched');
        setTitle('');
        setMessage('');
        onClose();
      } else {
        setErrorMsg(res.error?.message || 'Failed to dispatch announcement.');
      }
    } catch {
      setErrorMsg('Unexpected error while sending announcement.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Event Announcement"
      subtitle="Send urgent operational updates directly to registered student inboxes"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            isLoading={isSending}
            onClick={handleSend}
            disabled={attendeesCount === 0}
          >
            Broadcast Notice ({attendeesCount} Students)
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-[#18212B]">
        {errorMsg && (
          <div className="p-3 bg-[#FBEAEA] border-l-4 border-l-[#A83226] border border-[#A83226]/30 rounded-[2px] text-[#A83226] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-bold">{errorMsg}</div>
          </div>
        )}

        {/* Target Event */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Target Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          >
            {myEvents.map(e => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.venue})
              </option>
            ))}
          </select>
          <div className="text-[11px] font-mono text-[#62605B] mt-1">
            Registered recipients: <strong className="text-[#18212B]">{attendeesCount} students</strong>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTitle('Venue Relocation: Swarna Jayanti Auditorium');
                setMessage('Please note that today’s session has been relocated to Swarna Jayanti Auditorium. Please arrive 10 minutes early for seat allocation.');
              }}
              className="text-[10px] font-bold px-2.5 py-1 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] hover:bg-[#EAE5DB] text-[#18212B] shadow-[1px_1px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Swarna Jayanti Relocation
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle('Schedule Delay: Starting at 10:30 AM');
                setMessage('The start time has been delayed by 30 minutes due to guest speaker arrival on Patharia Hills campus. Lab doors open at 10:15 AM.');
              }}
              className="text-[10px] font-bold px-2.5 py-1 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] hover:bg-[#EAE5DB] text-[#18212B] shadow-[1px_1px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Delayed Start
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle('Essential Prerequisites for Turing Lab Workshop');
                setMessage('Reminder: Please download Python 3.11 and PyTorch on your personal laptops prior to entering Turing Advanced Computing Lab (DCSA).');
              }}
              className="text-[10px] font-bold px-2.5 py-1 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[2px] hover:bg-[#EAE5DB] text-[#18212B] shadow-[1px_1px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Turing Lab Prerequisites
            </button>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Subject Header *</label>
          <input
            type="text"
            placeholder="e.g. Relocated to CS Lab 2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>

        {/* Body */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Notice Body *</label>
          <textarea
            rows={4}
            placeholder="Provide clear instructions for registered attendees..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>
      </div>
    </Modal>
  );
};
