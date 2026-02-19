import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appId = process.env.LARK_APP_ID || '';
const appSecret = process.env.LARK_APP_SECRET || '';
const LARK_BASE_URL = 'https://mjpt22tawf9f.jp.larksuite.com/base/AFThbDEsJadrVosiOH5jwyFupC8';
const TABLE_ID = 'tblwliepcjDDGe9Q';

async function fixFields() {
  const client = new Lark.Client({
    appId,
    appSecret,
    domain: Lark.Domain.Lark,
  });

  const baseId = LARK_BASE_URL.split('/base/')[1]?.split('?')[0];

  try {
    // 1. Rename 多行文本 (fldrO17EY8) -> TempLabel
    console.log('Renaming primary field to Label...');
    await client.bitable.appTableField.update({
      path: { app_token: baseId, table_id: TABLE_ID, field_id: 'fldrO17EY8' },
      data: { field_name: 'Label_Primary' }
    });

    // 2. Delete redundant Label (fldOiHlQdn)
    console.log('Deleting redundant Label field...');
    await client.bitable.appTableField.delete({
      path: { app_token: baseId, table_id: TABLE_ID, field_id: 'fldOiHlQdn' }
    });

    // 3. Rename Label_Primary -> Label
    await client.bitable.appTableField.update({
      path: { app_token: baseId, table_id: TABLE_ID, field_id: 'fldrO17EY8' },
      data: { field_name: 'Label' }
    });

    console.log('Fix complete.');
  } catch (e) {
    console.error('Fix failed:', e);
  }
}

fixFields();
