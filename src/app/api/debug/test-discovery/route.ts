import { NextResponse } from 'next/server';
import { discoverLinks } from '@/engine/discovery';

export async function POST(request: Request) {
  // Restrict to development or require secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('Authorization');

  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { sourceUrl, linkSelector, urlPattern } = body;

    if (!sourceUrl || !linkSelector || !urlPattern) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const urls = await discoverLinks(sourceUrl, linkSelector, urlPattern);
    return NextResponse.json({ urls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
