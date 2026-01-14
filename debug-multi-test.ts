import { fetchContent } from './src/engine/crawler';
import crypto from 'crypto';

async function test(label: string, url: string, selector: string, iterations: number = 3) {
  console.log(`--- Multi-testing ${label} ---`);
  const results: { hash: string; length: number; content: string }[] = [];
  for (let i = 0; i < iterations; i++) {
    try {
      const content = await fetchContent(url, selector);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      results.push({ hash, length: content.length, content: content.substring(0, 50) });
      console.log(`Run ${i+1}: Hash=${hash}, Length=${content.length}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error(`Run ${i+1} Error: ${errorMessage}`);
    }
    if (i < iterations - 1) await new Promise(r => setTimeout(r, 1000));
  }
  
  const allSame = results.every(r => r.hash === results[0].hash);
  console.log(`All entries identical: ${allSame}`);
}

async function main() {
  await test(
    'React Blog',
    'https://ja.react.dev/blog',
    '#__next > div:nth-child(3) > main > article > div > div.px-5.sm\\:px-12 > div > div > div.sm\\:-mx-5.flex.flex-col.gap-5.mt-12 > a:nth-child(1)'
  );
  
  await test(
    'Next.js Blog',
    'https://nextjs.org/blog',
    'body > main > div > div.index-module__JrUOsq__root > div > article:nth-child(1)'
  );
}

main();
