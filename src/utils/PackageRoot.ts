/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Package Root Utility
 *
 * Finds the package root directory in both development and production environments.
 * Works with both ESM and CJS builds.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

/**
 * Get the current file's directory
 * This function uses a trick: new Error().stack to get the file path
 * Works in both ESM and CJS without using import.meta or __dirname
 */
function getCurrentFileDir(): string | undefined {
  try {
    // Create an error to get the stack trace
    const error = new Error();
    const stack = error.stack;

    if (!stack) return undefined;

    // Parse the stack to find this file's path
    // Stack format varies, but typically includes file:// URLs or absolute paths
    const lines = stack.split('\n');

    for (const line of lines) {
      // Look for file:// URLs (ESM)
      const fileMatch = line.match(/file:\/\/([^:)]+)/);
      if (fileMatch && fileMatch[1]) {
        const filePath = fileURLToPath(`file://${fileMatch[1]}`);
        if (filePath && filePath.includes('PackageRoot')) {
          return dirname(filePath);
        }
      }

      // Look for absolute paths (CJS)
      const pathMatch = line.match(/\(([^:)]+):\d+:\d+\)/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        if (filePath && filePath.includes('PackageRoot')) {
          return dirname(filePath);
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get the package root directory
 *
 * Strategy: Find this file's location, then search up for package.json
 * This works in both ESM and CJS, both development and production
 *
 * @returns Absolute path to package root directory
 */
export function getPackageRoot(): string {
  // Strategy 1: Use stack trace to find this file's location
  const currentDir = getCurrentFileDir();

  if (currentDir) {
    // Search up from this file's location to find package.json
    let searchDir = currentDir;
    for (let i = 0; i < 10; i++) {
      const packageJsonPath = join(searchDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          if (packageJson.name === 'create-ai-chat-context-experimental') {
            return searchDir;
          }
        } catch {
          // Invalid package.json, continue searching
        }
      }

      // Go up one level
      const parentDir = dirname(searchDir);
      if (parentDir === searchDir) {
        break; // Hit root
      }
      searchDir = parentDir;
    }
  }

  // Strategy 2: Search up from cwd (fallback for development)
  let searchDir = process.cwd();

  for (let i = 0; i < 10; i++) {
    const packageJsonPath = join(searchDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'create-ai-chat-context-experimental') {
          return searchDir;
        }
      } catch {
        // Invalid package.json, continue searching
      }
    }

    // Go up one level
    const parentDir = dirname(searchDir);
    if (parentDir === searchDir) {
      break; // Hit root
    }
    searchDir = parentDir;
  }

  // Last resort: assume we're in the package directory
  return process.cwd();
}

/**
 * Get the templates directory
 *
 * Templates are at: dist/templates/ (built) or templates/ (source) relative to package root
 *
 * @returns Absolute path to templates directory
 */
export function getTemplatesDir(): string {
  const packageRoot = getPackageRoot();

  // Try dist/templates first (built version)
  const distTemplatesDir = join(packageRoot, 'dist', 'templates');
  if (existsSync(distTemplatesDir)) {
    return distTemplatesDir;
  }

  // Fall back to templates (source version)
  const sourceTemplatesDir = join(packageRoot, 'templates');
  return sourceTemplatesDir;
}

/**
 * Verify that the templates directory exists
 *
 * @returns true if templates directory exists, false otherwise
 */
export function templatesExist(): boolean {
  const templatesDir = getTemplatesDir();
  return existsSync(templatesDir);
}
