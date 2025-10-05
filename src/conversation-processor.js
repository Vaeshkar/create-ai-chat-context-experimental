#!/usr/bin/env node

/**
 * Terminal Conversation Processor
 * Monitors AI terminal's SQLite database and automatically processes new conversations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// AI Terminal database path
const TERMINAL_DB_PATH = path.join(os.homedir(), 'Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite');

// Track processed conversations
const PROCESSED_CONVERSATIONS_FILE = '.terminal-processed-conversations.json';

class ConversationProcessor {
  constructor() {
    this.processedConversations = this.loadProcessedList();
    this.isProcessing = false;
  }

  loadProcessedList() {
    try {
      if (fs.existsSync(PROCESSED_CONVERSATIONS_FILE)) {
        return new Set(JSON.parse(fs.readFileSync(PROCESSED_CONVERSATIONS_FILE, 'utf-8')));
      }
    } catch (error) {
      console.log('⚠️ Could not load processed conversations list, starting fresh');
    }
    return new Set();
  }

  saveProcessedList() {
    try {
      fs.writeFileSync(PROCESSED_CONVERSATIONS_FILE, JSON.stringify([...this.processedConversations], null, 2));
    } catch (error) {
      console.error('❌ Could not save processed conversations list:', error.message);
    }
  }

  async getNewConversations() {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(TERMINAL_DB_PATH, { readonly: true });

      // Get all conversations ordered by last modified (newest first)
      const conversations = db.prepare(`
        SELECT DISTINCT
          ac.conversation_id,
          MAX(ac.last_modified_at) as last_modified,
          COUNT(DISTINCT aq.id) as query_count
        FROM agent_conversations ac
        LEFT JOIN ai_queries aq ON ac.conversation_id = aq.conversation_id
        GROUP BY ac.conversation_id
        HAVING query_count > 0
        ORDER BY last_modified DESC
        LIMIT 10
      `).all();

      db.close();

      // Filter out already processed conversations
      return conversations.filter(conv => 
        !this.processedConversations.has(conv.conversation_id)
      );

    } catch (error) {
      console.error('❌ Error checking for new conversations:', error.message);
      return [];
    }
  }

  async processConversation(conversationId) {
    try {
      console.log(`🧠 Auto-processing conversation: ${conversationId}`);
      
      // Get conversation data directly from SQLite
      const Database = require('better-sqlite3');
      const db = new Database(TERMINAL_DB_PATH, { readonly: true });
      
      const conversation = db.prepare(`
        SELECT conversation_id, last_modified_at
        FROM agent_conversations 
        WHERE conversation_id = ?
      `).get(conversationId);
      
      if (!conversation) {
        console.log(`❌ Conversation ${conversationId} not found`);
        db.close();
        return false;
      }
      
      const messages = db.prepare(`
        SELECT id, exchange_id, input, start_ts, model_id, working_directory, output_status
        FROM ai_queries 
        WHERE conversation_id = ?
        ORDER BY start_ts ASC
      `).all(conversationId);
      
      db.close();
      
      const conversationData = {
        id: conversationId,
        ...conversation,
        created_at: messages.length > 0 ? messages[0].start_ts : conversation.last_modified_at,
        messages: messages || [],
        messageCount: messages.length
      };
      
      // Use our smart analyzer (no truncation!) to create .aicf files
      const ConversationAnalyzer = require('./agents/conversation-analyzer');
      const analyzer = new ConversationAnalyzer();
      const analysis = analyzer.analyzeConversation(conversationData);
      
      // Write AICF files with full content (no truncation)
      this.writeAICFFiles(analysis, conversationData);
      
      console.log(`✅ Processed ${conversationData.messageCount} messages → Full content preserved`);
      this.processedConversations.add(conversationId);
      return true;
      
    } catch (error) {
      console.error(`❌ Error processing ${conversationId}:`, error.message);
      return false;
    }
  }

  /**
   * Write AICF files with full content (no truncation)
   */
  writeAICFFiles(analysis, conversationData) {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure .aicf directory exists
    if (!fs.existsSync('.aicf')) {
      fs.mkdirSync('.aicf');
    }
    
    const timestamp = new Date().toISOString();
    const conversationEntry = `@CONVERSATION:${analysis.id}\ntimestamp=${timestamp}\nmessage_count=${analysis.messageCount}\nsummary=${analysis.summary}\naccomplishments=${analysis.accomplishments.map(a => a.description).join('|')}\ndecisions=${analysis.decisions.map(d => d.description).join('|')}\nproblems=${analysis.problems.map(p => p.description).join('|')}\ninsights=${analysis.insights.map(i => i.description).join('|')}\nnext_steps=${analysis.nextSteps.join('|')}\nprocessing_status=completed\n\n`;
    
    // Append to conversation-memory.aicf (main conversation log)
    fs.appendFileSync('.aicf/conversation-memory.aicf', conversationEntry);
    
    // Append insights to decisions.aicf if significant decisions found
    if (analysis.decisions.length > 0) {
      const decisionEntry = `@DECISIONS:${analysis.id}\ntimestamp=${timestamp}\n${analysis.decisions.map(d => `decision=${d.description}`).join('\n')}\n\n`;
      fs.appendFileSync('.aicf/decisions.aicf', decisionEntry);
    }
    
    // Append technical work to technical-context.aicf if found
    if (analysis.accomplishments.length > 0) {
      const techEntry = `@TECHNICAL:${analysis.id}\ntimestamp=${timestamp}\n${analysis.accomplishments.map(a => `work=${a.description}`).join('\n')}\n\n`;
      fs.appendFileSync('.aicf/technical-context.aicf', techEntry);
    }
    
    // Append problems to issues.aicf if found
    if (analysis.problems.length > 0) {
      const issueEntry = `@ISSUES:${analysis.id}\ntimestamp=${timestamp}\n${analysis.problems.map(p => `issue=${p.description}`).join('\n')}\n\n`;
      fs.appendFileSync('.aicf/issues.aicf', issueEntry);
    }
  }

  async checkAndProcess() {
    if (this.isProcessing) {
      console.log('⏳ Already processing, skipping this cycle');
      return;
    }

    this.isProcessing = true;

    try {
      const newConversations = await this.getNewConversations();
      
      if (newConversations.length === 0) {
        console.log('✨ No new conversations to process');
        return;
      }

      console.log(`🔍 Found ${newConversations.length} new conversation(s) to process`);
      
      for (const conv of newConversations) {
        const success = await this.processConversation(conv.conversation_id);
        
        // Small delay between conversations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Save the updated processed list
      this.saveProcessedList();
      
      // Update markdown files with conversation data
      if (newConversations.length > 0) {
        console.log('📝 Updating .ai/ markdown files...');
        try {
          const MarkdownUpdater = require('./src/agents/markdown-updater');
          const markdownUpdater = new MarkdownUpdater({ verbose: false });
          await markdownUpdater.updateAllMarkdownFiles();
        } catch (error) {
          console.error('⚠️ Failed to update markdown files:', error.message);
        }
      }

    } catch (error) {
      console.error('❌ Error in check and process cycle:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  startDaemon(intervalMinutes = 5) {
    console.log(`🚀 Starting conversation processor daemon (checking every ${intervalMinutes} minutes)`);
    console.log(`📁 Monitoring: ${TERMINAL_DB_PATH}`);
    console.log(`💾 Processed conversations tracked in: ${PROCESSED_CONVERSATIONS_FILE}`);
    console.log('');

    // Run initial check
    this.checkAndProcess();

    // Set up periodic checking
    setInterval(() => {
      console.log(`⏰ Checking for new conversations... (${new Date().toLocaleTimeString()})`);
      this.checkAndProcess();
    }, intervalMinutes * 60 * 1000);

    // Keep the process running
    process.stdin.resume();
  }

  async runOnce() {
    console.log('🔍 Running one-time check for new conversations...');
    await this.checkAndProcess();
    console.log('✅ One-time processing complete');
  }
}

// CLI Interface
async function main() {
  const processor = new ConversationProcessor();

  const command = process.argv[2];
  
  if (command === 'daemon') {
    const interval = parseInt(process.argv[3]) || 5;
    processor.startDaemon(interval);
  } else if (command === 'once' || !command) {
    await processor.runOnce();
  } else {
    console.log('Usage:');
    console.log('  node conversation-processor.js once          # Check once and exit');
    console.log('  node conversation-processor.js daemon [min]  # Run continuously (default: 5 min intervals)');
    console.log('');
    console.log('Examples:');
    console.log('  node conversation-processor.js once          # Process new conversations now');
    console.log('  node conversation-processor.js daemon        # Run daemon (check every 5 minutes)');
    console.log('  node conversation-processor.js daemon 1      # Run daemon (check every 1 minute)');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ConversationProcessor;
