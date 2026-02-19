import { larkBase } from '../src/lib/lark';

async function checkState() {
  console.log('--- Checking Discovery Rules ---');
  try {
    const rules = await larkBase.getDiscoveryRules();
    console.log(`Found ${rules.length} rules.`);
    rules.forEach((r: any) => {
      console.log(`- Label: ${r.fields.Label}, IsActive: ${r.fields.IsActive}, URL: ${r.fields.SourceURL}`);
    });

    console.log('\n--- Checking SaleEvents (Archive) ---');
    const events = await larkBase.getSaleEvents();
    console.log(`Found ${events.length} events in archive.`);
    
    // Monitorsも確認
    console.log('\n--- Checking Monitors ---');
    const monitors = await larkBase.getMonitors();
    console.log(`Found ${monitors.length} monitors.`);

  } catch (e) {
    console.error('Check failed:', e);
  }
}

checkState();
