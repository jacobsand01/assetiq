'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
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
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';

type Profile = {
  id: string;
  org_id: string;
};

type CsvRow = Record<string, string>;

type InternalField =
  | 'asset_tag'
  | 'serial_number'
  | 'model'
  | 'platform'
  | 'warranty_until'
  | 'status'
  | 'location';

type FieldConfig = {
  key: InternalField;
  label: string;
  required?: boolean;
  helper: string;
};

const FIELDS: FieldConfig[] = [
  {
    key: 'asset_tag',
    label: 'Asset tag',
    required: true,
    helper:
      'Unique ID you use on labels (e.g. PG-CH-001). Used as the primary key for upserts.',
  },
  {
    key: 'serial_number',
    label: 'Serial number',
    helper:
      'Manufacturer serial (often on the factory barcode). Helps when matching to Google Admin / Intune.',
  },
  {
    key: 'model',
    label: 'Model',
    helper: 'Device model (e.g. “Dell Latitude 5400”).',
  },
  {
    key: 'platform',
    label: 'Platform / type',
    helper:
      'Chromebook, Windows, Mac, iPad, or Other. We’ll normalize values where possible.',
  },
  {
    key: 'warranty_until',
    label: 'Warranty until',
    helper:
      'Date warranty expires. If provided, should be a date (e.g. 2026-06-30).',
  },
  {
    key: 'status',
    label: 'Status',
    helper:
      'active, assigned, retired, lost, or repair. If omitted or invalid, defaults to active.',
  },
  {
    key: 'location',
    label: 'Location / room',
    helper:
      'Room number, cart label, building, etc. Used for room-based tracking.',
  },
];

type FieldMapping = Record<InternalField, string | ''>;

type NormalizedRow = {
  org_id: string;
  asset_tag: string;
  serial_number: string | null;
  model: string | null;
  platform: string;
  warranty_until: string | null;
  status: string;
  location: string | null;
  metadata: Record<string, any> | null;
};

type Step = 'upload' | 'map' | 'preview';

