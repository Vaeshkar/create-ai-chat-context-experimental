/**
 * Test Memory Dropoff Agent with Session Files
 * Phase 7 (Updated for Phase 6.5)
 */

import { MemoryDropoffAgent } from './src/agents/MemoryDropoffAgent.js';

console.log('🚀 Phase 7: Memory Dropoff Test (Session Files)\n');

const agent = new MemoryDropoffAgent(process.cwd());

console.log('📊 Starting dropoff...');
console.log('   Input: .aicf/sessions/ (5 session files)');
console.log('   Age thresholds:');
console.log('     0-2 days:  sessions/ (FULL)');
console.log('     2-7 days:  medium/  (SUMMARY - meaningful conversations only)');
console.log('     7-14 days: old/     (KEY_POINTS - decisions and actions only)');
console.log('     14+ days:  archive/ (SINGLE_LINE per conversation)');
console.log('');

const result = await agent.dropoff();

if (result.ok) {
  const stats = result.value;
  
  console.log('✅ Dropoff Complete!\n');
  console.log('📈 Statistics:');
  console.log(`   Session files: ${stats.sessionFiles}`);
  console.log(`   Medium files: ${stats.mediumFiles}`);
  console.log(`   Old files: ${stats.oldFiles}`);
  console.log(`   Archive files: ${stats.archiveFiles}`);
  console.log(`   Moved to medium: ${stats.movedToMedium}`);
  console.log(`   Moved to old: ${stats.movedToOld}`);
  console.log(`   Moved to archive: ${stats.movedToArchive}`);
  console.log(`   Compressed: ${stats.compressed}`);
  
  console.log('\n📁 Check folders:');
  console.log('   .aicf/sessions/ - Recent sessions (0-2 days)');
  console.log('   .aicf/medium/   - Summary format (2-7 days)');
  console.log('   .aicf/old/      - Key points only (7-14 days)');
  console.log('   .aicf/archive/  - Single line format (14+ days)');
} else {
  console.error('❌ Dropoff failed:', result.error.message);
  process.exit(1);
}

