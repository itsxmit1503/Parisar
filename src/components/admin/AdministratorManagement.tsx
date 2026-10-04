'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  CheckCircle2,
  Ban,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Settings,
  Copy,
  Clock,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  User,
  AdminLevel,
  AdminAccountStatus,
  AdminPermission,
  ALL_ADMIN_PERMISSIONS,
} from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

const PERMISSION_LABELS: Record<AdminPermission, { label: string; desc: string }> = {
  MANAGE_ORGANIZERS: {
    label: 'Manage Organizers',
    desc: 'Approve, reject, or revoke faculty and society organizer requests',
  },
  MANAGE_EVENTS: {
    label: 'Moderate Events',
    desc: 'Approve, return, or cancel campus event proposals',
  },
  MANAGE_USERS: {
    label: 'Manage Users',
    desc: 'View campus directory and manage student/organizer roles',
  },
  MANAGE_ATTENDANCE: {
    label: 'Manage & Override Attendance',
    desc: 'Perform audited corrections on finalized attendance records',
  },
  MANAGE_CERTIFICATES: {
    label: 'Manage Certificates',
    desc: 'Authorize and audit university event participation certificates',
  },
  MANAGE_VENUES: {
    label: 'Manage Venues',
    desc: 'Configure DHSGSU auditoriums, halls, and venue capacities',
  },
  MANAGE_ADMINS: {
    label: 'Manage Administrators',
    desc: 'Provision, suspend, or update delegated administrator accounts',
  },
  VIEW_AUDIT_LOG: {
    label: 'View Audit Logs',
    desc: 'Inspect university security, attendance, and governance logs',
  },
  MANAGE_SECURITY: {
    label: 'Security & Broadcasts',
    desc: 'Dispatch official DSW circulars and manage security policies',
  },
};

const DEFAULT_DELEGATED_PERMISSIONS: AdminPermission[] = [
  'MANAGE_ORGANIZERS',
  'MANAGE_EVENTS',
  'MANAGE_ATTENDANCE',
  'MANAGE_CERTIFICATES',
  'VIEW_AUDIT_LOG',
];

