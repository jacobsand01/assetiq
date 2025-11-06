// src/app/api/fake-sync/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fake sync endpoint:
 * - Inserts ~5 mock devices for the given org
 * - Assigns some of them to fake users via device_assignments
 * - Marks status = 'assigned' to make the dashboard look alive
 *
 * Called from /integrations with { orgId } in the body.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId as string | undefined;

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required in request body.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const warrantyDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    const mockDevices = [
      {
        asset_tag: 'GA-CH-001',
        serial_number: 'MOCK-GA-CH-001',
        model: 'Chromebook (Google Admin mock)',
        platform: 'chromebook',
        status: 'assigned',
        last_seen_at: now.toISOString(),
        warranty_until: warrantyDate,
        location: 'Lab 101',
      },
      {
        asset_tag: 'GA-CH-002',
        serial_number: 'MOCK-GA-CH-002',
        model: 'Chromebook (Google Admin mock)',
        platform: 'chromebook',
        status: 'assigned',
        last_seen_at: now.toISOString(),
        warranty_until: warrantyDate,
        location: 'Lab 102',
      },
      {
        asset_tag: 'GA-CH-003',
        serial_number: 'MOCK-GA-CH-003',
        model: 'Chromebook (Google Admin mock)',
        platform: 'chromebook',
        status: 'assigned',
        last_seen_at: now.toISOString(),
        warranty_until: warrantyDate,
        location: 'Library cart',
      },
      {
        asset_tag: 'GA-WIN-001',
        serial_number: 'MOCK-GA-WIN-001',
        model: 'Windows Laptop (Google Admin mock)',
        platform: 'windows',
        status: 'assigned',
        last_seen_at: now.toISOString(),
        warranty_until: warrantyDate,
        location: 'Office 201',
      },
      {
        asset_tag: 'GA-MAC-001',
        serial_number: 'MOCK-GA-MAC-001',
        model: 'MacBook (Google Admin mock)',
        platform: 'mac',
        status: 'assigned',
        last_seen_at: now.toISOString(),
        warranty_until: warrantyDate,
        location: 'Media center',
      },
    ];

    // Insert devices with org_id
    const { data: inserted, error: insertError } = await supabase
      .from('devices')
      .insert(
        mockDevices.map((d) => ({
          org_id: orgId,
          ...d,
        }))
      )
      .select('id, asset_tag');

    if (insertError) {
      console.error('Fake sync insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message ?? 'Failed to insert mock devices.' },
        { status: 500 }
      );
    }

    const devices = inserted ?? [];
    const devicesInserted = devices.length;

    // Create mock assignments for first 3 devices
    const mockAssignees = [
      { name: 'Alex Teacher', email: 'alex.teacher@example.org' },
      { name: 'Jamie Staff', email: 'jamie.staff@example.org' },
      { name: 'Riley Librarian', email: 'riley.librarian@example.org' },
    ];

    const assignmentsPayload = devices.slice(0, 3).map((dev, idx) => {
      const assignee = mockAssignees[idx] ?? mockAssignees[0];
      return {
        org_id: orgId,
        device_id: dev.id,
        assignee_name: assignee.name,
        assignee_email: assignee.email,
        assigned_at: now.toISOString(),
        returned_at: null,
        notes: 'Mock assignment from fake-sync demo.',
      };
    });

    let assignmentsInserted = 0;

    if (assignmentsPayload.length > 0) {
      const { error: assignError } = await supabase
        .from('device_assignments')
        .insert(assignmentsPayload);

      if (assignError) {
        console.error('Fake sync assignment error:', assignError);
      } else {
        assignmentsInserted = assignmentsPayload.length;
      }
    }

    return NextResponse.json({
      success: true,
      devicesInserted,
      assignmentsInserted,
      runAt: now.toISOString(),
    });
  } catch (err: any) {
    console.error('Fake sync exception:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Fake sync crashed.' },
      { status: 500 }
    );
  }
}
