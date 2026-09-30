'use client';

import React, { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  LogOut,
  Calendar,
  Award,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

interface RoleProfileViewProps {
  onLogout: () => void;
}

export const RoleProfileView: React.FC<RoleProfileViewProps> = ({ onLogout }) => {
  const { currentUser, updateUserProfile, events, organizerRequests } = useApp();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department);
  const [designation, setDesignation] = useState(currentUser.designation || '');
  const [phone, setPhone] = useState(currentUser.phone || '+91 75822 64201');
  const [organization, setOrganization] = useState(currentUser.organization || currentUser.department);

  const myManagedEvents = events.filter(e => e.organizerId === currentUser._id);
  const pendingReqsCount = organizerRequests.filter(r => r.status === 'PENDING').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateUserProfile({
      name: name.trim() || currentUser.name,
      department,
      designation,
      phone,
      organization,
    });
    if (res.success) {
      setIsEditing(false);
      showToast('success', 'Official university profile record updated.', 'Profile Saved');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Identity Card */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-6 sm:p-8 shadow-[4px_4px_0_0_#18212B]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[3px] border-2 border-[#18212B] object-cover shadow-[2px_2px_0_0_#18212B]"
              />
              <span
                className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-[2px] text-white text-[9px] font-mono font-bold tracking-wider uppercase border border-[#18212B] ${
                  currentUser.role === 'admin' ? 'bg-[#B6533C]' : 'bg-[#B08A4A]'
                }`}
              >
                {currentUser.role === 'admin' ? 'Admin' : 'Organizer'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C]">
                  Dr. Harisingh Gour Vishwavidyalaya • DHSGSU
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
                {currentUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#62605B]">
                <span className="font-mono font-bold text-[#18212B]">
                  ID: {currentUser.rollNumber || 'EMP-DHSGSU'}
                </span>
                <span>•</span>
                <span>{currentUser.designation || 'Verified University Authority'}</span>
                <span>•</span>
                <span>{currentUser.department}</span>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <Badge variant="success">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {currentUser.role === 'admin'
                    ? 'Executive Proctorial Authority'
                    : 'DSW Verified Event Organizer'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut className="w-3.5 h-3.5 text-[#A83226]" />}
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Form or Official Record Details */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[4px] p-6 sm:p-8 shadow-[2px_2px_0_0_#18212B] space-y-6">
        <div className="flex items-center justify-between border-b border-[#B9B4AA] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#18212B]">
              {isEditing ? 'Update Institutional Profile' : 'Authenticated University Credential Record'}
            </h2>
            <p className="text-xs text-[#62605B]">
              Official identity details associated with your {currentUser.role.toUpperCase()} privileges on PARISAR.
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-bold text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Designation / Academic Title
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Department / Office
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-mono text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Affiliated University Council / Society
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs font-medium text-[#18212B] focus:outline-none focus:border-[#18212B]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#B9B4AA] flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Profile Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">Full Name</div>
              <div className="font-bold text-[#18212B] mt-1 text-sm">{currentUser.name}</div>
            </div>

            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
                University Role
              </div>
              <div className="font-bold text-[#B6533C] mt-1 text-sm uppercase font-mono">
                {currentUser.role === 'admin' ? 'University Administrator' : 'Verified Event Organizer'}
              </div>
            </div>

            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
                University ID / Employee Code
              </div>
              <div className="font-mono font-bold text-[#18212B] mt-1">
                {currentUser.rollNumber || 'EMP-DHSGSU'}
              </div>
            </div>

            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
                Official University Email
              </div>
              <div className="font-mono font-bold text-[#18212B] mt-1">{currentUser.email}</div>
            </div>

            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
                Department / Administrative Wing
              </div>
              <div className="font-semibold text-[#18212B] mt-1">{currentUser.department}</div>
            </div>

            <div className="p-3.5 bg-[#EAE5DB]/60 border border-[#B9B4AA] rounded-[2px]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#62605B]">
                Designation
              </div>
              <div className="font-semibold text-[#18212B] mt-1">
                {currentUser.designation || 'Faculty Convener'}
              </div>
            </div>
          </div>
        )}

        {/* Role Activity Summary */}
        <div className="pt-4 border-t border-[#B9B4AA] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-xl font-mono font-extrabold text-[#18212B]">
              {currentUser.role === 'admin' ? events.length : myManagedEvents.length}
            </div>
            <div className="text-[10px] font-mono uppercase text-[#62605B] mt-0.5">
              {currentUser.role === 'admin' ? 'Total Campus Events' : 'Events Convened'}
            </div>
          </div>

          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-xl font-mono font-extrabold text-[#2F613B]">VERIFIED</div>
            <div className="text-[10px] font-mono uppercase text-[#62605B] mt-0.5">
              DSW Credential Status
            </div>
          </div>

          <div className="p-3 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px]">
            <div className="text-xl font-mono font-extrabold text-[#B6533C]">
              {currentUser.role === 'admin' ? pendingReqsCount : 'ACTIVE'}
            </div>
            <div className="text-[10px] font-mono uppercase text-[#62605B] mt-0.5">
              {currentUser.role === 'admin' ? 'Pending Organizer Requests' : 'Panel Access Level'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
