import { runDiscovery } from '../src/engine/runner';

async function test() {
  console.log('Starting manual discovery run...');
  try {
    await runDiscovery();
    console.log('Manual discovery run finished.');
  } catch (e) {
    console.error('Manual discovery run failed:', e);
  }
}

test();
