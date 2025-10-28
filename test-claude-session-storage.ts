#!/usr/bin/env npx tsx

/**
 * Search Session Storage for conversation data
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function searchSessionStorage() {
  const sessionPath = join(homedir(), 'Library/Application Support/Claude/Session Storage');

  console.log('🔍 Searching Claude Desktop Session Storage\n');

  if (!existsSync(sessionPath)) {
    console.log('❌ Session Storage not found');
    return;
  }

  const tempDbPath = join(tmpdir(), `claude-session-${Date.now()}`);

  try {
    cpSync(sessionPath, tempDbPath, { recursive: true });
    const db = new ClassicLevel(tempDbPath);
    await db.open();

    console.log('✅ Database opened\n');
    console.log('🔍 Reading all keys...\n');

    const allData: Array<{ key: string; value: string; size: number }> = [];

    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      const valueStr = value.toString();

      allData.push({
        key: keyStr,
        value: valueStr,
        size: valueStr.length,
      });
    }

    await db.close();

    console.log(`📊 Total keys: ${allData.length}\n`);

    console.log('📝 All keys (sorted by size):\n');
    allData
      .sort((a, b) => b.size - a.size)
      .forEach((item, i) => {
        console.log(`${i + 1}. Key: ${item.key}`);
        console.log(`   Size: ${item.size} bytes`);
        if (item.size > 100) {
          console.log(`   Value preview: ${item.value.substring(0, 500)}`);
        } else {
          console.log(`   Value: ${item.value}`);
        }
        console.log('');
      });

    // Search for specific text
    console.log('\n🔍 Searching for "Do you know where these chat_sessions"...\n');

    const found = allData.find((item) =>
      item.value.includes('Do you know where these chat_sessions')
    );

    if (found) {
      console.log('✅ FOUND IT!');
      console.log(`Key: ${found.key}`);
      console.log(`Value: ${found.value}`);
    } else {
      console.log('❌ Text not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (existsSync(tempDbPath)) {
      rmSync(tempDbPath, { recursive: true, force: true });
    }
  }
}

searchSessionStorage().catch(console.error);

