/**
 * MCP Tools for AETHER
 * Tool implementations for Model Context Protocol
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { QuadIndex, Principle, GraphEdge } from 'lill-core';
import type {
  QueryPrinciplesArgs,
  QueryPrinciplesResponse,
  GetProjectStatsArgs,
  GetProjectStatsResponse,
  TraverseGraphArgs,
  TraverseGraphResponse,
  GetRecentPrinciplesArgs,
  GetRecentPrinciplesResponse,
  FormattedPrinciple,
  FormattedRelationship,
  FormattedReasoning,
} from './types.js';

/**
 * Format a principle for MCP response
 */
function formatPrinciple(principle: Principle, score?: number): FormattedPrinciple {
  return {
    id: principle.id,
    name: principle.name,
    intent: principle.intent,
    confidence: principle.confidence,
    status: principle.status,
    score,
    created_at: principle.created_at?.toISOString() || new Date().toISOString(),
    updated_at: principle.updated_at?.toISOString() || new Date().toISOString(),
    sources: principle.sources || [],
  };
}

/**
 * Format relationships for MCP response
 */
function formatRelationships(relationships: GraphEdge[]): FormattedRelationship[] {
  return relationships.map((rel) => ({
    from: rel.from,
    to: rel.to,
    type: rel.type,
    reason: rel.reason,
    strength: rel.strength,
  }));
}

/**
 * Format reasoning for MCP response
 */
function formatReasoning(reasoning: unknown): FormattedReasoning {
  const r = reasoning as {
    alternatives?: Array<{ id: string; name: string; reason: string }>;
    lessons?: Array<{ principle_id: string; lesson: string }>;
    rejected?: Array<{ id: string; name: string; reason: string }>;
  };

  return {
    alternatives: r.alternatives?.map((alt) => ({
      id: alt.id,
      name: alt.name,
      reason: alt.reason,
    })),
    lessons: r.lessons?.map((lesson) => ({
      principle_id: lesson.principle_id,
      lesson: lesson.lesson,
    })),
    rejected: r.rejected?.map((rej) => ({
      id: rej.id,
      name: rej.name,
      reason: rej.reason,
    })),
  };
}

/**
 * Tool: query_principles
 * Search for principles using QuadIndex
 */
