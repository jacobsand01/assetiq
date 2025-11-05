'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  model: string | null;
  platform: string;
  status: string;
  location: string | null;
};

type Profile = {
  id: string;
  org_id: string;
};

type Mode = 'person' | 'location';

export default function AssignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetTagFromUrl = searchParams.get('asset_tag') || '';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>('person');

  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [location, setLocation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load profile + device
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // 1) Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // 2) Profile / org
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !profileData) {
        console.error('Profile load error:', profileError);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(profileData);

      if (!assetTagFromUrl) {
        setError('Missing asset_tag in URL.');
        setLoading(false);
        return;
      }

      // 3) Device by asset_tag + org
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, org_id, asset_tag, model, platform, status, location'
        )
        .eq('org_id', profileData.org_id)
        .eq('asset_tag', assetTagFromUrl)
        .maybeSingle<Device>();

      if (deviceError || !deviceData) {
        console.error('Device lookup error:', deviceError);
        setError(
          `Could not find a device with asset tag "${assetTagFromUrl}" in your organization.`
        );
        setLoading(false);
        return;
      }

      setDevice(deviceData);
      setLocation(deviceData.location ?? '');
      setLoading(false);
    }

    load();
  }, [router, assetTagFromUrl]);

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
    if (!device || !profile) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const nowIso = new Date().toISOString();

      if (mode === 'person') {
        // Basic validation
        if (!assigneeName.trim() || !assigneeEmail.trim()) {
          throw new Error('Please provide both assignee name and email.');
        }

        // 1) Insert assignment row
        const { error: insertError } = await supabase
          .from('device_assignments')
          .insert([
            {
              device_id: device.id,
              org_id: device.org_id,
              assignee_name: assigneeName.trim(),
              assignee_email: assigneeEmail.trim(),
              assigned_at: nowIso,
              returned_at: null,
            },
          ]);

        if (insertError) throw insertError;

        // 2) Update device status (and optional location if provided)
        const { error: updateError } = await supabase
          .from('devices')
          .update({
            status: 'assigned',
            location: location.trim() || device.location,
          })
          .eq('id', device.id);

        if (updateError) throw updateError;
      } else {
        // mode === 'location'
        if (!location.trim()) {
          throw new Error('Please enter a location to assign this device to.');
        }

        const { error: updateError } = await supabase
          .from('devices')
          .update({
            status: 'assigned',
            location: location.trim(),
          })
          .eq('id', device.id);

        if (updateError) throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/devices/${device.id}`);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to update device assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Checking your account and looking up the device.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !device) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Assign device</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              {error ?? 'We could not find the device you were trying to assign.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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

const label = (device.asset_tag ?? assetTagFromUrl) || 'Device';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push(device ? `/devices/${device.id}` : '/devices')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to device
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Assign {label}
            </h1>
            <p className="text-xs text-slate-400">
              Assign this device either to a person or directly to a room / location.
            </p>
          </div>

          <Badge variant="outline" className="text-[10px] border-slate-700">
            {formatPlatform(device.platform)} · {device.status}
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Device summary */}
        <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Device summary</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Quick context before you assign.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Asset tag</span>
                <span className="font-medium">{device.asset_tag ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Model</span>
                <span className="font-medium">{device.model ?? '—'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Platform</span>
                <span className="font-medium">
                  {formatPlatform(device.platform)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Current location</span>
                <span className="font-medium">{device.location ?? '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assign form */}
        <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Who or where gets this?</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              You can either track this against a person (for history) or just pin it to a room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mode toggle */}
            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/60 p-1 text-xs mb-4">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === 'person'
                    ? 'bg-[#3578E5] text-white'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
                onClick={() => setMode('person')}
              >
                Assign to person
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === 'location'
                    ? 'bg-[#3578E5] text-white'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
                onClick={() => setMode('location')}
              >
                Assign to location
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'person' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Assignee name
                    </label>
                    <input
                      type="text"
                      required
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
                      required
                      value={assigneeEmail}
                      onChange={(e) => setAssigneeEmail(e.target.value)}
                      placeholder="jane.smith@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                    />
                    <p className="text-[11px] text-slate-500">
                      This will show up in assignment history and offboarding flows.
                    </p>
                  </div>
                </>
              )}

              {/* Location field is shared: optional in person mode, required in location mode */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Location {mode === 'location' && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 120, Chromebook cart A"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  For carts or lab sets, assign to the room instead of a person.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                  Assignment updated.
                </p>
              )}

              <div className="flex justify-between items-center pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/devices/${device.id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {submitting
                    ? 'Saving…'
                    : mode === 'person'
                    ? 'Assign to person'
                    : 'Assign to location'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
