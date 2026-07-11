import { NextResponse } from 'next/server';
import { runIngestPipeline } from '@/lib/agents/pipeline';

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.text || !body.uploader) {
      return NextResponse.json({ ok: false, error: 'text and uploader required' }, { status: 400 });
    }
    const result = await runIngestPipeline({
      text: body.text,
      uploader: body.uploader,
      sourceKind: body.sourceKind ?? 'manual',
      sourceName: body.sourceName ?? `upload by ${body.uploader}`,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
