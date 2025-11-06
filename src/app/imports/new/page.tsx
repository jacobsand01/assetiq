'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Profile = {
  id: string;
  org_id: string;
  full_name: string | null;
};

type Step = 1 | 2 | 3;

type AssignIQField =
  | 'authority_asset_id'
  | 'description'
  | 'site_code'
  | 'room'
  | 'custodian'
  | 'fund'
  | 'cost'
  | 'purchase_date';

const ASSIGNIQ_FIELDS: { key: AssignIQField; label: string; required?: boolean }[] =
  [
    { key: 'authority_asset_id', label: 'Asset ID / Tag', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'site_code', label: 'Site / Building code', required: true },
    { key: 'room', label: 'Room' },
    { key: 'custodian', label: 'Custodian / Owner' },
    { key: 'fund', label: 'Fund' },
    { key: 'cost', label: 'Cost' },
    { key: 'purchase_date', label: 'Purchase date' },
  ];

type ColumnMapping = Record<AssignIQField, string | ''>;

type ImportProgress = {
  processed: number;
  total: number;
};

export default function NewAuthorityImportPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>(1);

  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);

  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotSource, setSnapshotSource] = useState('Record of authority CSV import');

  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    const initial: ColumnMapping = {
      authority_asset_id: '',
      description: '',
      site_code: '',
      room: '',
      custodian: '',
      fund: '',
      cost: '',
      purchase_date: '',
    };
    return initial;
  });

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    processed: 0,
    total: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1) Load current user + profile/org
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id, full_name')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !data) {
        console.error('Profile load error:', profileError);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  // --- CSV parsing helpers ---

  function parseCsv(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    return lines.map((line) => splitCsvLine(line));
  }

  // Minimal CSV line splitter (handles simple quotes, not full RFC 4180)
  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map((cell) => cell.trim());
  }

  // --- Step 1: Handle file upload & basic preview ---

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }

    setFileName(file.name);

    try {
      const text = await file.text();
      setCsvText(text);

      const rows = parseCsv(text);
      if (!rows.length) {
        setError('The CSV file appears to be empty.');
        return;
      }

      const headers = rows[0];
      const preview = rows.slice(1, 11); // first 10 rows
      setCsvHeaders(headers);
      setCsvPreviewRows(preview);

      // Some light auto-guessing for mapping
      const lowerHeaders = headers.map((h) => h.toLowerCase());

      const newMapping: ColumnMapping = {
        authority_asset_id: guessHeader(lowerHeaders, headers, ['asset', 'tag', 'id']),
        description: guessHeader(lowerHeaders, headers, ['description', 'desc', 'item']),
        site_code: guessHeader(lowerHeaders, headers, ['site', 'school', 'building', 'location']),
        room: guessHeader(lowerHeaders, headers, ['room', 'loc', 'location']),
        custodian: guessHeader(lowerHeaders, headers, ['custodian', 'owner', 'teacher']),
        fund: guessHeader(lowerHeaders, headers, ['fund', 'program']),
        cost: guessHeader(lowerHeaders, headers, ['cost', 'amount', 'value']),
        purchase_date: guessHeader(lowerHeaders, headers, ['date', 'purchase', 'acquired']),
      };

      setMapping(newMapping);
      setStep(2);
    } catch (err: any) {
      console.error('CSV read error:', err);
      setError('Failed to read CSV file.');
    }
  }

  function guessHeader(
    lowerHeaders: string[],
    originalHeaders: string[],
    keywords: string[]
  ): string {
    for (const keyword of keywords) {
      const idx = lowerHeaders.findIndex((h) => h.includes(keyword));
      if (idx !== -1) return originalHeaders[idx];
    }
    return '';
  }

  function handleMappingChange(field: AssignIQField, value: string) {
    setMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateMapping(): string | null {
    for (const field of ASSIGNIQ_FIELDS.filter((f) => f.required)) {
      if (!mapping[field.key]) {
        return `Please map a CSV column for “${field.label}”.`;
      }
    }
    return null;
  }

  // --- Step 3: Import logic (client-side chunked inserts) ---

  async function handleStartImport(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profile) {
      setError('No organization found for your account.');
      return;
    }

    if (!csvText || !csvHeaders.length) {
      setError('Please upload and map a CSV file first.');
      return;
    }

    const mappingError = validateMapping();
    if (mappingError) {
      setError(mappingError);
      return;
    }

    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      setError('The CSV file does not have any data rows.');
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Build index map from mapping
    const indexMap: Record<AssignIQField, number | null> = {
      authority_asset_id: null,
      description: null,
      site_code: null,
      room: null,
      custodian: null,
      fund: null,
      cost: null,
      purchase_date: null,
    };

    for (const field of ASSIGNIQ_FIELDS) {
      const csvColumn = mapping[field.key];
      if (csvColumn) {
        const idx = headers.indexOf(csvColumn);
        indexMap[field.key] = idx !== -1 ? idx : null;
      }
    }

    const effectiveName =
      snapshotName.trim() ||
      `Authority snapshot – ${new Date().toLocaleDateString()}`;

    setImporting(true);
    setImportProgress({ processed: 0, total: dataRows.length });

    try {
      // 1) Create snapshot row
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('authority_snapshots')
        .insert([
          {
            org_id: profile.org_id,
            name: effectiveName,
            source: snapshotSource.trim() || null,
            uploaded_by: profile.id,
            status: 'processing',
          },
        ])
        .select('id')
        .single();

      if (snapshotError || !snapshotData) {
        console.error('Snapshot insert error:', snapshotError);
        throw new Error(
          snapshotError?.message ?? 'Failed to create snapshot record.'
        );
      }

      const snapshotId = snapshotData.id as string;

      // 2) Chunk data rows and insert into authority_snapshot_items
      const chunkSize = 500;
      for (let i = 0; i < dataRows.length; i += chunkSize) {
        const chunk = dataRows.slice(i, i + chunkSize);

        const items = chunk.map((row) => {
          const raw: Record<string, string> = {};
          headers.forEach((h, idx) => {
            raw[h] = row[idx] ?? '';
          });

          const costRaw =
            indexMap.cost !== null ? row[indexMap.cost] ?? '' : '';

          return {
            snapshot_id: snapshotId,
            authority_asset_id:
              indexMap.authority_asset_id !== null
                ? row[indexMap.authority_asset_id] ?? null
                : null,
            description:
              indexMap.description !== null
                ? row[indexMap.description] ?? null
                : null,
            site_code:
              indexMap.site_code !== null
                ? row[indexMap.site_code] ?? null
                : null,
            room:
              indexMap.room !== null ? row[indexMap.room] ?? null : null,
            custodian:
              indexMap.custodian !== null
                ? row[indexMap.custodian] ?? null
                : null,
            fund:
              indexMap.fund !== null ? row[indexMap.fund] ?? null : null,
            cost: costRaw ? Number(costRaw.replace(/[^0-9.]/g, '')) : null,
            purchase_date:
              indexMap.purchase_date !== null
                ? row[indexMap.purchase_date] ?? null
                : null,
            raw_json: raw,
          };
        });

        const { error: itemsError } = await supabase
          .from('authority_snapshot_items')
          .insert(items);

        if (itemsError) {
          console.error('Snapshot items insert error:', itemsError);
          throw new Error(
            itemsError.message ?? 'Failed to insert snapshot items.'
          );
        }

        setImportProgress((prev) => ({
          processed: Math.min(prev.processed + chunk.length, prev.total),
          total: prev.total,
        }));
      }

      // 3) Mark snapshot as complete
      const { error: updateError } = await supabase
        .from('authority_snapshots')
        .update({
          status: 'complete',
          total_rows: dataRows.length,
        })
        .eq('id', snapshotId);

      if (updateError) {
        console.error('Snapshot status update error:', updateError);
        throw new Error(
          updateError.message ?? 'Failed to finalize snapshot.'
        );
      }

      setSuccess(
        `Import complete: ${dataRows.length.toLocaleString()} rows added.`
      );
      setStep(3);

      setTimeout(() => {
        router.push(`/imports/${snapshotId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Import exception:', err);
      setError(err?.message ?? 'Failed to import snapshot.');
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">
              Loading workspace…
            </CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Checking your account and organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              New authority snapshot
            </h1>
            <p className="text-xs text-slate-400">
              Import the district&apos;s Record of Authority CSV so AssignIQ can
              reconcile it with reality.
            </p>
          </div>

          <Badge variant="outline" className="text-xs">
            Record-of-Authority
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Step indicator */}
        <section className="flex items-center gap-3 text-xs text-slate-400">
          <span className={step >= 1 ? 'text-slate-100 font-medium' : ''}>
            1. Upload CSV
          </span>
          <span>·</span>
          <span className={step >= 2 ? 'text-slate-100 font-medium' : ''}>
            2. Map columns
          </span>
          <span>·</span>
          <span className={step >= 3 ? 'text-slate-100 font-medium' : ''}>
            3. Import & reconcile
          </span>
        </section>

        {/* Main card */}
        <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {step === 1 && 'Upload authority snapshot CSV'}
              {step === 2 && 'Map CSV columns to AssignIQ fields'}
              {step === 3 && 'Import complete'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {step === 1 &&
                'This is usually exported from your finance or fixed-asset system.'}
              {step === 2 &&
                'Tell AssignIQ which CSV columns correspond to sites, rooms, and asset details.'}
              {step === 3 &&
                'We’ve stored this snapshot for discrepancy analysis and audit health.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step content */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Snapshot name
                  </label>
                  <input
                    type="text"
                    value={snapshotName}
                    onChange={(e) => setSnapshotName(e.target.value)}
                    placeholder="e.g. FY25 Fixed Assets – June 30 export"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Optional, but helpful when you have multiple snapshots over
                    time.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Source system (optional)
                  </label>
                  <input
                    type="text"
                    value={snapshotSource}
                    onChange={(e) => setSnapshotSource(e.target.value)}
                    placeholder="e.g. Skyward Fixed Assets, Munis, etc."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Upload CSV file
                  </label>
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-6 text-center">
                    <p className="text-xs text-slate-300">
                      Drag and drop a CSV here, or click to choose a file.
                    </p>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="block text-xs text-slate-300"
                    />
                    {fileName && (
                      <p className="text-[11px] text-slate-500">
                        Selected file: <span className="font-medium">{fileName}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    We&apos;ll only read the file in your browser for mapping, then
                    store structured rows in your database.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {/* Mapping UI */}
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
                        {ASSIGNIQ_FIELDS.map((field) => (
                          <TableRow key={field.key} className="border-slate-800">
                            <TableCell className="text-xs text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{field.label}</span>
                                {field.required && (
                                  <span className="text-[10px] text-red-400">
                                    *
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-200">
                              <select
                                value={mapping[field.key]}
                                onChange={(e) =>
                                  handleMappingChange(field.key, e.target.value)
                                }
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

                {/* Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-300">
                    Preview (first 10 rows)
                  </p>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900/80">
                          {csvHeaders.map((h) => (
                            <TableHead
                              key={h}
                              className="text-[11px] text-slate-400"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreviewRows.map((row, idx) => (
                          <TableRow
                            key={idx}
                            className="border-slate-800 hover:bg-slate-900/60"
                          >
                            {csvHeaders.map((_, colIdx) => (
                              <TableCell
                                key={`${idx}-${colIdx}`}
                                className="text-[11px] text-slate-200"
                              >
                                {row[colIdx] ?? ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleStartImport}
                    disabled={importing}
                    className="bg-[#3578E5] hover:bg-[#2861bc]"
                  >
                    {importing ? 'Starting import…' : 'Start import'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-200">
                  Snapshot created and rows imported. You&apos;ll now be able to run
                  discrepancy reports against this authority snapshot.
                </p>
                <div className="flex items-center justify-between pt-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/imports')}
                  >
                    Back to imports
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="bg-[#3578E5] hover:bg-[#2861bc]"
                  >
                    Go to dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* Progress + messages */}
            {(importing || importProgress.total > 0) && step !== 1 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Import progress</span>
                  <span>
                    {importProgress.processed} / {importProgress.total} rows
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#3578E5] transition-all duration-150"
                    style={{
                      width:
                        importProgress.total > 0
                          ? `${
                              (importProgress.processed /
                                importProgress.total) *
                              100
                            }%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                {success}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
