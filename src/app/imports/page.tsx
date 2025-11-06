'use client';

import { useEffect, useState } from 'react';
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
};

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

export default function ImportsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Profile load error:', profileError);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(profileData);

      const { data: snapshotData, error: snapshotError } = await supabase
        .from('authority_snapshots')
        .select(
          'id, org_id, name, source, uploaded_by, uploaded_at, total_rows, status'
        )
        .eq('org_id', profileData.org_id)
        .order('uploaded_at', { ascending: false });

      if (snapshotError) {
        console.error('Snapshot load error:', snapshotError);
        setError('Failed to load authority snapshots.');
        setLoading(false);
        return;
      }

      setSnapshots((snapshotData ?? []) as Snapshot[]);
      setLoading(false);
    }

    load();
  }, [router]);

  function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading imports…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching authority snapshots for your organization.
            </CardDescription>
          </CardHeader>
        </Card>
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
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

  const totalSnapshots = snapshots.length;
  const totalRows = snapshots.reduce(
    (sum, s) => sum + (s.total_rows ?? 0),
    0
  );

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
              Authority imports
            </h1>
            <p className="text-xs text-slate-400">
              Snapshots of your district&apos;s Record of Authority CSVs.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => router.push('/imports/new')}
            className="bg-[#3578E5] hover:bg-[#2861bc]"
          >
            + New snapshot
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Summary cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Total snapshots
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1">
                {totalSnapshots}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Total authority rows
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1">
                {totalRows.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Latest snapshot
              </CardDescription>
              <CardTitle className="text-base md:text-lg font-semibold mt-1">
                {snapshots[0]?.name ?? '—'}
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                {snapshots[0]?.uploaded_at
                  ? formatDateTime(snapshots[0].uploaded_at)
                  : 'No snapshot imported yet.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Snapshot table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm md:text-base font-semibold text-slate-100">
              Snapshot history
            </h2>
            <span className="text-[11px] text-slate-400">
              Click a row to see all items from that authority export.
            </span>
          </div>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-900/90">
                      <TableHead className="text-xs text-slate-400">
                        Name
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Source
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Uploaded
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Rows
                      </TableHead>
                      <TableHead className="text-xs text-slate-400">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          No authority snapshots yet. Import your first CSV to
                          get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      snapshots.map((s) => (
                        <TableRow
                          key={s.id}
                          className="clickable-row"
                          onClick={() => router.push(`/imports/${s.id}`)}
                        >
                          <TableCell className="text-sm text-slate-200">
                            {s.name}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {s.source ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {formatDateTime(s.uploaded_at)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {(s.total_rows ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            <Badge
                              className="capitalize"
                              variant="outline"
                            >
                              {s.status ?? 'unknown'}
                            </Badge>
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
