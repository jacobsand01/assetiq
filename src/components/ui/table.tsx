// src/components/ui/table.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table
    className={cn('w-full text-sm text-left border-collapse', className)}
    {...props}
  />
);

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-slate-900/90', className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('', className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'border-b border-slate-800 last:border-none',
      className
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400',
      className
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn('px-4 py-2 align-middle text-sm text-slate-200', className)}
    {...props}
  />
);
