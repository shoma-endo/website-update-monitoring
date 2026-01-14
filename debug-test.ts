import { fetchContent } from './src/engine/crawler';
import crypto from 'crypto';

async function test(label: string, url: string, selector: string) {
  console.log(`--- Testing ${label} ---`);
  console.log(`URL: ${url}`);
  console.log(`Selector: ${selector}`);
  try {
    const content = await fetchContent(url, selector);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    console.log(`Content length: ${content.length}`);
    console.log(`Content (first 200 chars): "${content.substring(0, 200)}..."`);
    console.log(`Hash: ${hash}`);
    return { content, hash };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(`Error: ${errorMessage}`);
  }
}

async function main() {
  const react = await test(
    'React Blog',
    'https://ja.react.dev/blog',
    '#__next > div:nth-child(3) > main > article > div > div.px-5.sm\\:px-12 > div > div > div.sm\\:-mx-5.flex.flex-col.gap-5.mt-12 > a:nth-child(1)'
  );
  
  const nextjs = await test(
    'Next.js Blog',
    'https://nextjs.org/blog',
    'body > main > div > div.index-module__JrUOsq__root > div > article:nth-child(1)'
  );
}

main();
