import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

// DELETE with JSON body: { publicUrl?: string, path?: string, bucket?: string }
export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let body: { publicUrl?: string; path?: string; bucket?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const bucket = body.bucket || 'uploads';
  let path = body.path || '';
  if (!path && body.publicUrl) {
    try {
      const u = new URL(body.publicUrl);
      const i = u.pathname.indexOf(`/storage/v1/object/public/${bucket}/`);
      if (i >= 0) path = u.pathname.substring(i + (`/storage/v1/object/public/${bucket}/`).length);
    } catch {}
  }
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

