// src/app/api/import-snapshot/route.ts
import { NextResponse } from 'next/server';

/**
 * Placeholder / future hook for server-side snapshot importing.
 *
 * Right now, the /imports/new page performs all CSV parsing and
 * chunked inserts directly via the Supabase client in the browser.
 *
 * If you later want to move heavy work to the server, you can:
 *  - Upload the CSV to Supabase Storage
 *  - POST { snapshotId, mapping, storagePath } to this route
 *  - Parse the CSV + insert rows here using a server Supabase client
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    // For now we just acknowledge the payload so you can test wiring.
    // You can log or inspect `body` while developing.
    console.log('[import-snapshot] Received payload:', body);

    return NextResponse.json(
      {
        ok: true,
        message:
          'import-snapshot API is currently a stub. The /imports/new page performs imports client-side.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[import-snapshot] Error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal error in import-snapshot route.' },
      { status: 500 }
    );
  }
}
