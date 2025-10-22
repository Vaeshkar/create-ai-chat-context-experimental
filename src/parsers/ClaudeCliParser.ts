/**
 * Claude CLI Parser
 * Extracts conversation data from Claude Code (CLI) JSONL format
 * Phase 5.5a: October 2025
 *
 * Parses JSONL files from ~/.claude/projects/{project}/{session-id}.jsonl
 * Each line is a JSON object representing a message or event
 */

import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { extractStringContent, isValidContent } from '../utils/ParserUtils.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import { handleError } from '../utils/ErrorUtils.js';

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
          const content = extractStringContent(data.content);
          if (!isValidContent(content)) {
            continue;
          }

          // Create message
          const rawLength =
            typeof data.content === 'string'
              ? data.content.length
              : JSON.stringify(data.content).length;

          const id = data.uuid || `claude-cli-${sessionId}-${messageIndex}`;

          const message = MessageBuilder.createWithPlatform({
            id,
            conversationId: sessionId,
            timestamp: data.timestamp,
            role: data.role === 'assistant' ? 'assistant' : 'user',
            content,
            platform: 'claude-cli',
            extractedFrom: 'claude-cli-jsonl',
            messageType: data.role === 'assistant' ? 'ai_response' : 'user_request',
            rawLength,
            metadata: {
              ...(data.tokenUsage && { tokenUsage: data.tokenUsage }),
              ...(data.thinking && { thinking: data.thinking }),
              ...(data.metadata?.gitBranch && { gitBranch: data.metadata.gitBranch }),
              ...(data.metadata?.workingDirectory && {
                workingDirectory: data.metadata.workingDirectory,
              }),
            },
          });

          messages.push(message);
          messageIndex++;
        } catch (lineError) {
          // Skip malformed JSON lines
          continue;
        }
      }

      return Ok(messages);
    } catch (error) {
      return Err(handleError(error, 'Failed to parse Claude CLI JSONL'));
    }
  }
}
