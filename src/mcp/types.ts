/**
 * MCP Types for AETHER
 * Type definitions for Model Context Protocol integration
 */

/**
 * MCP Tool: query_principles
 * Search for principles using QuadIndex
 */
export interface QueryPrinciplesArgs {
  /** Search query text */
  query: string;

  /** Maximum number of results to return */
  limit?: number;

  /** Filter by principle status */
  status?: 'validated' | 'proposed' | 'rejected' | 'deprecated';

  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;

  /** Include relationship graph */
  includeRelationships?: boolean;

  /** Relationship traversal depth (default: 2) */
  relationshipDepth?: number;

  /** Include reasoning (alternatives, lessons learned) */
  includeReasoning?: boolean;

  /** Reasoning iterations (default: 3) */
  reasoningIterations?: number;
}

/**
 * MCP Tool: get_project_stats
 * Get project statistics from QuadIndex
 */
export type GetProjectStatsArgs = Record<string, never>;

/**
 * MCP Tool: traverse_graph
 * Traverse relationship graph from a specific principle
 */
export interface TraverseGraphArgs {
  /** Principle ID to start from */
  principleId: string;

  /** Maximum depth to traverse */
  depth?: number;

  /** Relationship types to follow */
  relationshipTypes?: string[];
}

/**
 * MCP Tool: get_recent_principles
 * Get recently added or updated principles
 */
export interface GetRecentPrinciplesArgs {
  /** Number of days to look back */
  days?: number;

  /** Maximum number of results */
  limit?: number;
}

/**
 * Formatted principle for MCP response
 */
export interface FormattedPrinciple {
  id: string;
  name: string;
  intent: string;
  confidence: number;
  status: string;
  score?: number;
  created_at: string;
  updated_at: string;
  sources: string[];
}

/**
 * Formatted relationship for MCP response
 */
export interface FormattedRelationship {
  from: string;
  to: string;
  type: string;
  reason?: string;
  strength?: number;
}

/**
 * Formatted reasoning for MCP response
 */
export interface FormattedReasoning {
  alternatives?: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
  lessons?: Array<{
    principle_id: string;
    lesson: string;
  }>;
  rejected?: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
}

/**
 * MCP query_principles response
 */
export interface QueryPrinciplesResponse {
  success: boolean;
  results: FormattedPrinciple[];
  relationships?: FormattedRelationship[];
  reasoning?: FormattedReasoning;
  stats: {
    total: number;
    returned: number;
    store: string;
    query: string;
  };
  error?: string;
}

/**
 * MCP get_project_stats response
 */
export interface GetProjectStatsResponse {
  success: boolean;
  stats: {
    principles: {
      total: number;
      validated: number;
      proposed: number;
      rejected: number;
      deprecated: number;
    };
    relationships: {
      total: number;
      types: Record<string, number>;
    };
    reasoning: {
      hypotheticals: number;
      rejected: number;
    };
    metadata: {
      total: number;
    };
  };
  error?: string;
}

/**
 * MCP traverse_graph response
 */
export interface TraverseGraphResponse {
  success: boolean;
  principle: FormattedPrinciple;
  relationships: FormattedRelationship[];
  relatedPrinciples: FormattedPrinciple[];
  error?: string;
}

/**
 * MCP get_recent_principles response
 */
export interface GetRecentPrinciplesResponse {
  success: boolean;
  principles: FormattedPrinciple[];
  error?: string;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Project directory (where .lill/ is located) */
  projectDir: string;

  /** Enable verbose logging */
  verbose?: boolean;

  /** Server name */
  name?: string;

  /** Server version */
  version?: string;
}
