#!/usr/bin/env node
/**
 * AETHER MCP Server
 * Model Context Protocol server for AETHER QuadIndex
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { QuadIndex } from 'lill-core';
import { SnapshotManager } from 'lill-core';
import { join } from 'node:path';
import type { MCPServerConfig } from './types.js';
import { queryPrinciples, getProjectStats, traverseGraph, getRecentPrinciples } from './tools.js';

/**
 * AETHER MCP Server
 * Exposes QuadIndex via Model Context Protocol
 */
export class AetherMCPServer {
  private server: Server;
  private quadIndex: QuadIndex;
  private snapshotManager: SnapshotManager;
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;

    // Initialize server
    this.server = new Server(
      {
        name: config.name || 'aether',
        version: config.version || '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize QuadIndex
    this.quadIndex = new QuadIndex();
    this.snapshotManager = new SnapshotManager({
      snapshotDir: join(config.projectDir, '.lill', 'snapshots'),
      verbose: config.verbose || false,
    });

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_principles',
          description:
            'Search for principles using QuadIndex. Supports semantic search, filters, relationships, and reasoning.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query text',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10)',
              },
              status: {
                type: 'string',
                enum: ['validated', 'proposed', 'rejected', 'deprecated'],
                description: 'Filter by principle status',
              },
              minConfidence: {
                type: 'number',
                description: 'Minimum confidence threshold (0-1)',
              },
              includeRelationships: {
                type: 'boolean',
                description: 'Include relationship graph',
              },
              relationshipDepth: {
                type: 'number',
                description: 'Relationship traversal depth (default: 2)',
              },
              includeReasoning: {
                type: 'boolean',
                description: 'Include reasoning (alternatives, lessons learned)',
              },
              reasoningIterations: {
                type: 'number',
                description: 'Reasoning iterations (default: 3)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_project_stats',
          description:
            'Get project statistics from QuadIndex (principles, relationships, reasoning)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'traverse_graph',
          description: 'Traverse relationship graph from a specific principle',
          inputSchema: {
            type: 'object',
            properties: {
              principleId: {
                type: 'string',
                description: 'Principle ID to start from',
              },
              depth: {
                type: 'number',
                description: 'Maximum depth to traverse (default: 2)',
              },
              relationshipTypes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Relationship types to follow',
              },
            },
            required: ['principleId'],
          },
        },
        {
          name: 'get_recent_principles',
          description: 'Get recently added or updated principles',
          inputSchema: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Number of days to look back (default: 7)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10)',
              },
            },
          },
        },
      ],
    }));

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'query_principles': {
            const result = await queryPrinciples(this.quadIndex, args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_project_stats': {
            const result = await getProjectStats(this.quadIndex, args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'traverse_graph': {
            const result = await traverseGraph(this.quadIndex, args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_recent_principles': {
            const result = await getRecentPrinciples(this.quadIndex, args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'aether://project-context',
          name: 'Project Context',
          description: 'Project statistics and metadata from QuadIndex',
          mimeType: 'application/json',
        },
      ],
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'aether://project-context') {
        const stats = await getProjectStats(this.quadIndex, {});
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      // Load QuadIndex from snapshot
      if (this.config.verbose) {
        console.error('📚 Loading QuadIndex from snapshot...');
      }

      const restoreResult = await this.snapshotManager.restore(this.quadIndex, 'rolling');
      if (!restoreResult.success) {
        // Try golden snapshot
        const goldenResult = await this.snapshotManager.restore(this.quadIndex, 'golden');
        if (!goldenResult.success) {
          console.error('❌ No snapshots found. Run watcher first: aether watch-terminal');
          process.exit(1);
        }
      }

      if (this.config.verbose) {
        const stats = this.quadIndex.getStats();
        if (stats.success && stats.data) {
          console.error(`✅ Loaded ${stats.data.metadata.total} principles`);
        }
      }

      // Start MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      if (this.config.verbose) {
        console.error('🚀 AETHER MCP Server running');
      }
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// Start server if run directly (ESM only)
// Note: MCP server only works in ESM mode (uses stdio transport)
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: MCPServerConfig = {
    projectDir: process.env['AETHER_PROJECT_DIR'] || process.cwd(),
    verbose: process.env['AETHER_VERBOSE'] === 'true',
  };

  const server = new AetherMCPServer(config);
  server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
