import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'brass' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Tactile button styling with sharp corners, touch-action manipulation, and comfortable finger-sized targets (Sections 3 & 8)
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-[3px] select-none touch-manipulation transition-all duration-75 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  // Balanced mobile scale: comfortably finger-sized tap areas
  const sizeClasses = {
    sm: 'min-h-[38px] text-xs px-3.5 py-2 gap-1.5',
    md: 'min-h-[44px] text-xs sm:text-sm px-4 py-2.5 gap-2',
    lg: 'min-h-[50px] text-sm sm:text-base px-5 py-3 gap-2.5',
  };

  // Clear Button Hierarchy (Section 8):
  // PRIMARY (dominant): primary (terracotta), dark, brass, destructive
  // SECONDARY (visible but quieter): secondary, outline
  // TERTIARY (quietest): ghost
  const variantClasses = {
    primary:
      'bg-[#B6533C] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B] hover:bg-[#A24833]',
    secondary:
      'bg-[#FCFAF5] text-[#18212B] border border-[#18212B] shadow-[2px_2px_0_0_#B9B4AA] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#EAE5DB]',
    dark:
      'bg-[#18212B] text-[#FCFAF5] border border-[#0D131A] shadow-[2px_2px_0_0_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#273342]',
    brass:
      'bg-[#B08A4A] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B] hover:bg-[#9C7738]',
    outline:
      'bg-[#FCFAF5]/80 text-[#18212B] border border-[#B9B4AA] hover:bg-[#FCFAF5] hover:border-[#18212B] active:bg-[#EAE5DB]',
    destructive:
      'bg-[#A83226] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B] hover:bg-[#92271D]',
    ghost:
      'bg-transparent text-[#62605B] hover:bg-[#EAE5DB] hover:text-[#18212B] active:bg-[#E2DDD3]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
