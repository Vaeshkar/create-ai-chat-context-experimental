#!/usr/bin/env npx tsx

/**
 * List ALL keys and their values to understand the complete structure
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';

async function listAllKeys() {
  const claudePath = join(homedir(), 'Library/Application Support/Claude/Local Storage/leveldb');

  console.log('🔍 Listing ALL keys from Claude Desktop LevelDB\n');

  if (!existsSync(claudePath)) {
    console.log('❌ Claude Desktop LevelDB not found');
    return;
  }

  const tempDbPath = join(tmpdir(), `claude-all-keys-${Date.now()}`);

  try {
    cpSync(claudePath, tempDbPath, { recursive: true });
    const db = new ClassicLevel(tempDbPath);
    await db.open();

    console.log('✅ Database opened\n');
    console.log('📋 ALL KEYS AND VALUES:\n');
    console.log('='.repeat(100));

    let count = 0;
    for await (const [key, value] of db.iterator()) {
      count++;
      const keyStr = key.toString();
      const valueStr = value.toString();

      console.log(`\n${count}. KEY: ${keyStr}`);
      console.log(`   LENGTH: ${valueStr.length} bytes`);

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(valueStr);
        console.log(`   TYPE: JSON`);
        console.log(`   VALUE:`);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        // Not JSON, show raw value
        console.log(`   TYPE: String/Binary`);
        if (valueStr.length < 200) {
          console.log(`   VALUE: ${valueStr}`);
        } else {
          console.log(`   VALUE (first 200 chars): ${valueStr.substring(0, 200)}...`);
        }
      }

      console.log('-'.repeat(100));
    }

    console.log(`\n📊 Total keys: ${count}`);

    await db.close();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (existsSync(tempDbPath)) {
      rmSync(tempDbPath, { recursive: true, force: true });
    }
  }
}

listAllKeys().catch(console.error);

