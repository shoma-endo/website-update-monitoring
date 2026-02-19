import * as cheerio from 'cheerio';
import axios from 'axios';
import { SCRAPING_TIMEOUT, DEFAULT_USER_AGENT } from '../lib/constants';
import puppeteer from 'puppeteer';

export interface DiscoveryResult {
  url: string;
  label?: string;
}

export async function discoverLinks(
  sourceUrl: string,
  linkSelector: string,
  urlPattern: string
): Promise<string[]> {
  console.log(`Starting discovery on ${sourceUrl} with selector: ${linkSelector}`);
  
  // We need the full HTML to extract multiple links, while fetchContent usually returns text.
  // So we implement a similar logic here but returns the URLs.
  
  const urls = new Set<string>();
  const regex = new RegExp(urlPattern);

  try {
    // If it's Amazon or similar, we might need Puppeteer to get all dynamically rendered links
    // For now, let's try a logic that chooses between static and browser
    const html = await fetchRawHtml(sourceUrl);
    const $ = cheerio.load(html);
    
    $(linkSelector).each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, sourceUrl).href;
          if (regex.test(absoluteUrl)) {
            urls.add(absoluteUrl);
          }
        } catch (linkError) {
          // Ignore invalid URLs
        }
      }
    });

    return Array.from(urls);
  } catch (error) {
    console.error(`Discovery failed for ${sourceUrl}:`, error);
    throw error;
  }
}

async function fetchRawHtml(url: string): Promise<string> {
  // Use browser for Amazon or explicitly defined patterns
  if (url.includes('amazon.co.jp') || url.includes('platform.claude.com')) {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setUserAgent(DEFAULT_USER_AGENT);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  const { data } = await axios.get(url, {
    timeout: SCRAPING_TIMEOUT,
    headers: { 'User-Agent': DEFAULT_USER_AGENT }
  });
  return data;
}

// Re-using launchBrowser logic from crawler or local helper
async function launchBrowser() {
  const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_REGION;

  if (isServerless) {
    const [{ default: chromium }, puppeteerCore] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ]);

    return puppeteerCore.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}
