/**
 * Warp Parser
 * Extracts conversation data from Warp Terminal SQLite database
 * October 2025
 */

import type { Message } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { MessageBuilder } from '../utils/MessageBuilder.js';
import { handleError } from '../utils/ErrorUtils.js';

/**
 * Warp query structure from SQLite ai_queries table
 */
interface WarpQuery {
  exchange_id: string;
  conversation_id: string;
  start_ts: string;
  input: string;
  working_directory?: string;
  output_status: string;
  model_id?: string;
}

/**
 * Parse Warp Terminal SQLite format
 * Extracts messages from Warp AI queries
 */
export class WarpParser {
  /**
   * Parse raw Warp query data into messages
   *
   * @param queries - Array of Warp queries from SQLite
   * @param conversationId - Conversation ID
   * @returns Result with Message[] or error
   */
  parse(queries: WarpQuery[], conversationId: string): Result<Message[]> {
    try {
      if (!queries || queries.length === 0) {
        return Ok([]);
      }

      const messages = this.extractMessages(queries, conversationId);
      return Ok(messages);
    } catch (error) {
      return Err(handleError(error, 'Failed to parse Warp data'));
    }
  }

  /**
   * Extract messages from Warp queries
   * Handles JSON-formatted queries and action results
   */
  private extractMessages(queries: WarpQuery[], conversationId: string): Message[] {
    const messages: Message[] = [];
    let messageIndex = 0;

    for (const query of queries) {
      try {
        const inputData = JSON.parse(query.input);

        // Handle array of query items
        if (Array.isArray(inputData)) {
          for (const item of inputData) {
            // Extract user query
            if (item.Query && item.Query.text) {
              const content = this.cleanContent(item.Query.text);
              if (content && content.length > 0) {
                const message = MessageBuilder.createWithPlatform({
                  prefix: 'warp-user',
                  index: messageIndex,
                  conversationId,
                  timestamp: query.start_ts,
                  role: 'user',
                  content,
                  platform: 'warp',
                  extractedFrom: 'warp-query',
                  messageType: 'user_request',
                  rawLength: item.Query.text.length,
                });
                messages.push(message);
                messageIndex++;
              }
            }

            // Extract AI action results
            if (item.ActionResult && item.ActionResult.result) {
              const actionContent = this.extractActionResult(item.ActionResult.result);
              if (actionContent && actionContent.length > 0) {
                const message = MessageBuilder.createWithPlatform({
                  prefix: 'warp-action',
                  index: messageIndex,
                  conversationId,
                  timestamp: query.start_ts,
                  role: 'assistant',
                  content: actionContent,
                  platform: 'warp',
                  extractedFrom: 'warp-action-result',
                  messageType: 'ai_response',
                  rawLength: actionContent.length,
                });
                messages.push(message);
                messageIndex++;
              }
            }
          }
        }
      } catch (parseError) {
        // If not JSON, treat as plain text query
        const content = this.cleanContent(query.input);
        if (content && content.length > 0) {
          messages.push({
            id: `warp-query-${messageIndex}`,
            conversationId,
            timestamp: query.start_ts,
            role: 'user',
            content,
            metadata: {
              extractedFrom: 'warp-plain-query',
              rawLength: query.input.length,
              messageType: 'user_request',
              platform: 'warp',
            },
          });
          messageIndex++;
        }
      }
    }

    return messages;
  }

  /**
   * Extract content from Warp action results
   */
  private extractActionResult(result: any): string {
    const parts: string[] = [];

    if (result.RequestCommandOutput) {
      const cmdResult = result.RequestCommandOutput.result;
      if (cmdResult.Success) {
        parts.push(`Command: ${cmdResult.Success.command}`);
        if (cmdResult.Success.output) {
          parts.push(`Output: ${cmdResult.Success.output}`);
        }
      }
    } else if (result.GetFiles) {
      const files = result.GetFiles.result;
      if (files.Success) {
        const fileNames = files.Success.files.map((f: any) => f.file_name).join(', ');
        parts.push(`Files accessed: ${fileNames}`);
      }
    } else if (result.EditFiles) {
      const edits = result.EditFiles.result;
      if (edits.Success) {
        parts.push(`Files edited: ${edits.Success.length} file(s)`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Clean message content
   * Remove JSON artifacts and normalize whitespace
   */
  private cleanContent(content: string): string {
    if (!content) return '';

    let cleaned = content
      .replace(/\\"/g, '"') // Unescape quotes
      .replace(/\\n/g, '\n') // Unescape newlines
      .replace(/\\t/g, '\t') // Unescape tabs
      .trim();

    return cleaned;
  }

  /**
   * Detect if data is from Warp
   * @param input - Raw input string
   * @returns true if data appears to be from Warp
   */
  isWarpData(input: string): boolean {
    try {
      const data = JSON.parse(input);
      return Array.isArray(data) && data.some((item) => item.Query || item.ActionResult);
    } catch {
      return false;
    }
  }
}
