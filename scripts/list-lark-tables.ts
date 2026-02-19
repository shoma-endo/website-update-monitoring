import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
const LARK_BASE_URL = 'https://mjpt22tawf9f.jp.larksuite.com/base/AFThbDEsJadrVosiOH5jwyFupC8';

const client = new Lark.Client({
  appId,
  appSecret,
  domain: Lark.Domain.Lark,
});

async function listTables() {
  const baseId = LARK_BASE_URL.split('/base/')[1]?.split('?')[0];
  console.log(`Connecting to Base: ${baseId}`);

  try {
    const res = await client.bitable.appTable.list({
      path: { app_token: baseId }
    });

    console.log('Tables in this Base:');
    res.data?.items?.forEach(t => {
      console.log(`- ${t.name}: ${t.table_id}`);
    });
  } catch (e) {
    console.error('Failed to list tables:', e);
  }
}

listTables();
