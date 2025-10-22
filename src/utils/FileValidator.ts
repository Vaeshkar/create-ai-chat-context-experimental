/**
 * File Validator
 * Phase 3.2: File I/O - Memory File Writing - October 2025
 *
 * Validates file integrity, format, and content
 */

import { readFileSync, existsSync } from 'fs';
import { extname } from 'path';

export type ValidationResult =
  | { ok: true; isValid: true; warnings: string[] }
  | { ok: true; isValid: false; errors: string[]; warnings: string[] }
  | { ok: false; error: string };

/**
 * File Validator for content and format validation
 */
export class FileValidator {
  /**
   * Validate AICF format file
   */
  validateAICF(filePath: string): ValidationResult {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const content = readFileSync(filePath, 'utf-8');
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if file is empty
      if (!content.trim()) {
        errors.push('File is empty');
        return { ok: true, isValid: false, errors, warnings };
      }

      // Parse lines
      const lines = content.split('\n').filter((line) => line.trim());

      // Check for required fields
      const requiredFields = ['version', 'timestamp', 'conversationId'];
      const foundFields = new Set<string>();

      for (const line of lines) {
        const [field] = line.split('|');
        if (field) {
          foundFields.add(field);
        }
      }

      for (const field of requiredFields) {
        if (!foundFields.has(field)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate version format
      const versionLine = lines.find((line) => line.startsWith('version|'));
      if (versionLine) {
        const version = versionLine.split('|')[1];
        if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
          errors.push(`Invalid version format: ${version}`);
        }
      }

      // Validate timestamp format
      const timestampLine = lines.find((line) => line.startsWith('timestamp|'));
      if (timestampLine) {
        const timestamp = timestampLine.split('|')[1];
        if (!timestamp || isNaN(Date.parse(timestamp))) {
          errors.push(`Invalid timestamp format: ${timestamp}`);
        }
      }

      // Check for pipe-delimited format
      for (const line of lines) {
        if (!line.includes('|')) {
          warnings.push(`Line does not contain pipe delimiter: ${line.substring(0, 50)}...`);
        }
      }

      return {
        ok: true,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate Markdown format file
   */
  validateMarkdown(filePath: string): ValidationResult {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const content = readFileSync(filePath, 'utf-8');
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if file is empty
      if (!content.trim()) {
        errors.push('File is empty');
        return { ok: true, isValid: false, errors, warnings };
      }

      // Check for markdown headers
      if (!content.includes('#')) {
        warnings.push('No markdown headers found');
      }

      // Check for basic markdown structure
      const lines = content.split('\n');
      if (lines.length < 3) {
        warnings.push('File appears to be very short');
      }

      // Check for common markdown elements
      const hasHeaders = /^#+\s/m.test(content);

      if (!hasHeaders) {
        warnings.push('No markdown headers detected');
      }

      return {
        ok: true,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate JSON format file
   */
  validateJSON(filePath: string): ValidationResult {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const content = readFileSync(filePath, 'utf-8');
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if file is empty
      if (!content.trim()) {
        errors.push('File is empty');
        return { ok: true, isValid: false, errors, warnings };
      }

      // Try to parse JSON
      try {
        JSON.parse(content);
      } catch (parseError) {
        errors.push(
          `Invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }

      return {
        ok: true,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate file by extension
   */
  validateByExtension(filePath: string): ValidationResult {
    const ext = extname(filePath).toLowerCase();

    switch (ext) {
      case '.aicf':
        return this.validateAICF(filePath);
      case '.md':
        return this.validateMarkdown(filePath);
      case '.json':
        return this.validateJSON(filePath);
      default:
        return {
          ok: true,
          isValid: true,
          warnings: [`Unknown file extension: ${ext}`],
        };
    }
  }

  /**
   * Validate file content length
   */
  validateContentLength(
    filePath: string,
    minLength: number = 10,
    maxLength: number = 10_000_000
  ): ValidationResult {
    try {
      if (!existsSync(filePath)) {
        return { ok: false, error: `File not found: ${filePath}` };
      }

      const content = readFileSync(filePath, 'utf-8');
      const errors: string[] = [];
      const warnings: string[] = [];

      if (content.length < minLength) {
        errors.push(`File content too short: ${content.length} bytes (minimum: ${minLength})`);
      }

      if (content.length > maxLength) {
        errors.push(`File content too long: ${content.length} bytes (maximum: ${maxLength})`);
      }

      return {
        ok: true,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
