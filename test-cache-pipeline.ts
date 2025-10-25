/**
 * Test script to manually trigger the cache-first pipeline
 */

import { AugmentCacheWriter } from './dist/esm/writers/AugmentCacheWriter.js';
import { ClaudeCacheWriter } from './dist/esm/writers/ClaudeCacheWriter.js';
import { CacheConsolidationAgent } from './dist/esm/agents/CacheConsolidationAgent.js';
import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';
import { ClaudeCliWatcher } from './dist/esm/watchers/ClaudeCliWatcher.js';
import { ConversationOrchestrator } from './dist/esm/orchestrators/ConversationOrchestrator.js';
import { MemoryFileWriter } from './dist/esm/writers/MemoryFileWriter.js';
import { AgentRouter } from './dist/esm/agents/AgentRouter.js';
import { WatcherLogger } from './dist/esm/utils/WatcherLogger.js';
import { join } from 'path';
import { cwd } from 'process';

const logger = new WatcherLogger({ verbose: true });

async function runTest() {
  console.log('\n🧪 Testing Cache-First Pipeline\n');
  console.log('='.repeat(60));

  try {
    const workDir = cwd();

    // Step 1: Write Augment data to cache
    console.log('\n📝 Step 1: Writing Augment data to cache...');
    const augmentWriter = new AugmentCacheWriter(workDir);
    const augmentResult = await augmentWriter.write();
    if (augmentResult.ok) {
      console.log(`✅ Augment cache written:`);
      console.log(`   - New chunks: ${augmentResult.value.newChunksWritten}`);
      console.log(`   - Skipped (duplicates): ${augmentResult.value.chunksSkipped}`);
    } else {
      console.log(`❌ Augment write failed: ${augmentResult.error.message}`);
    }

    // Step 2: Write Claude data to cache
    console.log('\n📝 Step 2: Writing Claude CLI data to cache...');
    const claudeWriter = new ClaudeCacheWriter(workDir);
    const claudeResult = await claudeWriter.write();
    if (claudeResult.ok) {
      console.log(`✅ Claude cache written:`);
      console.log(`   - New chunks: ${claudeResult.value.newChunksWritten}`);
      console.log(`   - Skipped (duplicates): ${claudeResult.value.chunksSkipped}`);
    } else {
      console.log(`❌ Claude write failed: ${claudeResult.error.message}`);
    }

    // Step 3: Consolidate cache chunks
    console.log('\n📝 Step 3: Consolidating cache chunks...');
    const consolidationAgent = new CacheConsolidationAgent(workDir);
    const consolidationResult = await consolidationAgent.consolidate();
    if (consolidationResult.ok) {
      console.log(`✅ Consolidation complete:`);
      console.log(`   - Chunks consolidated: ${consolidationResult.value.chunksConsolidated}`);
      console.log(`   - Files written: ${consolidationResult.value.filesWritten}`);
      console.log(`   - Duplicates removed: ${consolidationResult.value.duplicatesRemoved}`);
    } else {
      console.log(`❌ Consolidation failed: ${consolidationResult.error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Pipeline test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
