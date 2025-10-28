/**
 * Test script to read Claude Desktop LevelDB
 * Claude Desktop stores conversations in IndexedDB (LevelDB format)
 * Location: ~/Library/Application Support/Claude/IndexedDB/https_claude.ai_0.indexeddb.leveldb/
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function testClaudeDesktopLevelDB() {
  const paths = [
    join(homedir(), 'Library/Application Support/Claude/Local Storage/leveldb'),
    join(homedir(), 'Library/Application Support/Claude/Session Storage'),
    join(
      homedir(),
      'Library/Application Support/Claude/IndexedDB/https_claude.ai_0.indexeddb.leveldb'
    ),
  ];

  for (const claudePath of paths) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 Testing: ${claudePath.split('/').slice(-2).join('/')}\n`);
    console.log(`📂 Full Path: ${claudePath}`);
    console.log(`✅ Exists: ${existsSync(claudePath)}\n`);

    if (!existsSync(claudePath)) {
      console.log('❌ Not found\n');
      continue;
    }

    // Create temporary copy to avoid lock conflicts
    const tempDbPath = join(tmpdir(), `claude-desktop-leveldb-test-${Date.now()}`);
    console.log(`📋 Copying database to: ${tempDbPath}`);

    try {
      cpSync(claudePath, tempDbPath, { recursive: true });
      console.log('✅ Database copied successfully\n');

      // Open the copied database
      const db = new ClassicLevel(tempDbPath);
      await db.open();
      console.log('✅ Database opened successfully\n');

      console.log('🔍 Scanning keys...\n');

      let totalKeys = 0;
      const keyPrefixes = new Map<string, number>();
      const sampleKeys: string[] = [];
      let conversationKeys = 0;

      for await (const [key, value] of db.iterator()) {
        const keyStr = key.toString();
        const valueStr = value.toString();
        totalKeys++;

        // Track key prefixes
        const prefix = keyStr.split(':')[0] || keyStr.substring(0, 20);
        keyPrefixes.set(prefix, (keyPrefixes.get(prefix) || 0) + 1);

        // Collect sample keys
        if (sampleKeys.length < 10) {
          sampleKeys.push(keyStr);
        }

        // Look for conversation-like data
        if (
          keyStr.includes('conversation') ||
          keyStr.includes('message') ||
          keyStr.includes('chat') ||
          valueStr.includes('"role"') ||
          valueStr.includes('"content"') ||
          valueStr.includes('"text"')
        ) {
          conversationKeys++;
          if (conversationKeys <= 5) {
            console.log(`🔑 Key: ${keyStr.substring(0, 100)}`);
            console.log(`📝 Value (first 300 chars): ${valueStr.substring(0, 300)}\n`);
          }
        }
      }

      await db.close();

      console.log('\n📊 Summary:');
      console.log(`Total keys: ${totalKeys}`);
      console.log(`Conversation-like keys: ${conversationKeys}`);
      console.log(`\nTop key prefixes:`);
      for (const [prefix, count] of Array.from(keyPrefixes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)) {
        console.log(`  ${prefix}: ${count}`);
      }

      console.log(`\nSample keys (first 10):`);
      sampleKeys.forEach((key, i) => {
        console.log(`  ${i + 1}. ${key.substring(0, 100)}`);
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
}

testClaudeDesktopLevelDB().catch(console.error);
