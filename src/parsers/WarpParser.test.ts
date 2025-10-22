/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * WarpParser Tests
 * Verify Warp Terminal SQLite format parsing
 */

import { describe, it, expect } from 'vitest';
import { WarpParser } from './WarpParser.js';

describe('WarpParser', () => {
  const parser = new WarpParser();

  describe('parse', () => {
    it('should parse Warp queries into messages', () => {
      const queries = [
        {
          exchange_id: 'ex-1',
          conversation_id: 'conv-123',
          start_ts: '2025-10-22T10:00:00Z',
          input: JSON.stringify([
            {
              Query: {
                text: 'How do I implement a parser?',
                context: [],
              },
            },
          ]),
          working_directory: '/Users/test/project',
          output_status: 'success',
        },
      ];

      const result = parser.parse(queries, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].role).toBe('user');
        expect(result.value[0].content).toContain('parser');
      }
    });

    it('should handle action results', () => {
      const queries = [
        {
          exchange_id: 'ex-1',
          conversation_id: 'conv-123',
          start_ts: '2025-10-22T10:00:00Z',
          input: JSON.stringify([
            {
              ActionResult: {
                result: {
                  RequestCommandOutput: {
                    result: {
                      Success: {
                        command: 'npm test',
                        output: 'All tests passed',
                      },
                    },
                  },
                },
              },
            },
          ]),
          working_directory: '/Users/test/project',
          output_status: 'success',
        },
      ];

      const result = parser.parse(queries, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].role).toBe('assistant');
        expect(result.value[0].content).toContain('npm test');
      }
    });

    it('should handle file access results', () => {
      const queries = [
        {
          exchange_id: 'ex-1',
          conversation_id: 'conv-123',
          start_ts: '2025-10-22T10:00:00Z',
          input: JSON.stringify([
            {
              ActionResult: {
                result: {
                  GetFiles: {
                    result: {
                      Success: {
                        files: [{ file_name: 'src/index.ts' }, { file_name: 'src/types.ts' }],
                      },
                    },
                  },
                },
              },
            },
          ]),
          working_directory: '/Users/test/project',
          output_status: 'success',
        },
      ];

      const result = parser.parse(queries, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('Files accessed');
        expect(result.value[0].content).toContain('src/index.ts');
      }
    });

    it('should handle plain text queries', () => {
      const queries = [
        {
          exchange_id: 'ex-1',
          conversation_id: 'conv-123',
          start_ts: '2025-10-22T10:00:00Z',
          input: 'Plain text query without JSON',
          working_directory: '/Users/test/project',
          output_status: 'success',
        },
      ];

      const result = parser.parse(queries, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0].content).toBe('Plain text query without JSON');
      }
    });

    it('should return empty array for empty queries', () => {
      const result = parser.parse([], 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(0);
      }
    });

    it('should clean escaped characters', () => {
      const queries = [
        {
          exchange_id: 'ex-1',
          conversation_id: 'conv-123',
          start_ts: '2025-10-22T10:00:00Z',
          input: JSON.stringify([
            {
              Query: {
                text: 'What is the difference between "const" and "let"?',
                context: [],
              },
            },
          ]),
          working_directory: '/Users/test/project',
          output_status: 'success',
        },
      ];

      const result = parser.parse(queries, 'conv-123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].content).toContain('const');
        expect(result.value[0].content).toContain('let');
      }
    });
  });

  describe('isWarpData', () => {
    it('should detect Warp query format', () => {
      const warpData = JSON.stringify([
        {
          Query: {
            text: 'test',
            context: [],
          },
        },
      ]);

      expect(parser.isWarpData(warpData)).toBe(true);
    });

    it('should detect Warp action result format', () => {
      const warpData = JSON.stringify([
        {
          ActionResult: {
            result: {},
          },
        },
      ]);

      expect(parser.isWarpData(warpData)).toBe(true);
    });

    it('should reject non-Warp data', () => {
      const nonWarpData = JSON.stringify({
        request_message: 'test',
        response_text: 'response',
      });

      expect(parser.isWarpData(nonWarpData)).toBe(false);
    });
  });
});
