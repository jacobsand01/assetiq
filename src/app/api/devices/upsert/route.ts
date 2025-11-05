import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

type DeviceInput = {
  asset_tag: string;
  serial_number?: string | null;
  model?: string | null;
  platform?: string | null;
  warranty_until?: string | null;
  status?: string | null;
  org_id: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: 'Request body must be a non-empty array.' },
        { status: 400 }
      );
    }

    const devices: DeviceInput[] = body.map((d: any) => ({
      asset_tag: String(d.asset_tag ?? '').trim(),
      serial_number: d.serial_number ?? null,
      model: d.model ?? null,
      platform: (d.platform ?? 'other').toLowerCase(),
      warranty_until: d.warranty_until ?? null,
      status: d.status ?? 'active',
      org_id: String(d.org_id),
    }));

    // Basic validation
    if (devices.some((d) => !d.asset_tag || !d.org_id)) {
      return NextResponse.json(
        { error: 'Each device must have asset_tag and org_id.' },
        { status: 400 }
      );
    }

    // IMPORTANT: matches the unique index (org_id, asset_tag)
    const { data, error } = await supabase
      .from('devices')
      .upsert(devices, {
        onConflict: 'org_id,asset_tag',
        ignoreDuplicates: false,
      })
      .select('*');

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message ?? 'Failed to upsert devices' },
        { status: 500 }
      );
    }

    const total = data?.length ?? 0;

    return NextResponse.json({
      success: true,
      total,
      message: `Upserted ${total} device${total === 1 ? '' : 's'}`,
    });
  } catch (err: any) {
    console.error('Upsert route error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
