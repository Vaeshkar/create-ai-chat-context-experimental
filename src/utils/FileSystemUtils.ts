/**
 * File System Utilities
 * Common file operations for watchers
 * October 2025
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Get project path
 */
export function getProjectPath(basePath: string, projectName: string): string {
  return join(basePath, projectName);
}

/**
 * List files in directory
 */
export function listFiles(dirPath: string): Result<string[]> {
  try {
    if (!existsSync(dirPath)) {
      return Ok([]);
    }

    const files = readdirSync(dirPath);
    return Ok(files);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(new Error(`Failed to list files: ${message}`));
  }
}

/**
 * List files with specific extension
 */
export function listFilesByExtension(dirPath: string, extension: string): Result<string[]> {
  try {
    const result = listFiles(dirPath);
    if (!result.ok) {
      return result;
    }

    const filtered = result.value.filter((f) => f.endsWith(extension));
    return Ok(filtered);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(new Error(`Failed to list files by extension: ${message}`));
  }
}

/**
 * Read file content
 */
export function readFile(filePath: string): Result<string> {
  try {
    if (!existsSync(filePath)) {
      return Err(new Error(`File not found: ${filePath}`));
    }

    const content = readFileSync(filePath, 'utf-8');
    return Ok(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(new Error(`Failed to read file: ${message}`));
  }
}

/**
 * Get latest file (by modification time)
 */
export function getLatestFile(dirPath: string, extension?: string): Result<string | null> {
  try {
    const filesResult = extension ? listFilesByExtension(dirPath, extension) : listFiles(dirPath);

    if (!filesResult.ok) {
      return filesResult;
    }

    const files = filesResult.value;
    if (files.length === 0) {
      return Ok(null);
    }

    let latestFile = files[0];
    let latestTime = 0;

    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        const stat = statSync(filePath);
        if (stat.mtimeMs > latestTime) {
          latestTime = stat.mtimeMs;
          latestFile = file;
        }
      } catch {
        // Skip files that can't be stat'd
        continue;
      }
    }

    return Ok(latestFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Err(new Error(`Failed to get latest file: ${message}`));
  }
}

/**
 * Filter files by extension
 */
export function filterByExtension(files: string[], extension: string): string[] {
  return files.filter((f) => f.endsWith(extension));
}

/**
 * Check if path exists
 */
export function pathExists(path: string): boolean {
  return existsSync(path);
}

