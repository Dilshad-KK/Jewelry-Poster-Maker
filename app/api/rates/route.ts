import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminAuthorized } from '@/lib/auth';

export const runtime = 'nodejs';

// Shape for a rate entry
type RatePayload = {
  date?: string; // ISO date (yyyy-mm-dd), defaults to today (UTC)
  perGram: number;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rate: data ?? null });
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
  const row = {
    date: body.date ?? today,
    per_gram: body.perGram,
    per_sovereign: body.perSovereign,
    image_url: body.imageUrl ?? null,
    shop_name: body.shopName ?? null,
    shop_address: body.shopAddress ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from('rates')
    .upsert(row, { onConflict: 'date' })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rate: data });
}
