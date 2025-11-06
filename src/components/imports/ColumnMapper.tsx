// src/components/imports/ColumnMapper.tsx
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type AssignIQFieldKey =
  | 'authority_asset_id'
  | 'description'
  | 'site_code'
  | 'room'
  | 'custodian'
  | 'fund'
  | 'cost'
  | 'purchase_date';

export type ColumnMapping = Record<AssignIQFieldKey, string | ''>;

export interface AssignIQFieldConfig {
  key: AssignIQFieldKey;
  label: string;
  required?: boolean;
}

interface ColumnMapperProps {
  fields: AssignIQFieldConfig[];
  csvHeaders: string[];
  mapping: ColumnMapping;
  onChange: (fieldKey: AssignIQFieldKey, csvHeader: string) => void;
}

export function ColumnMapper({
  fields,
  csvHeaders,
  mapping,
  onChange,
}: ColumnMapperProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-300">
        Map CSV columns
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-900/80">
              <TableHead className="text-xs text-slate-400">
                AssignIQ field
              </TableHead>
              <TableHead className="text-xs text-slate-400">
                CSV column
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.key} className="border-slate-800">
                <TableCell className="text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <span>{field.label}</span>
                    {field.required && (
                      <span className="text-[10px] text-red-400">*</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-200">
                  <select
                    value={mapping[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#3578E5]"
                  >
                    <option value="">— Not mapped —</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] text-slate-500">
        Required fields help AssignIQ match authority rows to real-world
        assets and locations.
      </p>
    </div>
  );
}
