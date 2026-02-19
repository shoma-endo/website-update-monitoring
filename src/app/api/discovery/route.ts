import { NextResponse } from 'next/server';
import { larkBase } from '@/lib/lark';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await larkBase.getDiscoveryRules();
    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, sourceUrl, linkSelector, urlPattern, targetSelector, isActive } = body;

    if (!sourceUrl || !linkSelector || !urlPattern || !targetSelector) {
      return NextResponse.json({ error: 'すべての項目（ラベル以外）は必須です。' }, { status: 400 });
    }

    const record = await larkBase.createMonitor({
      Label: label,
      SourceURL: sourceUrl,
      LinkSelector: linkSelector,
      URLPattern: urlPattern,
      TargetSelector: targetSelector,
      IsActive: !!isActive,
    }, /* tableId: */ 'tblfuKUnCXhtMiY1'); // Need to update larkBase.createMonitor or add a specific one

    return NextResponse.json({ success: true, record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to create discovery rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
