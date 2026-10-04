'use client';

import React from 'react';

interface UserAvatarProps {
  name: string;
  profileImage?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Computes deterministic initials from a user's full name.
 * Example: "Amit Sharma" -> "AS", "Dr. Alok Sahay" -> "AS"
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'U';
  // Strip honorific prefixes so initials represent the actual name
  const cleaned = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|Shri|Smt\.)\s+/i, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Returns true only if the profileImage is an explicit user-uploaded photo
 * (data:image/... or /api/v1/users/photo/...) and NOT a random stock/AI human photo.
 */
export function isCustomUploadedPhoto(profileImage?: string | null): boolean {
  if (!profileImage || !profileImage.trim()) return false;
  if (profileImage.includes('images.unsplash.com')) return false;
  if (profileImage.includes('randomuser.me')) return false;
  if (profileImage.includes('pravatar.cc')) return false;
  return (
    profileImage.startsWith('data:image/') ||
    profileImage.startsWith('/uploads/') ||
    profileImage.startsWith('blob:') ||
    profileImage.startsWith('https://')
  );
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-24 h-24 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  profileImage,
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name);
  const hasUploadedPhoto = isCustomUploadedPhoto(profileImage);

  if (hasUploadedPhoto && profileImage) {
    return (
      <img
        src={profileImage}
        alt={name}
        className={`${SIZE_CLASSES[size]} rounded-[3px] border border-[#18212B] object-cover shrink-0 bg-[#EAE5DB] ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      title={`${name} (${initials})`}
      className={`${SIZE_CLASSES[size]} rounded-[3px] border border-[#18212B] bg-[#18212B] text-[#FCFAF5] font-mono font-extrabold flex items-center justify-center shrink-0 select-none tracking-wider shadow-[1px_1px_0_0_#B6533C] ${className}`}
    >
      {initials}
    </div>
  );
};
