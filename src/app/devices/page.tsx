'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const PAGE_SIZE = 10;

type DeviceRow = {
  id: string;
  asset_tag: string | null;
  serial_number: string | null;
  platform: string;
  status: string;
  last_seen_at: string | null;
  warranty_until: string | null;
};

type ProfileRow = {
  id: string;
  org_id: string;
  full_name: string | null;
};

export default function DevicesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error } = await supabase
        .from('profiles')
        .select('id, org_id, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

    useEffect(() => {
    if (!profile) return;

    async function loadDevices(orgId: string) {
      setLoadingPage(true);
      setError(null);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('devices')
        .select(
          'id, asset_tag, serial_number, platform, status, last_seen_at, warranty_until',
          { count: 'exact' }
        )
        .eq('org_id', orgId)
        .order('asset_tag', { ascending: true })
        .range(from, to);

      if (error) {
        setError(error.message ?? 'Failed to load devices');
        setDevices([]);
        setTotalCount(null);
        setLoadingPage(false);
        return;
      }

      setDevices(data ?? []);
      setTotalCount(count ?? null);
      setLoadingPage(false);
    }

    loadDevices(profile.org_id);
  }, [profile, page]);


  const totalPages =
    totalCount !== null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1;

  function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Loading devices...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Devices</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/devices/import')}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
          >
            Import CSV
          </button>
          <button
            onClick={() => router.push('/devices/new')}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            + Add Device
          </button>
        </div>
      </header>

      <section className="p-6">
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Asset Tag</th>
                <th className="px-4 py-2 text-left font-medium">Serial</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Last Seen</th>
                <th className="px-4 py-2 text-left font-medium">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No devices found yet.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-800 hover:bg-slate-800/70"
                  >
                    <td className="px-4 py-2">
                      <button
                        className="text-indigo-400 hover:underline"
                        onClick={() => router.push(`/devices/${d.id}`)}
                      >
                        {d.asset_tag ?? '—'}
                      </button>
                    </td>
                    <td className="px-4 py-2">{d.serial_number ?? '—'}</td>
                    <td className="px-4 py-2">{formatPlatform(d.platform)}</td>
                    <td className="px-4 py-2 capitalize">{d.status}</td>
                    <td className="px-4 py-2">
                      {formatDateTime(d.last_seen_at)}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(d.warranty_until)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {totalCount && totalCount > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loadingPage}
              className="rounded-md border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) =>
                  totalPages ? Math.min(totalPages, p + 1) : p + 1
                )
              }
              disabled={loadingPage || page >= totalPages}
              className="rounded-md border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
