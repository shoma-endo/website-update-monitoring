import crypto from 'crypto';
import { larkBase } from '../lib/lark';
import { fetchContent } from './crawler';
import { sendChangeNotification } from '../lib/notification';

interface MonitorRecord {
  record_id: string;
  fields: {
    [key: string]: unknown;
    URL?: string;
    Selector?: string;
    LastHash?: string;
    Label?: string;
  };
}

async function checkMonitor(record: MonitorRecord) {
  const { record_id, fields } = record;
  const { URL: url, Selector: selector, LastHash: prevHash, Label: label } = fields;

  if (!url || !selector) return;

  try {
    const content = await fetchContent(url as string, selector as string);
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');

    if (!prevHash || prevHash !== currentHash) {
      console.log(`Change detected for ${label || url}`);
      
      // 通知処理を分離
      await sendChangeNotification(url as string, label || '無題');

      // Update Lark with Success
      await larkBase.updateMonitor(record_id, {
        LastHash: currentHash,
        LastChecked: Date.now(),
        Status: 'OK',
        ErrorMessage: ''
      });
    } else {
      // Update only timestamp and status
      await larkBase.updateMonitor(record_id, {
        LastChecked: Date.now(),
        Status: 'OK',
        ErrorMessage: ''
      });
    }
    return { success: true, url, label };
  } catch (error: any) {
    console.error(`Failed to check ${url}:`, error);
    
    // エラー情報をLarkに書き込む
    try {
      await larkBase.updateMonitor(record_id, {
        LastChecked: Date.now(),
        Status: 'Error',
        ErrorMessage: error.message || 'Unknown error'
      });
    } catch (updateError) {
      console.error('Failed to update error status to Lark:', updateError);
    }

    throw error;
  }
}

export async function checkAllMonitors() {
  const monitors = (await larkBase.getMonitors()) as MonitorRecord[];
  
  const results = await Promise.allSettled(monitors.map(record => checkMonitor(record)));

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failCount = results.filter(r => r.status === 'rejected').length;

  console.log(`Check complete. Success: ${successCount}, Failed: ${failCount}`);
}
