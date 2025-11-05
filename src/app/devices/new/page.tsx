'use client';

import { useEffect, useState, FormEvent } from 'react';
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

type Profile = {
  id: string;
  org_id: string;
};

export default function NewDevicePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [platform, setPlatform] = useState<'chromebook' | 'windows' | 'mac' | 'ipad' | 'other'>(
    'chromebook'
  );
  const [warrantyUntil, setWarrantyUntil] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        .select('id, org_id')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (error || !data) {
        console.error(error);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!profile) {
      setError('No organization found for your account.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: insertError } = await supabase.from('devices').insert([
        {
          org_id: profile.org_id,
          asset_tag: assetTag || null,
          serial_number: serialNumber || null,
          model: model || null,
          platform,
          warranty_until: warrantyUntil || null,
          status: 'active',
          location: location || null,
        },
      ]);

      if (insertError) throw insertError;

      setSuccess(true);

      setTimeout(() => {
        router.push('/devices');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to create device');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading workspace…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Checking your account and organization.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/devices')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to devices
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Add device
            </h1>
            <p className="text-xs text-slate-400">
              Create a single device record. For bulk import, use the CSV flow.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Device details</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              You can edit these later or enrich them via integrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Asset tag
                  </label>
                  <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="PG-CH-001"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Optional, but strongly recommended. Used for upserts and QR.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Serial number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="SN12345678"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Dell Latitude 5400"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value as typeof platform)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  >
                    <option value="chromebook">Chromebook</option>
                    <option value="windows">Windows</option>
                    <option value="mac">Mac</option>
                    <option value="ipad">iPad</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Location field */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Room 120, 6th grade lab, Library cart 3..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  For “lives in this room” devices, this is more important than
                  a person.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Warranty until
                </label>
                <input
                  type="date"
                  value={warrantyUntil}
                  onChange={(e) => setWarrantyUntil(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                  Device created.
                </p>
              )}

              <div className="flex justify-between items-center pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/devices')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {submitting ? 'Saving…' : 'Save device'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
