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

  // Add timeout to prevent hanging on locked databases
  const openPromise = db.open();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Database open timeout')), 5000)
  );

  try {
    await Promise.race([openPromise, timeoutPromise]);
  } catch (e) {
    console.log(`Failed to open database: ${e instanceof Error ? e.message : String(e)}`);
    console.log('Database is likely locked by VSCode. Close VSCode and try again.');
    process.exit(1);
  }

  console.log('First 100 keys in LevelDB:\n');
  let count = 0;
  const keys: string[] = [];
  for await (const [key] of db.iterator()) {
    const keyStr = key.toString();
    keys.push(keyStr);
    count++;
    if (count >= 100) break;
  }

  keys.forEach((k, i) => console.log(`${i + 1}. ${k}`));
  console.log(`\nTotal keys shown: ${count}`);
  await db.close();
}

main().catch(console.error);
