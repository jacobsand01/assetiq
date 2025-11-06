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

type ReminderPlan = 'default' | 'none';

export default function NewOffboardingPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [leaverName, setLeaverName] = useState('');
  const [leaverEmail, setLeaverEmail] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [devicesExpected, setDevicesExpected] = useState('');
  const [notes, setNotes] = useState('');

  const [dueDate, setDueDate] = useState(''); // yyyy-mm-dd from <input type="date" />
  const [reminderPlan, setReminderPlan] = useState<ReminderPlan>('default');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current user + profile/org
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

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id, full_name')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !data) {
        console.error('Profile load error:', profileError);
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

    if (!leaverName.trim() || !leaverEmail.trim()) {
      setError('Please fill in the leaver’s name and email.');
      return;
    }

    if (!dueDate) {
      setError('Please choose when the devices are due back.');
      return;
    }

    setSubmitting(true);

    try {
      // Turn yyyy-mm-dd into a Date for next_reminder_at (midnight UTC)
      const dueDateIso = new Date(`${dueDate}T00:00:00Z`).toISOString();

      const { error: insertError } = await supabase
        .from('offboarding_events')
        .insert([
          {
            org_id: profile.org_id,
            user_email: leaverEmail.trim(),
            user_name: leaverName.trim(),
            status: 'open',

            manager_email: managerEmail.trim() || null,
            devices_expected: devicesExpected.trim() || null,
            devices_due_date: dueDate, // date column
            reminder_plan: reminderPlan, // 'default' or 'none'
            next_reminder_at:
              reminderPlan === 'default' ? dueDateIso : null, // first email on due date

            notes: notes.trim() || null,
          },
        ]);

      if (insertError) {
        console.error('Offboarding insert error:', insertError);
        throw new Error(
          insertError.message ??
            'Failed to create offboarding event in Supabase.'
        );
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/offboarding');
      }, 1200);
    } catch (err: any) {
      console.error('Offboarding create exception:', err);
      setError(err?.message ?? 'Failed to create offboarding event');
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
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              New offboarding
            </h1>
            <p className="text-xs text-slate-400">
              Track leavers and the devices they&apos;re supposed to return.
            </p>
          </div>

          <Badge variant="outline" className="text-xs">
            Offboarding workflow
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Leaver details</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Create an offboarding record so AssetIQ can nag managers until all
              devices are back.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leaver name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Leaver name
                </label>
                <input
                  type="text"
                  required
                  value={leaverName}
                  onChange={(e) => setLeaverName(e.target.value)}
                  placeholder="Alex Teacher"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
              </div>

              {/* Leaver email */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Leaver email
                </label>
                <input
                  type="email"
                  required
                  value={leaverEmail}
                  onChange={(e) => setLeaverEmail(e.target.value)}
                  placeholder="alex.teacher@school.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Used for tracking who the devices belong to.
                </p>
              </div>

              {/* Manager email */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Manager / owner email
                </label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="principal@school.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  We&apos;ll use this later for escalations when devices don&apos;t
                  come back.
                </p>
              </div>

              {/* Devices due back */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Devices due back by
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  We&apos;ll use this to drive reminder emails and overdue
                  reporting.
                </p>
              </div>

              {/* Reminder behavior */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Reminder emails
                </label>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReminderPlan('default')}
                    className={`rounded-full px-3 py-1 border transition-colors ${
                      reminderPlan === 'default'
                        ? 'border-[#3578E5] bg-[#3578E5]/20 text-[#d2e3ff]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    Default: email leaver &amp; manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderPlan('none')}
                    className={`rounded-full px-3 py-1 border transition-colors ${
                      reminderPlan === 'none'
                        ? 'border-[#3578E5] bg-[#3578E5]/20 text-[#d2e3ff]'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    No automatic reminders
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  In a later phase, AssetIQ will email the leaver and manager
                  on/after the due date based on this setting.
                </p>
              </div>

              {/* Devices expected */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Devices expected back
                </label>
                <textarea
                  value={devicesExpected}
                  onChange={(e) => setDevicesExpected(e.target.value)}
                  rows={3}
                  placeholder="e.g. SKPOE2L (staff laptop), CHR-104 (Chromebook cart spare)…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5] resize-y"
                />
                <p className="text-[11px] text-slate-500">
                  You can paste a quick list now; later we&apos;ll tie this directly
                  to assets.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any context that will help you chase devices later."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5] resize-y"
                />
              </div>

              {/* Feedback messages */}
              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-xl px-3 py-2">
                  Offboarding event created. We&apos;ll keep an eye on those devices.
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 gap-2">
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
                  disabled={submitting}
                  className="bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {submitting ? 'Creating…' : 'Create offboarding'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
