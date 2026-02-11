import { NextResponse } from 'next/server';
import { larkBase } from '@/lib/lark';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await larkBase.deleteMonitor(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label, url, selector } = body;
    const normalizedSelector = typeof selector === 'string' ? selector.trim() : selector;

    // バリデーション
    if (url && !url.startsWith('http')) {
        return NextResponse.json({ error: '有効な URL を入力してください。' }, { status: 400 });
    }

    await larkBase.updateMonitor(id, {
        Label: label,
        URL: url,
        Selector: normalizedSelector
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
