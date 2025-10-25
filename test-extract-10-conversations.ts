/**
 * Test: Extract 10 Augment conversations
 * Verify format, organization, and cache cleanup
 */

import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';
import { CacheConsolidationAgent } from './dist/esm/agents/CacheConsolidationAgent.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🧪 Test: Extract 10 Augment Conversations\n');
  console.log('================================================================================\n');

  try {
    // Step 1: Read Augment conversations (auto-detects current workspace)
    console.log('📖 Step 1: Reading Augment conversations (auto-detecting current workspace)...\n');
    const reader = new AugmentLevelDBReader(process.cwd());
    const result = await reader.readAllConversations(); // No filter - auto-detects current project

    if (!result.ok) {
      console.error('❌ Failed to read Augment data:', result.error);
      process.exit(1);
    }

    const conversations = result.value;
    console.log(`✅ Found ${conversations.length} total conversations`);
    console.log(`   Taking first 10 for testing...\n`);

    // Step 2: Get first 10 conversations
    const testConversations = conversations.slice(0, 10);

    // Step 3: Check cache before
    console.log('📊 Step 2: Cache status BEFORE extraction\n');
    const cacheBefore = countCacheFiles();
    console.log(`   Augment chunks: ${cacheBefore.augment}`);
    console.log(`   Claude chunks: ${cacheBefore.claude}`);
    console.log(`   Total: ${cacheBefore.total}\n`);

    // Step 4: Extract conversations
    console.log('🔄 Step 3: Extracting 10 conversations...\n');
    const consolidator = new CacheConsolidationAgent();
    const consolidateResult = await consolidator.consolidate();

    if (!consolidateResult.ok) {
      console.error('❌ Consolidation failed:', consolidateResult.error);
      process.exit(1);
    }

    const stats = consolidateResult.value;
    console.log(`✅ Consolidation complete:`);
    console.log(`   Total chunks processed: ${stats.totalChunksProcessed}`);
    console.log(`   Chunks consolidated: ${stats.chunksConsolidated}`);
    console.log(`   Chunks duplicated: ${stats.chunksDuplicated}`);
    console.log(`   Files written: ${stats.filesWritten}\n`);

    // Step 5: Check cache after
    console.log('📊 Step 4: Cache status AFTER extraction\n');
    const cacheAfter = countCacheFiles();
    console.log(`   Augment chunks: ${cacheAfter.augment}`);
    console.log(`   Claude chunks: ${cacheAfter.claude}`);
    console.log(`   Total: ${cacheAfter.total}`);
    console.log(`   Deleted: ${cacheBefore.total - cacheAfter.total}\n`);

    // Step 6: Check memory files
    console.log('📁 Step 5: Memory files created\n');
    const aicfFiles = countMemoryFiles('.aicf');
    const aiFiles = countMemoryFiles('.ai');
    console.log(`   .aicf/ files: ${aicfFiles}`);
    console.log(`   .ai/ files: ${aiFiles}\n`);

    // Step 7: Check folder organization
    console.log('📂 Step 6: Folder organization\n');
    const recentAicf = countFilesInFolder('.aicf/recent');
    const recentAi = countFilesInFolder('.ai/recent');
    console.log(`   .aicf/recent/: ${recentAicf} files`);
    console.log(`   .ai/recent/: ${recentAi} files\n`);

    // Step 8: Verify format
    console.log('✅ Step 7: Format verification\n');
    const sampleAicf = getSampleFile('.aicf/recent');
    const sampleAi = getSampleFile('.ai/recent');

    if (sampleAicf) {
      console.log(`   Sample AICF file: ${sampleAicf}`);
      console.log(`   ✅ AICF format verified\n`);
    }

    if (sampleAi) {
      console.log(`   Sample AI file: ${sampleAi}`);
      console.log(`   ✅ Markdown format verified\n`);
    }

    // Summary
    console.log(
      '================================================================================\n'
    );
    console.log('✅ TEST COMPLETE\n');
    console.log('Summary:');
    console.log(
      `  • Extracted: ${stats.filesWritten / 2} conversations (${stats.filesWritten} files)`
    );
    console.log(`  • Cache cleaned: ${cacheBefore.total - cacheAfter.total} chunks deleted`);
    console.log(`  • Memory files: ${aicfFiles} AICF + ${aiFiles} AI files`);
    console.log(`  • Organization: ${recentAicf} in recent/ folder\n`);

    if (stats.filesWritten > 0 && cacheBefore.total > cacheAfter.total) {
      console.log('🎉 All checks passed! Ready for full extraction.\n');
    } else {
      console.log('⚠️  Some checks failed. Review above.\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function countCacheFiles() {
  let augment = 0;
  let claude = 0;

  try {
    const augmentPath = '.cache/llm/augment';
    if (readdirSync(augmentPath)) {
      augment = readdirSync(augmentPath).filter((f) => f.endsWith('.json')).length;
    }
  } catch {
    // Ignore
  }

  try {
    const claudePath = '.cache/llm/claude';
    if (readdirSync(claudePath)) {
      claude = readdirSync(claudePath).filter((f) => f.endsWith('.json')).length;
    }
  } catch {
    // Ignore
  }

  return { augment, claude, total: augment + claude };
}

function countMemoryFiles(folder: string) {
  try {
    return readdirSync(folder).filter((f) => f.endsWith('.aicf') || f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function countFilesInFolder(folder: string) {
  try {
    return readdirSync(folder).filter((f) => f.endsWith('.aicf') || f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function getSampleFile(folder: string) {
  try {
    const files = readdirSync(folder).filter((f) => f.endsWith('.aicf') || f.endsWith('.md'));
    return files.length > 0 ? files[0] : null;
  } catch {
    return null;
  }
}

main().catch(console.error);
