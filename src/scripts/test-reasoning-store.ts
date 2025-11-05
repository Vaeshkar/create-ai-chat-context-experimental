#!/usr/bin/env node
/**
 * Test script for ReasoningStore
 * Tests deep thinking with hypotheticals and rejected alternatives
 */

import { QuadIndex } from 'lill-core';
import { SnapshotManager } from 'lill-core';
import { join } from 'path';

async function main() {
  const cwd = process.cwd();
  const snapshotDir = join(cwd, '.lill', 'snapshots');

  console.log('🧠 Testing ReasoningStore...\n');

  // Load QuadIndex from snapshot
  console.log('📚 Loading QuadIndex from snapshot...');
  const quadIndex = new QuadIndex();
  const snapshotManager = new SnapshotManager({ snapshotDir, verbose: false });
  await snapshotManager.restore(quadIndex, 'rolling');

  // Get stats
  const stats = quadIndex.getStats();
  console.log(`✅ Loaded ${stats.data.metadata.total} principles`);
  console.log(`✅ Loaded ${stats.data.graph.edges} relationships`);
  console.log(`✅ Loaded ${stats.data.reasoning.hypotheticals} hypotheticals`);
  console.log(`✅ Loaded ${stats.data.reasoning.rejected} rejected alternatives\n`);

  // Get all hypotheticals
  console.log('📋 All Hypotheticals:');
  const hypotheticalsResult = quadIndex.getAllHypotheticals();
  if (
    !hypotheticalsResult.success ||
    !hypotheticalsResult.data ||
    hypotheticalsResult.data.length === 0
  ) {
    console.log('   (none)\n');
  } else {
    for (const hyp of hypotheticalsResult.data) {
      console.log(`   - ID: ${hyp.id}`);
      console.log(`     Question: ${hyp.question}`);
      console.log(`     Status: ${hyp.status}`);
      console.log(`     Alternatives: ${hyp.alternatives.length}`);
      for (const alt of hyp.alternatives) {
        console.log(`       - ${alt.option} (${alt.status}): ${alt.reason}`);
      }
      console.log();
    }
  }

  // Get all rejected alternatives
  console.log('❌ All Rejected Alternatives:');
  const rejectedResult = quadIndex.getAllRejected();
  if (!rejectedResult.success || !rejectedResult.data || rejectedResult.data.length === 0) {
    console.log('   (none)\n');
  } else {
    for (const rej of rejectedResult.data) {
      console.log(`   - ID: ${rej.id}`);
      console.log(`     Alternative: ${rej.alternative}`);
      console.log(`     Reason: ${rej.reason}`);
      console.log(`     Context: ${rej.context || 'N/A'}`);
      console.log();
    }
  }

  // Test reasoning with a query
  console.log('🧠 Testing Deep Thinking:');
  console.log('   Query: "Should we use TypeScript strict mode?"\n');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = quadIndex.search({
    text: 'TypeScript strict mode',
    includeReasoning: true,
    reasoningIterations: 3,
    reasoningConfidenceThreshold: 0.9,
    limit: 5,
  } as any);

  if (!result.success) {
    console.error(`❌ Query failed: ${result.error}`);
    return;
  }

  const data = result.data!;
  console.log(`✅ Found ${data.total} principle(s)\n`);

  // Show reasoning
  if (data.reasoning) {
    console.log('🧠 Reasoning Result:');
    console.log(`   Final Thought: ${data.reasoning.finalThought}`);
    console.log(`   Confidence: ${(data.reasoning.confidence * 100).toFixed(0)}%`);
    console.log(`   Iterations: ${data.reasoning.iterations}`);
    console.log(`   Halted Early: ${data.reasoning.haltedEarly ? 'Yes' : 'No'}\n`);

    if (data.reasoning.alternatives && data.reasoning.alternatives.length > 0) {
      console.log('   Alternatives Considered:');
      for (const alt of data.reasoning.alternatives) {
        console.log(`   - ${alt.option} (${alt.status}): ${alt.reason}`);
      }
      console.log();
    }

    if (data.reasoning.lessons && data.reasoning.lessons.length > 0) {
      console.log('   Lessons Learned:');
      for (const lesson of data.reasoning.lessons) {
        console.log(`   - ${lesson}`);
      }
      console.log();
    }

    if (data.reasoning.reasoningChain && data.reasoning.reasoningChain.length > 0) {
      console.log('   Reasoning Chain:');
      for (let i = 0; i < data.reasoning.reasoningChain.length; i++) {
        const step = data.reasoning.reasoningChain[i];
        console.log(`   Iteration ${i + 1}:`);
        console.log(`     Thought: ${step.thought}`);
        console.log(`     Confidence: ${(step.confidence * 100).toFixed(0)}%`);
        console.log(`     Alternatives: ${step.alternatives.length}`);
        console.log(`     Lessons: ${step.lessons.length}`);
      }
      console.log();
    }
  } else {
    console.log('❌ No reasoning data returned\n');
  }

  console.log('✅ Test complete!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
