import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

// Shape for a rate entry
type RatePayload = {
  date?: string; // ISO date (yyyy-mm-dd), defaults to today (UTC)
  perGram: number;
  perGram18k?: number | null;
  perSovereign: number;
  imageUrl?: string | null;
  shopName?: string | null;
  shopAddress?: string | null;
};

// GET /api/rates -> latest rate
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured (missing SUPABASE envs)' }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", Pragma: "no-cache", Expires: "0" } }
    );
  }

  return NextResponse.json(
    { rate: data ?? null },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", Pragma: "no-cache", Expires: "0" } }
  );
}

// POST /api/rates -> upsert today’s rate
export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured (missing SUPABASE envs)' }, { status: 500 });
  }

  let body: RatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  const row: Record<string, unknown> = {
    date: body.date ?? today,
    per_gram: body.perGram,
    per_sovereign: body.perSovereign,
    image_url: body.imageUrl ?? null,
    shop_name: body.shopName ?? null,
    shop_address: body.shopAddress ?? null,
  };

  if (body.perGram18k !== undefined) {
    row.per_gram_18k = body.perGram18k;
  }

  let { data, error } = await supabaseAdmin
    .from('rates')
    .upsert(row, { onConflict: 'date' })
    .select()
    .maybeSingle();

  // Backward-compat: if DB doesn't have the new column yet, retry without it.
  if (error && (error as any)?.message?.includes('per_gram_18k')) {
    const { per_gram_18k: _ignored, ...fallbackRow } = row;
    ({ data, error } = await supabaseAdmin
      .from('rates')
      .upsert(fallbackRow, { onConflict: 'date' })
      .select()
      .maybeSingle());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rate: data });
}
