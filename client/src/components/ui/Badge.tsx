import React from 'react';

export type BadgeVariant =
  | 'gold'
  | 'red'
  | 'emerald'
  | 'slate'
  | 'blue'
  | 'outline'
  | 'live';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  outline: 'bg-transparent text-slate-300 border-bgmi-border',
  live: 'bg-red-950/40 text-red-400 border-red-500/40'
};

const dotStyles: Record<BadgeVariant, string> = {
  gold: 'bg-amber-400',
  red: 'bg-red-500',
  emerald: 'bg-emerald-400',
  slate: 'bg-slate-400',
  blue: 'bg-blue-400',
  outline: 'bg-slate-400',
  live: 'bg-red-500'
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[9px] font-semibold',
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-xs font-bold'
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-mono uppercase tracking-wider font-bold rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} ${pulse ? 'animate-ping' : ''}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
