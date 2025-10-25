/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Import Claude Command
 * Phase 5.4: Import Command Implementation - October 2025
 *
 * Imports Claude conversation exports and generates memory files
 *
 * TODO: Future Enhancement (Phase 5.5+)
 * After writing to cache, trigger consolidation pipeline:
 * 1. CacheConsolidationAgent.consolidate() → .aicf/recent/
 * 2. SessionConsolidationAgent.consolidate() → .aicf/sessions/
 * 3. MemoryDropoffAgent.dropoff() → .aicf/medium/old/archive/
 *
 * Current behavior: Writes to .cache/llm/claude/ only (cache-first approach ✅)
 * Missing: Automatic consolidation trigger (requires WatcherCommand integration)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { randomUUID } from 'crypto';
import { ClaudeParser } from '../parsers/ClaudeParser.js';
import type { Result } from '../types/result.js';
import type { Message } from '../types/conversation.js';
import { Ok, Err } from '../types/result.js';

export interface ImportClaudeCommandOptions {
  cwd?: string;
  output?: string;
  verbose?: boolean;
}

export interface ImportClaudeResult {
  conversationId: string;
  messageCount: number;
  outputPath: string;
  filesCreated: string[];
  message: string;
}

/**
 * Import Claude conversation exports and generate memory files
 */
export class ImportClaudeCommand {
  private cwd: string;
  private output: string;
  private parser: ClaudeParser;

  constructor(options: ImportClaudeCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.output = options.output || '.cache/llm/claude';
    this.parser = new ClaudeParser();
  }

  /**
   * Execute import command
   */
  async execute(filePath: string): Promise<Result<ImportClaudeResult>> {
    const spinner = ora();

    try {
      // Step 1: Validate file exists
      if (!existsSync(filePath)) {
        return Err(new Error(`Claude export file not found: ${filePath}`));
      }

      spinner.start(`📂 Reading Claude export: ${basename(filePath)}`);

      // Step 2: Read and parse JSON
      const fileContent = readFileSync(filePath, 'utf-8');
      let exportData: unknown;

      try {
        exportData = JSON.parse(fileContent);
      } catch {
        spinner.fail('Invalid JSON format');
        return Err(new Error('Claude export file is not valid JSON'));
      }

      spinner.succeed('✅ File loaded');

      // Step 3: Parse using ClaudeParser
      spinner.start('🔍 Parsing Claude export...');
      const parseResult = this.parser.parse(exportData);

      if (!parseResult.ok) {
        spinner.fail('Failed to parse Claude export');
        return Err(parseResult.error);
      }

      const messages = parseResult.value;
      spinner.succeed(`✅ Parsed ${messages.length} messages`);

      if (messages.length === 0) {
        spinner.warn('⚠️  No messages found in export');
        return Ok({
          conversationId: 'empty',
          messageCount: 0,
          outputPath: this.output,
          filesCreated: [],
          message: 'No messages to import',
        });
      }

      // Step 4: Create output directory
      spinner.start('📁 Creating output directory...');
      const outputDir = join(this.cwd, this.output);
      mkdirSync(outputDir, { recursive: true });
      spinner.succeed('✅ Output directory ready');

      // Step 5: Generate checkpoint file
      spinner.start('💾 Generating checkpoint file...');
      const firstMessage = messages[0];
      if (!firstMessage) {
        spinner.fail('❌ No messages to checkpoint');
        return Err(new Error('No messages extracted'));
      }
      const conversationId = firstMessage.conversationId;
      const checkpointId = randomUUID();
      const checkpointFile = join(outputDir, `checkpoint-${checkpointId}.json`);

      const checkpoint = {
        sessionId: checkpointId,
        conversationId,
        source: 'claude',
        timestamp: new Date().toISOString(),
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      };

      writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf-8');
      spinner.succeed('✅ Checkpoint created');

      // Step 6: Generate memory files
      spinner.start('📝 Generating memory files...');
      const filesCreated = [checkpointFile];

      // Generate AICF file
      const aicfContent = this.generateAICFContent(conversationId, messages.length);
      const aicfFile = join(outputDir, `${conversationId}.aicf`);
      writeFileSync(aicfFile, aicfContent, 'utf-8');
      filesCreated.push(aicfFile);

      // Generate Markdown file
      const mdContent = this.generateMarkdownContent(conversationId, messages);
      const mdFile = join(outputDir, `${conversationId}.md`);
      writeFileSync(mdFile, mdContent, 'utf-8');
      filesCreated.push(mdFile);

      spinner.succeed('✅ Memory files generated');

      // Step 7: Display summary
      console.log();
      console.log(chalk.green('✅ Claude Import Complete'));
      console.log();
      console.log(chalk.dim('Summary:'));
      console.log(chalk.dim(`  Conversation ID: ${conversationId}`));
      console.log(chalk.dim(`  Messages: ${messages.length}`));
      console.log(chalk.dim(`  Output: ${this.output}`));
      console.log(chalk.dim(`  Files Created: ${filesCreated.length}`));
      console.log();
      console.log(chalk.dim('Files:'));
      filesCreated.forEach((file) => {
        const relativePath = file.replace(this.cwd, '.');
        console.log(chalk.dim(`  - ${relativePath}`));
      });
      console.log();

      return Ok({
        conversationId,
        messageCount: messages.length,
        outputPath: this.output,
        filesCreated,
        message: `Successfully imported ${messages.length} messages from Claude export`,
      });
    } catch (error) {
      spinner.fail('❌ Import failed');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Generate AICF content
   */
  private generateAICFContent(conversationId: string, messageCount: number): string {
    const timestamp = new Date().toISOString();
    return `@CONVERSATION|id=${conversationId}|source=claude|timestamp=${timestamp}
@METADATA|messages=${messageCount}|format=aicf|version=1.0
@IMPORT|source=claude-export|timestamp=${timestamp}|user=system
`;
  }

  /**
   * Generate Markdown content
   */
  private generateMarkdownContent(conversationId: string, messages: Message[]): string {
    const lines: string[] = [];

    lines.push(`# ${conversationId}`);
    lines.push('');
    lines.push(`**Source:** Claude Export`);
    lines.push(`**Imported:** ${new Date().toISOString()}`);
    lines.push(`**Messages:** ${messages.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of messages) {
      const role = msg.role === 'user' ? '👤 User' : '🤖 Claude';
      lines.push(`## ${role}`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
    }

    return lines.join('\n');
  }
}
