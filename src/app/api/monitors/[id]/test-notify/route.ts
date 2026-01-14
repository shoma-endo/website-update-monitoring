import { NextResponse } from 'next/server';
import { larkBase, larkBot } from '@/lib/lark';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // レコード情報の取得
    const record = await larkBase.getMonitor(id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { Label: label, URL: url } = record.fields;
    const notifyId = process.env.LARK_NOTIFY_CHAT_ID;

    if (!notifyId) {
      return NextResponse.json({ error: 'LARK_NOTIFY_CHAT_ID is not set' }, { status: 500 });
    }

    // テスト通知用カードの送信
    const card = {
      config: {
        wide_screen_mode: true
      },
      header: {
        title: {
          tag: 'plain_text',
          content: `🔔 [テスト] Web更新検知: ${label || '無題'}`
        },
        template: 'orange' // テスト通知はオレンジ色
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**${url}**\n\nこれはテスト通知です。実際の更新ではありません。`
          }
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
            }
          ]
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: 'サイトを確認する'
              },
              type: 'primary',
              url: url
            }
          ]
        }
      ]
    };

    await larkBot.sendCard(notifyId, card);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Test notify error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
