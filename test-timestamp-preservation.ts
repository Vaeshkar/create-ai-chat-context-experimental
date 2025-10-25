/**
 * Test timestamp preservation through the pipeline
 * Verify that historical conversations get correct dates in filenames
 */

import { AugmentLevelDBReader } from './src/readers/AugmentLevelDBReader.js';
import { AugmentCacheWriter } from './src/writers/AugmentCacheWriter.js';
import { CacheConsolidationAgent } from './src/agents/CacheConsolidationAgent.js';
import { readdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🧪 Testing Timestamp Preservation Through Pipeline\n');
  console.log('='.repeat(70));

  // Clean up test directories
  const testCacheDir = join(process.cwd(), '.cache', 'llm', 'augment', '.conversations');
  const testAicfDir = join(process.cwd(), '.aicf', 'recent');

  if (existsSync(testCacheDir)) {
    console.log('🧹 Cleaning cache directory...');
    rmSync(testCacheDir, { recursive: true, force: true });
  }

  if (existsSync(testAicfDir)) {
    console.log('🧹 Cleaning AICF directory...');
    rmSync(testAicfDir, { recursive: true, force: true });
  }

  // Step 1: Read conversations from Augment LevelDB
  console.log('\n📖 Step 1: Reading conversations from Augment LevelDB...');
  const reader = new AugmentLevelDBReader();
  const readResult = await reader.readAllConversations();

  if (!readResult.ok) {
    console.error('❌ Failed to read conversations:', readResult.error.message);
    return;
  }

  const allConversations = readResult.value;
  console.log(`✅ Found ${allConversations.length} total conversations`);

  // Sample 5 conversations for verification
  const sampleConversations = allConversations.slice(0, 5);
  console.log(`\n🎯 Sample conversations for verification:`);

  const conversationTimestamps = new Map<string, string>();

  for (let i = 0; i < sampleConversations.length; i++) {
    const conv = sampleConversations[i];
    const rawData = typeof conv.rawData === 'string' ? JSON.parse(conv.rawData) : conv.rawData;
    const timestamp = rawData.timestamp || 'NO TIMESTAMP';
    const date = timestamp !== 'NO TIMESTAMP' ? new Date(timestamp).toISOString() : 'N/A';

    conversationTimestamps.set(conv.conversationId, timestamp);

    console.log(`  ${i + 1}. ${conv.conversationId.substring(0, 50)}...`);
    console.log(`     Timestamp: ${timestamp}`);
    console.log(`     Date: ${date}`);
  }

  // Step 2: Write to cache
  console.log('\n📝 Step 2: Writing to cache...');
  const cacheWriter = new AugmentCacheWriter();
  const writeResult = await cacheWriter.write();

  if (!writeResult.ok) {
    console.error('❌ Failed to write cache:', writeResult.error.message);
    return;
  }

  console.log(`✅ Wrote ${writeResult.value.newChunksWritten} chunks to cache`);

  // Check cache files
  const cacheFiles = readdirSync(testCacheDir);
  console.log(`\n📂 Cache files created: ${cacheFiles.length}`);
  for (const file of cacheFiles.slice(0, 3)) {
    console.log(`   - ${file}`);
  }

  // Step 3: Consolidate cache to AICF
  console.log('\n🔄 Step 3: Consolidating cache to AICF...');
  const consolidator = new CacheConsolidationAgent(process.cwd());
  const consolidateResult = await consolidator.consolidate();

  if (!consolidateResult.ok) {
    console.error('❌ Failed to consolidate:', consolidateResult.error.message);
    return;
  }

  console.log(`✅ Consolidated ${consolidateResult.value.chunksConsolidated} chunks`);
  console.log(`✅ Wrote ${consolidateResult.value.filesWritten} AICF files`);

  // Step 4: Verify AICF filenames have correct dates
  console.log('\n🔍 Step 4: Verifying AICF filenames have correct dates...');

  if (!existsSync(testAicfDir)) {
    console.error('❌ AICF directory not found!');
    return;
  }

  const aicfFiles = readdirSync(testAicfDir);
  console.log(`\n📂 AICF files created: ${aicfFiles.length}`);

  let correctDates = 0;
  let incorrectDates = 0;

  for (const file of aicfFiles) {
    // Extract date from filename: {date}_{conversationId}.aicf
    const match = file.match(/^(\d{4}-\d{2}-\d{2})_(.+)\.aicf$/);
    if (!match) {
      console.log(`   ⚠️  ${file} - Invalid filename format`);
      continue;
    }

    const fileDate = match[1];
    const conversationId = match[2];

    // Check if this is one of our sample conversations
    const originalTimestamp = conversationTimestamps.get(conversationId);
    if (!originalTimestamp) {
      // Not a sample conversation, skip
      continue;
    }

    const originalDate = new Date(originalTimestamp).toISOString().split('T')[0];

    if (fileDate === originalDate) {
      console.log(`   ✅ ${file}`);
      console.log(`      File date: ${fileDate}, Original: ${originalDate}`);
      correctDates++;
    } else {
      console.log(`   ❌ ${file}`);
      console.log(`      File date: ${fileDate}, Original: ${originalDate} (MISMATCH!)`);
      incorrectDates++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Results:');
  console.log(`   Total AICF files: ${aicfFiles.length}`);
  console.log(`   Correct dates: ${correctDates}`);
  console.log(`   Incorrect dates: ${incorrectDates}`);

  if (incorrectDates === 0) {
    console.log('\n✅ SUCCESS! All timestamps preserved correctly!');
  } else {
    console.log('\n❌ FAILURE! Some timestamps were not preserved!');
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