export const AdministratorManagement: React.FC = () => {
  const {
    currentUser,
    allUsers,
    createOrInviteAdministrator,
    updateAdministratorStatus,
    updateAdministratorPermissions,
  } = useApp();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add/Invite form state
  const [provisionMode, setProvisionMode] = useState<'create' | 'invite'>('create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [department, setDepartment] = useState("Office of the Dean of Students' Welfare (DSW)");
  const [designation, setDesignation] = useState('Deputy Proctor / Event Governance Officer');
  const [adminLevel, setAdminLevel] = useState<AdminLevel>('ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>(
    DEFAULT_DELEGATED_PERMISSIONS
  );
  const [tempPassword, setTempPassword] = useState('');
  const [generatedInviteToken, setGeneratedInviteToken] = useState<{
    email: string;
    token: string;
  } | null>(null);

  // Edit permissions modal state
  const [editLevel, setEditLevel] = useState<AdminLevel>('ADMIN');
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);

  const administrators = allUsers.filter(u => u.role === 'admin');
  const activeSuperAdmins = administrators.filter(
    a => a.adminLevel === 'SUPER_ADMIN' && (a.adminAccountStatus || 'ACTIVE') === 'ACTIVE'
  );

  const isCurrentUserSuperAdmin =
    currentUser.role === 'admin' &&
    (currentUser.adminLevel === 'SUPER_ADMIN' || currentUser._id === 'admin-1');

  const canManageAdmins =
    isCurrentUserSuperAdmin ||
    (currentUser.role === 'admin' &&
      Array.isArray(currentUser.adminPermissions) &&
      currentUser.adminPermissions.includes('MANAGE_ADMINS'));

  const isLastActiveSuperAdmin = (target: User): boolean => {
    return (
      target.adminLevel === 'SUPER_ADMIN' &&
      (target.adminAccountStatus || 'ACTIVE') === 'ACTIVE' &&
      activeSuperAdmins.length <= 1
    );
  };

  const togglePermission = (
    perm: AdminPermission,
    list: AdminPermission[],
    setter: React.Dispatch<React.SetStateAction<AdminPermission[]>>
  ) => {
    if (list.includes(perm)) {
      setter(list.filter(p => p !== perm));
    } else {
      setter([...list, perm]);
    }
  };

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setUniversityId(`ADMIN-DSW-00${administrators.length + 1}`);
    setDepartment("Office of the Dean of Students' Welfare (DSW)");
    setDesignation('Deputy Proctor / Event Governance Officer');
    setAdminLevel('ADMIN');
    setSelectedPermissions(DEFAULT_DELEGATED_PERMISSIONS);
    setTempPassword('');
    setGeneratedInviteToken(null);
    setIsAddModalOpen(true);
  };

  const handleCreateOrInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAdmins) {
      showToast('error', 'Only Super Admin or authorized administrators can provision admin accounts.', 'Access Denied');
      return;
    }

    if (!name.trim() || !email.trim()) {
      showToast('warning', 'Administrator Name and Institutional Email are required.', 'Validation');
      return;
    }

    if (provisionMode === 'create' && tempPassword.trim().length < 8) {
      showToast('warning', 'Temporary password must be at least 8 characters.', 'Validation');
      return;
    }

    setIsSubmitting(true);
    const effectivePerms =
      adminLevel === 'SUPER_ADMIN' ? [...ALL_ADMIN_PERMISSIONS] : selectedPermissions;

    const res = await createOrInviteAdministrator({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      universityId: universityId.trim() || undefined,
      department: department.trim(),
      designation: designation.trim(),
      adminLevel,
      adminPermissions: effectivePerms,
      password: provisionMode === 'create' ? tempPassword : undefined,
      inviteMode: provisionMode === 'invite',
    });
    setIsSubmitting(false);

    if (res.success) {
      if (provisionMode === 'invite' && res.data.devInvitationToken) {
        setGeneratedInviteToken({
          email: res.data.user.email,
          token: res.data.devInvitationToken,
        });
        showToast(
          'success',
          `One-time invitation generated for ${res.data.user.name}.`,
          'Admin Invitation Created'
        );
      } else {
        showToast(
          'success',
          `Administrator account provisioned for ${res.data.user.name}.`,
          'Administrator Added'
        );
        setIsAddModalOpen(false);
      }
    } else {
      showToast('error', res.error.message, 'Provisioning Failed');
    }
  };

  const handleStatusChange = async (target: User, newStatus: AdminAccountStatus) => {
    if (isLastActiveSuperAdmin(target) && newStatus !== 'ACTIVE') {
      showToast(
        'error',
        'Cannot suspend or revoke the last active Super Admin account.',
        'Final Super Admin Protected'
      );
      return;
    }

    const res = await updateAdministratorStatus(target._id, newStatus);
    if (res.success) {
      showToast(
        'success',
        `Updated ${target.name} account status to ${newStatus}.`,
        'Admin Status Updated'
      );
    } else {
      showToast('error', res.error.message, 'Action Blocked');
    }
  };

  const handleOpenEditModal = (target: User) => {
    setEditingAdmin(target);
    setEditLevel(target.adminLevel || 'ADMIN');
    setEditPermissions(
      target.adminLevel === 'SUPER_ADMIN'
        ? [...ALL_ADMIN_PERMISSIONS]
        : [...(target.adminPermissions || DEFAULT_DELEGATED_PERMISSIONS)]
    );
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (isLastActiveSuperAdmin(editingAdmin) && editLevel !== 'SUPER_ADMIN') {
      showToast(
        'error',
        'Cannot demote the last active Super Admin account.',
        'Final Super Admin Protected'
      );
      return;
    }

    setIsSubmitting(true);
    const perms = editLevel === 'SUPER_ADMIN' ? [...ALL_ADMIN_PERMISSIONS] : editPermissions;
    const res = await updateAdministratorPermissions(editingAdmin._id, editLevel, perms);
    setIsSubmitting(false);

    if (res.success) {
      showToast(
        'success',
        `Updated administrative permissions for ${editingAdmin.name}.`,
        'Permissions Updated'
      );
      setEditingAdmin(null);
    } else {
      showToast('error', res.error.message, 'Update Failed');
    }
  };

  const getStatusBadge = (status?: AdminAccountStatus) => {
    const resolved = status || 'ACTIVE';
    switch (resolved) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#EBF3ED] text-[#2F613B] border border-[#2F613B] rounded-[2px]">
            ACTIVE
          </span>
        );
      case 'INVITED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#FBF4E8] text-[#8F5E15] border border-[#B08A4A] rounded-[2px]">
            INVITED (PENDING ACTIVATION)
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#FDF0EE] text-[#A83226] border border-[#A83226] rounded-[2px]">
            SUSPENDED
          </span>
        );
      case 'REVOKED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#18212B] text-[#FCFAF5] border border-[#18212B] rounded-[2px]">
            REVOKED
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 lg:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B6533C]">
            PARISAR · UNIVERSITY GOVERNANCE & ACCESS CONTROL
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18212B] tracking-tight">
            University Administrators
          </h1>
          <p className="text-sm text-[#62605B]">
            Provision delegated university administrators, manage granular DSW permissions, and enforce Super Admin safeguards.
          </p>
        </div>

        {canManageAdmins && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            Add / Invite Administrator
          </Button>
        )}
      </div>

      {/* Governance Safeguard Banner */}
      <div className="bg-[#FCFAF5] border-2 border-[#18212B] rounded-[4px] p-4 shadow-[3px_3px_0_0_#18212B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#B6533C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#18212B] space-y-0.5">
            <div className="font-bold">
              Your Access Level:{' '}
              <span className="font-mono text-[#B6533C]">
                {currentUser.adminLevel || (isCurrentUserSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN')}
              </span>
            </div>
            <p className="text-[#62605B]">
              Administrator accounts are never exposed in public signup. At least one active{' '}
              <strong className="font-mono text-[#18212B]">SUPER_ADMIN</strong> is permanently protected from suspension, revocation, or demotion.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#B9B4AA]">
          <div>
            <span className="text-[#62605B] block text-[10px]">SUPER ADMINS</span>
            <span className="font-bold text-sm text-[#18212B]">{activeSuperAdmins.length} Active</span>
          </div>
          <div>
            <span className="text-[#62605B] block text-[10px]">TOTAL ADMINS</span>
            <span className="font-bold text-sm text-[#18212B]">{administrators.length}</span>
          </div>
        </div>
      </div>

      {/* Administrator Cards List */}
      <div className="space-y-4">
        {administrators.map(admin => {
          const isSuper = admin.adminLevel === 'SUPER_ADMIN';
          const status = admin.adminAccountStatus || 'ACTIVE';
          const protectedLastSuper = isLastActiveSuperAdmin(admin);
          const perms = isSuper
            ? ALL_ADMIN_PERMISSIONS
            : admin.adminPermissions || DEFAULT_DELEGATED_PERMISSIONS;

          return (
            <div
              key={admin._id}
              className="bg-[#FCFAF5] border border-[#18212B] rounded-[4px] p-5 shadow-[2px_2px_0_0_#18212B] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#B9B4AA] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#18212B]">{admin.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-[2px] border ${
                        isSuper
                          ? 'bg-[#18212B] text-[#FCFAF5] border-[#18212B]'
                          : 'bg-[#EAE5DB] text-[#18212B] border-[#B9B4AA]'
                      }`}
                    >
                      {isSuper ? 'SUPER_ADMIN' : 'ADMIN'}
                    </span>
                    {getStatusBadge(status)}
                    {protectedLastSuper && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-[#B6533C] bg-[#FDF0EE] border border-[#E9BFB8] rounded-[2px]">
                        Protected Primary Super Admin
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#62605B] font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Email: {admin.email}</span>
                    <span>ID: {admin.universityId || admin.rollNumber || admin._id}</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#B6533C]" />
                      {admin.department}
                    </span>
                  </div>

                  {admin.designation && (
                    <div className="text-xs text-[#18212B] font-medium">{admin.designation}</div>
                  )}
                </div>

                <div className="text-left sm:text-right font-mono text-[11px] text-[#62605B] shrink-0">
                  <div className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B08A4A]" />
                    <span>
                      Last Login:{' '}
                      {admin.lastLoginAt
                        ? new Date(admin.lastLoginAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never / Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions List */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62605B]">
                  Granted Governance Permissions ({perms.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map(perm => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[10px] font-mono font-bold text-[#18212B]"
                    >
                      {PERMISSION_LABELS[perm]?.label || perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Super Admin Actions */}
              {canManageAdmins && (
                <div className="pt-3 border-t border-[#B9B4AA]/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-[#62605B]">
                    {protectedLastSuper
                      ? 'Final active SUPER_ADMIN cannot be suspended, revoked, or demoted.'
                      : 'All status and permission updates are recorded in the Audit Log.'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Settings className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEditModal(admin)}
                      disabled={!isCurrentUserSuperAdmin && isSuper}
                    >
                      Permissions
                    </Button>

                    {status !== 'ACTIVE' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleStatusChange(admin, 'ACTIVE')}
                      >
                        Restore Active
                      </Button>
                    )}

                    {status === 'ACTIVE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={protectedLastSuper}
                        leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-[#8F5E15]" />}
                        onClick={() => handleStatusChange(admin, 'SUSPENDED')}
                      >
                        Suspend
                      </Button>
                    )}

                    {status !== 'REVOKED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={protectedLastSuper}
                        leftIcon={<Ban className="w-3.5 h-3.5" />}
                        onClick={() => handleStatusChange(admin, 'REVOKED')}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Invite Administrator Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision University Administrator"
      >
        {generatedInviteToken ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#EBF3ED] border border-[#2F613B] rounded-[3px] text-xs text-[#18212B] space-y-2">
              <div className="font-bold text-[#2F613B] flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>One-Time Administrator Invitation Generated</span>
              </div>
              <p>
                Share the one-time token below with <strong>{generatedInviteToken.email}</strong>. The token is stored as a SHA-256 hash on the server and expires in 48 hours.
              </p>
            </div>

            <div className="p-3.5 bg-[#EAE5DB] border border-[#18212B] rounded-[3px] font-mono text-xs space-y-2">
              <div className="text-[10px] font-bold uppercase text-[#62605B]">
                One-Time Invitation Token (Copy Now)
              </div>
              <div className="flex items-center justify-between gap-2 bg-[#FCFAF5] p-2.5 border border-[#B9B4AA] rounded-[2px]">
                <code className="font-bold text-[#18212B] break-all">
                  {generatedInviteToken.token}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedInviteToken.token);
                    showToast('info', 'Invitation token copied to clipboard.', 'Copied');
                  }}
                  className="px-2.5 py-1 bg-[#18212B] text-[#FCFAF5] rounded-[2px] text-[10px] font-mono font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setIsAddModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateOrInvite} className="space-y-4">
            {/* Provisioning Method Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-[#EAE5DB] p-1 border border-[#B9B4AA] rounded-[3px] font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setProvisionMode('create')}
                className={`py-2 rounded-[2px] cursor-pointer ${
                  provisionMode === 'create'
                    ? 'bg-[#18212B] text-[#FCFAF5]'
                    : 'text-[#62605B] hover:text-[#18212B]'
                }`}
              >
                Option A: Direct + Temp Password
              </button>
              <button
                type="button"
                onClick={() => setProvisionMode('invite')}
                className={`py-2 rounded-[2px] cursor-pointer ${
                  provisionMode === 'invite'
                    ? 'bg-[#18212B] text-[#FCFAF5]'
                    : 'text-[#62605B] hover:text-[#18212B]'
                }`}
              >
                Option B: One-Time Invite Token
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. N.K. Mishra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. proctor@dhsgsu.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Admin / Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={universityId}
                  onChange={e => setUniversityId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono font-bold text-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Admin Level *
                </label>
                <select
                  value={adminLevel}
                  onChange={e => {
                    const lvl = e.target.value as AdminLevel;
                    setAdminLevel(lvl);
                    if (lvl === 'SUPER_ADMIN') {
                      setSelectedPermissions([...ALL_ADMIN_PERMISSIONS]);
                    }
                  }}
                  disabled={!isCurrentUserSuperAdmin}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono font-bold text-[#18212B]"
                >
                  <option value="ADMIN">ADMIN (Delegated Authority)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Governance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Office / Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Official Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] text-[#18212B]"
                />
              </div>
            </div>

            {provisionMode === 'create' && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                  Temporary Password (min 8 chars — hashed with bcrypt) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter temporary password"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono text-xs text-[#18212B]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() =>
                      setTempPassword(`Dhsgsu@${Math.floor(10000 + Math.random() * 90000)}`)
                    }
                  >
                    Generate
                  </Button>
                </div>
              </div>
            )}

            {/* Permissions Selection */}
            <div className="space-y-2 pt-2 border-t border-[#B9B4AA]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#18212B]">
                Assigned Administrator Permissions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {ALL_ADMIN_PERMISSIONS.map(perm => {
                  const checked =
                    adminLevel === 'SUPER_ADMIN' || selectedPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`p-2.5 border rounded-[2px] flex items-start gap-2 cursor-pointer text-xs ${
                        checked
                          ? 'bg-[#FCFAF5] border-[#18212B]'
                          : 'bg-[#EAE5DB]/50 border-[#B9B4AA]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={adminLevel === 'SUPER_ADMIN'}
                        onChange={() =>
                          togglePermission(perm, selectedPermissions, setSelectedPermissions)
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-[#18212B]">
                          {PERMISSION_LABELS[perm].label}
                        </div>
                        <div className="text-[10px] text-[#62605B]">
                          {PERMISSION_LABELS[perm].desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#B9B4AA]">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                {provisionMode === 'invite'
                  ? 'Generate One-Time Invitation'
                  : 'Create Administrator'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={Boolean(editingAdmin)}
        onClose={() => setEditingAdmin(null)}
        title={`Edit Permissions — ${editingAdmin?.name || ''}`}
      >
        {editingAdmin && (
          <form onSubmit={handleSavePermissions} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#18212B] mb-1">
                Administrator Level
              </label>
              <select
                value={editLevel}
                disabled={isLastActiveSuperAdmin(editingAdmin) || !isCurrentUserSuperAdmin}
                onChange={e => {
                  const lvl = e.target.value as AdminLevel;
                  setEditLevel(lvl);
                  if (lvl === 'SUPER_ADMIN') {
                    setEditPermissions([...ALL_ADMIN_PERMISSIONS]);
                  }
                }}
                className="w-full px-3 py-2 bg-[#EAE5DB] border border-[#B9B4AA] rounded-[2px] font-mono text-xs font-bold text-[#18212B]"
              >
                <option value="ADMIN">ADMIN (Delegated Authority)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full Governance)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {ALL_ADMIN_PERMISSIONS.map(perm => {
                const checked = editLevel === 'SUPER_ADMIN' || editPermissions.includes(perm);
                return (
                  <label
                    key={perm}
                    className={`p-2.5 border rounded-[2px] flex items-start gap-2 cursor-pointer text-xs ${
                      checked
                        ? 'bg-[#FCFAF5] border-[#18212B]'
                        : 'bg-[#EAE5DB]/50 border-[#B9B4AA]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={editLevel === 'SUPER_ADMIN'}
                      onChange={() =>
                        togglePermission(perm, editPermissions, setEditPermissions)
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-[#18212B]">
                        {PERMISSION_LABELS[perm].label}
                      </div>
                      <div className="text-[10px] text-[#62605B]">
                        {PERMISSION_LABELS[perm].desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#B9B4AA]">
              <Button type="button" variant="secondary" onClick={() => setEditingAdmin(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Save Permissions
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
