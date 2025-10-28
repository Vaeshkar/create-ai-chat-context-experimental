#!/usr/bin/env npx tsx

/**
 * Dump ALL data for a specific conversation UUID to understand the structure
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function dumpConversation() {
  const claudePath = join(homedir(), 'Library/Application Support/Claude/Local Storage/leveldb');

  console.log('🔍 Dumping ALL data from Claude Desktop LevelDB\n');

  if (!existsSync(claudePath)) {
    console.log('❌ Claude Desktop LevelDB not found');
    return;
  }

  const tempDbPath = join(tmpdir(), `claude-dump-${Date.now()}`);

  try {
    cpSync(claudePath, tempDbPath, { recursive: true });
    const db = new ClassicLevel(tempDbPath);
    await db.open();

    console.log('✅ Database opened\n');

    // First, find the most recently modified conversation
    const conversationData = new Map<string, Array<{ key: string; value: any; timestamp?: number }>>();

    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      const valueStr = value.toString();

      // Extract UUID from key
      const uuidMatch = keyStr.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);

      if (uuidMatch && uuidMatch[1]) {
        const uuid = uuidMatch[1];

        if (!conversationData.has(uuid)) {
          conversationData.set(uuid, []);
        }

        let parsed: any;
        let timestamp: number | undefined;

        try {
          parsed = JSON.parse(valueStr);
          timestamp = parsed.timestamp;
        } catch {
          parsed = valueStr;
        }

        conversationData.get(uuid)!.push({
          key: keyStr,
          value: parsed,
          timestamp,
        });
      }
    }

    console.log(`📊 Found ${conversationData.size} conversation UUIDs\n`);

    // Find the most recent conversation
    let mostRecentUuid: string | null = null;
    let mostRecentTimestamp = 0;

    for (const [uuid, entries] of conversationData.entries()) {
      for (const entry of entries) {
        if (entry.timestamp && entry.timestamp > mostRecentTimestamp) {
          mostRecentTimestamp = entry.timestamp;
          mostRecentUuid = uuid;
        }
      }
    }

    if (mostRecentUuid) {
      console.log(`🎯 Most recent conversation: ${mostRecentUuid}`);
      console.log(`📅 Last activity: ${new Date(mostRecentTimestamp).toISOString()}\n`);

      const entries = conversationData.get(mostRecentUuid)!;
      console.log(`📝 Total keys for this conversation: ${entries.length}\n`);

      console.log('🔍 ALL DATA FOR THIS CONVERSATION:\n');
      console.log('='.repeat(80));

      entries.forEach((entry, i) => {
        console.log(`\n${i + 1}. KEY: ${entry.key}`);
        console.log(`   TIMESTAMP: ${entry.timestamp ? new Date(entry.timestamp).toISOString() : 'N/A'}`);
        console.log(`   VALUE:`);
        if (typeof entry.value === 'object') {
          console.log(JSON.stringify(entry.value, null, 2));
        } else {
          console.log(entry.value);
        }
        console.log('-'.repeat(80));
      });
    } else {
      console.log('❌ No conversations with timestamps found');

      // Just dump the first 5 keys to see what we have
      console.log('\n📝 First 5 keys in database:\n');
      let count = 0;
      for await (const [key, value] of db.iterator()) {
        if (count >= 5) break;
        console.log(`Key: ${key.toString()}`);
        console.log(`Value: ${value.toString().substring(0, 500)}\n`);
        count++;
      }
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

dumpConversation().catch(console.error);

