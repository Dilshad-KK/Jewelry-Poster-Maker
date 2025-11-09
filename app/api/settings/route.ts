import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

type SettingsPayload = {
  theme?: 'classic' | 'overlay';
  primaryColor?: string | null;
  accentColor?: string | null;
  bgColor?: string | null;
};

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ settings: null });
  }
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('theme, primary_color, accent_color, bg_color')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    // If table missing, fallback to defaults without failing
    return NextResponse.json({ settings: null });
  }

  return NextResponse.json({
    settings: data
      ? {
          theme: (data.theme as 'classic' | 'overlay') || 'classic',
          primaryColor: data.primary_color || null,
          accentColor: data.accent_color || null,
          bgColor: (data as any).bg_color || null,
        }
      : null,
  });
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let body: SettingsPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const row = {
    id: 'default',
    theme: body.theme || 'classic',
    primary_color: body.primaryColor ?? null,
    accent_color: body.accentColor ?? null,
    bg_color: body.bgColor ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .upsert(row, { onConflict: 'id' })
    .select('theme, primary_color, accent_color, bg_color')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    settings: data
      ? {
          theme: (data.theme as 'classic' | 'overlay') || 'classic',
          primaryColor: data.primary_color || null,
          accentColor: data.accent_color || null,
          bgColor: (data as any).bg_color || null,
        }
      : null,
  });
}
