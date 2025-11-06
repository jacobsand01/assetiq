'use client';

import React, { useEffect, useState, FormEvent } from 'react';
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

type Profile = {
  id: string;
  org_id: string;
  full_name: string | null;
};

type Device = {
  id: string;
  org_id: string;
  asset_tag: string | null;
  serial_number: string | null;
  model: string | null;
  platform: string;
  status: string;
  location: string | null;
};

type Mode = 'person' | 'location' | 'both';

export default function AssignPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [assetTagFromUrl, setAssetTagFromUrl] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('person');
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1) Read ?asset_tag= from the URL (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('asset_tag');
    setAssetTagFromUrl(tag);
  }, []);

  // 2) Load profile + device once we have the asset_tag
  useEffect(() => {
    if (!assetTagFromUrl) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // Get profile / org_id
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

      // Load device by org + asset_tag
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, org_id, asset_tag, serial_number, model, platform, status, location'
        )
        .eq('org_id', profileData.org_id)
        .eq('asset_tag', assetTagFromUrl)
        .maybeSingle<Device>();

      if (deviceError || !deviceData) {
        console.error('Device load error:', deviceError);
        setError(
          `We couldn’t find a device with asset tag "${assetTagFromUrl}".`
        );
        setDevice(null);
        setLoading(false);
        return;
      }

      setDevice(deviceData);
      setLocation(deviceData.location ?? '');
      setLoading(false);
    }

    load();
  }, [assetTagFromUrl, router]);

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

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setSuccess(false);

  if (!device || !profile) {
    setError('No device or organization found for this assignment.');
    return;
  }

  // Basic validation: require something depending on mode
  if (mode === 'person' && (!assigneeName || !assigneeEmail)) {
    setError(
      'Please provide both assignee name and email, or switch mode to "Location only".'
    );
    return;
  }

  if (mode === 'location' && !location) {
    setError('Please provide a location, or switch mode to "Person".');
    return;
  }

  if (mode === 'both' && (!assigneeName || !assigneeEmail || !location)) {
    setError(
      'For "Person + location", please fill in both the person fields and a location.'
    );
    return;
  }

  setSubmitting(true);

  try {
    const updates: Partial<Device> = {};
    const nowIso = new Date().toISOString();

    // 0) Close any existing active assignment for this device
    const { data: currentRows, error: currentError } = await supabase
      .from('device_assignments')
      .select('id, device_id, returned_at')
      .eq('device_id', device.id)
      .is('returned_at', null)
      .limit(1);

    if (currentError) {
      console.error('Failed to load current assignment:', currentError);
      setError('Failed to load current assignment.');
      return;
    }

    const current = currentRows?.[0] ?? null;

    if (current) {
      const { error: closeError } = await supabase
        .from('device_assignments')
        .update({ returned_at: nowIso })
        .eq('id', current.id);

      if (closeError) {
        console.error('Failed to close existing assignment:', closeError);
        setError('Failed to update existing assignment.');
        return;
      }
    }

    // Status logic
    if (mode === 'person' || mode === 'both') {
      updates.status = 'assigned';
    } else if (mode === 'location') {
      // Device is placed somewhere but not tied to a person
      if (device.status === 'assigned') {
        updates.status = 'active';
      }
    }

    // Location logic
    if (mode === 'location' || mode === 'both') {
      updates.location = location || null;
    }

    // Common fields for any assignment history row
    const baseAssignment = {
      org_id: device.org_id, // ✅ include org_id for multi-tenant safety
      device_id: device.id,
      assigned_at: nowIso,
      returned_at: null,
    };

    // 1) If assigning to a person, insert into device_assignments
    if (mode === 'person' || mode === 'both') {
      const { error: assignError } = await supabase
        .from('device_assignments')
        .insert([
          {
            ...baseAssignment,
            assignee_name: assigneeName,
            assignee_email: assigneeEmail,
            notes:
              mode === 'both' && location
                ? `Assigned with location: ${location}`
                : null,
          },
        ]);

      if (assignError) {
        console.error('Assignment insert error (person):', assignError);
        setError(assignError.message ?? 'Failed to save assignment.');
        return;
      }
    }

    // 2) If assigning only to a location, also log a history row
    if (mode === 'location' && location) {
      const { error: locationAssignError } = await supabase
        .from('device_assignments')
        .insert([
          {
            ...baseAssignment,
            assignee_name: location, // stored so it shows up in history
            assignee_email: null,
            notes: 'Location assignment',
          },
        ]);

      if (locationAssignError) {
        console.error(
          'Assignment insert error (location-only):',
          locationAssignError
        );
        setError(locationAssignError.message ?? 'Failed to save assignment.');
        return;
      }
    }

    // 3) Update device row if we have any changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', device.id);

      if (updateError) {
        console.error('Device update error:', updateError);
        setError(updateError.message ?? 'Failed to update device.');
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => router.push(`/devices/${device.id}`), 1200);
  } catch (err: any) {
    console.error('handleSubmit error:', err);
    if (err && typeof err === 'object' && 'message' in err) {
      setError((err as any).message ?? 'Failed to save assignment.');
    } else {
      setError('Failed to save assignment.');
    }
  } finally {
    setSubmitting(false);
  }
}


  const label = device
    ? device.asset_tag ?? assetTagFromUrl ?? 'Device'
    : assetTagFromUrl ?? 'Device';

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading assignment…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching device details and workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!assetTagFromUrl) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Missing asset tag</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              This page expects a URL like <code>?asset_tag=PG-CH-001</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/devices')}
            >
              ← Back to devices
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error && !device) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Device not found</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/devices')}
            >
              ← Back to devices
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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() =>
                device
                  ? router.push(`/devices/${device.id}`)
                  : router.push('/devices')
              }
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to device
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Assign {label}
            </h1>
            <p className="text-xs text-slate-400">
              You can assign this Chromebook to a person, a location, or both.
            </p>
          </div>
          {device && (
            <Badge variant="outline" className="text-xs capitalize">
              {device.status}
            </Badge>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assignment details</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Decide whether you&apos;re tracking who has it, where it lives, or
              both.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300">
                  Assignment mode
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMode('person')}
                    className={`rounded-full px-3 py-1 border transition-colors ${
                      mode === 'person'
                        ? 'border-[#3578E5] bg-[#3578E5]/20 text-[#d2e3ff]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Person only
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('location')}
                    className={`rounded-full px-3 py-1 border transition-colors ${
                      mode === 'location'
                        ? 'border-[#3578E5] bg-[#3578E5]/20 text-[#d2e3ff]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Location only
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('both')}
                    className={`rounded-full px-3 py-1 border transition-colors ${
                      mode === 'both'
                        ? 'border-[#3578E5] bg-[#3578E5]/20 text-[#d2e3ff]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Person + location
                  </button>
                </div>
              </div>

              {/* Person fields */}
              {(mode === 'person' || mode === 'both') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Assignee name
                    </label>
                    <input
                      type="text"
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Assignee email
                    </label>
                    <input
                      type="email"
                      value={assigneeEmail}
                      onChange={(e) => setAssigneeEmail(e.target.value)}
                      placeholder="jane.smith@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                    />
                    <p className="text-[11px] text-slate-500">
                      Used later for reminder emails and reports.
                    </p>
                  </div>
                </div>
              )}

              {/* Location field */}
              {(mode === 'location' || mode === 'both') && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Room 120 · Chromebook cart"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Where this device lives day-to-day (e.g. lab, classroom,
                    cart).
                  </p>
                </div>
              )}

              {/* Messages */}
              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                  Assignment saved. Redirecting back to the device…
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    device
                      ? router.push(`/devices/${device.id}`)
                      : router.push('/devices')
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {submitting ? 'Saving…' : 'Save assignment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
