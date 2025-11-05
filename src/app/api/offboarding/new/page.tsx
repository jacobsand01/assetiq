'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NewOffboardingPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [devicesExpected, setDevicesExpected] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // find org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found.');

      const { error: insertError } = await supabase
        .from('offboarding_events')
        .insert([
          {
            org_id: profile.org_id,
            user_email: userEmail,
            manager_email: managerEmail,
            devices_expected: devicesExpected,
            devices_returned: false,
            reminders_sent: 0,
            status: 'open',
          },
        ]);

      if (insertError) throw insertError;

      setMessage('Offboarding event created!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          New Offboarding Event
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-200">Leaver Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              placeholder="employee@company.com"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-200">Manager Email</label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              required
              placeholder="manager@company.com"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-200">
              Devices Expected to Return
            </label>
            <input
              type="number"
              min={1}
              value={devicesExpected}
              onChange={(e) => setDevicesExpected(Number(e.target.value))}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            />
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

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
