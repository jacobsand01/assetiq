'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const router = useRouter();
  const [threshold, setThreshold] = useState<number>(30);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrg() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Find org
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }

      setOrgId(profile.org_id);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('threshold')
        .eq('id', profile.org_id)
        .maybeSingle();

      if (orgError || !org) {
        setError('Organization not found.');
        setLoading(false);
        return;
      }

      setThreshold(org.threshold ?? 30);
      setLoading(false);
    }

    loadOrg();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase
      .from('organizations')
      .update({ threshold })
      .eq('id', orgId);

    if (error) {
      console.error(error);
      setError('Failed to update settings.');
    } else {
      setMessage('Settings saved successfully!');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
        >
          ← Back to Dashboard
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Stale Device Threshold (days)
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Devices not seen for this many days will appear as “stale” in your
            dashboard.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-md px-3 py-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </main>
  );
}
