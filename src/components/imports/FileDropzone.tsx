// src/components/imports/FileDropzone.tsx
'use client';

import React from 'react';

interface FileDropzoneProps {
  fileName: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
}

export function FileDropzone({
  fileName,
  onFileChange,
  helperText,
}: FileDropzoneProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-6 text-center">
        <p className="text-xs text-slate-300">
          Drag and drop a CSV here, or click to choose a file.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="block text-xs text-slate-300"
        />
        {fileName && (
          <p className="text-[11px] text-slate-500">
            Selected file:{' '}
            <span className="font-medium">
              {fileName}
            </span>
          </p>
        )}
      </div>
      <p className="text-[11px] text-slate-500">
        {helperText ??
          "We’ll only read the file in your browser for mapping, then store structured rows in your database."}
      </p>
    </div>
  );
}
