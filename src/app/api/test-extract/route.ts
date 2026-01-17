import { NextResponse } from 'next/server';
import { fetchContent } from '@/engine/crawler';

export async function POST(request: Request) {
  try {
    const { url, selector } = await request.json();

    if (!url || !selector) {
      return NextResponse.json(
        { error: 'URL and Selector are required' },
        { status: 400 }
      );
    }

    // 実際のスクレイピング処理を実行
    const content = await fetchContent(url, selector);
    
    return NextResponse.json({ 
      success: true, 
      content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // プレビュー用に先頭500文字
      fullLength: content.length 
    });

  } catch (error: any) {
    console.error('Test extract failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract content' },
      { status: 500 }
    );
  }
}
