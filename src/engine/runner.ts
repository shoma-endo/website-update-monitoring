import axios from 'axios';
import * as cheerio from 'cheerio';
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
        StartDate: startDate ? new Date(startDate).getTime() : null,
        EndDate: endDate ? new Date(endDate).getTime() : null
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

/**
 * URLからトラッキングパラメータなどを削除して正規化する
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

/**
 * コンテンツから適切なタイトルを抽出する
 */
async function extractSmartTitle(url: string, targetSelector: string): Promise<string> {
  // ブラウザレンダリングが必要な場合、より高度な抽出が可能だが、
  // 現在の fetchContent はテキストのみを返すため、Cheerio で HTML を再取得して解析する
  // (パフォーマンスを考慮し、すでに取得済みの content を引数で渡すように runner を変更する)
  return 'New Event'; // プレースホルダー、実際には下のループ内で処理
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

      for (const rawUrl of discoveredUrls) {
        const url = normalizeUrl(rawUrl);
        try {
          // 個別イベントページをクロールして情報を抽出
          console.log(`Crawling discovered event: ${url}`);
          let content = '';
          let isFallback = false;
          try {
            content = await fetchContent(url, TargetSelector);
          } catch (e) {
            console.warn(`Selector "${TargetSelector}" not found on ${url}. Falling back to body...`);
            content = await fetchContent(url, 'body');
            isFallback = true;
          }
          
          const currentHash = crypto.createHash('sha256').update(content).digest('hex');
          const { startDate, endDate } = extractDatesFromText(content);
          
          // タイトル抽出の改善
          let eventTitle = '';
          
          if (!isFallback) {
            // 指定セレクタがヒットした場合はその1行目（ただしゴミ取り付き）
            eventTitle = content.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('{') && !l.startsWith('(')) || '';
          }

          // フォールバック時、またはセレクタで見つかったタイトルが不適切な場合
          if (!eventTitle || eventTitle.length < 2) {
            // 再度 fetchContentStatic 相当の処理が必要だが、runner 内で cheerio を直接使う
            try {
              const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              const $ = cheerio.load(html);
              
              // 優先度 1: img の alt (発見系では有効なことが多い)
              eventTitle = $('img').map((_, el) => $(el).attr('alt')).get().find(alt => alt && alt.length > 5 && !alt.includes('{')) || '';
              
              // 優先度 2: h1
              if (!eventTitle) {
                eventTitle = $('h1').first().text().trim();
              }
              
              // 優先度 3: title
              if (!eventTitle) {
                eventTitle = $('title').text().replace(/Amazon/g, '').replace(/[\s|:|-].*/, '').trim();
              }
            } catch {
              eventTitle = 'New Event';
            }
          }

          eventTitle = eventTitle.substring(0, 100) || 'New Event';

          const result = await larkBase.upsertSaleEvent({
            EventTitle: eventTitle,
            URL: url,
            StartDate: startDate ? new Date(startDate).getTime() : null,
            EndDate: endDate ? new Date(endDate).getTime() : null,
            LastHash: currentHash,
            FoundAt: Date.now()
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
