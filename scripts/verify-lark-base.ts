import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

// .env および .env.local を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
/**
 * URL から baseId と tableId を抽出する
 */
function extractBaseAndTableIds(url: string | undefined) {
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

const extracted = extractBaseAndTableIds(process.env.LARK_BASE_URL);
const LARK_BASE_ID = extracted.baseId;
const LARK_TABLE_ID = extracted.tableId;

if (!appId || !appSecret || !LARK_BASE_ID || !LARK_TABLE_ID) {
  console.error('Error: LARK_APP_ID, LARK_APP_SECRET, or LARK_BASE_URL is not set correctly in .env');
  process.exit(1);
}

const client = new Lark.Client({
  appId,
  appSecret,
  domain: Lark.Domain.Lark,
});

const REQUIRED_FIELDS = [
  { field_name: 'Label', type: 1 },         // Text
  { field_name: 'URL', type: 1 },           // Text
  { field_name: 'Selector', type: 1 },      // Text
  { field_name: 'LastHash', type: 1 },      // Text
  { field_name: 'LastChecked', type: 5 },   // DateTime
  { field_name: 'Status', type: 1 },        // Text
  { field_name: 'ErrorMessage', type: 1 },  // Text
];

async function main() {
  console.log(`Checking Base: ${LARK_BASE_ID}, Table: ${LARK_TABLE_ID}`);

  try {
    // 1. 現在のフィールド一覧を取得
    const res = await client.bitable.appTableField.list({
      path: {
        app_token: LARK_BASE_ID,
        table_id: LARK_TABLE_ID,
      },
    });

    const existingFields = res.data?.items || [];
    const existingFieldNames = existingFields.map(f => f.field_name);

    console.log('Existing fields:', existingFieldNames.join(', '));

    // 2. 不足しているフィールドを特定して追加
    for (const required of REQUIRED_FIELDS) {
      if (!existingFieldNames.includes(required.field_name)) {
        console.log(`Adding missing field: ${required.field_name} (type: ${required.type})...`);
        await client.bitable.appTableField.create({
          path: {
            app_token: LARK_BASE_ID,
            table_id: LARK_TABLE_ID,
          },
          data: {
            field_name: required.field_name,
            type: required.type,
          },
        });
        console.log(`Successfully added: ${required.field_name}`);
      } else {
        const existing = existingFields.find(f => f.field_name === required.field_name);
        if (existing?.type !== required.type) {
          console.warn(`Warning: Field "${required.field_name}" exists but has different type. Expected ${required.type}, got ${existing?.type}`);
          console.log(`Fixing field: ${required.field_name} (Recreating with type ${required.type})...`);
          
          await client.bitable.appTableField.delete({
            path: {
              app_token: LARK_BASE_ID,
              table_id: LARK_TABLE_ID,
              field_id: existing?.field_id || '',
            },
          });
          
          await client.bitable.appTableField.create({
            path: {
              app_token: LARK_BASE_ID,
              table_id: LARK_TABLE_ID,
            },
            data: {
              field_name: required.field_name,
              type: required.type,
            },
          });
          console.log(`Successfully fixed: ${required.field_name}`);
        } else {
          console.log(`Field "${required.field_name}" is already present and correct.`);
        }
      }
    }

    console.log('All required fields are verified.');
  } catch (error: unknown) {
    const errorData = error as { response?: { data?: unknown }, message?: string };
    console.error('Error during verification:', errorData.response?.data || errorData.message || error);
    process.exit(1);
  }
}

main();
