import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-[#FAF9F4] border border-[#BDB9AE] rounded-[3px] shadow-[0_2px_0_0_#BDB9AE] ${className}`}>
      <div className="w-11 h-11 rounded-[3px] bg-[#ECE9E0] border border-[#BDB9AE] flex items-center justify-center text-[#181818] mb-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#181818] mb-1">{title}</h3>
      <p className="text-xs text-[#6B6962] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
