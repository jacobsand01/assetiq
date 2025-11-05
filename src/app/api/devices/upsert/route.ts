import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

type IncomingRow = {
  org_id: string;
  asset_tag: string;
  serial_number?: string | null;
  model?: string | null;
  platform?: string | null;
  warranty_until?: string | null;
  status?: string | null;
  last_seen_at?: string | null;
  location?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Expected an array of rows.' },
        { status: 400 }
      );
    }

    const incoming = body as IncomingRow[];

    if (incoming.length === 0) {
      return NextResponse.json({
        success: true,
        rowsReceived: 0,
        rowsUpserted: 0,
      });
    }

    // Normalize + validate each row
    const normalized = incoming.map((row, index) => {
      if (!row.org_id) {
        throw new Error(`Row ${index} is missing org_id.`);
      }
      if (!row.asset_tag || !row.asset_tag.trim()) {
        throw new Error(`Row ${index} is missing asset_tag.`);
      }

      const platformRaw = (row.platform ?? 'other').toLowerCase();
      const statusRaw = (row.status ?? 'active').toLowerCase();

      const platformAllowed = ['chromebook', 'windows', 'mac', 'ipad', 'other'];
      const statusAllowed = ['active', 'assigned', 'retired', 'lost', 'repair'];

      const platform = platformAllowed.includes(platformRaw)
        ? platformRaw
        : 'other';

      const status = statusAllowed.includes(statusRaw)
        ? statusRaw
        : 'active';

      return {
        org_id: row.org_id,
        asset_tag: row.asset_tag.trim(),
        serial_number: row.serial_number ?? null,
        model: row.model ?? null,
        platform,
        status,
        warranty_until: row.warranty_until ?? null,
        last_seen_at: row.last_seen_at ?? null,
        location: row.location ?? null,
      };
    });

    // Dedupe by org_id + asset_tag so Postgres doesn't complain
    const byKey = new Map<string, (typeof normalized)[number]>();
    for (const row of normalized) {
      const key = `${row.org_id}::${row.asset_tag}`;
      byKey.set(key, row);
    }
    const deduped = Array.from(byKey.values());

    const { error } = await supabase
      .from('devices')
      .upsert(deduped, {
        onConflict: 'org_id,asset_tag',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ No more data?.length — just report what we actually sent
    return NextResponse.json({
      success: true,
      rowsReceived: incoming.length,
      rowsUpserted: deduped.length,
    });
  } catch (err: any) {
    console.error('Upsert handler exception:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error during import.' },
      { status: 500 }
    );
  }
}
