'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Strict solid backdrop - NO BLUR EVER */}
      <div 
        className="fixed inset-0 bg-[#18212B]/70 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Solid Tactile Surface Container - Sharp Corners, Directional Shadow */}
      <div 
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#FCFAF5] rounded-[4px] border-2 border-[#18212B] shadow-[5px_5px_0_0_#18212B] overflow-hidden z-10 my-8`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#B9B4AA] bg-[#EAE5DB]">
            <div>
              {title && <h3 className="text-base font-bold text-[#18212B] tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-[#62605B] mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#62605B] hover:text-[#18212B] p-1 rounded-[2px] hover:bg-[#FCFAF5] border border-transparent hover:border-[#B9B4AA] transition-all ml-4"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto bg-[#FCFAF5] text-[#18212B]">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#B9B4AA] bg-[#EAE5DB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
