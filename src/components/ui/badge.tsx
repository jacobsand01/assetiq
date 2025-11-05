// src/components/ui/badge.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors';

  const variants = {
    default:
      'border-slate-700 bg-slate-800 text-slate-100',
    outline:
      'border-slate-700 bg-transparent text-slate-300',
  };

  return (
    <span
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
