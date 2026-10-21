import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...rest }) => {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/80 ${className}`}
      {...rest}
    />
  );
};