export async function queryPrinciples(
  quadIndex: QuadIndex,
  args: QueryPrinciplesArgs
): Promise<QueryPrinciplesResponse> {
  try {
    // Build query
    const query: any = {
      text: args.query,
      limit: args.limit || 10,
      status: args.status,
      minConfidence: args.minConfidence,
      includeRelationships: args.includeRelationships || false,
      relationshipDepth: args.relationshipDepth || 2,
      includeReasoning: args.includeReasoning || false,
      reasoningIterations: args.reasoningIterations || 3,
    };

    // Execute query
    const result = await quadIndex.searchAsync(query);

    if (!result.success || !result.data) {
      return {
        success: false,
        results: [],
        stats: {
          total: 0,
          returned: 0,
          store: 'vector',
          query: args.query,
        },
        error: result.error || 'Query failed',
      };
    }

    // Format results
    const formattedPrinciples = result.data.principles.map((p: Principle, i: number) =>
      formatPrinciple(p, result.data!.scores?.[i])
    );

    const response: QueryPrinciplesResponse = {
      success: true,
      results: formattedPrinciples,
      stats: {
        total: result.data.total || formattedPrinciples.length,
        returned: formattedPrinciples.length,
        store: result.data.store || 'vector',
        query: args.query,
      },
    };

    // Add relationships if requested
    if (args.includeRelationships && result.data.relationships) {
      response.relationships = formatRelationships(result.data.relationships);
    }

    // Add reasoning if requested
    if (args.includeReasoning && result.data.reasoning) {
      response.reasoning = formatReasoning(result.data.reasoning);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      results: [],
      stats: {
        total: 0,
        returned: 0,
        store: 'vector',
        query: args.query,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_project_stats
 * Get project statistics from QuadIndex
 */
export async function getProjectStats(
  quadIndex: QuadIndex,
  _args: GetProjectStatsArgs
): Promise<GetProjectStatsResponse> {
  try {
    const stats = quadIndex.getStats();

    if (!stats.success || !stats.data) {
      return {
        success: false,
        stats: {
          principles: { total: 0, validated: 0, proposed: 0, rejected: 0, deprecated: 0 },
          relationships: { total: 0, types: {} },
          reasoning: { hypotheticals: 0, rejected: 0 },
          metadata: { total: 0 },
        },
        error: stats.error || 'Failed to get stats',
      };
    }

    return {
      success: true,
      stats: {
        principles: {
          total: stats.data.metadata.total,
          validated: stats.data.metadata.byStatus?.validated || 0,
          proposed: stats.data.metadata.byStatus?.proposed || 0,
          rejected: stats.data.metadata.byStatus?.rejected || 0,
          deprecated: stats.data.metadata.byStatus?.deprecated || 0,
        },
        relationships: {
          total: stats.data.graph.edges,
          types: stats.data.graph.edgesByType || {},
        },
        reasoning: {
          hypotheticals: stats.data.reasoning.hypotheticals,
          rejected: stats.data.reasoning.rejected,
        },
        metadata: {
          total: stats.data.metadata.total,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      stats: {
        principles: { total: 0, validated: 0, proposed: 0, rejected: 0, deprecated: 0 },
        relationships: { total: 0, types: {} },
        reasoning: { hypotheticals: 0, rejected: 0 },
        metadata: { total: 0 },
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: traverse_graph
 * Traverse relationship graph from a specific principle
 */
export async function traverseGraph(
  quadIndex: QuadIndex,
  args: TraverseGraphArgs
): Promise<TraverseGraphResponse> {
  try {
    // Get the principle
    const principleResult = await quadIndex.searchAsync({
      text: args.principleId,
      limit: 1,
      includeRelationships: true,
      relationshipDepth: args.depth || 2,
    } as any);

    if (
      !principleResult.success ||
      !principleResult.data ||
      principleResult.data.principles.length === 0
    ) {
      return {
        success: false,
        principle: {} as FormattedPrinciple,
        relationships: [],
        relatedPrinciples: [],
        error: `Principle not found: ${args.principleId}`,
      };
    }

    const principle = principleResult.data.principles[0];
    const relationships = principleResult.data.relationships || [];

    // Get related principles
    const relatedIds = new Set<string>();
    relationships.forEach((rel: GraphEdge) => {
      if (rel.from === principle.id) relatedIds.add(rel.to);
      if (rel.to === principle.id) relatedIds.add(rel.from);
    });

    // Fetch related principles
    const relatedPrinciples: Principle[] = [];
    for (const id of relatedIds) {
      const result = await quadIndex.searchAsync({ text: id, limit: 1 } as any);
      if (result.success && result.data && result.data.principles.length > 0) {
        relatedPrinciples.push(result.data.principles[0]);
      }
    }

    return {
      success: true,
      principle: formatPrinciple(principle),
      relationships: formatRelationships(relationships),
      relatedPrinciples: relatedPrinciples.map((p: Principle) => formatPrinciple(p)),
    };
  } catch (error) {
    return {
      success: false,
      principle: {} as FormattedPrinciple,
      relationships: [],
      relatedPrinciples: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Tool: get_recent_principles
 * Get recently added or updated principles
 */
export async function getRecentPrinciples(
  quadIndex: QuadIndex,
  args: GetRecentPrinciplesArgs
): Promise<GetRecentPrinciplesResponse> {
  try {
    const days = args.days || 7;
    const limit = args.limit || 10;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Query for recent principles
    const result = await quadIndex.searchAsync({
      text: 'recent',
      limit: limit * 2, // Get more to filter by date
    } as any);

    if (!result.success || !result.data) {
      return {
        success: false,
        principles: [],
        error: result.error || 'Query failed',
      };
    }

    // Filter by date and sort
    const recentPrinciples = result.data.principles
      .filter((p: Principle) => {
        const updatedAt = p.updated_at ? new Date(p.updated_at) : new Date(0);
        return updatedAt >= cutoffDate;
      })
      .sort((a: Principle, b: Principle) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, limit);

    return {
      success: true,
      principles: recentPrinciples.map((p: Principle) => formatPrinciple(p)),
    };
  } catch (error) {
    return {
      success: false,
      principles: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
