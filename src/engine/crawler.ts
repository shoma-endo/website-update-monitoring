import axios from 'axios';
import * as cheerio from 'cheerio';
import { SCRAPING_TIMEOUT, DEFAULT_USER_AGENT } from '../lib/constants';

export function validateSelector(selector: string): void {
  try {
    // Cheerio load with empty HTML is lightweight and catches syntax errors
    cheerio.load('')(selector);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid CSS selector "${selector}": ${errorMessage}`);
  }
}

export async function fetchContent(url: string, selector: string): Promise<string> {
  // Validate selector before making the network request
  validateSelector(selector);

  try {
    const { data } = await axios.get(url, {
      timeout: SCRAPING_TIMEOUT,
      headers: { 
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    });
    const $ = cheerio.load(data);
    const text = $(selector).text().trim();
    
    if (!text && $(selector).length === 0) {
      throw new Error(`Selector "${selector}" not found`);
    }
    
    return text;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Timeout fetching ${url} (${SCRAPING_TIMEOUT / 1000}s)`);
    }
    throw error;
  }
}
