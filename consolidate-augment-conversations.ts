import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';
import { AugmentCacheWriter } from './dist/esm/writers/AugmentCacheWriter.js';
import { CacheConsolidationAgent } from './dist/esm/agents/CacheConsolidationAgent.js';

async function main() {
  console.log('🚀 Consolidating Augment conversations into memory files...\n');

  // Step 1: Read all conversations
  console.log('📖 Step 1: Reading conversations from Augment LevelDB...');
  const reader = new AugmentLevelDBReader(process.cwd());
  const readResult = await reader.readAllConversations();

  if (!readResult.ok) {
    console.error('❌ Error reading conversations:', readResult.error.message);
    process.exit(1);
  }

  const conversations = readResult.value;
  console.log(`✅ Read ${conversations.length} conversations\n`);

  // Step 2: Write to cache
  console.log('💾 Step 2: Writing to cache...');
  const writer = new AugmentCacheWriter(process.cwd());
  const writeResult = await writer.write();

  if (!writeResult.ok) {
    console.error('❌ Error writing to cache:', writeResult.error.message);
    process.exit(1);
  }

  console.log(`✅ Cache write complete:`, writeResult.value, '\n');

  // Step 3: Consolidate cache to memory files
  console.log('🔄 Step 3: Consolidating cache to .aicf/ memory files...');
  const agent = new CacheConsolidationAgent(process.cwd());
  const consolidateResult = await agent.consolidate();

  if (!consolidateResult.ok) {
    console.error('❌ Error consolidating:', consolidateResult.error.message);
    process.exit(1);
  }

  const stats = consolidateResult.value;
  console.log(`✅ Consolidation complete:`);
  console.log(`   Total chunks processed: ${stats.totalChunksProcessed}`);
  console.log(`   Chunks consolidated: ${stats.chunksConsolidated}`);
  console.log(`   Files written: ${stats.filesWritten}\n`);

  console.log('✅ ALL DONE! Conversations are now in .aicf/recent/');
}

main().catch(console.error);
