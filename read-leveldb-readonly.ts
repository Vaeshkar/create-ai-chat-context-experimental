import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';

async function main() {
  const dbPath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage/66f00bfbc4603280bc668e8f373134ed/Augment.vscode-augment/augment-kv-store'
  );

  console.log(`Attempting read-only access to: ${dbPath}\n`);

  const db = new ClassicLevel(dbPath, { 
    createIfMissing: false,
    readonly: true  // Try read-only mode
  });

  try {
    await db.open();
    console.log('✅ Database opened in read-only mode\n');

    let count = 0;
    const conversationIds = new Set<string>();

    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      
      // Extract conversation IDs from keys like:
      // exchange:conversationId:messageId
      // history:conversationId
      // history-metadata:conversationId
      if (keyStr.includes(':')) {
        const parts = keyStr.split(':');
        if (parts[1]) {
          conversationIds.add(parts[1]);
        }
      }
      
      count++;
      if (count % 1000 === 0) {
        console.log(`Processed ${count} keys...`);
      }
    }

    console.log(`\n✅ Total keys: ${count}`);
    console.log(`✅ Unique conversations: ${conversationIds.size}`);
    
    if (conversationIds.size > 0) {
      console.log(`\nFirst 10 conversation IDs:`);
      let i = 0;
      for (const convId of conversationIds) {
        console.log(`  ${i + 1}. ${convId}`);
        i++;
        if (i >= 10) break;
      }
    }

    await db.close();
  } catch (e) {
    console.error(`❌ Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

main().catch(console.error);
