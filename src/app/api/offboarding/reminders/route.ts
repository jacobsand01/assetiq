// src/app/api/offboarding/reminders/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    const now = new Date();

    // Fetch all open offboarding events that haven’t returned devices
    const { data: events, error } = await supabase
      .from('offboarding_events')
      .select('*')
      .eq('status', 'open')
      .eq('devices_returned', false);

    if (error) throw error;

    // For simplicity, we’ll just increment reminders_sent
    for (const e of events ?? []) {
      await supabase
        .from('offboarding_events')
        .update({
          reminders_sent: (e.reminders_sent ?? 0) + 1,
          notes: `Reminder sent on ${now.toISOString()}`,
        })
        .eq('id', e.id);
    }

    return NextResponse.json({
      success: true,
      reminders_sent: events?.length ?? 0,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
