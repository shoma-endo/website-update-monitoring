import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
const LARK_BASE_URL = 'https://mjpt22tawf9f.jp.larksuite.com/base/AFThbDEsJadrVosiOH5jwyFupC8';

async function setupDiscoveryTable() {
  const client = new Lark.Client({
    appId,
    appSecret,
    domain: Lark.Domain.Lark,
  });

  const baseId = LARK_BASE_URL.split('/base/')[1]?.split('?')[0];

  try {
    console.log(`Creating 'DiscoveryRules' table in Base: ${baseId}`);
    const res = await client.bitable.appTable.create({
      path: { app_token: baseId },
      data: { table: { name: 'DiscoveryRules' } }
    });

    const tableId = res.data?.table_id;
    if (!tableId) throw new Error('Failed to create table');
    console.log(`Table created. ID: ${tableId}`);

    // フィールド作成
    const fields = [
      { field_name: 'Label', type: 1 },
      { field_name: 'SourceURL', type: 1 },
      { field_name: 'LinkSelector', type: 1 },
      { field_name: 'URLPattern', type: 1 },
      { field_name: 'TargetSelector', type: 1 },
      { field_name: 'IsActive', type: 7 }, // Checkbox
    ];

    for (const field of fields) {
      await client.bitable.appTableField.create({
        path: { app_token: baseId, table_id: tableId },
        data: field
      });
      console.log(`Field '${field.field_name}' created.`);
    }

    // デフォルトフィールドのリネーム (多行文本 -> Label)
    const fieldsLog = await client.bitable.appTableField.list({
        path: { app_token: baseId, table_id: tableId }
    });
    const defaultField = fieldsLog.data?.items?.find(f => f.field_name === '多行文本');
    const redundantLabel = fieldsLog.data?.items?.find(f => f.field_name === 'Label');

    if (defaultField && redundantLabel) {
        console.log('Cleaning up redundant fields...');
        await client.bitable.appTableField.update({
            path: { app_token: baseId, table_id: tableId, field_id: defaultField.field_id! },
            data: { field_name: 'RuleLabel' } // 一時的な名前
        });
        await client.bitable.appTableField.delete({
            path: { app_token: baseId, table_id: tableId, field_id: redundantLabel.field_id! }
        });
        await client.bitable.appTableField.update({
            path: { app_token: baseId, table_id: tableId, field_id: defaultField.field_id! },
            data: { field_name: 'Label' }
        });
    }

    console.log('\n--- SETUP COMPLETE ---');
    console.log(`LARK_DISCOVERY_TABLE=${tableId}`);

  } catch (e) {
    console.error('Setup failed:', e);
  }
}

setupDiscoveryTable();
