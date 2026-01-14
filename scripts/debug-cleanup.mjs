import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

// .env を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const client = new Lark.Client({
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  domain: Lark.Domain.Lark,
});

/**
 * URL から baseId と tableId を抽出する
 */
function extractBaseAndTableIds(url) {
  if (!url) return { baseId: '', tableId: '' };
  const [pathPart, queryPart] = url.split('?');
  const query = queryPart || '';
  let tableId = '';
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

const extracted = extractBaseAndTableIds(process.env.LARK_BASE_URL);
const LARK_BASE_ID = extracted.baseId;
const LARK_MONITORS_TABLE = extracted.tableId;

if (!LARK_BASE_ID || !LARK_MONITORS_TABLE) {
  console.error('Error: LARK_BASE_URL is not set or invalid.');
  process.exit(1);
}

async function cleanup() {
  const fieldsToDelete = [
    { name: 'テキスト', id: 'fldI2pD2p2' },
    { name: 'Interval', id: 'fldIivTid8' },
    { name: 'Enabled', id: 'fldqpxwOie' }
  ];

  for (const field of fieldsToDelete) {
    console.log(`Deleting ${field.name} (${field.id})...`);
    const res = await client.bitable.appTableField.delete({
      path: { app_token: LARK_BASE_ID, table_id: LARK_MONITORS_TABLE, field_id: field.id }
    });
    console.log(`Response: code=${res.code}, msg=${res.msg}`);
  }
}

cleanup();
