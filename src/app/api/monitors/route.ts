import { NextResponse } from 'next/server';
import { larkBase } from '@/lib/lark';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [items, baseInfo] = await Promise.all([
      larkBase.getMonitors(),
      larkBase.getBaseInfo(),
    ]);
    return NextResponse.json({ 
      items, 
      baseInfo: {
        name: baseInfo?.name || 'Lark Base',
        app_token: baseInfo?.app_token
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, url, selector } = body;

    if (!url || !selector) {
      return NextResponse.json({ error: 'URL と セレクタは必須です。' }, { status: 400 });
    }

    if (!url.startsWith('http')) {
      return NextResponse.json({ error: '有効な URL を入力してください。' }, { status: 400 });
    }

    const record = await larkBase.createMonitor({
      Label: label,
      URL: url,
      Selector: selector,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to create monitor:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
