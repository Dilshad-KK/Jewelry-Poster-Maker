import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// POST /api/rates/ensure-today
// Creates today's rate by copying the latest row if today's does not exist
export async function POST() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server not configured (missing SUPABASE envs)' }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd (UTC)

  // Get the latest rate
  const { data: latest, error: latestErr } = await supabaseAdmin
    .from('rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    return NextResponse.json({ error: latestErr.message }, { status: 500 });
  }

  if (!latest) {
    // Nothing to copy — no-op
    return NextResponse.json({ created: false, reason: 'no-latest' });
  }

  if (latest.date === today) {
    return NextResponse.json({ created: false, latestIsToday: true, date: today });
  }

  // Copy fields from latest into a new row for today
  const row = {
    date: today,
    per_gram: latest.per_gram,
    per_sovereign: latest.per_sovereign,
    image_url: latest.image_url ?? null,
    shop_name: latest.shop_name ?? null,
    shop_address: latest.shop_address ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from('rates')
    .upsert(row, { onConflict: 'date' })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ created: true, rate: data });
}

