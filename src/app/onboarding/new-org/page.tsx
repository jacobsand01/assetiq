'use client';

import { FormEvent, useEffect, useState } from 'react';
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

export default function NewOrgOnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [staleDays, setStaleDays] = useState('30');
  const [fullName, setFullName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) On mount: ensure user is logged in and check if they already have an org
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      // Pre-fill full name from auth metadata if available
      const metaName =
        (user.user_metadata && (user.user_metadata.full_name as string)) || '';
      if (metaName) {
        setFullName(metaName);
      }

      // Do they already have a profile/org?
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id, full_name')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError) {
        console.error('Profile check error:', profileError);
      }

      if (profile && profile.org_id) {
        // Already onboarded → go to dashboard
        router.replace('/dashboard');
        return;
      }

      setCheckingExisting(false);
      setLoading(false);
    }

    init();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const thresholdValue = Number.parseInt(staleDays || '30', 10);
      const safeThreshold = Number.isNaN(thresholdValue)
        ? 30
        : Math.max(1, thresholdValue);

      // 1) Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: orgName,
            domain: domain || null,
            threshold: safeThreshold,
          },
        ])
        .select('id')
        .single();

      if (orgError || !org) {
        throw orgError ?? new Error('Failed to create organization');
      }

      // 2) Create profile for this user, linked to org
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          org_id: org.id,
          full_name: fullName || null,
          role: 'owner',
        },
      ]);

      if (profileError) {
        throw profileError;
      }

      // All set → go to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || checkingExisting) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading your workspace…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Checking your account and existing organizations.
            </CardDescription>
          </CardHeader>
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
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              Welcome to AssetIQ
            </span>
            <p className="text-[11px] text-slate-500">
              Let&apos;s set up your first workspace so you can get out of
              spreadsheet hell.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Onboarding
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create your workspace</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              This is usually your school or company name. You can change
              details later in Settings.
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
                  placeholder="Example School District"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
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
                  Used later for auto-matching users to your workspace.
                </p>
              </div>

              {/* Full name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Your name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  We&apos;ll show this on your profile for later multi-user
                  workspaces.
                </p>
              </div>

              {/* Stale days threshold */}
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
                  Devices that haven&apos;t checked in for longer than this will
                  show up as &quot;stale&quot; on your dashboard.
                </p>
              </div>

              {/* Errors */}
              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end items-center pt-2 gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {submitting ? 'Creating workspace…' : 'Create workspace'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
