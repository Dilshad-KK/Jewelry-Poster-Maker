import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

// Shape for a rate entry
type RatePayload = {
  date?: string; // ISO date (yyyy-mm-dd), defaults to today (UTC)
  perGram: number;
  perGram18k?: number | null;
  perGram9k?: number | null;
  perSovereign: number;
  imageUrl?: string | null;
  shopName?: string | null;
  shopAddress?: string | null;
};

// GET /api/rates -> latest rate + yesterday's rate (for accurate delta display)
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured (missing SUPABASE envs)' }, { status: 500 });
  }

  const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", Pragma: "no-cache", Expires: "0" };

  // Fetch today's (latest) rate
  const { data: latestData, error: latestErr } = await supabaseAdmin
    .from('rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    return NextResponse.json({ error: latestErr.message }, { status: 500, headers: noStore });
  }

  // Compute yesterday relative to the latest rate's date (not server clock),
  // so comparison is always "the day before the displayed rate"
  let previousRate = null;
  if (latestData?.date) {
    const latestDate = new Date(latestData.date);
    latestDate.setUTCDate(latestDate.getUTCDate() - 1);
    const yesterday = latestDate.toISOString().slice(0, 10);

    const { data: prevData } = await supabaseAdmin
      .from('rates')
      .select('*')
      .eq('date', yesterday)
      .maybeSingle();

    previousRate = prevData ?? null;
  }

  return NextResponse.json(
    { rate: latestData ?? null, previousRate },
    { headers: noStore }
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

  if (body.perGram9k !== undefined) {
    row.per_gram_9k = body.perGram9k;
  }

  let { data, error } = await supabaseAdmin
    .from('rates')
    .upsert(row, { onConflict: 'date' })
    .select()
    .maybeSingle();

  // Backward-compat: if DB doesn't have the new columns yet, retry without them.
  if (error && (error as any)?.message?.includes('per_gram_18k')) {
    const { per_gram_18k: _ignored, ...fallbackRow } = row;
    ({ data, error } = await supabaseAdmin
      .from('rates')
      .upsert(fallbackRow, { onConflict: 'date' })
      .select()
      .maybeSingle());
  }

  if (error && (error as any)?.message?.includes('per_gram_9k')) {
    const { per_gram_9k: _ignored9k, ...fallbackRow9k } = row;
    ({ data, error } = await supabaseAdmin
      .from('rates')
      .upsert(fallbackRow9k, { onConflict: 'date' })
      .select()
      .maybeSingle());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rate: data });
}
