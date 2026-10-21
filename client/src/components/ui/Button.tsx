import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'outline'
  | 'gold'
  | 'ghost';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  to?: string;
  href?: string;
  target?: string;
  rel?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-black font-extrabold border border-amber-400/50 shadow-gold-sm hover:shadow-gold-lg',
  secondary:
    'bg-bgmi-surface hover:bg-slate-800 active:bg-slate-900 text-slate-200 hover:text-white border border-bgmi-border hover:border-amber-500/40 shadow-tactical',
  danger:
    'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold border border-red-500/50 shadow-red-sm hover:shadow-md',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold border border-emerald-500/50 shadow-sm',
  outline:
    'bg-transparent hover:bg-amber-500/10 active:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/50 hover:border-amber-400 shadow-sm',
  gold:
    'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-110 active:brightness-95 text-black font-black border border-yellow-300/60 shadow-gold-lg text-glow',
  ghost:
    'bg-transparent hover:bg-slate-800/70 active:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] rounded-md gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-2',
  md: 'px-5 py-2.5 text-xs sm:text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5',
  xl: 'px-8 py-3.5 text-base sm:text-lg rounded-xl gap-3'
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      onClick,
      to,
      href,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isInactive = disabled || loading;

    const baseStyles = [
      'relative inline-flex items-center justify-center font-display uppercase tracking-wider select-none font-bold',
      'transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bgmi-dark',
      'active:scale-[0.98]',
      fullWidth ? 'w-full' : '',
      isInactive ? 'opacity-55 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      variantStyles[variant],
      sizeStyles[size],
      className
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = (e: React.MouseEvent<any>) => {
      if (isInactive) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    const content = (
      <>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current flex-shrink-0" />
            <span>{loadingText || children}</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0 flex items-center">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="flex-shrink-0 flex items-center">{rightIcon}</span>}
          </>
        )}
      </>
    );

    if (to && !isInactive) {
      return (
        <Link
          to={to}
          ref={ref as any}
          className={baseStyles}
          onClick={handleClick}
          {...(rest as any)}
        >
          {content}
        </Link>
      );
    }

    if (href && !isInactive) {
      return (
        <a
          href={href}
          ref={ref as any}
          className={baseStyles}
          onClick={handleClick}
          {...(rest as any)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as any}
        type={type}
        disabled={isInactive}
        aria-busy={loading}
        aria-disabled={isInactive}
        className={baseStyles}
        onClick={handleClick}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
