import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { SCRAPING_TIMEOUT, DEFAULT_USER_AGENT, BROWSER_RENDER_PATTERNS, BROWSER_RENDER_TIMEOUT } from '../lib/constants';

function normalizeSelector(selector: string): string {
  return selector.trim();
}

function getSelectorCandidates(url: string, selector: string): string[] {
  const normalized = normalizeSelector(selector);

  if (url.includes('status.claude.com') && normalized === '.page-status') {
    return [
      normalized,
      '.component-container .component-status',
      '.incident-title a',
    ];
  }

  return [normalized];
}

export function validateSelector(selector: string): void {
  const normalized = normalizeSelector(selector);
  try {
    // Cheerio load with empty HTML is lightweight and catches syntax errors
    cheerio.load('')(normalized);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid CSS selector "${normalized}": ${errorMessage}`);
  }
}

/**
 * URLがブラウザレンダリングを必要とするかどうかを判定
 */
function needsBrowserRendering(url: string): boolean {
  return BROWSER_RENDER_PATTERNS.some(pattern => url.includes(pattern));
}

/**
 * Puppeteerを使用してJavaScriptレンダリング後のコンテンツを取得
 */
async function fetchContentWithBrowser(url: string, selector: string): Promise<string> {
  let browser;
  const candidates = getSelectorCandidates(url, selector);
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    
    // ページを読み込み、ネットワークがアイドル状態になるまで待機
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: BROWSER_RENDER_TIMEOUT 
    });
    
    // セレクタが表示されるまで待機（最大5秒）
    for (const candidate of candidates) {
      try {
        await page.waitForSelector(candidate, { timeout: 3000 });
        break;
      } catch {
        // セレクタが見つからない場合でも続行（後でエラーハンドリング）
      }
    }

    for (const candidate of candidates) {
      const text = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.textContent?.trim() || '' : '';
      }, candidate);
      if (text) {
        return text;
      }
    }

    throw new Error(`Selector "${normalizeSelector(selector)}" not found or empty`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 静的HTMLからコンテンツを取得（従来の方法）
 */
async function fetchContentStatic(url: string, selector: string): Promise<string> {
  const candidates = getSelectorCandidates(url, selector);
  const { data } = await axios.get(url, {
    timeout: SCRAPING_TIMEOUT,
    headers: { 
      'User-Agent': DEFAULT_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    }
  });
  const $ = cheerio.load(data);

  for (const candidate of candidates) {
    const text = $(candidate).text().trim();
    if (text) {
      return text;
    }
    if ($(candidate).length > 0) {
      return text;
    }
  }

  throw new Error(`Selector "${normalizeSelector(selector)}" not found`);
}

export async function fetchContent(url: string, selector: string): Promise<string> {
  // Validate selector before making the network request
  validateSelector(selector);

  try {
    // URLに基づいて適切な取得方法を選択
    if (needsBrowserRendering(url)) {
      console.log(`Using browser rendering for ${url}`);
      return await fetchContentWithBrowser(url, selector);
    } else {
      return await fetchContentStatic(url, selector);
    }
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Timeout fetching ${url} (${SCRAPING_TIMEOUT / 1000}s)`);
    }
    throw error;
  }
}
