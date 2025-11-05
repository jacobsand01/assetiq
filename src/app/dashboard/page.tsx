'use client';

import { useEffect, useState } from 'react';
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
  created_at: string | null; // ✅ NEW
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [thresholdDays, setThresholdDays] = useState<number>(30);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // Get profile/org
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

      // Get org threshold
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('threshold')
        .eq('id', profileData.org_id)
        .maybeSingle();

      if (orgError) console.warn('No org threshold found, falling back to 30');
      setThresholdDays(orgData?.threshold ?? 30);

      // Get devices (✅ include created_at)
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, asset_tag, serial_number, platform, status, last_seen_at, warranty_until, created_at'
        )
        .eq('org_id', profileData.org_id);

      if (deviceError) {
        setError('Failed to load devices.');
        setLoading(false);
        return;
      }

      setDevices((deviceData ?? []) as Device[]);
      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-300">Loading your workspace…</p>
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
              We couldn&apos;t load your dashboard data.
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

  // --- Derived stats ---
  const total = devices.length;
  const assigned = devices.filter((d) => d.status === 'assigned').length;
  const unassigned = devices.filter((d) => d.status === 'active').length;

  const now = new Date();
  const cutoff = new Date(
    now.getTime() - thresholdDays * 24 * 60 * 60 * 1000
  );

  // ✅ NEW: smarter stale logic
  const stale = devices.filter((d) => {
    // If we have last_seen_at, use that
    if (d.last_seen_at) {
      const lastSeen = new Date(d.last_seen_at);
      if (!isNaN(lastSeen.getTime())) {
        return lastSeen < cutoff;
      }
    }

    // Otherwise, fall back to created_at — only stale if it's old
    if (d.created_at) {
      const created = new Date(d.created_at);
      if (!isNaN(created.getTime())) {
        return created < cutoff;
      }
    }

    // Brand new devices (no dates or very recent) → not stale
    return false;
  });

  const needsAttention = [
    ...stale,
    ...devices.filter(
      (d) => d.status === 'lost' || d.status === 'repair'
    ),
  ].filter(
    (value, index, self) => self.findIndex((x) => x.id === value.id) === index
  );

  const formatPlatform = (p: string) => {
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
  };

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
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden sm:inline-flex border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600 rounded-xl text-xs md:text-sm transition-colors"
              onClick={() => router.push('/devices')}
            >
              Devices
            </Button>
            <Button
              variant="outline"
              className="hidden sm:inline-flex border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600 rounded-xl text-xs md:text-sm transition-colors"
              onClick={() => router.push('/offboarding')}
            >
              Offboarding
            </Button>
            <Button
              variant="outline"
              className="hidden sm:inline-flex border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600 rounded-xl text-xs md:text-sm transition-colors"
              onClick={() => router.push('/settings')}
            >
              Settings
            </Button>
            <Button
              className="bg-[#3578E5] hover:bg-[#2861bc] text-white rounded-xl text-xs md:text-sm px-3 py-2 transition-colors"
              onClick={() => router.push('/offboarding/new')}
            >
              New offboarding
            </Button>
          </div>
        </div>
      </header>

      {/* Page body */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Summary bar */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              Quick view of your fleet health.
            </p>
            <p className="text-xs text-slate-500">
              Devices not seen in the last{' '}
              <span className="font-medium text-[#3578E5]">
                {thresholdDays} days
              </span>{' '}
              are marked as stale. Brand-new devices won&apos;t show as stale.
            </p>
          </div>
        </section>

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
                Across your whole organization.
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
                Currently checked out to staff or students.
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
                Ready to deploy or keep as spares.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-slate-400">
                Stale &gt; {thresholdDays} days
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-semibold mt-1 text-amber-400">
                {stale.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500">
                Devices that haven&apos;t been seen or updated in a while.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Needs Attention table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-100">
                Needs attention
              </h2>
              <Badge
                variant="outline"
                className="border-slate-700 bg-slate-900/80 text-xs text-slate-200 rounded-full px-2 py-0.5"
              >
                {needsAttention.length} item
                {needsAttention.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-300 hover:text-slate-50 hover:bg-slate-800/70 rounded-xl transition-colors"
              onClick={() => router.push('/devices')}
            >
              Open device list
            </Button>
          </div>

          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 bg-slate-900/90">
                      <TableHead className="text-xs font-medium text-slate-400">
                        Asset tag
                      </TableHead>
                      <TableHead className="text-xs font-medium text-slate-400">
                        Serial
                      </TableHead>
                      <TableHead className="text-xs font-medium text-slate-400">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-medium text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-medium text-slate-400">
                        Last seen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {needsAttention.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          All quiet for now. 🎉
                        </TableCell>
                      </TableRow>
                    ) : (
                      needsAttention.map((d) => (
                        <TableRow
                          key={d.id}
                          className="cursor-pointer border-slate-800 hover:bg-slate-800/80 transition-colors"
                          onClick={() => router.push(`/devices/${d.id}`)}
                        >
                          <TableCell className="text-sm text-slate-100">
                            {d.asset_tag ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {d.serial_number ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {formatPlatform(d.platform)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge className="rounded-full bg-slate-800 text-slate-100 border-slate-700 text-[11px] px-2 py-0.5">
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-300">
                            {d.last_seen_at
                              ? new Date(
                                  d.last_seen_at
                                ).toLocaleDateString()
                              : '—'}
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
