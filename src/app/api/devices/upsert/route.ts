import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Shape we expect from the client
type IncomingRow = {
  org_id: string;
  asset_tag: string;
  serial_number?: string | null;
  model?: string | null;
  platform?: string | null;
  warranty_until?: string | null;
  status?: string | null;
  location?: string | null;
  metadata?: Record<string, any> | null;
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

    const incoming = body as IncomingRow[];

    // Filter invalid rows + normalize
    const cleaned = incoming
      .filter((r) => r && r.org_id && r.asset_tag)
      .map((r) => ({
        org_id: r.org_id,
        asset_tag: r.asset_tag.trim(),
        serial_number: r.serial_number ?? null,
        model: r.model ?? null,
        platform: r.platform ?? 'other',
        status: r.status ?? 'active',
        warranty_until: r.warranty_until ?? null,
        location: r.location ?? null,
        metadata: r.metadata ?? null,
      }));

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows with org_id + asset_tag.' },
        { status: 400 }
      );
    }

    // 🔑 De-duplicate by (org_id, asset_tag) to avoid the
    // "ON CONFLICT DO UPDATE command cannot affect row a second time" error
    const map = new Map<string, (typeof cleaned)[number]>();
    for (const row of cleaned) {
      map.set(`${row.org_id}::${row.asset_tag}`, row);
    }
    const deduped = Array.from(map.values());

    const { data, error } = await supabase
      .from('devices')
      .upsert(deduped, {
        onConflict: 'org_id,asset_tag',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      rowsReceived: incoming.length,
      rowsUpserted: deduped.length,
      rowsReturned: data?.length ?? 0,
    });
  } catch (err: any) {
    console.error('Upsert handler exception:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
