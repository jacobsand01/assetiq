'use client';

import React, { useEffect, useState } from 'react';
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

type OffboardingEvent = {
  id: string;
  org_id: string;
  user_email: string;
  user_name: string | null;
  manager_email?: string | null;
  status: string;
  devices_expected?: string | null; // text, not number
  devices_returned?: boolean | null;
  reminders_sent?: number | null;
  created_at: string | null;
  completed_at?: string | null;
  notes?: string | null;
};

export default function OffboardingListPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<OffboardingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Ensure user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // 2) Get profile to find org_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id, full_name')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !profileData) {
        console.error('Profile load error:', profileError);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(profileData);

      // 3) Load offboarding events for this org.
      const { data: eventsData, error: eventsError } = await supabase
        .from('offboarding_events')
        .select('*')
        .eq('org_id', profileData.org_id)
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Offboarding events error:', eventsError);
        setError('Failed to load offboarding events.');
        setEvents([]);
        setLoading(false);
        return;
      }

      setEvents((eventsData ?? []) as OffboardingEvent[]);
      setLoading(false);
    }

    load();
  }, [router]);

  function formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  function formatStatus(status: string): React.ReactNode {
    const normalized = status.toLowerCase();

    let colorClasses = 'bg-slate-800/80 text-slate-100 border-slate-700';

    if (normalized === 'open') {
      colorClasses = 'bg-amber-500/10 text-amber-300 border-amber-600/60';
    } else if (normalized === 'completed') {
      colorClasses = 'bg-emerald-500/10 text-emerald-300 border-emerald-600/60';
    } else if (normalized === 'cancelled') {
      colorClasses = 'bg-slate-700/80 text-slate-200 border-slate-500/80';
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${colorClasses}`}
      >
        {normalized}
      </span>
    );
  }

  function devicesReturnedLabel(flag: boolean | null | undefined): string {
    if (flag === true) return 'Yes';
    if (flag === false) return 'No';
    return 'Unknown';
  }

  const openEvents = events.filter(
    (e) => e.status && e.status.toLowerCase() === 'open'
  );
  const closedEvents = events.filter(
    (e) => e.status && e.status.toLowerCase() !== 'open'
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading offboarding…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching leavers and their device status.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error && !events.length) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Offboarding unavailable</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              ← Back to dashboard
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
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Offboarding
            </h1>
            <p className="text-xs text-slate-400">
              Track leavers and make sure their devices make it back to IT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-[#3578E5] hover:bg-[#2861bc]"
              onClick={() => router.push('/offboarding/new')}
            >
              + New offboarding
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Open events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Open offboarding</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Staff who are leaving and still have devices to confirm or chase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="text-center">
                      Devices expected
                    </TableHead>
                    <TableHead className="text-center">
                      Devices returned
                    </TableHead>
                    <TableHead className="text-center">
                      Reminders sent
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openEvents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-slate-400"
                      >
                        No open offboarding events. You can add a leaver using
                        the button above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    openEvents.map((e) => (
                      <TableRow
                        key={e.id}
                        className="border-slate-800 hover:bg-slate-800/80 transition-colors"
                      >
                        <TableCell>{e.user_name ?? '—'}</TableCell>
                        <TableCell className="text-xs">
                          {e.user_email}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.manager_email ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {e.devices_expected ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {devicesReturnedLabel(e.devices_returned)}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {e.reminders_sent ?? 0}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(e.created_at)}
                        </TableCell>
                        <TableCell>{formatStatus(e.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Closed events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed / archived</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Past offboarding events, useful when someone asks
              &quot;Did they bring their laptop back?&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="text-center">
                      Devices expected
                    </TableHead>
                    <TableHead className="text-center">
                      Devices returned
                    </TableHead>
                    <TableHead className="text-center">
                      Reminders sent
                    </TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-slate-400"
                      >
                        No completed or cancelled offboarding events yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    closedEvents.map((e) => (
                      <TableRow
                        key={e.id}
                        className="border-slate-800 hover:bg-slate-800/80 transition-colors"
                      >
                        <TableCell>{e.user_name ?? '—'}</TableCell>
                        <TableCell className="text-xs">
                          {e.user_email}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.manager_email ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {e.devices_expected ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {devicesReturnedLabel(e.devices_returned)}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {e.reminders_sent ?? 0}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(e.completed_at)}
                        </TableCell>
                        <TableCell>{formatStatus(e.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
