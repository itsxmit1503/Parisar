'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventCategory, CampusEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [coverImage] = useState(
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
  );

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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
          status: asDraft ? 'DRAFT' : 'PENDING_REVIEW',
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
            : `Event "${res.data.title}" submitted to University Administrator for review & approval.`,
          asDraft ? 'Draft Saved' : 'Submitted for Review'
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
      title="Create Campus Event"
      subtitle="Submit a new event proposal to the University Administrator for campus publication"
      maxWidth="2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
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
              Submit for Review
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-[#18212B]">
        {errorMsg && (
          <div className="p-3.5 bg-[#FBEAEA] border-l-4 border-l-[#A83226] border border-[#A83226]/30 rounded-[3px] text-[#A83226] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-bold text-xs">{errorMsg}</div>
          </div>
        )}

        {/* Essential Field 1: Event Title */}
        <div>
          <label className="font-bold text-xs text-[#18212B] block mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            placeholder="e.g. Next-Generation Cloud Systems Seminar"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Essential Field 2: Category & Campus Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="font-bold text-xs text-[#18212B] block mb-1.5">Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as EventCategory)}
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-xs text-[#18212B] block mb-1.5">Campus Venue *</label>
            <select
              value={venueId}
              onChange={e => setVenueId(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-semibold text-[#18212B] focus:outline-none focus:border-[#18212B]"
            >
              {venues.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Essential Field 3: Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="font-bold text-xs text-[#18212B] block mb-1.5">Event Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
            />
          </div>

          <div>
            <label className="font-bold text-xs text-[#18212B] block mb-1.5">Start Time *</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
            />
          </div>

          <div>
            <label className="font-bold text-xs text-[#18212B] block mb-1.5">End Time *</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
            />
          </div>
        </div>

        {/* Essential Field 4: Seat Capacity */}
        <div>
          <label className="font-bold text-xs text-[#18212B] block mb-1.5">
            Participant Capacity (Seats) *
          </label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm font-mono font-bold text-[#18212B] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Essential Field 5: Description */}
        <div>
          <label className="font-bold text-xs text-[#18212B] block mb-1.5">Event Description</label>
          <textarea
            rows={3}
            placeholder="Summarize the event agenda, speakers, or rules..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[3px] text-sm text-[#18212B] focus:outline-none focus:border-[#18212B]"
          />
        </div>

        {/* Progressive Disclosure Toggle for Secondary Fields */}
        <div className="pt-1 border-t border-[#EAE5DB]">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[3px] bg-[#EAE5DB]/70 border border-[#B9B4AA] flex items-center justify-between text-xs font-bold text-[#18212B] hover:bg-[#EAE5DB] transition-colors cursor-pointer touch-manipulation"
          >
            <span>Additional Event Details (Optional: Deadline, Eligibility, Instructions)</span>
            {showAdvancedOptions ? (
              <ChevronUp className="w-4 h-4 text-[#B6533C]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#B6533C]" />
            )}
          </button>

          {showAdvancedOptions && (
            <div className="mt-3.5 space-y-3.5 p-3.5 bg-[#EAE5DB]/40 border border-[#B9B4AA] rounded-[3px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-xs text-[#18212B] block mb-1.5">
                    Registration Deadline Date
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={e => setDeadlineDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-xs font-mono text-[#18212B]"
                  />
                </div>

                <div>
                  <label className="font-bold text-xs text-[#18212B] block mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI, Python, Career"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-xs text-[#18212B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-[#18212B] block mb-1.5">Eligibility</label>
                <input
                  type="text"
                  placeholder="e.g. Open to all enrolled students of DHSGSU"
                  value={eligibility}
                  onChange={e => setEligibility(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-xs text-[#18212B]"
                />
              </div>

              <div>
                <label className="font-bold text-xs text-[#18212B] block mb-1.5">
                  Special Instructions for Attendees
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bring university ID card"
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] text-xs text-[#18212B]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
