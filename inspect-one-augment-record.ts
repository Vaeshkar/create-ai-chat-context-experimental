#!/usr/bin/env node

/**
 * Inspect ONE Augment record to understand the data structure
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';

async function main() {
  const vscodeStoragePath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage'
  );

  const workspaceIds = readdirSync(vscodeStoragePath);

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

    try {
      const db = new ClassicLevel(augmentPath);
      await db.open();

      let count = 0;
      for await (const [key, value] of db.iterator()) {
        const keyStr = key.toString();

        // Find an exchange record
        if (keyStr.startsWith('exchange:')) {
          const valueStr = value.toString();
          const parsed = JSON.parse(valueStr);

          console.log('='.repeat(80));
          console.log('FOUND EXCHANGE RECORD');
          console.log('='.repeat(80));
          console.log('\nKey:', keyStr);
          console.log('\nValue (formatted):');
          console.log(JSON.stringify(parsed, null, 2));
          console.log('\n' + '='.repeat(80));

          await db.close();
          return;
        }

        count++;
        if (count > 100) break;
      }

      await db.close();
    } catch (error) {
      // Skip locked databases
    }
  }
}

main().catch(console.error);