export default function ImportDevicesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    asset_tag: '',
    serial_number: '',
    model: '',
    platform: '',
    warranty_until: '',
    status: '',
    location: '',
  });

  const [previewRows, setPreviewRows] = useState<NormalizedRow[]>([]);
  const [rowsToSend, setRowsToSend] = useState<NormalizedRow[]>([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1) Ensure user has profile/org
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, org_id')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (error || !data) {
        console.error(error);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(data);
      setLoadingProfile(false);
    }

    loadProfile();
  }, [router]);

  function guessMappingFromHeaders(list: string[]): FieldMapping {
    const lowerHeaders = list.map((h) => h.toLowerCase());

    function findHeader(...candidates: string[]): string | '' {
      const idx = lowerHeaders.findIndex((h) =>
        candidates.some((c) => h.includes(c))
      );
      return idx >= 0 ? list[idx] : '';
    }

    return {
      asset_tag: findHeader('asset', 'tag', 'asset id', 'device id'),
      serial_number: findHeader('serial', 'sn', 's/n'),
      model: findHeader('model', 'device', 'product'),
      platform: findHeader('platform', 'os', 'type', 'device type'),
      warranty_until: findHeader('warranty', 'expires', 'expiry'),
      status: findHeader('status', 'state', 'lifecycle'),
      location: findHeader('room', 'location', 'building'),
    };
  }

  function normalizeWarrantyDate(value: string | null): string | null {
    if (!value) return null;

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      // If it’s not a valid date, drop it instead of breaking the import
      return null;
    }

    // Convert to YYYY-MM-DD for Postgres DATE column
    return d.toISOString().slice(0, 10);
  }

  function normalizePlatform(value: string | undefined | null): string {
    if (!value) return 'other';
    const v = value.toLowerCase();

    if (v.includes('chrome')) return 'chromebook';
    if (v.includes('chromebook')) return 'chromebook';
    if (v.includes('win')) return 'windows';
    if (v.includes('mac')) return 'mac';
    if (v.includes('os x')) return 'mac';
    if (v.includes('ipad') || v.includes('ios')) return 'ipad';

    return 'other';
  }

  function normalizeStatus(value: string | undefined | null): string {
    if (!value) return 'active';
    const v = value.toLowerCase().trim();
    const allowed = ['active', 'assigned', 'retired', 'lost', 'repair'];
    if (allowed.includes(v)) return v;
    return 'active';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    setParsing(true);
    setFileName(file.name);
    setRawRows([]);
    setHeaders([]);
    setPreviewRows([]);
    setRowsToSend([]);
    setStep('upload');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<CsvRow>) => {
        const data = results.data || [];
        const fields = results.meta.fields || [];

        if (!data.length || !fields.length) {
          setError('No rows or headers found in the CSV file.');
          setParsing(false);
          return;
        }

        setRawRows(data);
        setHeaders(fields);

        // Auto-guess mapping
        const guessed = guessMappingFromHeaders(fields);
        setMapping((prev) => ({
          ...prev,
          ...guessed,
        }));

        setParsing(false);
        setStep('map');
      },
      error: (err: any) => {
        console.error('Papa parse error:', err);
        setError('Failed to parse CSV file. Please check the format.');
        setParsing(false);
      },
    });
  }

  function prepareNormalizedRows(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!profile) {
      setError('No organization found for your account.');
      return;
    }

    if (!mapping.asset_tag) {
      setError(
        'Asset tag mapping is required. Please map the Asset tag field to one of your CSV columns.'
      );
      return;
    }

    // Set of headers that are mapped to core fields (so we can treat the rest as metadata)
    const usedHeaders = new Set(
      (Object.values(mapping).filter(Boolean) as string[])
    );

    const rows: NormalizedRow[] = rawRows.map((row) => {
      const get = (header: string | ''): string | null => {
        if (!header) return null;
        const val = row[header];
        if (val === undefined || val === null || val === '') return null;
        return String(val).trim();
      };

      const assetTag = get(mapping.asset_tag);
      const serial = get(mapping.serial_number);
      const model = get(mapping.model);
      const platformRaw = get(mapping.platform);
      const warrantyRaw = get(mapping.warranty_until);
      const statusRaw = get(mapping.status);
      const locationRaw = get(mapping.location);

      // Anything *not* mapped becomes metadata
      const metadata: Record<string, any> = {};
      for (const [header, value] of Object.entries(row)) {
        if (usedHeaders.has(header)) continue;
        const v = value?.toString().trim();
        if (!v) continue;
        metadata[header] = v;
      }

      const metadataOrNull =
        Object.keys(metadata).length > 0 ? metadata : null;

      return {
        org_id: profile.org_id,
        asset_tag: assetTag ?? '',
        serial_number: serial,
        model,
        platform: normalizePlatform(platformRaw ?? undefined),
        warranty_until: normalizeWarrantyDate(warrantyRaw),
        status: normalizeStatus(statusRaw ?? undefined),
        location: locationRaw,
        metadata: metadataOrNull,
      };
    });

    // Filter out rows with no asset_tag (cannot upsert reliably)
    const usable = rows.filter((r) => r.asset_tag && r.asset_tag.trim() !== '');
    const preview = usable.slice(0, 10);

    if (!usable.length) {
      setError(
        'None of the rows have an asset tag after mapping. Please adjust your mapping or CSV.'
      );
      return;
    }

    setRowsToSend(usable);
    setPreviewRows(preview);
    setStep('preview');
  }

  async function handleImportConfirm() {
    if (!rowsToSend.length) return;

    setImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/devices/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowsToSend),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Upsert API error response:', text);
        throw new Error(text || 'Import failed.');
      }

      const data = await res.json();
      console.log('Upsert response:', data);

      setSuccessMessage(
        `Import complete. ${rowsToSend.length} row${
          rowsToSend.length === 1 ? '' : 's'
        } sent to the server.`
      );
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-300">Loading your workspace…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/devices')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to devices
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Import devices from CSV
            </h1>
            <p className="text-xs text-slate-400">
              Bring in your existing spreadsheet without rebuilding it from
              scratch.
            </p>
          </div>

          <Badge variant="outline" className="text-[10px] border-slate-700">
            CSV import · Upsert by asset tag
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step === 'upload'
                  ? 'bg-[#3578E5] text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              1
            </span>
            <span>Upload CSV</span>
          </div>
          <span>›</span>
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step === 'map'
                  ? 'bg-[#3578E5] text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              2
            </span>
            <span>Map columns</span>
          </div>
          <span>›</span>
          <div className="flex items-center gap-1">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step === 'preview'
                  ? 'bg-[#3578E5] text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              3
            </span>
            <span>Preview &amp; import</span>
          </div>
        </div>

        {/* Error / success */}
        {error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-200">
            {successMessage}
          </div>
        )}

        {/* Step content */}
        {step === 'upload' && (
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upload CSV</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Export from Google Sheets, Excel, or your current asset
                spreadsheet. We&apos;ll let you map columns in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-dashed border-slate-700 rounded-2xl p-4 bg-slate-950/60 flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-slate-300">
                  {fileName
                    ? `Selected file: ${fileName}`
                    : 'Drop a CSV here or use the button below.'}
                </p>
                <label className="mt-2">
                  <span className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800 cursor-pointer">
                    {parsing ? 'Parsing…' : 'Choose CSV file'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={parsing}
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                Minimum requirement: a column that can become your{' '}
                <span className="font-medium">Asset tag</span>. Everything else
                is optional but recommended.
              </p>
            </CardContent>
          </Card>
        )}

        {step === 'map' && (
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Map columns</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Tell AssetIQ which columns in your CSV correspond to its core
                fields. Your original headers are on the right.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={prepareNormalizedRows} className="space-y-4">
                <div className="space-y-3">
                  {FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-200">
                            {field.label}
                            {field.required && (
                              <span className="text-red-400"> *</span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {field.helper}
                          </span>
                        </div>
                        <div className="min-w-[160px]">
                          <select
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                            value={mapping[field.key] ?? ''}
                            onChange={(e) =>
                              setMapping((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                          >
                            <option value="">
                              {field.required
                                ? 'Select a column…'
                                : 'Not provided'}
                            </option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('upload')}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-[#3578E5] hover:bg-[#2861bc]"
                    disabled={!mapping.asset_tag}
                  >
                    Next: Preview import
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && (
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview import</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                We&apos;ll upsert devices by{' '}
                <span className="font-medium text-slate-200">asset tag</span>{' '}
                within your organization. Only rows with an asset tag will be
                sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing up to 10 of{' '}
                  <span className="font-medium text-slate-200">
                    {rowsToSend.length}
                  </span>{' '}
                  row{rowsToSend.length === 1 ? '' : 's'} to be imported.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] text-slate-300 hover:text-slate-50 hover:bg-slate-800/70 rounded-xl"
                  onClick={() => setStep('map')}
                >
                  Adjust mapping
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-900/90">
                      <TableHead className="text-xs text-slate-400">
                        Asset tag
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Serial
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Model
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Platform
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Location
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Warranty until
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, idx) => (
                      <TableRow
                        key={`${row.asset_tag}-${idx}`}
                        className="border-slate-800"
                      >
                        <TableCell className="text-xs text-slate-100">
                          {row.asset_tag}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.serial_number ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.model ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.platform}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.location ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.warranty_until ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {row.status}
                        </TableCell>
                      </TableRow>
                    ))}
                    {previewRows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-6 text-center text-xs text-slate-400"
                        >
                          No usable rows after mapping. Try adjusting your
                          mapping.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('map')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                  disabled={importing || rowsToSend.length === 0}
                  onClick={handleImportConfirm}
                >
                  {importing ? 'Importing…' : 'Import devices'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
