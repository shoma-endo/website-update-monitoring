import dotenv from 'dotenv';
import path from 'path';
import { checkAllMonitors } from '../src/engine/runner';

// .env および .env.local を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('--- Starting Trial Monitoring Check ---');
  try {
    await checkAllMonitors();
    console.log('--- Trial Check Completed Successfully ---');
  } catch (error) {
    console.error('--- Trial Check Failed ---', error);
  }
}

main();
