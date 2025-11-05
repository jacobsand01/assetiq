'use client';

import { useEffect, useState, FormEvent } from 'react';
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

type Device = {
  id: string;
  org_id: string;
  asset_tag: string | null;
  serial_number: string | null;
  model: string | null;
  platform: string;
  status: string;
  location: string | null;
  warranty_until: string | null; // date string like "2026-06-30"
};

const PLATFORM_OPTIONS = [
  { value: 'chromebook', label: 'Chromebook' },
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'Mac' },
  { value: 'ipad', label: 'iPad' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active (in inventory)' },
  { value: 'assigned', label: 'Assigned to person / room' },
  { value: 'retired', label: 'Retired / decommissioned' },
  { value: 'lost', label: 'Lost / missing' },
  { value: 'repair', label: 'In repair' },
];

export default function EditDevicePage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = typeof params?.id === 'string' ? params.id : '';

  const [device, setDevice] = useState<Device | null>(null);

  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [platform, setPlatform] = useState('chromebook');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('active');
  const [warranty, setWarranty] = useState(''); // YYYY-MM-DD

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load device on mount
  useEffect(() => {
    if (!deviceId) return;

    async function load() {
      setLoading(true);
      setError(null);

      // Optionally ensure user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('devices')
        .select(
          'id, org_id, asset_tag, serial_number, model, platform, status, location, warranty_until'
        )
        .eq('id', deviceId)
        .maybeSingle<Device>();

      if (error || !data) {
        console.error('Device load error:', error);
        setError('Device not found.');
        setLoading(false);
        return;
      }

      setDevice(data);

      // Prefill form fields
      setAssetTag(data.asset_tag ?? '');
      setSerialNumber(data.serial_number ?? '');
      setModel(data.model ?? '');
      setPlatform(data.platform ?? 'other');
      setLocation(data.location ?? '');
      setStatus(data.status ?? 'active');

      // warranty_until may be full ISO or YYYY-MM-DD – normalize for <input type="date">
      if (data.warranty_until) {
        const dateOnly = data.warranty_until.slice(0, 10);
        setWarranty(dateOnly);
      } else {
        setWarranty('');
      }

      setLoading(false);
    }

    load();
  }, [deviceId, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!device) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          asset_tag: assetTag.trim() || null,
          serial_number: serialNumber.trim() || null,
          model: model.trim() || null,
          platform,
          location: location.trim() || null,
          status,
          warranty_until: warranty ? warranty : null, // Postgres DATE can take "YYYY-MM-DD"
        })
        .eq('id', device.id);

      if (updateError) throw updateError;

      setSuccess(true);
      // Small delay so the success message is visible
      setTimeout(() => {
        router.push(`/devices/${device.id}`);
      }, 900);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to update device.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Loading device…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching current details so you can make updates.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error && !device) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md rounded-2xl border-red-900/60 bg-red-950/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-red-100">
              Unable to load device
            </CardTitle>
            <CardDescription className="text-sm text-red-200/80">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-red-500/40 text-red-100 hover:bg-red-900/40"
              onClick={() => router.push('/devices')}
            >
              ← Back to devices
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // We know device exists here
  const label = device?.asset_tag || 'Device';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push(`/devices/${device?.id}`)}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to device
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Edit {label}
            </h1>
            <p className="text-xs text-slate-400">
              Update identifiers, platform, location, and lifecycle status.
            </p>
          </div>

          <Badge className="capitalize">{device?.status}</Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8">
        <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Device details</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Small changes here keep your records clean and searchable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Asset tag + Serial */}
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
                    The label you stick on the device. Used for CSV imports and
                    QR links.
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
                    placeholder="SN12345XYZ"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Manufacturer serial, useful for warranty and vendor portals.
                  </p>
                </div>
              </div>

              {/* Row 2: Model + Platform */}
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
                    Platform / type
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Location + Status */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room 120 (Chromebook cart 1)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                  <p className="text-[11px] text-slate-500">
                    For room-based devices, this can matter more than who it&apos;s
                    assigned to.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    This drives counts on the dashboard and attention views.
                  </p>
                </div>
              </div>

              {/* Row 4: Warranty */}
              <div className="space-y-1 max-w-xs">
                <label className="block text-xs font-medium text-slate-300">
                  Warranty until
                </label>
                <input
                  type="date"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Optional, but handy when you need to know what&apos;s still
                  covered.
                </p>
              </div>

              {/* Messages */}
              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                  Device updated. Redirecting back to details…
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 gap-3">
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => router.push(`/devices/${device?.id ?? ''}`)}
  >
    Cancel
  </Button>
  <Button
    type="submit"
    size="sm"
    disabled={saving}
    className="bg-[#3578E5] hover:bg-[#2861bc]"
  >
    {saving ? 'Saving…' : 'Save changes'}
  </Button>
</div>

            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
