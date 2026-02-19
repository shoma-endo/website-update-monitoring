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
    Status?: string;
    ErrorMessage?: string;
  };
}

import { extractDatesFromText } from './date-extractor';

async function checkMonitor(record: MonitorRecord) {
  const { record_id, fields } = record;
  const {
    URL: url,
    Selector: selector,
    LastHash: prevHash,
    Label: label,
    Status: prevStatus,
    ErrorMessage: prevErrorMessage
  } = fields;

  if (!url || !selector) return;

  try {
    const content = await fetchContent(url as string, selector as string);
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');

    const timestamp = Date.now();
    
    // 日付を抽出
    const { startDate, endDate } = extractDatesFromText(content);

    if (!prevHash || prevHash !== currentHash) {
      console.log(`Change detected for ${label || url}. Updating Lark...`);
      
      // 通知処理を分離
      await sendChangeNotification(url as string, label || '無題');

      // Update Lark with Success and Extracted Dates
      await larkBase.updateMonitor(record_id, {
        LastHash: currentHash,
        LastChecked: timestamp,
        Status: 'OK',
        ErrorMessage: '',
        StartDate: startDate || '',
        EndDate: endDate || ''
      });
    } else {
      // 変更なしの場合は不要な通知を避けるため更新しない。
      // ただし前回がエラー状態だった場合は復旧を1回だけ反映する。
      if (prevStatus !== 'OK' || !!prevErrorMessage) {
        await larkBase.updateMonitor(record_id, {
          Status: 'OK',
          ErrorMessage: ''
        });
      }
    }
    // console.log(`Update completed for ${record_id}`);
    return { success: true, url, label };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to check ${url}:`, message);
    
    // エラー情報をLarkに書き込む
    try {
      await larkBase.updateMonitor(record_id, {
        LastChecked: Date.now(),
        Status: 'Error',
        ErrorMessage: message || 'Unknown error'
      });
    } catch (updateError: unknown) {
      console.error('Failed to update error status to Lark:', updateError);
    }

    throw error;
  }
}

import { discoverLinks } from './discovery';

// DiscoveryRecord の定義
interface DiscoveryRule {
  record_id: string;
  fields: {
    Label?: string;
    SourceURL?: string;
    LinkSelector?: string;
    URLPattern?: string;
    TargetSelector?: string;
    IsActive?: boolean;
  };
}

export async function runDiscovery() {
  console.log('Starting discovery phase...');
  const rules = (await larkBase.getDiscoveryRules()) as DiscoveryRule[];
  const activeRules = rules.filter(r => r.fields.IsActive);

  for (const rule of activeRules) {
    const { Label, SourceURL, LinkSelector, URLPattern, TargetSelector } = rule.fields;
    if (!SourceURL || !LinkSelector || !URLPattern || !TargetSelector) continue;

    try {
      const discoveredUrls = await discoverLinks(SourceURL, LinkSelector, URLPattern);
      console.log(`Discovered ${discoveredUrls.length} links for rule: ${Label}`);

      for (const url of discoveredUrls) {
        try {
          // 個別イベントページをクロールして情報を抽出
          console.log(`Crawling discovered event: ${url}`);
          const content = await fetchContent(url, TargetSelector);
          const currentHash = crypto.createHash('sha256').update(content).digest('hex');
          const { startDate, endDate } = extractDatesFromText(content);
          
          // タイトルを簡易抽出（セレクタの中身を使う
          const eventTitle = content.split('\n')[0].trim().substring(0, 100) || 'New Event';

          const result = await larkBase.upsertSaleEvent({
            EventTitle: eventTitle,
            URL: url,
            StartDate: startDate || '',
            EndDate: endDate || '',
            LastHash: currentHash,
            FoundAt: new Date().toISOString()
          });

          if (result.action === 'created') {
            console.log(`Registered NEW sale event: ${url}`);
            await sendChangeNotification(url, `【新着】${Label}: ${eventTitle}`);
          } else if (result.action === 'updated') {
            console.log(`Updated existing sale event: ${url}`);
          }
        } catch (crawlError) {
          console.error(`Failed to process discovered URL ${url}:`, crawlError);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Discovery failed for rule ${Label}:`, message);
    }
  }
}

export async function checkAllMonitors() {
  // 1. 自動発見と蓄積を実行
  try {
    await runDiscovery();
  } catch (discoveryError: unknown) {
    const message = discoveryError instanceof Error ? discoveryError.message : String(discoveryError);
    console.error('Discovery phase failed:', message);
  }

  // 2. 固定モニタリング対象のチェックを実行
  const monitors = (await larkBase.getMonitors()) as MonitorRecord[];
  
  const results = await Promise.allSettled(monitors.map(record => checkMonitor(record)));

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failCount = results.filter(r => r.status === 'rejected').length;

  console.log(`Check complete. Success: ${successCount}, Failed: ${failCount}`);
}
