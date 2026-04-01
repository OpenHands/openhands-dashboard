import { collectAndSaveSnapshot } from '../src/lib/snapshots';

async function main() {
  const result = await collectAndSaveSnapshot();

  if (result.action === 'unchanged') {
    console.log(`No snapshot changes for ${result.date}.`);
    return;
  }

  console.log(`${result.action === 'created' ? 'Created' : 'Updated'} snapshot for ${result.date}.`);
}

main().catch((error) => {
  console.error('Failed to update snapshots:', error);
  process.exitCode = 1;
});
