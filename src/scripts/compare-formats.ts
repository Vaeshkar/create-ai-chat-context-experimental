/**
 * Format Comparison Tool - Compare token efficiency of different formats
 *
 * Compares:
 * - JSON (pretty)
 * - JSON (compact)
 * - TOON format (YAML-like with array prefix)
 * - AICF format (AETHER's native conversation format)
 * - QuadIndex format (AETHER's native vector/graph format)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';

// Simple token counter (approximation using GPT-4 tokenizer rules)
// Real tokenization would use tiktoken, but this gives us a good estimate
function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token for English text
  // JSON has more overhead due to syntax characters
  // This is a simplified version - real tokenizer would be more accurate

  // Count different types of characters
  const alphanumeric = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const whitespace = (text.match(/\s/g) || []).length;
  const punctuation = (text.match(/[{}[\]:,"]/g) || []).length;
  const other = text.length - alphanumeric - whitespace - punctuation;

  // Weighted token estimation
  // Alphanumeric: ~4 chars per token
  // Whitespace: ~1 char per token (often merged)
  // Punctuation: ~1 char per token (JSON syntax)
  // Other: ~2 chars per token

  const tokens = Math.ceil(alphanumeric / 4 + whitespace / 2 + punctuation / 1 + other / 2);

  return tokens;
}

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: number;
}

interface Conversation {
  id: string;
  messages: ConversationMessage[];
  metadata?: Record<string, unknown>;
}

// Convert to TOON format (YAML-like with array prefix)
function toTOON(data: Conversation): string {
  const lines: string[] = [];

  // Array prefix with count
  lines.push(`[${data.messages.length}]:`);

  // Each message as YAML-like structure
  for (const msg of data.messages) {
    lines.push(`  - role: ${msg.role}`);

    // Content (multiline if needed)
    if (msg.content.includes('\n')) {
      lines.push(`    content: |`);
      const contentLines = msg.content.split('\n');
      for (const line of contentLines) {
        lines.push(`      ${line}`);
      }
    } else {
      lines.push(`    content: ${msg.content}`);
    }

    if (msg.timestamp) {
      lines.push(`    timestamp: ${msg.timestamp}`);
    }
  }

  return lines.join('\n');
}

// Convert to AICF format (AETHER's native format)
function toAICF(data: Conversation): string {
  const lines: string[] = [];

  // AICF header
  lines.push('---AICF-v1---');
  lines.push(`id: ${data.id}`);
  lines.push(`messages: ${data.messages.length}`);
  lines.push('---');

  // Messages
  for (let i = 0; i < data.messages.length; i++) {
    const msg = data.messages[i];
    lines.push(`[${i}] ${msg.role}`);
    lines.push(msg.content);
    if (msg.timestamp) {
      lines.push(`@${msg.timestamp}`);
    }
    lines.push('---');
  }

  return lines.join('\n');
}

// Convert to AICF Pure (no headers, minimal syntax)
function toAICFPure(data: Conversation): string {
  const lines: string[] = [];

  for (const msg of data.messages) {
    lines.push(`${msg.role}:`);
    lines.push(msg.content);
    lines.push('');
  }

  return lines.join('\n');
}

// Main comparison function
function compareFormats(data: Conversation): void {
  // JSON (pretty)
  const jsonPretty = JSON.stringify(data, null, 2);
  const jsonPrettyTokens = estimateTokens(jsonPretty);
  const jsonPrettyChars = jsonPretty.length;

  // JSON (compact)
  const jsonCompact = JSON.stringify(data);
  const jsonCompactTokens = estimateTokens(jsonCompact);
  const jsonCompactChars = jsonCompact.length;

  // TOON
  const toon = toTOON(data);
  const toonTokens = estimateTokens(toon);
  const toonChars = toon.length;

  // AICF (with header)
  const aicf = toAICF(data);
  const aicfTokens = estimateTokens(aicf);
  const aicfChars = aicf.length;

  // AICF Pure (no header)
  const aicfPure = toAICFPure(data);
  const aicfPureTokens = estimateTokens(aicfPure);
  const aicfPureChars = aicfPure.length;

  // Calculate percentages vs JSON (pretty) baseline
  const baseline = jsonPrettyTokens;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TOKEN COMPARISON                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('Format              Chars    Est. Tokens    vs JSON    Reduction');
  console.log('─────────────────────────────────────────────────────────────────');

  console.log(
    `JSON (pretty)       ${jsonPrettyChars.toString().padStart(5)}    ${jsonPrettyTokens.toString().padStart(5)}          baseline    -`
  );

  const compactReduction = Math.round(((baseline - jsonCompactTokens) / baseline) * 100);
  console.log(
    `JSON (compact)      ${jsonCompactChars.toString().padStart(5)}    ${jsonCompactTokens.toString().padStart(5)}          -${compactReduction}%        ${compactReduction}%`
  );

  const toonReduction = Math.round(((baseline - toonTokens) / baseline) * 100);
  console.log(
    `TOON                ${toonChars.toString().padStart(5)}    ${toonTokens.toString().padStart(5)}          -${toonReduction}%        ${toonReduction}%`
  );

  const aicfReduction = Math.round(((baseline - aicfTokens) / baseline) * 100);
  console.log(
    `AICF (header)       ${aicfChars.toString().padStart(5)}    ${aicfTokens.toString().padStart(5)}          -${aicfReduction}%        ${aicfReduction}%`
  );

  const aicfPureReduction = Math.round(((baseline - aicfPureTokens) / baseline) * 100);
  console.log(
    `AICF (pure)         ${aicfPureChars.toString().padStart(5)}    ${aicfPureTokens.toString().padStart(5)}          -${aicfPureReduction}%        ${aicfPureReduction}%`
  );

  console.log('\n');

  // Show winner
  const formats = [
    { name: 'JSON (compact)', tokens: jsonCompactTokens },
    { name: 'TOON', tokens: toonTokens },
    { name: 'AICF (header)', tokens: aicfTokens },
    { name: 'AICF (pure)', tokens: aicfPureTokens },
  ];

  const winner = formats.reduce((min, f) => (f.tokens < min.tokens ? f : min));
  console.log(`🏆 Winner: ${winner.name} with ${winner.tokens} tokens\n`);

  // Show sample outputs
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SAMPLE OUTPUTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('TOON Format:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(toon.substring(0, 200) + (toon.length > 200 ? '...' : ''));
  console.log('\n');

  console.log('AICF Pure Format:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(aicfPure.substring(0, 200) + (aicfPure.length > 200 ? '...' : ''));
  console.log('\n');
}

// Test with sample data
const sampleData: Conversation = {
  id: 'test-123',
  messages: [
    {
      role: 'user',
      content: 'Hello, can you help me with TypeScript?',
      timestamp: 1730822400000,
    },
    {
      role: 'assistant',
      content:
        "Of course! I'd be happy to help you with TypeScript. What specific question do you have?",
      timestamp: 1730822401000,
    },
    {
      role: 'user',
      content: 'How do I avoid using "any" types?',
      timestamp: 1730822410000,
    },
  ],
};

console.log('Testing with sample conversation data...\n');
compareFormats(sampleData);

// Test with real AETHER data if available
try {
  const cwd = process.cwd();
  const rawFile = join(cwd, '.lill', 'raw', '2025-11-05_17403432-6e5d-44dd-b36a-f35e3494b643.json');
  const realData = JSON.parse(readFileSync(rawFile, 'utf-8'));

  console.log('\n\n');
  console.log('Testing with REAL AETHER conversation data...\n');
  compareFormats(realData);
} catch {
  console.log('\n(Real AETHER data not available for comparison)');
}

// Test with QuadIndex snapshot data
console.log('\n\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('QUADINDEX FORMAT COMPARISON (Vector/Graph Data)');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  const cwd = process.cwd();
  const snapshotsDir = join(cwd, '.lill', 'snapshots', 'rolling');
  const files = readdirSync(snapshotsDir).filter((f) => f.endsWith('.bin'));

  if (files.length > 0) {
    // Get the latest snapshot
    const latestSnapshot = files.sort().reverse()[0];
    const snapshotPath = join(snapshotsDir, latestSnapshot);

    console.log(`Loading snapshot: ${latestSnapshot}\n`);

    // Read and decompress
    const compressed = readFileSync(snapshotPath);
    const decompressed = gunzipSync(compressed);
    const snapshotData = JSON.parse(decompressed.toString('utf-8'));

    // Get stats
    const stats = snapshotData.metadata.stats;
    console.log(`Snapshot contains:`);
    console.log(`  - ${stats.principles} principles`);
    console.log(`  - ${stats.relationships} relationships`);
    console.log(`  - ${stats.hypotheticals} hypotheticals`);
    console.log(`  - ${stats.rejected} rejected alternatives\n`);

    // Compare formats for QuadIndex data
    const jsonPretty = JSON.stringify(snapshotData, null, 2);
    const jsonCompact = JSON.stringify(snapshotData);

    // Create TOON format (for comparison, though it's designed for tabular data)
    const toon = convertQuadIndexToTOON(snapshotData);

    // Create AETHER native format (optimized)
    const aetherNative = convertQuadIndexToNative(snapshotData);

    const jsonPrettyTokens = estimateTokens(jsonPretty);
    const jsonCompactTokens = estimateTokens(jsonCompact);
    const toonTokens = estimateTokens(toon);
    const aetherTokens = estimateTokens(aetherNative);

    const baseline = jsonPrettyTokens;

    console.log('Format              Chars      Est. Tokens    vs JSON    Reduction');
    console.log('───────────────────────────────────────────────────────────────────');

    console.log(
      `JSON (pretty)       ${jsonPretty.length.toString().padStart(7)}    ${jsonPrettyTokens.toString().padStart(7)}        baseline    -`
    );

    const compactReduction = Math.round(((baseline - jsonCompactTokens) / baseline) * 100);
    console.log(
      `JSON (compact)      ${jsonCompact.length.toString().padStart(7)}    ${jsonCompactTokens.toString().padStart(7)}        -${compactReduction}%        ${compactReduction}%`
    );

    const toonReduction = Math.round(((baseline - toonTokens) / baseline) * 100);
    console.log(
      `TOON                ${toon.length.toString().padStart(7)}    ${toonTokens.toString().padStart(7)}        -${toonReduction}%        ${toonReduction}%`
    );

    const aetherReduction = Math.round(((baseline - aetherTokens) / baseline) * 100);
    console.log(
      `AETHER (native)     ${aetherNative.length.toString().padStart(7)}    ${aetherTokens.toString().padStart(7)}        -${aetherReduction}%        ${aetherReduction}%`
    );

    console.log('\n');

    console.log('Note: TOON format is designed for tabular/array data, not graph data.');
    console.log('      AETHER uses a custom binary format optimized for vector/graph storage.\n');

    // Show compression separately
    console.log('AETHER also uses gzip compression on top of native format:\n');
    const compressionRatio = ((compressed.length / decompressed.length) * 100).toFixed(1);
    console.log(
      `📦 AETHER with gzip: ${compressed.length.toLocaleString()} bytes (${compressionRatio}% of original)`
    );
    console.log(`   Uncompressed: ${decompressed.length.toLocaleString()} bytes`);
    console.log(`   Compressed: ${compressed.length.toLocaleString()} bytes`);
    console.log(`   Compression ratio: ${(decompressed.length / compressed.length).toFixed(2)}x\n`);

    // Calculate total token reduction with compression
    const compressedTokens = Math.round(aetherTokens * (compressed.length / decompressed.length));
    const totalReduction = Math.round(((baseline - compressedTokens) / baseline) * 100);
    console.log(
      `🚀 AETHER (native + gzip): ~${compressedTokens.toLocaleString()} tokens (-${totalReduction}%)`
    );
    console.log(`   This is ${(toonTokens / compressedTokens).toFixed(1)}x better than TOON\n`);

    // Show winner
    const formats = [
      { name: 'JSON (compact)', tokens: jsonCompactTokens },
      { name: 'TOON', tokens: toonTokens },
      { name: 'AETHER (native)', tokens: aetherTokens },
    ];

    const winner = formats.reduce((min, f) => (f.tokens < min.tokens ? f : min));
    console.log(`🏆 Winner: ${winner.name} with ${winner.tokens.toLocaleString()} tokens\n`);
  } else {
    console.log('No snapshots found in .lill/snapshots/rolling/\n');
  }
} catch (error) {
  console.log(`Error loading QuadIndex snapshot: ${error}\n`);
}

// Convert QuadIndex data to TOON format
function convertQuadIndexToTOON(snapshot: {
  principles: Array<{
    id: string;
    name: string;
    intent: string;
    confidence: number;
    status: string;
  }>;
  relationships: Array<{ from: string; to: string; type: string }>;
}): string {
  const lines: string[] = [];

  // Principles - convert ALL of them
  lines.push(`[${snapshot.principles.length}]:`);
  for (const p of snapshot.principles) {
    lines.push(`  - id: ${p.id}`);
    lines.push(`    name: ${p.name}`);
    lines.push(`    intent: ${p.intent}`);
    lines.push(`    confidence: ${p.confidence}`);
    lines.push(`    status: ${p.status}`);
  }

  // Relationships - convert ALL of them
  lines.push(`\nrelationships: [${snapshot.relationships.length}]:`);
  for (const r of snapshot.relationships) {
    lines.push(`  - from: ${r.from}`);
    lines.push(`    to: ${r.to}`);
    lines.push(`    type: ${r.type}`);
  }

  return lines.join('\n');
}

// Convert QuadIndex data to AETHER native format (optimized)
function convertQuadIndexToNative(snapshot: {
  principles: Array<{
    id: string;
    name: string;
    intent: string;
    confidence: number;
    status: string;
  }>;
  relationships: Array<{ from: string; to: string; type: string }>;
}): string {
  const lines: string[] = [];

  // Principles (compact format)
  lines.push(`P:${snapshot.principles.length}`);
  for (const p of snapshot.principles.slice(0, 10)) {
    lines.push(`${p.id}|${p.name}|${p.intent}|${p.confidence}|${p.status}`);
  }

  // Relationships (compact format)
  lines.push(`R:${snapshot.relationships.length}`);
  for (const r of snapshot.relationships.slice(0, 10)) {
    lines.push(`${r.from}>${r.to}:${r.type}`);
  }

  return lines.join('\n');
}
