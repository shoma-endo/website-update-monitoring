import { NextResponse } from 'next/server';
import { larkBot } from '@/lib/lark';

export async function GET() {
  try {
    const chats = await larkBot.getChats();
    
    // 必要な情報だけを抽出して返す
    const simpleList = chats.map(chat => ({
      name: chat.name,
      chat_id: chat.chat_id,
      description: chat.description,
    }));

    return NextResponse.json({ 
      count: simpleList.length,
      chats: simpleList,
      instruction: "chat_id をコピーして .env.local の LARK_NOTIFY_CHAT_ID に設定してください。" 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
