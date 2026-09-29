'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Search } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export const UserManagement: React.FC = () => {
  const { allUsers, adminUpdateUserRole, currentUser } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const filteredUsers = allUsers.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRoleChange = (userId: string, userName: string, newRole: UserRole) => {
    if (userId === currentUser._id) {
      alert('Cannot change the role of the currently logged-in administrator.');
      return;
    }

    const res = adminUpdateUserRole(userId, newRole);
    if (res.success) {
      showToast('success', `Updated ${userName}'s role to ${newRole.toUpperCase()}.`, 'Role Updated');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B6533C] mb-1">
          Identity & Access Management
        </div>
        <h1 className="text-2xl font-bold text-[#18212B] tracking-tight">
          University User Directory
        </h1>
        <p className="text-xs text-[#62605B] mt-0.5">
          Administer student identities, faculty event coordinators, and academic privileges.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] p-3 shadow-[2px_2px_0_0_#18212B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#62605B]" />
          <input
            type="text"
            placeholder="Search by name, roll number, email, or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-xs text-[#18212B] placeholder-[#62605B] focus:outline-none focus:border-[#18212B] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'student', 'organizer', 'admin'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-[2px] text-[11px] font-mono uppercase tracking-wider font-bold transition-all ${
                roleFilter === role
                  ? 'bg-[#18212B] text-[#FCFAF5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#18212B]'
                  : 'bg-[#FCFAF5] text-[#18212B] hover:bg-[#EAE5DB] border border-[#B9B4AA] shadow-[1px_1px_0_0_#18212B]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#FCFAF5] border border-[#B9B4AA] rounded-[3px] overflow-hidden shadow-[2px_2px_0_0_#18212B]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#EAE5DB] border-b border-[#B9B4AA] text-[#18212B] font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-bold">User</th>
              <th className="py-3 px-4 font-bold">Identifier / Roll</th>
              <th className="py-3 px-4 font-bold">Department</th>
              <th className="py-3 px-4 font-bold">Role</th>
              <th className="py-3 px-4 text-right font-bold">Administrative Role Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B9B4AA]/50">
            {filteredUsers.map(user => (
              <tr key={user._id} className="hover:bg-[#EAE5DB]/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-[2px] border border-[#B9B4AA] object-cover"
                    />
                    <div>
                      <div className="font-bold text-[#18212B]">{user.name}</div>
                      <div className="text-[11px] text-[#62605B]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[#18212B]">
                  {user.rollNumber || user.designation || 'N/A'}
                </td>
                <td className="py-3 px-4 text-[#62605B]">
                  {user.department}
                </td>
                <td className="py-3 px-4">
                  {user.role === 'admin' ? (
                    <Badge variant="accent">Administrator</Badge>
                  ) : user.role === 'organizer' ? (
                    <Badge variant="info">Organizer</Badge>
                  ) : (
                    <Badge variant="default">Student</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user._id, user.name, e.target.value as UserRole)}
                    disabled={user._id === currentUser._id}
                    className="text-xs font-mono font-medium bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] px-2.5 py-1 text-[#18212B] focus:outline-none focus:border-[#18212B] cursor-pointer disabled:opacity-50"
                  >
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
