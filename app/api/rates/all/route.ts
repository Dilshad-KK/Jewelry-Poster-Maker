import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// GET /api/rates/all -> all rates, newest first
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Server not configured (missing SUPABASE envs)' },
      { status: 500, headers: noStoreHeaders }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('rates')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }

  return NextResponse.json({ rates: data ?? [] }, { headers: noStoreHeaders });
}
