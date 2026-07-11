import { NextResponse } from 'next/server';
import { runCouncilReview } from '@/lib/agents/pipeline';

export const maxDuration = 120;

export async function POST() {
  const result = await runCouncilReview();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
