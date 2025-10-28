/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Test Helpers
 * Utilities for creating and managing test directories
 */

import { mkdtempSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Get the centralized test output directory
 * All test artifacts should be created within this directory
 */
export function getTestOutputDir(): string {
  const testOutputDir = join(process.cwd(), '.test-output');
  return testOutputDir;
}

/**
 * Create a temporary test directory within the centralized test output folder
 * @param prefix - Prefix for the temporary directory name
 * @returns Path to the created temporary directory
 */
export function createTestDir(prefix: string = 'test-'): string {
  const testOutputDir = getTestOutputDir();
  const testDir = mkdtempSync(join(testOutputDir, prefix));
  return testDir;
}

/**
 * Clean up a test directory with retry logic
 * @param testDir - Path to the test directory to clean up
 * @param maxAttempts - Maximum number of cleanup attempts (default: 3)
 */
export function cleanupTestDir(testDir: string, maxAttempts: number = 3): void {
  if (!existsSync(testDir)) return;

  // Retry cleanup up to maxAttempts times with delays (handles file locks)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      rmSync(testDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return; // Success
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.warn(`Failed to cleanup ${testDir} after ${maxAttempts} attempts:`, error);
      }
    }
  }
}

/**
 * Create a test directory manager that tracks all created directories
 * and provides automatic cleanup
 */
export class TestDirManager {
  private testDirs: string[] = [];

  /**
   * Create a new test directory
   * @param prefix - Prefix for the temporary directory name
   * @returns Path to the created temporary directory
   */
  create(prefix: string = 'test-'): string {
    const testDir = createTestDir(prefix);
    this.testDirs.push(testDir);
    return testDir;
  }

  /**
   * Clean up a specific test directory
   * @param testDir - Path to the test directory to clean up
   */
  cleanup(testDir: string): void {
    cleanupTestDir(testDir);
    this.testDirs = this.testDirs.filter((dir) => dir !== testDir);
  }

  /**
   * Clean up all test directories created by this manager
   */
  cleanupAll(): void {
    for (const testDir of this.testDirs) {
      cleanupTestDir(testDir);
    }
    this.testDirs = [];
  }
}
