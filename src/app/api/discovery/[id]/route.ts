import { NextResponse } from 'next/server';
import { larkBase } from '@/lib/lark';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await larkBase.deleteDiscoveryRule(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to delete discovery rule:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
