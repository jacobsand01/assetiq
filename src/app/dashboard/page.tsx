'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
        .maybeSingle();

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

      if (orgError) console.warn('No org threshold found, using 30');
      setThresholdDays(orgData?.threshold ?? 30);

      // Get devices
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, asset_tag, serial_number, platform, status, last_seen_at, warranty_until'
        )
        .eq('org_id', profileData.org_id);

      if (deviceError) {
        setError('Failed to load devices.');
        setLoading(false);
        return;
      }

      setDevices(deviceData ?? []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Loading dashboard...</p>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
        {error}
      </main>
    );

  // --- Compute stats ---
  const total = devices.length;
  const assigned = devices.filter((d) => d.status === 'assigned').length;
  const unassigned = devices.filter((d) => d.status === 'active').length;

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);
  const stale = devices.filter(
    (d) => d.last_seen_at && new Date(d.last_seen_at) < staleCutoff
  );

  const needsAttention = [
    ...stale,
    ...devices.filter((d) => d.status === 'lost' || d.status === 'repair'),
  ];

  // --- UI ---
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => router.push('/devices')}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          View Devices
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Devices</p>
          <p className="text-2xl font-semibold text-white">{total}</p>
        </div>
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Assigned</p>
          <p className="text-2xl font-semibold text-indigo-400">{assigned}</p>
        </div>
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Unassigned</p>
          <p className="text-2xl font-semibold text-green-400">{unassigned}</p>
        </div>
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Stale &gt; {thresholdDays} days
          </p>
          <p className="text-2xl font-semibold text-yellow-400">
            {stale.length}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Needs Attention</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Asset Tag</th>
                <th className="px-4 py-2 text-left font-medium">Serial</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {needsAttention.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    All devices are healthy 🎉
                  </td>
                </tr>
              ) : (
                needsAttention.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-slate-800 hover:bg-slate-800/70 cursor-pointer"
                    onClick={() => router.push(`/devices/${d.id}`)}
                  >
                    <td className="px-4 py-2">{d.asset_tag ?? '—'}</td>
                    <td className="px-4 py-2">{d.serial_number ?? '—'}</td>
                    <td className="px-4 py-2 capitalize">{d.platform}</td>
                    <td className="px-4 py-2 capitalize">{d.status}</td>
                    <td className="px-4 py-2">
                      {d.last_seen_at
                        ? new Date(d.last_seen_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
