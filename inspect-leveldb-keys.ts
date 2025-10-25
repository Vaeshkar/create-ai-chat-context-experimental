#!/usr/bin/env node

/**
 * Inspect all keys in Augment LevelDB
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';

async function main() {
  console.log('🔍 Inspecting Augment LevelDB Keys\n');
  console.log('='.repeat(60) + '\n');

  const vscodeStoragePath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage'
  );

  if (!existsSync(vscodeStoragePath)) {
    console.log('❌ VSCode storage path not found');
    process.exit(1);
  }

  const workspaceIds = readdirSync(vscodeStoragePath);
  console.log(`Found ${workspaceIds.length} workspaces\n`);

  for (const workspaceId of workspaceIds) {
    const augmentPath = join(
      vscodeStoragePath,
      workspaceId,
      'Augment.vscode-augment',
      'augment-kv-store'
    );

    if (!existsSync(augmentPath)) {
      continue;
    }

    console.log(`📁 Workspace: ${workspaceId}`);
    console.log(`   Path: ${augmentPath}\n`);

    try {
      const db = new ClassicLevel(augmentPath);

      // Add timeout
      const openPromise = db.open();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      try {
        await Promise.race([openPromise, timeoutPromise]);
      } catch {
        console.log('   ⚠️  Database locked or inaccessible\n');
        continue;
      }

      let keyCount = 0;
      const keys: string[] = [];

      try {
        for await (const [key] of db.iterator()) {
          const keyStr = key.toString();
          keys.push(keyStr);
          keyCount++;
          if (keyCount <= 20) {
            console.log(`   Key ${keyCount}: ${keyStr}`);
          }
        }
      } finally {
        try {
          await db.close();
        } catch {
          // Ignore
        }
      }

      console.log(`\n   Total keys: ${keyCount}`);
      if (keyCount > 20) {
        console.log(`   (showing first 20 of ${keyCount})`);
      }

      // Show key patterns
      const patterns = new Set<string>();
      keys.forEach((k) => {
        const match = k.match(/^[^:]+/);
        if (match) patterns.add(match[0]);
      });

      console.log(`\n   Key patterns found:`);
      Array.from(patterns)
        .sort()
        .forEach((p) => {
          const count = keys.filter((k) => k.startsWith(p)).length;
          console.log(`     - ${p}: ${count} keys`);
        });

      console.log('\n' + '='.repeat(60) + '\n');
    } catch (error) {
      console.log(`   ❌ Error: ${error}\n`);
    }
  }
}

main().catch(console.error);

