/**
 * Claude CLI Parser
 * Extracts conversation data from Claude Code (CLI) JSONL format
 * Phase 5.5a: October 2025
 *
 * Parses JSONL files from ~/.claude/projects/{project}/{session-id}.jsonl
 * Each line is a JSON object representing a message or event
 */

import { randomUUID } from 'crypto';
import type { Message } from '../types/index.js';
import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Claude CLI message structure from JSONL
 */
interface ClaudeCliMessage {
  type: string;
  role?: 'user' | 'assistant';
  content?: string | Record<string, unknown>;
  timestamp?: string;
  uuid?: string;
  sessionId?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
  thinking?: string;
  metadata?: {
    gitBranch?: string;
    workingDirectory?: string;
    version?: string;
  };
}

/**
 * Parse Claude CLI JSONL format
 * Converts JSONL messages to standard Message format
 */
export class ClaudeCliParser {
  /**
   * Parse JSONL content from Claude Code session file
   *
   * @param jsonlContent - Raw JSONL content (one JSON per line)
   * @param sessionId - Session ID for conversation grouping
   * @returns Result with Message[] or error
   */
  parse(jsonlContent: string, sessionId: string): Result<Message[]> {
    try {
      if (!jsonlContent || typeof jsonlContent !== 'string') {
        return Err(new ExtractionError('Invalid Claude CLI JSONL: not a string'));
      }

      const messages: Message[] = [];
      const lines = jsonlContent.split('\n').filter((line) => line.trim());

      let messageIndex = 0;

      for (const line of lines) {
        try {
          const data = JSON.parse(line) as ClaudeCliMessage;

          // Skip non-message types (events, metadata, etc.)
          if (data.type !== 'message') {
            continue;
          }

          // Skip if no role or content
          if (!data.role || !data.content) {
            continue;
          }

          // Extract content
          const content = this.extractContent(data.content);
          if (!content || content.length === 0) {
            continue;
          }

          // Create message
          messages.push({
            id: data.uuid || `claude-cli-${sessionId}-${messageIndex}`,
            conversationId: sessionId,
            timestamp: data.timestamp || new Date().toISOString(),
            role: data.role === 'assistant' ? 'assistant' : 'user',
            content,
            metadata: {
              extractedFrom: 'claude-cli-jsonl',
              rawLength: typeof data.content === 'string' ? data.content.length : JSON.stringify(data.content).length,
              messageType: data.role === 'assistant' ? 'ai_response' : 'user_request',
              platform: 'claude-cli',
              // Store additional metadata
              ...(data.tokenUsage && { tokenUsage: data.tokenUsage }),
              ...(data.thinking && { thinking: data.thinking }),
              ...(data.metadata?.gitBranch && { gitBranch: data.metadata.gitBranch }),
              ...(data.metadata?.workingDirectory && { workingDirectory: data.metadata.workingDirectory }),
            },
          });

          messageIndex++;
        } catch (lineError) {
          // Skip malformed JSON lines
          continue;
        }
      }

      return Ok(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new ExtractionError(`Failed to parse Claude CLI JSONL: ${message}`, error));
    }
  }

  /**
   * Extract content from Claude CLI message
   * Handles string and structured content
   *
   * @param content - Message content (string or object)
   * @returns Extracted text content
   */
  private extractContent(content: string | Record<string, unknown>): string {
    if (typeof content === 'string') {
      return content.trim();
    }

    if (typeof content === 'object' && content !== null) {
      // Handle structured content
      if (typeof content.text === 'string') {
        return content.text.trim();
      }
      if (typeof content.message === 'string') {
        return content.message.trim();
      }
      // Fallback: stringify the object
      return JSON.stringify(content);
    }

    return '';
  }
}

