#!/usr/bin/env node

/**
 * Debug script to inspect Augment LevelDB contents
 */

import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';

async function main() {
  console.log('🔍 Debugging Augment LevelDB Reader\n');
  console.log('='.repeat(60) + '\n');

  const reader = new AugmentLevelDBReader(process.cwd());

  // Check if available
  console.log('1. Checking if Augment data is available...');
  const isAvailable = reader.isAvailable();
  console.log(`   Available: ${isAvailable}`);
  console.log(`   Storage path: ${reader.getStoragePath()}\n`);

  if (!isAvailable) {
    console.log('❌ No Augment workspaces found!');
    process.exit(1);
  }

  // Read all conversations (auto-detects current workspace)
  console.log(
    '2. Reading all conversations from Augment LevelDB (auto-detecting current workspace)...'
  );
  const result = await reader.readAllConversations();

  if (!result.ok) {
    console.log(`❌ Error: ${result.error?.message}`);
    process.exit(1);
  }

  const conversations = result.value;
  console.log(`   Total conversations found: ${conversations.length}\n`);

  if (conversations.length === 0) {
    console.log('⚠️  No conversations found in LevelDB');
    process.exit(0);
  }

  // Show first 5 conversations
  console.log('3. First 5 conversations:\n');
  for (let i = 0; i < Math.min(5, conversations.length); i++) {
    const conv = conversations[i];
    console.log(`   Conversation ${i + 1}:`);
    console.log(`     - ID: ${conv.conversationId}`);
    console.log(`     - Workspace: ${conv.workspaceId}`);
    console.log(`     - Data length: ${conv.rawData.length} bytes`);
    console.log(`     - Timestamp: ${conv.timestamp}`);
    console.log(`     - Data preview: ${conv.rawData.substring(0, 100)}...`);
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`✅ Debug complete! Found ${conversations.length} conversations`);
}

main().catch(console.error);
