#!/usr/bin/env tsx
/**
 * Test script for ReasoningStore semantic search
 * Tests if hypotheticals and rejected alternatives can be found using embeddings
 */

import { QuadIndex } from 'lill-core';
import { SnapshotManager } from 'lill-core';

async function main() {
  console.log('🧪 Testing ReasoningStore Semantic Search\n');

  const cwd = process.cwd();
  const quadIndex = new QuadIndex();
  const snapshotManager = new SnapshotManager({ cwd, verbose: true });

  // 1. Restore from snapshot
  console.log('📂 Restoring from snapshot...');
  const restoreResult = await snapshotManager.restore(quadIndex, 'rolling');
  if (!restoreResult.success) {
    console.error(`❌ Failed to restore: ${restoreResult.error}`);
    return;
  }
  console.log('✅ Restored from snapshot\n');

  // 2. Get stats
  console.log('📊 QuadIndex Stats:');
  const stats = quadIndex.getStats();
  if (stats.success && stats.data) {
    console.log(`   Principles: ${stats.data.metadata.total}`);
    console.log(`   Relationships: ${stats.data.graph.edges}`);
    console.log(`   Hypotheticals: ${stats.data.reasoning.hypotheticals}`);
    console.log(`   Rejected: ${stats.data.reasoning.rejected}\n`);
  }

  // 3. Get all hypotheticals
  console.log('📋 All Hypotheticals:');
  const hypotheticalsResult = quadIndex.getAllHypotheticals();
  if (hypotheticalsResult.success && hypotheticalsResult.data) {
    console.log(`   Total: ${hypotheticalsResult.data.length}`);
    for (const hyp of hypotheticalsResult.data.slice(0, 5)) {
      console.log(`   - ${hyp.question.substring(0, 80)}...`);
    }
    console.log();
  }

  // 4. Get all rejected alternatives
  console.log('❌ All Rejected Alternatives:');
  const rejectedResult = quadIndex.getAllRejected();
  if (rejectedResult.success && rejectedResult.data) {
    console.log(`   Total: ${rejectedResult.data.length}`);
    for (const rej of rejectedResult.data) {
      console.log(`   - ${rej.option.substring(0, 80)}...`);
    }
    console.log();
  }

  // 5. Test semantic search with reasoning
  console.log('🧠 Testing Semantic Search with Reasoning:');
  console.log('   Query: "Should we remove the dropoff system?"\n');

  const result = await quadIndex.searchAsync({
    text: 'Should we remove the dropoff system?',
    includeReasoning: true,
    reasoningIterations: 3,
    limit: 5,
  });

  if (result.success && result.data) {
    console.log(`✅ Found ${result.data.principles.length} principles`);

    if (result.data.reasoning) {
      console.log(`\n🤔 Reasoning:`);
      console.log(`   Alternatives: ${result.data.reasoning.alternatives.length}`);
      console.log(`   Lessons: ${result.data.reasoning.lessons.length}`);

      if (result.data.reasoning.alternatives.length > 0) {
        console.log(`\n   Alternatives found:`);
        for (const alt of result.data.reasoning.alternatives) {
          console.log(`   - ${alt.option} (${alt.status}): ${alt.reason}`);
        }
      }

      if (result.data.reasoning.lessons.length > 0) {
        console.log(`\n   Lessons learned:`);
        for (const lesson of result.data.reasoning.lessons) {
          console.log(`   - ${lesson.lesson}`);
        }
      }
    } else {
      console.log(`\n⚠️  No reasoning data returned`);
    }
  } else {
    console.error(`❌ Search failed: ${result.error}`);
  }

  // 6. Test direct ReasoningStore access
  console.log(`\n🔍 Testing Direct ReasoningStore Access:`);
  const reasoningStore = quadIndex.getReasoningStore();

  // Initialize the reasoning store
  await reasoningStore.initialize();

  // Try to find relevant hypotheticals manually
  console.log(`   Searching for hypotheticals about "dropoff system"...`);

  // This will use the new semantic search
  const reasoningResult = await reasoningStore.reason({
    query: 'dropoff system memory lifecycle',
    maxIterations: 3,
    includeLessons: true,
  });

  if (reasoningResult.success && reasoningResult.data) {
    console.log(`   ✅ Reasoning completed:`);
    console.log(`      Iterations: ${reasoningResult.data.iterations}`);
    console.log(`      Confidence: ${reasoningResult.data.confidence}`);
    console.log(`      Alternatives: ${reasoningResult.data.alternatives.length}`);
    console.log(`      Lessons: ${reasoningResult.data.lessons.length}`);

    if (reasoningResult.data.reasoning.length > 0) {
      console.log(`\n   Reasoning chain:`);
      for (const thought of reasoningResult.data.reasoning) {
        console.log(`   - ${thought.substring(0, 100)}...`);
      }
    }
  } else {
    console.error(`   ❌ Reasoning failed: ${reasoningResult.error}`);
  }

  console.log(`\n✅ Test complete!`);
}

main().catch(console.error);
