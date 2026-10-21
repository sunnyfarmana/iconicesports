import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      className = '',
      required,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono uppercase font-bold text-slate-300 tracking-wider"
          >
            {label} {required && <span className="text-red-400">*</span>}
          </label>
        )}

        <div className="relative rounded-lg">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`w-full bg-bgmi-surface text-white placeholder-slate-500 text-sm rounded-lg border transition-all duration-150 focus:outline-none focus:ring-1 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-bgmi-border focus:border-amber-500 focus:ring-amber-500/20'
            } ${className}`}
            {...rest}
          />

          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-400 font-mono flex items-center space-x-1">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 font-mono">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
