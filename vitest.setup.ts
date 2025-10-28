/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Vitest Setup
 * Configures global test directory for all test artifacts
 * Mocks child_process.spawn to prevent watcher daemon spawning during tests
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { vi } from 'vitest';

// Define global test directory
export const TEST_OUTPUT_DIR = join(process.cwd(), '.test-output');

// Ensure test output directory exists
if (!existsSync(TEST_OUTPUT_DIR)) {
  mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Make it available globally for tests
(global as any).TEST_OUTPUT_DIR = TEST_OUTPUT_DIR;

// Global mock for child_process.spawn to prevent watcher daemon spawning
// This prevents hundreds of `aice watch` processes from being spawned during tests
vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    spawn: vi.fn(() => ({
      unref: vi.fn(),
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      pid: 99999,
    })),
  };
});
