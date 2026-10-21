import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tacticalHover?: boolean;
  bordered?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  tacticalHover = false,
  bordered = true,
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`bg-bgmi-card rounded-xl transition-all duration-200 ${
        bordered ? 'border border-bgmi-border' : ''
      } ${
        tacticalHover
          ? 'hover:border-amber-500/40 hover:-translate-y-0.5 shadow-tactical hover:shadow-lg'
          : 'shadow-tactical'
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`p-5 border-b border-bgmi-border/60 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div className={`p-4 bg-bgmi-surface/60 border-t border-bgmi-border/60 rounded-b-xl ${className}`} {...rest}>
      {children}
    </div>
  );
};
