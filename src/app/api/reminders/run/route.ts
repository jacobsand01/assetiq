import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is set, allow all (useful for local dev)
  if (!secret) return true;

  const authHeader =
    req.headers.get('authorization') ?? req.headers.get('Authorization');

  return authHeader === `Bearer ${secret}`;
}

async function runReminderJob() {
  // 1) Load all orgs with thresholds
  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, threshold');

  if (orgErr) throw orgErr;

  let staleReminders = 0;
  let offboardingReminders = 0;

  for (const org of orgs ?? []) {
    const threshold = org.threshold ?? 30;
    const now = new Date();
    const cutoff = new Date(now.getTime() - threshold * 24 * 60 * 60 * 1000);
    const cutoffIso = cutoff.toISOString();

    // 2) Find stale devices: last_seen_at null OR older than threshold
    const { data: staleDevices, error: staleErr } = await supabase
      .from('devices')
      .select('id, org_id, asset_tag, last_seen_at')
      .eq('org_id', org.id)
      .or(`last_seen_at.is.null,last_seen_at.lt.${cutoffIso}`);

    if (staleErr) throw staleErr;

    for (const d of staleDevices ?? []) {
      const msg = `[MOCK EMAIL] [STALE] Device ${
        d.asset_tag ?? d.id
      } is stale (last seen ${d.last_seen_at ?? 'never'}).`;
      console.log(msg);

      await supabase.from('reminders').insert([
        {
          org_id: d.org_id,
          device_id: d.id,
          user_email: 'it@example.com', // TODO: later target real owner/manager
          type: 'stale_device',
          status: 'sent',
          scheduled_for: now.toISOString(),
          sent_at: now.toISOString(),
        },
      ]);

      staleReminders++;
    }

    // 3) Open offboarding events with devices not returned
    const { data: events, error: evErr } = await supabase
      .from('offboarding_events')
      .select('id, org_id, user_email, devices_returned, reminders_sent')
      .eq('org_id', org.id)
      .eq('status', 'open')
      .eq('devices_returned', false);

    if (evErr) throw evErr;

    for (const e of events ?? []) {
      const msg = `[MOCK EMAIL] [OFFBOARDING] Reminder for ${e.user_email}.`;
      console.log(msg);

      await supabase
        .from('offboarding_events')
        .update({
          reminders_sent: (e.reminders_sent ?? 0) + 1,
          notes: `Reminder sent at ${now.toISOString()}`,
        })
        .eq('id', e.id);

      await supabase.from('reminders').insert([
        {
          org_id: e.org_id,
          user_email: e.user_email,
          type: 'offboarding_device',
          status: 'sent',
          scheduled_for: now.toISOString(),
          sent_at: now.toISOString(),
        },
      ]);

      offboardingReminders++;
    }
  }

  return NextResponse.json({
    success: true,
    staleReminders,
    offboardingReminders,
    total: staleReminders + offboardingReminders,
  });
}

// Vercel Cron can call GET or POST; both reuse the same job.

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    return await runReminderJob();
  } catch (err: any) {
    console.error('Reminder job error (GET):', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    return await runReminderJob();
  } catch (err: any) {
    console.error('Reminder job error (POST):', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
