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
import { Badge } from '@/components/ui/badge';

type Profile = {
  id: string;
  org_id: string;
  full_name: string | null;
};

type Organization = {
  id: string;
  name: string;
  domain: string | null;
  threshold: number | null;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);

  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [staleDays, setStaleDays] = useState('30');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current user, profile, and org
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

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

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, domain, threshold')
        .eq('id', profileData.org_id)
        .maybeSingle<Organization>();

      if (orgError || !orgData) {
        console.error('Org load error:', orgError);
        setError('Could not load organization settings.');
        setLoading(false);
        return;
      }

      setOrg(orgData);

      setOrgName(orgData.name);
      setDomain(orgData.domain ?? '');
      setStaleDays(
        (orgData.threshold ?? 30).toString()
      );

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!org) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const parsed = Number.parseInt(staleDays || '30', 10);
      const safeThreshold = Number.isNaN(parsed)
        ? 30
        : Math.max(1, parsed);

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          domain: domain || null,
          threshold: safeThreshold,
        })
        .eq('id', org.id);

      if (updateError) {
        console.error(updateError);
        throw new Error(updateError.message ?? 'Failed to save settings.');
      }

      setOrg((prev) =>
        prev
          ? {
              ...prev,
              name: orgName,
              domain: domain || null,
              threshold: safeThreshold,
            }
          : prev
      );

      setSuccess('Settings saved. Dashboard and reminders will use the new threshold.');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading settings…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching your organization configuration.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error && !org) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Settings unavailable</CardTitle>
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Workspace settings
            </h1>
            <p className="text-xs text-slate-400">
              Organization details and device health thresholds for this workspace.
            </p>
          </div>

          {profile && (
            <Badge variant="outline" className="text-[11px]">
              {profile.full_name ?? 'You'}
            </Badge>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 md:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Organization</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              These settings apply to all devices and reminders in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Org name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Organization name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Shown in the UI and in future emails.
                </p>
              </div>

              {/* Domain */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Email domain (optional)
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="school.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Used in the future for auto-joining users and smarter offboarding.
                </p>
              </div>

              {/* Stale threshold */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Stale device threshold (days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={staleDays}
                  onChange={(e) => setStaleDays(e.target.value)}
                  className="w-32 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Devices that haven&apos;t checked in for longer than this will be
                  marked as &quot;stale&quot; on the dashboard and included in
                  reminder jobs.
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
                  {success}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end items-center pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {saving ? 'Saving…' : 'Save settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
