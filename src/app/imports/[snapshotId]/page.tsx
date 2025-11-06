'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

type Snapshot = {
  id: string;
  org_id: string;
  name: string;
  source: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  total_rows: number | null;
  status: string | null;
};

type SnapshotItem = {
  id: string;
  snapshot_id: string;
  authority_asset_id: string | null;
  description: string | null;
  site_code: string | null;
  room: string | null;
  custodian: string | null;
  fund: string | null;
  cost: number | null;
  purchase_date: string | null;
};

export default function SnapshotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const snapshotId =
    typeof params?.snapshotId === 'string' ? params.snapshotId : '';

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [items, setItems] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!snapshotId) return;

    async function load() {
      setLoading(true);
      setError(null);

      // 1) Load snapshot metadata
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('authority_snapshots')
        .select(
          'id, org_id, name, source, uploaded_by, uploaded_at, total_rows, status'
        )
        .eq('id', snapshotId)
        .maybeSingle<Snapshot>();

      if (snapshotError || !snapshotData) {
        console.error('Snapshot load error:', snapshotError);
        setError('Snapshot not found.');
        setLoading(false);
        return;
      }

      setSnapshot(snapshotData);

      // 2) Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('authority_snapshot_items')
        .select(
          'id, snapshot_id, authority_asset_id, description, site_code, room, custodian, fund, cost, purchase_date'
        )
        .eq('snapshot_id', snapshotId)
        .order('authority_asset_id', { ascending: true });

      if (itemsError) {
        console.error('Snapshot items load error:', itemsError);
        setItems([]);
      } else {
        setItems((itemsData ?? []) as SnapshotItem[]);
      }

      setLoading(false);
    }

    load();
  }, [snapshotId]);

  function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();

    return (
      (item.authority_asset_id ?? '').toLowerCase().includes(needle) ||
      (item.description ?? '').toLowerCase().includes(needle) ||
      (item.site_code ?? '').toLowerCase().includes(needle) ||
      (item.room ?? '').toLowerCase().includes(needle) ||
      (item.custodian ?? '').toLowerCase().includes(needle) ||
      (item.fund ?? '').toLowerCase().includes(needle)
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading snapshot…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching authority data for this import.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Snapshot not found</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              {error ?? 'We could not find this authority snapshot.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/imports')}
            >
              ← Back to imports
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/imports')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to authority imports
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              {snapshot.name}
            </h1>
            <p className="text-xs text-slate-400">
              Imported{' '}
              {snapshot.uploaded_at
                ? formatDateTime(snapshot.uploaded_at)
                : 'at an unknown time'}
              {snapshot.source ? ` · Source: ${snapshot.source}` : ''}
            </p>
          </div>

          <Badge variant="outline" className="text-xs capitalize">
            {snapshot.status ?? 'unknown'}
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Total rows
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1">
                {(snapshot.total_rows ?? items.length).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Sites (unique)
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1">
                {new Set(items.map((i) => i.site_code ?? '')).size}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Earliest purchase
              </CardDescription>
              <CardTitle className="text-base md:text-lg font-semibold mt-1">
                {(() => {
                  const dates = items
                    .map((i) => (i.purchase_date ? new Date(i.purchase_date) : null))
                    .filter((d): d is Date => !!d && !isNaN(d.getTime()))
                    .sort((a, b) => a.getTime() - b.getTime());
                  return dates.length ? dates[0].toLocaleDateString() : '—';
                })()}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        {/* Filters + table */}
        <section className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm md:text-base font-semibold text-slate-100">
              Authority items
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by asset, description, site, room, custodian…"
                value={search}
                onChange={handleSearchChange}
                className="w-full md:w-80 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-900/90">
                      <TableHead className="text-xs text-slate-400">
                        Asset ID
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Description
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Site
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Room
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Custodian
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Fund
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Cost
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Purchase date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          No rows match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-slate-800 hover:bg-slate-800/80"
                        >
                          <TableCell className="text-xs text-slate-200">
                            {item.authority_asset_id ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200 max-w-xs truncate">
                            {item.description ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {item.site_code ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {item.room ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {item.custodian ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {item.fund ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {item.cost != null
                              ? item.cost.toLocaleString(undefined, {
                                  style: 'currency',
                                  currency: 'USD',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-slate-200">
                            {formatDate(item.purchase_date)}
                          </TableCell>
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
