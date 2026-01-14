import { larkBot } from './lark';

export async function sendChangeNotification(url: string, label: string) {
  const notifyId = process.env.LARK_NOTIFY_CHAT_ID;
  if (!notifyId) {
    console.warn('LARK_NOTIFY_CHAT_ID is not set. Skipping notification.');
    return;
  }

  const card = {
    config: {
      wide_screen_mode: true
    },
    header: {
      title: {
        tag: 'plain_text',
        content: `🔔 Web更新検知: ${label || '無題'}`
      },
      template: 'blue'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${url}**\n\nページ内容の変更を検知しました。`
        }
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `検知日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
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
}
