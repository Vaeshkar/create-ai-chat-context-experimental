/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Vitest Global Setup
 * Cleans up test artifacts after all tests complete
 */

import { rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Global teardown - runs after all tests complete
 * Cleans up any leftover test directories and log files
 */
export async function teardown() {
  const cwd = process.cwd();
  
  try {
    // Get all files/directories in root
    const entries = readdirSync(cwd);
    
    // Find test artifacts
    const testArtifacts = entries.filter((entry) => {
      return (
        entry.startsWith('.test-') ||
        entry === '.watcher.log' ||
        entry === 'augment-import.log' ||
        entry === 'NEW_CHAT_PROMPT.md' ||
        entry.startsWith('TEST-')
      );
    });
    
    // Clean up each artifact
    for (const artifact of testArtifacts) {
      const artifactPath = join(cwd, artifact);
      try {
        const stats = statSync(artifactPath);
        if (stats.isDirectory()) {
          rmSync(artifactPath, { recursive: true, force: true });
          console.log(`✅ Cleaned up test directory: ${artifact}`);
        } else {
          rmSync(artifactPath, { force: true });
          console.log(`✅ Cleaned up test file: ${artifact}`);
        }
      } catch (error) {
        // Ignore errors - artifact might already be cleaned up
      }
    }
    
    if (testArtifacts.length > 0) {
      console.log(`\n🧹 Cleaned up ${testArtifacts.length} test artifacts`);
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
}

