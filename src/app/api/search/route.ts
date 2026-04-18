import { NextResponse } from 'next/server';
import { searchSuggestions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(Number(searchParams.get('limit') || 8), 20);
  const hits = searchSuggestions(q, limit);
  return NextResponse.json({ query: q, hits });
}
