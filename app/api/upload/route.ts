import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

// POST multipart/form-data with a `file` field
// Optional fields: `folder` (default ''), `filename` (default preserve original)
export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured (missing SUPABASE envs)' }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const folder = (form.get('folder') as string) || '';
  const desiredName = (form.get('filename') as string) || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const origName = desiredName || file.name || 'upload';
  const safeName = origName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const stamp = Date.now();
  const uniqueName = `${stamp}-${safeName}`;
  const path = folder ? `${folder.replace(/\/$/, '')}/${uniqueName}` : uniqueName;

  const bucket = 'uploads';

  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
    upsert: false,
    cacheControl: '3600',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attempt to build a public URL (works if bucket is public)
  const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    path: data?.path ?? path,
    publicUrl: pub?.publicUrl ?? null,
    bucket,
  });
}
