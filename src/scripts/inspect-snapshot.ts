#!/usr/bin/env node
/**
 * Inspect Snapshot - Check what's in the snapshot
 */

import { readFile } from 'fs/promises';
import { gunzip } from 'zlib';
import { promisify } from 'util';
import { join } from 'path';

const gunzipAsync = promisify(gunzip);

async function inspectSnapshot() {
  // Find latest snapshot
  const snapshotsDir = join(process.cwd(), '.lill/snapshots/rolling');
  const { readdirSync } = await import('fs');
  const snapshots = readdirSync(snapshotsDir)
    .filter((f) => f.startsWith('snapshot-') && f.endsWith('.bin'))
    .sort()
    .reverse();

  if (snapshots.length === 0) {
    console.log('❌ No snapshots found');
    return;
  }

  const snapshotPath = join(snapshotsDir, snapshots[0]!);

  console.log(`📥 Reading snapshot: ${snapshots[0]}\n`);
  let buffer = await readFile(snapshotPath);

  console.log('🔓 Decompressing...');
  buffer = await gunzipAsync(buffer);

  console.log('📊 Parsing JSON...');
  const data = JSON.parse(buffer.toString('utf-8'));

  console.log('\n📊 Snapshot Contents:');
  console.log(`   Metadata stats:`, data.metadata.stats);
  console.log(`   Principles: ${data.principles?.length || 0}`);
  console.log(`   Relationships: ${data.relationships?.length || 0}`);
  console.log(`   Hypotheticals: ${data.hypotheticals?.length || 0}`);
  console.log(`   Rejected: ${data.rejected?.length || 0}`);
  console.log(`   Vectors: ${data.vectors?.__type === 'Map' ? data.vectors.value.length : 0}`);

  if (data.rejected && data.rejected.length > 0) {
    console.log('\n🔍 Rejected alternatives:');
    for (const rejected of data.rejected) {
      console.log(`   - ${rejected.id}: ${rejected.option}`);
    }
  }

  if (data.relationships && data.relationships.length > 0) {
    console.log('\n🔗 Relationships:');
    for (const rel of data.relationships) {
      console.log(`   - ${rel.from} → ${rel.to} (${rel.type})`);
    }
  }
}

inspectSnapshot().catch(console.error);
