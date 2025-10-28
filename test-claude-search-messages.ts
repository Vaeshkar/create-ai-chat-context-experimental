#!/usr/bin/env npx tsx

/**
 * Search for message-related keys in Claude Desktop LevelDB
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function searchForMessages() {
  const claudePath = join(homedir(), 'Library/Application Support/Claude/Local Storage/leveldb');

  console.log('🔍 Searching for message-related data in Claude Desktop LevelDB\n');

  if (!existsSync(claudePath)) {
    console.log('❌ Claude Desktop LevelDB not found');
    return;
  }

  const tempDbPath = join(tmpdir(), `claude-search-${Date.now()}`);

  try {
    cpSync(claudePath, tempDbPath, { recursive: true });
    const db = new ClassicLevel(tempDbPath);
    await db.open();

    console.log('✅ Database opened\n');
    console.log('🔍 Searching for keys containing "message", "chat", "conversation"...\n');

    const matchingKeys: Array<{ key: string; value: string; size: number }> = [];

    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      const valueStr = value.toString();

      if (
        keyStr.toLowerCase().includes('message') ||
        keyStr.toLowerCase().includes('chat') ||
        keyStr.toLowerCase().includes('conversation') ||
        valueStr.toLowerCase().includes('message') ||
        valueStr.toLowerCase().includes('chat_') ||
        valueStr.toLowerCase().includes('conversation')
      ) {
        matchingKeys.push({
          key: keyStr,
          value: valueStr,
          size: valueStr.length,
        });
      }
    }

    await db.close();

    console.log(`📊 Found ${matchingKeys.length} matching keys\n`);

    if (matchingKeys.length > 0) {
      console.log('📝 Matching keys (sorted by size):\n');
      matchingKeys
        .sort((a, b) => b.size - a.size)
        .slice(0, 20)
        .forEach((item, i) => {
          console.log(`${i + 1}. Key: ${item.key}`);
          console.log(`   Size: ${item.size} bytes`);
          console.log(`   Value preview: ${item.value.substring(0, 300)}`);
          console.log('');
        });
    }

    // Also search for specific text
    console.log('\n🔍 Searching for your specific text: "Do you know where these chat_sessions"...\n');

    let found = false;
    await db.open();

    for await (const [key, value] of db.iterator()) {
      const valueStr = value.toString();

      if (valueStr.includes('Do you know where these chat_sessions')) {
        console.log('✅ FOUND IT!');
        console.log(`Key: ${key.toString()}`);
        console.log(`Value: ${valueStr}`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log('❌ Text not found in database');
    }

    await db.close();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (existsSync(tempDbPath)) {
      rmSync(tempDbPath, { recursive: true, force: true });
    }
  }
}

searchForMessages().catch(console.error);

