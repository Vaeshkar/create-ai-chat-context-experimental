#!/usr/bin/env node

/**
 * Test script to verify conversation summary extraction
 */

const { CheckpointOrchestrator } = require('./src/checkpoint-orchestrator');
const AugmentParser = require('./src/session-parsers/augment-parser');

async function test() {
  console.log('🧪 Testing Conversation Summary Extraction\n');
  
  // Step 1: Extract conversation from Augment
  const parser = new AugmentParser();
  const conversations = await parser.extractConversations(1);
  
  if (conversations.length === 0) {
    console.log('❌ No conversations found');
    return;
  }
  
  const conv = conversations[0];
  console.log(`✅ Found conversation with ${conv.messages.length} messages\n`);
  
  // Step 2: Create dump format (same as watcher)
  const dump = {
    sessionId: conv.conversationId || `aug-${Date.now()}`,
    checkpointNumber: 1,
    source: 'augment', // ✅ Explicitly set source
    startTime: conv.timestamp || new Date().toISOString(),
    endTime: new Date().toISOString(),
    tokenCount: conv.messages.reduce(
      (sum, m) => sum + Math.ceil((m.content || '').length / 4),
      0
    ),
    messages: conv.messages.map((m) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content || '',
      timestamp: m.timestamp || new Date().toISOString(),
      metadata: m.metadata // ✅ Preserve metadata
    })),
  };
  
  console.log('📦 Dump structure:');
  console.log(`   - Source: ${dump.source}`);
  console.log(`   - Messages: ${dump.messages.length}`);
  console.log(`   - First message role: ${dump.messages[0].role}`);
  console.log(`   - First message content length: ${dump.messages[0].content.length}`);
  console.log(`   - First message metadata: ${JSON.stringify(dump.messages[0].metadata)}\n`);
  
  // Step 3: Test IntelligentConversationParser directly
  const IntelligentConversationParser = require('./src/agents/intelligent-conversation-parser');
  const parser2 = new IntelligentConversationParser({ verbose: true });
  
  console.log('🧠 Testing conversation summary extraction...\n');
  
  // Call extractAugmentConversationSummary directly
  const summary = parser2.extractAugmentConversationSummary(dump.messages);
  
  console.log('📊 Conversation Summary Results:');
  console.log(`   - Total messages: ${summary.metrics.totalMessages}`);
  console.log(`   - User messages: ${summary.metrics.userMessages}`);
  console.log(`   - AI messages: ${summary.metrics.aiMessages}`);
  console.log(`   - Total chars: ${summary.metrics.totalChars}`);
  console.log(`   - Avg message length: ${summary.metrics.avgMessageLength}\n`);
  
  console.log('📝 User Queries (first 500 chars):');
  console.log(summary.userQueries.substring(0, 500) + '...\n');
  
  console.log('🤖 AI Responses (first 500 chars):');
  console.log(summary.aiResponses.substring(0, 500) + '...\n');
  
  console.log('💬 Full Conversation (first 1000 chars):');
  console.log(summary.fullConversation.substring(0, 1000) + '...\n');
  
  // Step 4: Test analysis
  console.log('🔍 Testing Augment conversation analysis...\n');
  const analysis = parser2.analyzeAugmentConversation({ messages: dump.messages }, dump.messages);
  
  console.log('📊 Analysis Results:');
  console.log(`   - User intents: ${analysis.userIntents.length}`);
  console.log(`   - AI actions: ${analysis.aiActions.length}`);
  console.log(`   - Technical work: ${analysis.technicalWork.length}`);
  console.log(`   - Decisions: ${analysis.decisions.length}`);
  console.log(`   - Flow: ${analysis.flow.substring(0, 200)}...`);
  console.log(`   - Working on: ${analysis.workingOn.substring(0, 200)}...`);
  console.log(`   - Blockers: ${analysis.blockers}`);
  console.log(`   - Next action: ${analysis.nextAction.substring(0, 200)}...\n`);
  
  if (analysis.userIntents.length > 0) {
    console.log('✅ First user intent:');
    console.log(`   ${analysis.userIntents[0].intent.substring(0, 300)}...\n`);
  }
  
  if (analysis.aiActions.length > 0) {
    console.log('✅ First AI action:');
    console.log(`   ${analysis.aiActions[0].details.substring(0, 300)}...\n`);
  }
  
  if (analysis.technicalWork.length > 0) {
    console.log('✅ First technical work:');
    console.log(`   ${analysis.technicalWork[0].work.substring(0, 300)}...\n`);
  }
  
  console.log('🎉 Test complete!');
}

test().catch(console.error);

