import * as Lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const LARK_APP_ID = process.env.LARK_APP_ID;
const LARK_APP_SECRET = process.env.LARK_APP_SECRET;
const LARK_BASE_URL = 'https://mjpt22tawf9f.jp.larksuite.com/base/AFThbDEsJadrVosiOH5jwyFupC8';
const TABLE_ID = 'tblWk1PPit7QRGeR';

async function convertTextFieldsToDate() {
  if (!LARK_APP_ID || !LARK_APP_SECRET) {
    console.error('Missing LARK_APP_ID or LARK_APP_SECRET');
    return;
  }

  const client = new Lark.Client({
    appId: LARK_APP_ID,
    appSecret: LARK_APP_SECRET,
  });

  const baseId = LARK_BASE_URL.split('/base/')[1]?.split('?')[0];

  console.log(`Re-configuring Date Fields for Table: ${TABLE_ID} in Base: ${baseId}`);

  try {
    // 1. Get current fields
    const fieldsRes = await client.bitable.appTableField.list({
      path: { app_token: baseId, table_id: TABLE_ID }
    });

    const items = fieldsRes.data?.items || [];
    
    // Find fields to replace
    const startDateField = items.find(f => f.field_name === 'StartDate');
    const endDateField = items.find(f => f.field_name === 'EndDate');

    // 2. Delete Text fields if they exist
    if (startDateField) {
      console.log(`Deleting Text field 'StartDate' (${startDateField.field_id})...`);
      await client.bitable.appTableField.delete({
        path: { app_token: baseId, table_id: TABLE_ID, field_id: startDateField.field_id! }
      });
    }
    if (endDateField) {
      console.log(`Deleting Text field 'EndDate' (${endDateField.field_id})...`);
      await client.bitable.appTableField.delete({
        path: { app_token: baseId, table_id: TABLE_ID, field_id: endDateField.field_id! }
      });
    }

    // 3. Create Date fields
    console.log("Creating 'StartDate' as DateTime (Type 5)...");
    await client.bitable.appTableField.create({
      path: { app_token: baseId, table_id: TABLE_ID },
      data: {
        field_name: 'StartDate',
        type: 5 // DateTime
      }
    });

    console.log("Creating 'EndDate' as DateTime (Type 5)...");
    await client.bitable.appTableField.create({
      path: { app_token: baseId, table_id: TABLE_ID },
      data: {
        field_name: 'EndDate',
        type: 5 // DateTime
      }
    });

    console.log('--- RE-CONFIGURATION COMPLETE ---');

  } catch (error) {
    console.error('Re-configuration failed:', error);
  }
}

convertTextFieldsToDate();
