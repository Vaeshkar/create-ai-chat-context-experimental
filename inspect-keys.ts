import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';

async function main() {
  const dbPath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage/66f00bfbc4603280bc668e8f373134ed/Augment.vscode-augment/augment-kv-store'
  );

  console.log(`Opening LevelDB at: ${dbPath}\n`);

  const db = new ClassicLevel(dbPath);
  await db.open();

  console.log('First 50 keys in LevelDB:\n');
  let count = 0;
  for await (const [key] of db.iterator()) {
    const keyStr = key.toString();
    console.log(`${count + 1}. ${keyStr}`);
    count++;
    if (count >= 50) break;
  }

  console.log(`\nTotal keys shown: ${count}`);
  await db.close();
}

main().catch(console.error);
