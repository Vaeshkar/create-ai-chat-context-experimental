#!/usr/bin/env node

/**
 * Simple Warp Conversation Extractor
 * Bypasses the problematic module chain and just works
 */

const conversationId = process.argv[2];

if (!conversationId) {
  console.log('Usage: node extract-warp-simple.js <conversation-id>');
  console.log('Example: node extract-warp-simple.js 1237cec7-c68c-4f77-986f-0746e5fc4655');
  process.exit(1);
}

async function main() {
  try {
    console.log(`🔍 Extracting Warp conversation: ${conversationId}`);
    
    // Use the method we know works
    const IntelligentConversationParser = require('./src/agents/intelligent-conversation-parser');
    const parser = new IntelligentConversationParser({ verbose: true });
    
    console.log('🧠 Processing through AI system...');
    const result = await parser.processFromSQLite(conversationId, { verbose: true });
    
    if (result.success) {
      console.log(`\n✅ Success! Processed ${result.messageCount} messages`);
      console.log(`📂 Content written to ${result.routingResults?.length || 0} files:`);
      if (result.routingResults) {
        for (const routing of result.routingResults) {
          console.log(`   • ${routing.file}`);
        }
      }
    } else {
      console.log(`\n❌ Failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();