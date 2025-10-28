#!/usr/bin/env npx tsx

/**
 * Test script to read Claude Desktop conversations from Local Storage LevelDB
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function testClaudeDesktopConversations() {
  const claudePath = join(homedir(), 'Library/Application Support/Claude/Local Storage/leveldb');

  console.log('🔍 Testing Claude Desktop Conversations Reader\n');
  console.log(`📂 Claude Desktop Path: ${claudePath}`);
  console.log(`✅ Exists: ${existsSync(claudePath)}\n`);

  if (!existsSync(claudePath)) {
    console.log('❌ Claude Desktop LevelDB not found');
    return;
  }

  // Create temporary copy to avoid lock conflicts
  const tempDbPath = join(tmpdir(), `claude-desktop-conversations-${Date.now()}`);
  console.log(`📋 Copying database to: ${tempDbPath}`);

  try {
    cpSync(claudePath, tempDbPath, { recursive: true });
    console.log('✅ Database copied successfully\n');

    // Open the copied database
    const db = new ClassicLevel(tempDbPath);
    await db.open();
    console.log('✅ Database opened successfully\n');

    console.log('🔍 Scanning for conversation data...\n');

    let totalKeys = 0;
    const conversationData: Array<{ key: string; value: any; size: number }> = [];
    const keysByPrefix = new Map<string, number>();

    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      const valueStr = value.toString();
      totalKeys++;

      // Track prefixes
      const prefix = keyStr.split('-')[0] || keyStr.substring(0, 30);
      keysByPrefix.set(prefix, (keysByPrefix.get(prefix) || 0) + 1);

      // Look for conversation-related data
      const isConversationData =
        keyStr.includes('conversation') ||
        keyStr.includes('message') ||
        keyStr.includes('chat') ||
        valueStr.includes('"role"') ||
        valueStr.includes('"content"') ||
        valueStr.includes('"text"') ||
        valueStr.includes('"sender"') ||
        valueStr.includes('"uuid"') ||
        valueStr.length > 1000; // Large values likely contain conversation data

      if (isConversationData) {
        try {
          const parsed = JSON.parse(valueStr);
          conversationData.push({
            key: keyStr,
            value: parsed,
            size: valueStr.length,
          });
        } catch {
          // Not JSON, store as string
          conversationData.push({
            key: keyStr,
            value: valueStr.substring(0, 500),
            size: valueStr.length,
          });
        }
      }
    }

    await db.close();

    console.log('📊 Summary:');
    console.log(`Total keys: ${totalKeys}`);
    console.log(`Conversation-related keys: ${conversationData.length}\n`);

    console.log('🔑 Top Key Prefixes:');
    Array.from(keysByPrefix.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([prefix, count]) => {
        console.log(`  ${prefix}: ${count}`);
      });

    console.log('\n💬 Conversation Data Found:\n');
    conversationData
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((item, i) => {
        console.log(`${i + 1}. Key: ${item.key}`);
        console.log(`   Size: ${item.size} bytes`);
        if (typeof item.value === 'object') {
          console.log(`   Type: JSON object`);
          console.log(`   Keys: ${Object.keys(item.value).join(', ')}`);
          if (item.value.uuid) console.log(`   UUID: ${item.value.uuid}`);
          if (item.value.name) console.log(`   Name: ${item.value.name}`);
          if (item.value.chat_messages) {
            console.log(`   Messages: ${item.value.chat_messages.length}`);
          }
          if (item.value.text) {
            console.log(`   Text preview: ${item.value.text.substring(0, 100)}...`);
          }
        } else {
          console.log(`   Type: String`);
          console.log(`   Preview: ${item.value.substring(0, 200)}...`);
        }
        console.log('');
      });

    // Look for specific conversation patterns
    console.log('\n🔍 Looking for specific patterns...\n');

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const conversationUUIDs = new Set<string>();

    conversationData.forEach((item) => {
      const matches = item.key.match(uuidPattern);
      if (matches) {
        matches.forEach((uuid) => conversationUUIDs.add(uuid));
      }
      if (typeof item.value === 'string') {
        const valueMatches = item.value.match(uuidPattern);
        if (valueMatches) {
          valueMatches.forEach((uuid) => conversationUUIDs.add(uuid));
        }
      }
    });

    console.log(`Found ${conversationUUIDs.size} unique conversation UUIDs:`);
    Array.from(conversationUUIDs)
      .slice(0, 10)
      .forEach((uuid) => {
        console.log(`  - ${uuid}`);
      });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean up
    if (existsSync(tempDbPath)) {
      rmSync(tempDbPath, { recursive: true, force: true });
      console.log('\n✅ Cleaned up temporary database');
    }
  }
}

testClaudeDesktopConversations().catch(console.error);

