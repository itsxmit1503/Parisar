import React from 'react';
import { EventStatus, EventCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' | 'brass';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider',
    md: 'text-[11px] px-2.5 py-0.5 font-semibold',
  };

  // Modern neo-skeuomorphic pill/badge with solid warm tones and crisp borders
  const variantClasses = {
    default: 'bg-[#EAE5DB] text-[#18212B] border border-[#B9B4AA]',
    neutral: 'bg-[#FCFAF5] text-[#62605B] border border-[#B9B4AA]',
    success: 'bg-[#EBF3ED] text-[#2F613B] border border-[#B8D5C0]',
    warning: 'bg-[#FBF4E8] text-[#8F5E15] border border-[#E5D2AF]',
    error: 'bg-[#FDF0EE] text-[#A83226] border border-[#E9BFB8]',
    info: 'bg-[#EBF0F4] text-[#2D5370] border border-[#B5C8D8]',
    accent: 'bg-[#B6533C] text-white border border-[#18212B]',
    brass: 'bg-[#B08A4A] text-white border border-[#18212B]',
  };

  return (
    <span className={`inline-flex items-center rounded-full gap-1 select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const EventStatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="success">Open for Registration</Badge>;
    case 'ONGOING':
      return <Badge variant="info">Ongoing Today</Badge>;
    case 'COMPLETED':
      return <Badge variant="neutral">Completed</Badge>;
    case 'DRAFT':
      return <Badge variant="warning">Draft Proposal</Badge>;
    case 'CANCELLED':
      return <Badge variant="error">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const CategoryBadge: React.FC<{ category: EventCategory }> = ({ category }) => {
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#FCFAF5] text-[#18212B] border border-[#B9B4AA] shadow-xs">
      {category}
    </span>
  );
};
