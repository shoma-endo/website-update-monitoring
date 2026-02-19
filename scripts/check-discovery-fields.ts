import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
const LARK_BASE_URL = 'https://mjpt22tawf9f.jp.larksuite.com/base/AFThbDEsJadrVosiOH5jwyFupC8';
const TABLE_ID = 'tblwliepcjDDGe9Q';

async function checkFields() {
  const client = new Lark.Client({
    appId,
    appSecret,
    domain: Lark.Domain.Lark,
  });

  const baseId = LARK_BASE_URL.split('/base/')[1]?.split('?')[0];

  try {
    const res = await client.bitable.appTableField.list({
      path: { app_token: baseId, table_id: TABLE_ID }
    });

    console.log(`Fields in table ${TABLE_ID}:`);
    res.data?.items?.forEach(f => {
      console.log(`- ${f.field_name} (ID: ${f.field_id}, Type: ${f.type})`);
    });
  } catch (e) {
    console.error('Failed to list fields:', e);
  }
}

checkFields();
