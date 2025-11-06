// src/components/imports/ProgressBar.tsx
'use client';

import React from 'react';

interface ProgressBarProps {
  processed: number;
  total: number;
  label?: string;
}

export function ProgressBar({ processed, total, label }: ProgressBarProps) {
  const percentage =
    total > 0 ? Math.min((processed / total) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{label ?? 'Import progress'}</span>
        <span>
          {processed} / {total} rows
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-[#3578E5] transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
