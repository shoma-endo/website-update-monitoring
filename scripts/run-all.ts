import { checkAllMonitors } from '../src/engine/runner';
import dotenv from 'dotenv';
import path from 'path';

// .env および .env.local を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('--- Starting Daily Monitoring (CLI) ---');
  console.log(`Time: ${new Date().toLocaleString('ja-JP')}`);

  try {
    await checkAllMonitors();
    console.log('--- Monitoring Task Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('--- Monitoring Task Failed ---');
    console.error(error);
    process.exit(1);
  }
}

main();
