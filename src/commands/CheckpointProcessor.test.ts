/**
 * CheckpointProcessor Tests
 * Phase 3: CLI Integration - October 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { CheckpointProcessor } from './CheckpointProcessor.js';
import type { Conversation } from '../types/conversation.js';

describe('CheckpointProcessor', () => {
  let tempDir: string;
  let outputDir: string;

  beforeEach(() => {
    tempDir = join(process.cwd(), '.test-checkpoints');
    outputDir = join(tempDir, '.aicf');
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  function createTestCheckpoint(conversationId: string = 'test-conv-1'): object {
    const conversation: Conversation = {
      id: conversationId,
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What is the best way to implement authentication in TypeScript?',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content:
            'JWT tokens are recommended for scalability and security in TypeScript applications',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      conversation,
      rawData: undefined,
      timestamp: new Date().toISOString(),
      source: 'test',
    };
  }

  it('should process a valid checkpoint file', async () => {
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
      backup: false,
    });

    await processor.process(checkpointPath);

    // Verify output files were created
    const aicfPath = join(outputDir, 'test-conv-1.aicf');
    const aiPath = join(outputDir, 'test-conv-1.ai.md');

    expect(existsSync(aicfPath)).toBe(true);
    expect(existsSync(aiPath)).toBe(true);
  });

  it('should throw error for non-existent file', async () => {
    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    await expect(processor.process('/non/existent/file.json')).rejects.toThrow(
      'Checkpoint file not found'
    );
  });

  it('should throw error for invalid checkpoint structure', async () => {
    const checkpointPath = join(tempDir, 'invalid.json');
    writeFileSync(checkpointPath, JSON.stringify({ invalid: 'structure' }));

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    await expect(processor.process(checkpointPath)).rejects.toThrow('Invalid checkpoint structure');
  });

  it('should create output directory if it does not exist', async () => {
    const newOutputDir = join(tempDir, 'new', 'output', 'dir');
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const processor = new CheckpointProcessor({
      output: newOutputDir,
      verbose: false,
    });

    await processor.process(checkpointPath);

    expect(existsSync(newOutputDir)).toBe(true);
  });

  it('should create backup files when backup option is enabled', async () => {
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const aicfPath = join(outputDir, 'test-conv-1.aicf');
    const aiPath = join(outputDir, 'test-conv-1.ai.md');

    // Create initial files
    writeFileSync(aicfPath, 'old content');
    writeFileSync(aiPath, 'old content');

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
      backup: true,
    });

    await processor.process(checkpointPath);

    // Verify backup files were created
    expect(existsSync(`${aicfPath}.backup`)).toBe(true);
    expect(existsSync(`${aiPath}.backup`)).toBe(true);

    // Verify backup content
    const backupContent = readFileSync(`${aicfPath}.backup`, 'utf-8');
    expect(backupContent).toBe('old content');
  });

  it('should handle checkpoint with raw data', async () => {
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    (checkpoint as any).rawData = `
      "request_message": "What is TypeScript?"
      "response_text": "TypeScript is a typed superset of JavaScript"
    `;
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    await processor.process(checkpointPath);

    const aicfPath = join(outputDir, 'test-conv-1.aicf');
    expect(existsSync(aicfPath)).toBe(true);
  });

  it('should generate valid AICF content', async () => {
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    await processor.process(checkpointPath);

    const aicfPath = join(outputDir, 'test-conv-1.aicf');
    const content = readFileSync(aicfPath, 'utf-8');

    // Verify AICF format (pipe-delimited)
    expect(content).toContain('version|');
    expect(content).toContain('timestamp|');
    expect(content).toContain('conversationId|');
  });

  it('should generate valid Markdown content', async () => {
    const checkpointPath = join(tempDir, 'checkpoint.json');
    const checkpoint = createTestCheckpoint();
    writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    await processor.process(checkpointPath);

    const aiPath = join(outputDir, 'test-conv-1.ai.md');
    const content = readFileSync(aiPath, 'utf-8');

    // Verify Markdown format
    expect(content).toContain('# Conversation Analysis');
    expect(content).toContain('## User Intents');
    expect(content).toContain('## AI Actions');
  });

  it('should handle multiple checkpoint files', async () => {
    const processor = new CheckpointProcessor({
      output: outputDir,
      verbose: false,
    });

    // Create and process multiple checkpoints
    for (let i = 1; i <= 3; i++) {
      const checkpointPath = join(tempDir, `checkpoint-${i}.json`);
      const checkpoint = createTestCheckpoint(`test-conv-${i}`);
      writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));

      await processor.process(checkpointPath);
    }

    // Verify all output files were created
    for (let i = 1; i <= 3; i++) {
      const aicfPath = join(outputDir, `test-conv-${i}.aicf`);
      const aiPath = join(outputDir, `test-conv-${i}.ai.md`);
      expect(existsSync(aicfPath)).toBe(true);
      expect(existsSync(aiPath)).toBe(true);
    }
  });
});
