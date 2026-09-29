'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventCategory, CampusEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { AlertCircle } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: CampusEvent) => void;
}

const CATEGORIES: EventCategory[] = [
  'Workshop',
  'Seminar',
  'Cultural',
  'Competition',
  'Sports',
  'Technology',
  'Coding',
  'Entrepreneurship',
  'Academic',
  'Club',
  'Placement',
  'Other',
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { venues, createEvent } = useApp();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [venueId, setVenueId] = useState(venues[0]?.id || '');
  const [date, setDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [capacity, setCapacity] = useState('60');
  const [deadlineDate, setDeadlineDate] = useState('2026-10-14');
  const [tagsInput, setTagsInput] = useState('DHSGSU, Workshop, Academic');
  const [eligibility, setEligibility] = useState('Open to all enrolled students of DHSGSU');
  const [specialInstructions, setSpecialInstructions] = useState('Bring your university ID card and relevant course materials.');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (asDraft = false) => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg('Event Title is mandatory.');
      return;
    }
    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setErrorMsg('Valid participant capacity is required.');
      return;
    }

    const selectedVenue = venues.find(v => v.id === venueId) || venues[0];
    const startIso = `${date}T${startTime}:00Z`;
    const endIso = `${date}T${endTime}:00Z`;
    const deadlineIso = `${deadlineDate}T23:59:00Z`;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      const res = createEvent(
        {
          title: title.trim(),
          description: description.trim() || 'Comprehensive campus event organized through PARISAR • Dr. Harisingh Gour Vishwavidyalaya.',
          category,
          venue: selectedVenue.name,
          venueId: selectedVenue.id,
          startTime: startIso,
          endTime: endIso,
          capacity: capNum,
          registrationDeadline: deadlineIso,
          tags: parsedTags,
          coverImage,
          status: asDraft ? 'DRAFT' : 'PUBLISHED',
          eligibility,
          specialInstructions,
        },
        asDraft
      );

      if (res.success) {
        showToast(
          'success',
          asDraft
            ? `Draft saved for "${res.data.title}".`
            : `Event "${res.data.title}" published to student portal.`,
          asDraft ? 'Draft Saved' : 'Event Published'
        );
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error.message || 'Failed to save event.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while creating the event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create University Event"
      subtitle="Establish new academic workshops, competitions, or society gatherings"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit(true)}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit(false)}
            >
              Publish Event
            </Button>
          </div>
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

        {/* Title */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">
            Event Title *
          </label>
          <input
            type="text"
            placeholder="e.g. Next-Generation Cloud Systems Seminar"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>

        {/* Category & Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as EventCategory)}
              className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Campus Venue *</label>
            <select
              value={venueId}
              onChange={e => setVenueId(e.target.value)}
              className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            >
              {venues.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.building})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Event Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        {/* Capacity & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">
              Participant Capacity (Atomic limit) *
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono font-bold text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">
              Registration Deadline Date
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Comprehensive agenda, curriculum, or rules..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>

        {/* Tags & Eligibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. AI, Python, Career"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div>
            <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">Eligibility</label>
            <input
              type="text"
              placeholder="e.g. 2nd & 3rd year engineering"
              value={eligibility}
              onChange={e => setEligibility(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="font-bold uppercase tracking-wider text-[10px] text-[#18212B] block mb-1">
            Special Instructions for Attendees
          </label>
          <input
            type="text"
            placeholder="e.g. Bring laptops, check in 15 mins prior"
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
          />
        </div>
      </div>
    </Modal>
  );
};
