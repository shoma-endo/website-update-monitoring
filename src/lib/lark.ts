import * as Lark from '@larksuiteoapi/node-sdk';

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';

const client = new Lark.Client({
  appId,
  appSecret,
  domain: Lark.Domain.Lark,
});

/**
 * URL から baseId と tableId を抽出する
 */
export function extractBaseAndTableIds(url: string) {
  if (!url) return { baseId: '', tableId: '' };
  
  // URL 全体からクエリ部分を分離
  const [pathPart, queryPart] = url.split('?');
  const query = queryPart || '';
  let tableId = '';
  // クエリから table パラメータを抽出
  query.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k === 'table') {
      tableId = decodeURIComponent(v || '');
    }
  });
  const parts = pathPart.split('/').filter(s => s);
  const baseIndex = parts.findIndex(s => s.toLowerCase() === 'base');
  const baseId = (baseIndex !== -1 && baseIndex + 1 < parts.length)
    ? parts[baseIndex + 1]
    : '';
  return { baseId, tableId };
}

const extracted = extractBaseAndTableIds(process.env.LARK_BASE_URL || '');

export const LARK_BASE_ID = extracted.baseId;
export const LARK_MONITORS_TABLE = extracted.tableId;

if (!LARK_BASE_ID || !LARK_MONITORS_TABLE) {
  console.error('Error: LARK_BASE_URL is not set or invalid. Please check your environment variables.');
}

export const larkBase = {
  async getMonitors() {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE }
    });
    return res.data?.items || [];
  },

  async getMonitor(recordId: string) {
    const res = await client.bitable.appTableRecord.get({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE, record_id: recordId }
    });
    return res.data?.record;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateMonitor(recordId: string, fields: any) {
    await client.bitable.appTableRecord.update({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE, record_id: recordId },
      data: { fields }
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createMonitor(fields: any) {
    const res = await client.bitable.appTableRecord.create({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE },
      data: { fields }
    });
    return res.data?.record;
  },

  async deleteMonitor(recordId: string) {
    await client.bitable.appTableRecord.delete({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE, record_id: recordId }
    });
  },

  async getBaseInfo() {
    const res = await client.bitable.app.get({
      path: { app_token: LARK_BASE_ID }
    });
    return res.data?.app;
  }
};

export const larkBot = {
  async sendMessage(receiveId: string, text: string) {
    const receiveIdType = receiveId.startsWith('oc_') ? 'chat_id' : (receiveId.startsWith('ou_') ? 'user_id' : 'open_id');
    await client.im.message.create({
      params: { receive_id_type: receiveIdType },
      data: {
        receive_id: receiveId,
        msg_type: 'text',
        content: JSON.stringify({ text })
      }
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendCard(receiveId: string, cardContent: any) {
    const receiveIdType = receiveId.startsWith('oc_') ? 'chat_id' : (receiveId.startsWith('ou_') ? 'user_id' : 'open_id');
    await client.im.message.create({
      params: { receive_id_type: receiveIdType },
      data: {
        receive_id: receiveId,
        msg_type: 'interactive',
        content: JSON.stringify(cardContent)
      }
    });
  },

  async getChats() {
    // Botが参加しているグループチャットのリストを取得
    const res = await client.im.chat.list({
      params: {
        sort_type: 'ByCreateTimeAsc',
        page_size: 20
      }
    });
    return res.data?.items || [];
  }
};
