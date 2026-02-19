import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

// .env および .env.local を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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
export const LARK_DISCOVERY_TABLE = 'tblfuKUnCXhtMiY1'; // 手動で追加したDiscoveryRulesテーブルのID
export const LARK_SALE_EVENTS_TABLE = 'tblWk1PPit7QRGeR'; // 自動作成されたセール蓄積用テーブルのID

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
  async createMonitor(fields: any, tableId = LARK_MONITORS_TABLE) {
    const res = await client.bitable.appTableRecord.create({
      path: { app_token: LARK_BASE_ID, table_id: tableId },
      data: { fields }
    });
    return res.data?.record;
  },

  async deleteMonitor(recordId: string) {
    await client.bitable.appTableRecord.delete({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE, record_id: recordId }
    });
  },

  async deleteDiscoveryRule(recordId: string) {
    await client.bitable.appTableRecord.delete({
      path: { app_token: LARK_BASE_ID, table_id: LARK_DISCOVERY_TABLE, record_id: recordId }
    });
  },

  async getBaseInfo() {
    const res = await client.bitable.app.get({
      path: { app_token: LARK_BASE_ID }
    });
    return res.data?.app;
  },

  async getDiscoveryRules() {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: LARK_BASE_ID, table_id: LARK_DISCOVERY_TABLE }
    });
    return res.data?.items || [];
  },

  async getSaleEvents() {
    const res = await client.bitable.appTableRecord.list({
      path: { app_token: LARK_BASE_ID, table_id: LARK_SALE_EVENTS_TABLE }
    });
    return res.data?.items || [];
  },

  async upsertSaleEvent(fields: { EventTitle: string; URL: string; StartDate: number | null; EndDate: number | null; LastHash?: string; FoundAt: number }) {
    // URLをキーに既存レコードを確認
    const escapedUrl = fields.URL.replace(/"/g, '\\"');
    const existing = await client.bitable.appTableRecord.list({
      path: { app_token: LARK_BASE_ID, table_id: LARK_SALE_EVENTS_TABLE },
      params: { filter: `CurrentValue.[URL]="${escapedUrl}"` }
    });

    if (existing.data?.items && existing.data.items.length > 0) {
      const recordId = existing.data.items[0].record_id!;
      await client.bitable.appTableRecord.update({
        path: { app_token: LARK_BASE_ID, table_id: LARK_SALE_EVENTS_TABLE, record_id: recordId },
        data: { fields: fields as any }
      });
      return { recordId, action: 'updated' };
    } else {
      const res = await client.bitable.appTableRecord.create({
        path: { app_token: LARK_BASE_ID, table_id: LARK_SALE_EVENTS_TABLE },
        data: { fields: fields as any }
      });
      return { recordId: res.data?.record?.record_id, action: 'created' };
    }
  },

  async createMonitorIfNotExists(fields: { URL: string; Label: string; Selector: string }) {
    // すでに同じURLが登録されていないか確認
    const escapedUrl = fields.URL.replace(/"/g, '\\"');
    const existing = await client.bitable.appTableRecord.list({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE },
      params: { filter: `CurrentValue.[URL]="${escapedUrl}"` }
    });

    if (existing.data?.items && existing.data.items.length > 0) {
      return null; // すでに存在
    }

    return this.createMonitor(fields);
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
