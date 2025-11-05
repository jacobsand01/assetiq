'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
};

type Device = {
  id: string;
  asset_tag: string | null;
  serial_number: string | null;
  platform: string;
  status: string;
  last_seen_at: string | null;
  warranty_until: string | null;
  location: string | null;
};

type ColumnKey =
  | 'asset_tag'
  | 'serial_number'
  | 'platform'
  | 'status'
  | 'last_seen_at'
  | 'warranty_until'
  | 'location';

const COLUMN_CONFIG: { key: ColumnKey; label: string }[] = [
  { key: 'asset_tag', label: 'Asset tag' },
  { key: 'serial_number', label: 'Serial' },
  { key: 'platform', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'last_seen_at', label: 'Last seen' },
  { key: 'warranty_until', label: 'Warranty' },
  { key: 'location', label: 'Location' },
];

type SortDirection = 'asc' | 'desc';

export default function DevicesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // column visibility
  const [visibleColumns, setVisibleColumns] = useState<
    Record<ColumnKey, boolean>
  >({
    asset_tag: true,
    serial_number: true,
    platform: true,
    status: true,
    last_seen_at: true,
    warranty_until: true,
    location: true,
  });

  // sorting
  const [sortKey, setSortKey] = useState<ColumnKey>('asset_tag');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !profileData) {
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(profileData);

      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, asset_tag, serial_number, platform, status, last_seen_at, warranty_until, location'
        )
        .eq('org_id', profileData.org_id)
        .order('asset_tag', { ascending: true }); // initial load order

      if (deviceError) {
        setError('Failed to load devices.');
        setLoading(false);
        return;
      }

      setDevices(deviceData ?? []);
      setLoading(false);
    }

    load();
  }, [router]);

  const total = devices.length;
  const assigned = devices.filter((d) => d.status === 'assigned').length;
  const unassigned = devices.filter((d) => d.status === 'active').length;

  const visibleCols = COLUMN_CONFIG.filter((c) => visibleColumns[c.key]);

  function formatPlatform(p: string): string {
    switch (p) {
      case 'chromebook':
        return 'Chromebook';
      case 'windows':
        return 'Windows';
      case 'mac':
        return 'Mac';
      case 'ipad':
        return 'iPad';
      default:
        return 'Other';
    }
  }

  function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  function renderCell(key: ColumnKey, d: Device): ReactNode {
    switch (key) {
      case 'asset_tag':
        return d.asset_tag ?? '—';
      case 'serial_number':
        return d.serial_number ?? '—';
      case 'platform':
        return formatPlatform(d.platform);
      case 'status':
        return (
          <Badge className="rounded-full bg-slate-800 text-slate-100 border-slate-700 text-[11px] px-2 py-0.5 capitalize">
            {d.status}
          </Badge>
        );
      case 'last_seen_at':
        return d.last_seen_at ? formatDate(d.last_seen_at) : '—';
      case 'warranty_until':
        return formatDate(d.warranty_until);
      case 'location':
        return d.location ?? '—';
      default:
        return '—';
    }
  }

  // --- Sorting helpers ---
  function compareString(
    a: string | null,
    b: string | null,
    direction: SortDirection
  ): number {
    const av = (a ?? '').toLowerCase();
    const bv = (b ?? '').toLowerCase();
    if (av === bv) return 0;
    const res = av < bv ? -1 : 1;
    return direction === 'asc' ? res : -res;
  }

  function compareDate(
    a: string | null,
    b: string | null,
    direction: SortDirection
  ): number {
    const at = a ? new Date(a).getTime() : Number.NaN;
    const bt = b ? new Date(b).getTime() : Number.NaN;

    const aValid = !isNaN(at);
    const bValid = !isNaN(bt);

    if (!aValid && !bValid) return 0;
    if (!aValid) return direction === 'asc' ? 1 : -1; // invalid/null at bottom in asc
    if (!bValid) return direction === 'asc' ? -1 : 1;

    if (at === bt) return 0;
    const res = at < bt ? -1 : 1;
    return direction === 'asc' ? res : -res;
  }

  function sortDevices(list: Device[]): Device[] {
    const copy = [...list];

    copy.sort((a, b) => {
      switch (sortKey) {
        case 'asset_tag':
          return compareString(a.asset_tag, b.asset_tag, sortDirection);
        case 'serial_number':
          return compareString(a.serial_number, b.serial_number, sortDirection);
        case 'platform':
          return compareString(a.platform, b.platform, sortDirection);
        case 'status':
          return compareString(a.status, b.status, sortDirection);
        case 'location':
          return compareString(a.location, b.location, sortDirection);
        case 'last_seen_at':
          return compareDate(a.last_seen_at, b.last_seen_at, sortDirection);
        case 'warranty_until':
          return compareDate(a.warranty_until, b.warranty_until, sortDirection);
        default:
          return 0;
      }
    });

    return copy;
  }

  const sortedDevices = sortDevices(devices);

  function handleHeaderClick(key: ColumnKey) {
    if (sortKey === key) {
      // toggle direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function sortLabelForKey(key: ColumnKey): string {
    return COLUMN_CONFIG.find((c) => c.key === key)?.label ?? key;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-300">Loading devices…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md rounded-2xl border-red-900/60 bg-red-950/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-red-100">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-sm text-red-200/80">
              We couldn&apos;t load your devices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-200 mb-4">{error}</p>
            <Button
              variant="outline"
              className="w-full border-red-500/40 text-red-100 hover:bg-red-900/40"
              onClick={() => router.refresh()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              AssetIQ
            </span>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Devices
            </h1>
            <p className="text-xs text-slate-400">
              All hardware registered to your organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600 rounded-xl text-xs md:text-sm transition-colors"
              onClick={() => router.push('/devices/import')}
            >
              Import CSV
            </Button>
            <Button
              className="bg-[#3578E5] hover:bg-[#2861bc] text-white rounded-xl text-xs md:text-sm px-3 py-2 transition-colors"
              onClick={() => router.push('/devices/new')}
            >
              + Add device
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Stat cards */}
        <section className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Total devices
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1">
                {total}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500">
                Includes assigned, active, and other statuses.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Assigned
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1 text-[#3578E5]">
                {assigned}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500">
                Devices currently tied to a user.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Unassigned
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1 text-emerald-400">
                {unassigned}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500">
                Active devices with no current assignment.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Device list + column chooser + sort info */}
        <section className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm md:text-base font-semibold text-slate-100">
              Device list
            </h2>

            {/* Column chooser */}
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="mr-1">Columns:</span>
              {COLUMN_CONFIG.map((col) => (
                <label
                  key={col.key}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 cursor-pointer hover:bg-slate-800/80"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    checked={visibleColumns[col.key]}
                    onChange={(e) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [col.key]: e.target.checked,
                      }))
                    }
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort summary row (right above table) */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Showing{' '}
              <span className="font-medium text-slate-200">
                {sortedDevices.length}
              </span>{' '}
              device{sortedDevices.length === 1 ? '' : 's'}.
            </span>
            <span>
              Sorting by{' '}
              <span className="font-medium text-slate-200">
                {sortLabelForKey(sortKey)}
              </span>{' '}
              (
              {sortDirection === 'asc' ? 'A → Z / oldest first' : 'Z → A / newest first'}
              ). Click a column header to change.
            </span>
          </div>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-900/90">
                      {visibleCols.map((col) => {
                        const isActive = col.key === sortKey;
                        const arrow =
                          isActive && sortDirection === 'asc'
                            ? '↑'
                            : isActive && sortDirection === 'desc'
                            ? '↓'
                            : '';

                        return (
                          <TableHead
                            key={col.key}
                            className="text-xs font-medium text-slate-400 cursor-pointer select-none"
                            onClick={() => handleHeaderClick(col.key)}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              {arrow && (
                                <span className="text-[10px] text-slate-300">
                                  {arrow}
                                </span>
                              )}
                            </span>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDevices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={visibleCols.length || 1}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          No devices found yet. Try importing a CSV or adding a
                          device.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedDevices.map((d) => (
                        <TableRow
                          key={d.id}
                          className="cursor-pointer border-slate-800 hover:bg-slate-800/80 transition-colors"
                          onClick={() => router.push(`/devices/${d.id}`)}
                        >
                          {visibleCols.map((col) => (
                            <TableCell
                              key={`${d.id}-${col.key}`}
                              className="text-sm text-slate-200"
                            >
                              {renderCell(col.key, d)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
