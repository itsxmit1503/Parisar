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
  // Tactile button styling with sharp corners and physical press feedback
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-[3px] select-none transition-all duration-75 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-4.5 py-2.5 gap-2.5',
  };

  // Modern Neo-Skeuomorphism: Terracotta CTA, Ink dark, Raised Ivory secondary, Muted Brass highlight
  const variantClasses = {
    primary: 'bg-[#B6533C] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] hover:bg-[#A24833] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B]',
    secondary: 'bg-[#FCFAF5] text-[#18212B] border border-[#18212B] shadow-[2px_2px_0_0_#B9B4AA] hover:-translate-y-[1px] hover:shadow-[2px_2px_0_0_#18212B] hover:bg-[#EAE5DB] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    dark: 'bg-[#18212B] text-[#FCFAF5] border border-[#0D131A] shadow-[2px_2px_0_0_#000000] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#000000] hover:bg-[#273342] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
    brass: 'bg-[#B08A4A] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] hover:bg-[#9C7738] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B]',
    outline: 'bg-transparent text-[#18212B] border border-[#B9B4AA] hover:bg-[#FCFAF5] hover:border-[#18212B] active:bg-[#EAE5DB]',
    destructive: 'bg-[#A83226] text-white border border-[#18212B] shadow-[2px_2px_0_0_#18212B] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#18212B] hover:bg-[#92271D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#18212B]',
    ghost: 'bg-transparent text-[#62605B] hover:bg-[#EAE5DB] hover:text-[#18212B] active:bg-[#E2DDD3]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
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
