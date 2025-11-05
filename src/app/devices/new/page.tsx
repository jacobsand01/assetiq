'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NewDevicePage() {
  const router = useRouter();

  const [assetTag, setAssetTag] = useState('');
  const [serial, setSerial] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('chromebook');
  const [warranty, setWarranty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // Get the user's org_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('No organization found for your account.');
      }

      const { error: insertError } = await supabase.from('devices').insert([
        {
          org_id: profile.org_id,
          asset_tag: assetTag,
          serial_number: serial,
          model,
          platform: type,
          warranty_until: warranty || null,
          status: 'active',
          last_seen_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push('/devices'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to add device');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Add New Device
        </h1>
        <p className="text-slate-300 text-center mb-6">
          Fill out the device details below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Asset Tag
            </label>
            <input
              type="text"
              required
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              placeholder="PG-CH-001"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              required
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="SN12345XYZ"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">Model</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Dell Latitude 5400"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="chromebook">Chromebook</option>
              <option value="windows">Windows</option>
              <option value="mac">Mac</option>
              <option value="ipad">iPad</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Warranty Until
            </label>
            <input
              type="date"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-md px-3 py-2">
              Device added successfully!
            </p>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/devices')}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
            >
              {loading ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
