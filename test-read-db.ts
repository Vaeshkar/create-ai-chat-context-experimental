import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';

async function main() {
  const dbPath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage/66f00bfbc4603280bc668e8f373134ed/Augment.vscode-augment/augment-kv-store'
  );

  console.log(`Opening database at: ${dbPath}\n`);

  const db = new ClassicLevel(dbPath);
  await db.open();

  console.log('Database opened successfully!\n');

  let count = 0;
  let exchangeCount = 0;

  for await (const [key, value] of db.iterator()) {
    const keyStr = key.toString();
    count++;

    if (keyStr.startsWith('exchange:')) {
      exchangeCount++;
      if (exchangeCount <= 3) {
        console.log(`Exchange key ${exchangeCount}: ${keyStr.substring(0, 80)}...`);
      }
    }
  }

  console.log(`\nTotal keys: ${count}`);
  console.log(`Exchange keys: ${exchangeCount}`);

  await db.close();
}

main().catch(console.error);
