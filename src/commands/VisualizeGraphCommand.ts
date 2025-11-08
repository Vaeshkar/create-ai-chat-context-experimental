/**
 * VisualizeGraphCommand - Generate interactive D3.js visualization
 *
 * Creates an interactive HTML visualization of QuadIndex:
 * - VectorStore: Principles as nodes
 * - GraphStore: Relationships as edges
 * - ReasoningStore: Hypotheticals as special nodes
 * - MetadataStore: Node colors by confidence/status
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  QuadIndex,
  SnapshotManager,
  type GraphNode,
  type GraphEdge,
  type Principle,
  type Hypothetical,
} from 'lill-core';

export interface VisualizeGraphOptions {
  cwd: string;
  output?: string;
  verbose?: boolean;
}

interface QuadIndexStats {
  data: {
    metadata: {
      total: number;
      byStatus: Record<string, number>;
      byConfidence: Record<string, number>;
    };
    vector: {
      total: number;
      dimensions: number;
    };
    graph: {
      nodes: number;
      edges: number;
    };
    reasoning: {
      hypotheticals: number;
      rejected: number;
      lessons: number;
    };
  };
}

interface SankeyNode {
  name: string;
  fullName?: string;
  type?: string;
  status?: string;
  color?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  type?: string;
  color?: string;
}

export class VisualizeGraphCommand {
  private cwd: string;
  private output: string;
  private verbose: boolean;

  constructor(options: VisualizeGraphOptions) {
    this.cwd = options.cwd;
    this.output = options.output || 'quadindex-graph.html';
    this.verbose = options.verbose || false;
  }

  async execute(): Promise<void> {
    console.log('🎨 Generating QuadIndex Sankey Diagram...\n');

    // 1. Load QuadIndex from snapshot
    const quadIndex = new QuadIndex();
    const snapshotManager = new SnapshotManager();

    if (this.verbose) {
      console.log('📂 Loading QuadIndex from snapshot...');
    }

    const restoreResult = await snapshotManager.restore(quadIndex, 'rolling');
    if (!restoreResult.success) {
      console.error('❌ Failed to restore QuadIndex:', restoreResult.error);
      process.exit(1);
    }

    if (this.verbose) {
      console.log('✅ QuadIndex loaded\n');
    }

    // 2. Get all data from QuadIndex
    const stats = quadIndex.getStats();
    if (!stats.success) {
      console.error('❌ Failed to get stats:', stats.error);
      process.exit(1);
    }

    // Get all nodes and edges
    const nodesResult = quadIndex.getAllNodes();
    const edgesResult = quadIndex.getAllRelationships();
    const principlesResult = quadIndex.getAll();
    const hypotheticalsResult = quadIndex.getAllHypotheticals();

    if (!nodesResult.success || !edgesResult.success || !principlesResult.success) {
      console.error('❌ Failed to get graph data');
      process.exit(1);
    }

    const nodes = nodesResult.data || [];
    const edges = edgesResult.data || [];
    const principles = principlesResult.data || [];
    const hypotheticals = (hypotheticalsResult.success ? hypotheticalsResult.data : []) || [];

    console.log('📊 Data Summary:');
    console.log(
      `   Conversations: ${nodes.filter((n: { type: string }) => n.type === 'conversation').length}`
    );
    console.log(`   Principles: ${principles.length}`);
    console.log(`   Hypotheticals: ${hypotheticals.length}`);
    console.log(`   Relationships: ${edges.length}\n`);

    // 3. Generate Sankey HTML
    const html = this.generateSankeyHTML(nodes, edges, principles, hypotheticals, stats.data);

    // 4. Write to file
    const outputPath = join(this.cwd, this.output);
    writeFileSync(outputPath, html, 'utf-8');

    console.log(`✅ Sankey diagram generated: ${this.output}\n`);
    console.log('🌐 Open in browser to explore the flow!\n');
  }

  private generateSankeyHTML(
    nodes: GraphNode[],
    edges: GraphEdge[],
    principles: Principle[],
    hypotheticals: Hypothetical[],
    stats: QuadIndexStats['data']
  ): string {
    // Build Sankey data: Conversations → Principles → Hypotheticals
    const conversations = nodes.filter((n) => n.type === 'conversation');

    // Create Sankey nodes
    const sankeyNodes: SankeyNode[] = [];
    const nodeIndexMap = new Map<string, number>();

    // Add conversations (left column)
    conversations.forEach((conv) => {
      const idx = sankeyNodes.length;
      nodeIndexMap.set(conv.id, idx);
      sankeyNodes.push({
        name: `Conv ${conv.id.substring(0, 8)}`,
        fullName: conv.name || conv.id,
        type: 'conversation',
      });
    });

    // Add principles (middle column)
    principles.forEach((prin) => {
      const idx = sankeyNodes.length;
      nodeIndexMap.set(prin.id, idx);
      sankeyNodes.push({
        name: prin.intent?.substring(0, 50) || prin.id.substring(0, 50),
        fullName: prin.intent || prin.id,
        type: 'principle',
        status: prin.status,
      });
    });

    // Add hypotheticals (right column)
    hypotheticals.slice(0, 50).forEach((hyp) => {
      const idx = sankeyNodes.length;
      nodeIndexMap.set(hyp.id, idx);
      sankeyNodes.push({
        name: hyp.question.substring(0, 50),
        fullName: hyp.question,
        type: 'hypothetical',
      });
    });

    // Create Sankey links from edges (only include links where both nodes exist)
    const sankeyLinks: SankeyLink[] = [];
    const linkMap = new Map<string, SankeyLink>(); // Deduplicate links

    edges.forEach((edge) => {
      const sourceIdx = nodeIndexMap.get(edge.from);
      const targetIdx = nodeIndexMap.get(edge.to);

      // Only add link if both source and target exist in our node list
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        const linkKey = `${sourceIdx}-${targetIdx}`;
        const existing = linkMap.get(linkKey);

        if (existing) {
          // Aggregate weights for duplicate links
          existing.value += edge.strength || 1;
        } else {
          linkMap.set(linkKey, {
            source: sourceIdx,
            target: targetIdx,
            value: edge.strength || 1,
          });
        }
      }
    });

    // Convert map to array
    linkMap.forEach((link) => sankeyLinks.push(link));

    if (this.verbose) {
      console.log(`\n🔗 Sankey Links:`);
      console.log(`   Total edges: ${edges.length}`);
      console.log(`   Valid links: ${sankeyLinks.length}`);
      console.log(`   Nodes: ${sankeyNodes.length}`);
    }

    const sankeyData = {
      nodes: sankeyNodes,
      links: sankeyLinks,
      stats,
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuadIndex Sankey Diagram</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/dist/d3-sankey.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0e27;
      color: #e0e0e0;
      overflow: hidden;
    }

    #container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    #graph {
      width: 100%;
      height: 100%;
    }

    #controls {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(20, 25, 45, 0.95);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 300px;
    }

    #controls h2 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #60a5fa;
    }

    #stats {
      font-size: 13px;
      line-height: 1.8;
      color: #94a3b8;
    }

    #stats strong {
      color: #e0e0e0;
    }

    #legend {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(20, 25, 45, 0.95);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    #legend h3 {
      font-size: 14px;
      margin-bottom: 12px;
      color: #60a5fa;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #94a3b8;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 10px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    #tooltip {
      position: absolute;
      background: rgba(20, 25, 45, 0.98);
      padding: 12px 16px;
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 13px;
      max-width: 300px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
    }

    #tooltip.visible {
      opacity: 1;
    }

    .tooltip-title {
      font-weight: 600;
      margin-bottom: 6px;
      color: #60a5fa;
    }

    .tooltip-content {
      color: #94a3b8;
      line-height: 1.5;
    }

    .node {
      cursor: pointer;
      transition: all 0.2s;
    }

    .node:hover {
      stroke-width: 3px;
    }

    .link {
      stroke: rgba(148, 163, 184, 0.08);
      stroke-width: 0.3px;
      transition: all 0.2s;
    }

    .link:hover {
      stroke: rgba(96, 165, 250, 0.8);
      stroke-width: 2px;
    }

    .link-label {
      font-size: 10px;
      fill: #64748b;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="container">
    <svg id="graph"></svg>

    <div id="controls">
      <h2>📊 QuadIndex Stats</h2>
      <div id="stats"></div>
    </div>

    <div id="legend">
      <h3>🎨 Legend</h3>
      <div class="legend-item">
        <div class="legend-color" style="background: #10b981;"></div>
        <span>Principle (validated)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #3b82f6;"></div>
        <span>Principle (active)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #f59e0b;"></div>
        <span>Hypothetical</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ef4444;"></div>
        <span>Rejected</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #8b5cf6;"></div>
        <span>Conversation</span>
      </div>
    </div>

    <div id="tooltip"></div>
  </div>

  <script>
    (function() {
      const data = ${JSON.stringify(sankeyData, null, 2)};

      // Setup
      const width = window.innerWidth;
      const height = window.innerHeight;
      const margin = { top: 20, right: 200, bottom: 20, left: 200 };

      const svg = d3.select('#graph')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g')
        .attr('transform', \`translate(\${margin.left},\${margin.top})\`);

      // Display stats
      const statsDiv = document.getElementById('stats');
      statsDiv.innerHTML = \`
        <div><strong>Conversations:</strong> \${data.nodes.filter(n => n.type === 'conversation').length}</div>
        <div><strong>Principles:</strong> \${data.nodes.filter(n => n.type === 'principle').length}</div>
        <div><strong>Hypotheticals:</strong> \${data.nodes.filter(n => n.type === 'hypothetical').length}</div>
        <div><strong>Flows:</strong> \${data.links.length}</div>
      \`;

      // Color scale
      function getNodeColor(node) {
        if (node.type === 'conversation') return '#8b5cf6';  // Purple
        if (node.type === 'hypothetical') return '#f59e0b';  // Orange
        if (node.type === 'principle') {
          if (node.status === 'validated') return '#10b981';  // Green
          return '#3b82f6';  // Blue
        }
        return '#64748b';  // Gray
      }

      // Check if d3.sankey is available
      if (typeof d3.sankey === 'undefined') {
        console.error('d3.sankey is not available. Check if d3-sankey library loaded correctly.');
        document.body.innerHTML += '<div style="color: red; padding: 20px;">Error: d3-sankey library failed to load</div>';
        return;
      }

    console.log('Data:', data);
    console.log('Nodes:', data.nodes.length);
    console.log('Links:', data.links.length);

    // Create Sankey generator
    const sankey = d3.sankey()
      .nodeId(d => d.name)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]]);

    // Generate Sankey layout
    const graph = sankey({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });

    console.log('Sankey graph:', graph);
    console.log('Sankey nodes:', graph.nodes.length);
    console.log('Sankey links:', graph.links.length);

    const { nodes, links } = graph;

    // Draw links (flows)
    const link = g.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => {
        const sourceNode = nodes.find(n => n.index === d.source.index);
        return getNodeColor(sourceNode);
      })
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.3)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.6);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.3);
      });

    // Draw nodes
    const node = g.append('g')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip);

    // Add labels
    g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .attr('font-size', '10px')
      .attr('fill', '#e2e8f0')
      .text(d => d.name);

    // Tooltip
    const tooltip = d3.select('#tooltip');

    function showTooltip(event, d) {
      tooltip
        .classed('visible', true)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px')
        .html(\`
          <div class="tooltip-title">\${d.fullName || d.name}</div>
          <div class="tooltip-content">
            <div><strong>Type:</strong> \${d.type}</div>
            \${d.status ? \`<div><strong>Status:</strong> \${d.status}</div>\` : ''}
          </div>
        \`);
    }

    function hideTooltip() {
      tooltip.classed('visible', false);
    }
    })();
  </script>
</body>
</html>`;
  }
}
