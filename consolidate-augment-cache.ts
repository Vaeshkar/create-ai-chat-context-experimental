import { CacheConsolidationAgent } from './src/agents/CacheConsolidationAgent.js';

async function main() {
  console.log('🔄 Consolidating cache into .aicf/ files...\n');

  const agent = new CacheConsolidationAgent(process.cwd());
  const result = await agent.consolidate();

  if (result.ok) {
    console.log('\n✅ Consolidation complete!');
    console.log(`   Total chunks: ${result.value.totalChunksProcessed}`);
    console.log(`   Consolidated: ${result.value.chunksConsolidated}`);
    console.log(`   Duplicated: ${result.value.chunksDuplicated}`);
    console.log(`   Files written: ${result.value.filesWritten}`);
  } else {
    console.error('\n❌ Consolidation failed:');
    console.error(result.error.message);
  }
}

main().catch(console.error);
