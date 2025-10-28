#!/usr/bin/env npx tsx

/**
 * Test script to verify ClaudeDesktopWatcher works with LevelDB
 */

import { ClaudeDesktopWatcher } from './src/watchers/ClaudeDesktopWatcher.js';

async function testClaudeDesktopWatcher() {
  console.log('🔍 Testing ClaudeDesktopWatcher with LevelDB\n');

  const watcher = new ClaudeDesktopWatcher();

  console.log('📂 Storage Path:', watcher.getStoragePath());
  console.log('✅ Available:', watcher.isAvailable());

  if (!watcher.isAvailable()) {
    console.log('❌ Claude Desktop LevelDB not found');
    return;
  }

  console.log('\n📥 Reading all messages...\n');

  try {
    const result = await watcher.getAllMessages();

    if (!result.ok) {
      console.error('❌ Error:', result.error.message);
      return;
    }

    const messages = result.value;
    console.log(`✅ Found ${messages.length} messages\n`);

    if (messages.length > 0) {
      console.log('📝 Sample messages (first 5):\n');
      messages.slice(0, 5).forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.role}] ${msg.conversationId}`);
        console.log(`   Timestamp: ${msg.timestamp}`);
        console.log(`   Content: ${msg.content.substring(0, 100)}...`);
        console.log('');
      });
    }

    console.log('\n🔄 Testing getNewMessages()...\n');

    const newResult = await watcher.getNewMessages();

    if (!newResult.ok) {
      console.error('❌ Error:', newResult.error.message);
      return;
    }

    const newMessages = newResult.value;
    console.log(`✅ New messages: ${newMessages.length}`);

    if (newMessages.length > 0) {
      console.log('\n📝 New messages (first 3):\n');
      newMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.role}] ${msg.conversationId}`);
        console.log(`   Content: ${msg.content.substring(0, 100)}...`);
        console.log('');
      });
    }

    console.log('\n✅ ClaudeDesktopWatcher test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testClaudeDesktopWatcher().catch(console.error);

