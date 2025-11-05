/**
 * QuadIndex Types
 * Re-export and extend types from lill-core for proper type resolution
 */

import type { PrincipleQuery, RetrievalResult, Principle } from 'lill-core';

import type { RelationshipType, ReasoningResult } from 'lill-core';

/**
 * Extended query options for QuadIndex
 */
export interface QuadQuery extends PrincipleQuery {
  // Graph options
  includeRelationships?: boolean;
  relationshipTypes?: RelationshipType[];
  relationshipDepth?: number;

  // Reasoning options
  includeReasoning?: boolean;
  reasoningIterations?: number;
  reasoningConfidenceThreshold?: number;

  // Confidence decay options
  applyConfidenceDecay?: boolean;
  excludeStale?: boolean;

  // Conflict detection options
  detectConflicts?: boolean;
  conflictSimilarityThreshold?: number;

  // Query explain options
  explain?: boolean;
}

/**
 * Conflict data structure
 */
export interface Conflict {
  principle1: Principle;
  principle2: Principle;
  similarity: number;
  contradictionScore: number;
  reason: string;
}

/**
 * Query explanation data
 */
export interface QueryExplanation {
  steps: Array<{
    name: string;
    description: string;
    store: string;
    duration_ms: number;
    results_count: number;
  }>;
  total_duration_ms: number;
  cache_hit: boolean;
}

/**
 * Routing decision data
 */
export interface RoutingDecision {
  intent: string;
  confidence: number;
  stores: string[];
  reasoning: string;
}

/**
 * Extended retrieval result with graph and reasoning data
 */
export interface QuadRetrievalResult extends RetrievalResult {
  // Graph data
  relationships?: Array<{
    from: string;
    to: string;
    type: RelationshipType;
    metadata?: Record<string, unknown>;
  }>;

  // Reasoning data
  reasoning?: ReasoningResult;

  // Conflict data
  conflicts?: Conflict[];

  // Query explanation (if explain: true)
  explanation?: QueryExplanation;

  // Routing information (if using smartQuery)
  routing?: RoutingDecision;
}
