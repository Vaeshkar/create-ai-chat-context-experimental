/**
 * Test Session Consolidation Agent
 * Phase 6.5: Convert 10,260 conversation files into ~20 session files
 */

import { SessionConsolidationAgent } from './src/agents/SessionConsolidationAgent.js';

console.log('🚀 Phase 6.5: Session Consolidation Test\n');

const agent = new SessionConsolidationAgent(process.cwd());

console.log('📊 Starting consolidation...');
console.log('   Input: .aicf/recent/ (10,260 files)');
console.log('   Output: .aicf/sessions/ (session files)\n');

const result = await agent.consolidate();

if (result.ok) {
  const stats = result.value;
  
  console.log('✅ Consolidation Complete!\n');
  console.log('📈 Statistics:');
  console.log(`   Total files processed: ${stats.totalFiles}`);
  console.log(`   Total conversations: ${stats.totalConversations}`);
  console.log(`   Sessions created: ${stats.sessionsCreated}`);
  console.log(`   Unique conversations: ${stats.uniqueConversations}`);
  console.log(`   Duplicates removed: ${stats.duplicatesRemoved}`);
  console.log(`   Storage reduction: ${stats.storageReduction}`);
  console.log(`   Token reduction: ${stats.tokenReduction}`);
  
  console.log('\n📁 Output files:');
  console.log('   Check .aicf/sessions/ for session files');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Review session files in .aicf/sessions/');
  console.log('   2. Verify readability and format');
  console.log('   3. Test with MemoryDropoffAgent');
} else {
  console.error('❌ Consolidation failed:', result.error.message);
  process.exit(1);
}

