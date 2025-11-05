// src/components/ui/button.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:pointer-events-none';

const variantClasses: Record<Variant, string> = {
  default: 'bg-red-500 hover:bg-red-600 text-white',
  outline:
    'border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800/80',
  ghost: 'bg-transparent text-slate-200 hover:bg-slate-800/70',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-xl',
  md: 'h-9 px-4 text-sm rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
