import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';
import sharp from 'sharp';

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
  const base = safeName.replace(/\.[^.]+$/, '') || 'upload';

  const bucket = 'uploads';

  // Read once
  const ab = await file.arrayBuffer();
  let outBuffer: Buffer = Buffer.from(ab);
  let outContentType: string = file.type || 'application/octet-stream';
  let outExt: string = '';

  // Try to convert to PNG using sharp. If that fails, keep original bytes/type/ext.
  try {
    const converted = await sharp(Buffer.from(ab)).png({ compressionLevel: 9 }).toBuffer();
    outBuffer = converted;
    outContentType = 'image/png';
    outExt = '.png';
  } catch {
    // Determine extension from type or name
    const typeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/avif': '.avif',
      'image/heic': '.heic',
      'image/heif': '.heif',
      'image/bmp': '.bmp',
      'image/tiff': '.tif',
      'image/svg+xml': '.svg',
    };
    outExt = typeToExt[outContentType] || (safeName.match(/\.[^.]+$/)?.[0].toLowerCase() || '.bin');
  }

  const uniqueName = `${stamp}-${base}${outExt || '.png'}`;
  const path = folder ? `${folder.replace(/\/$/, '')}/${uniqueName}` : uniqueName;

  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, outBuffer, {
    upsert: false,
    cacheControl: '3600',
    contentType: outContentType,
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
