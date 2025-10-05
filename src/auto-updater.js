#!/usr/bin/env node

/**
 * Auto-updater daemon for AI conversation updates
 * Runs every 30 minutes to keep .ai and .aicf files fresh
 */

const chalk = require('chalk');
const { ContextExtractor } = require('./context-extractor');
const { processCheckpoint } = require('./checkpoint-process');
const fs = require('fs');
const path = require('path');

class AutoUpdater {
  constructor(intervalMinutes = 30) {
    this.intervalMinutes = intervalMinutes;
    this.intervalMs = intervalMinutes * 60 * 1000;
    this.isRunning = false;
    this.intervalId = null;
    this.lastUpdateTime = null;
    this.lastConversationId = null;
  }

  async start() {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  Auto-updater is already running'));
      return;
    }

    console.log(chalk.cyan(`🚀 Starting AI auto-updater (every ${this.intervalMinutes} minutes)`));
    console.log(chalk.gray(`   Process ID: ${process.pid}`));
    console.log(chalk.gray(`   Next update: ${new Date(Date.now() + this.intervalMs).toLocaleTimeString()}`));
    
    this.isRunning = true;
    
    // Run initial update
    await this.checkAndUpdate();
    
    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.checkAndUpdate();
    }, this.intervalMs);

    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop() {
    if (!this.isRunning) return;

    console.log(chalk.yellow('\n🛑 Stopping auto-updater...'));
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log(chalk.green('✅ Auto-updater stopped gracefully'));
    process.exit(0);
  }

  async checkAndUpdate() {
    try {
      const now = new Date();
      console.log(chalk.cyan(`\n🔍 Auto-update check at ${now.toLocaleTimeString()}`));
      
      const extractor = new ContextExtractor();
      const availableSources = extractor.getAvailableSources();
      
      console.log(chalk.blue(`   Available AI sources: ${availableSources.join(', ')}`));
      
      let latestConversation = null;
      let bestSource = null;
      let latestTimestamp = null;
      
      // Check all available AI sources for the most recent conversation
      for (const source of availableSources) {
        try {
          // Skip ChatGPT if encrypted (metadata only)
          const limit = source === 'chatgpt' ? 1 : 3;
          const conversations = await extractor.listConversations(source, { limit });
          
          if (conversations.length > 0) {
            const mostRecent = conversations[0];
            const timestamp = new Date(mostRecent.updated);
            
            console.log(chalk.gray(`   ${source.toUpperCase()}: ${conversations.length} conversations, latest: ${timestamp.toLocaleTimeString()}`));
            
            if (!latestTimestamp || timestamp > latestTimestamp) {
              latestConversation = mostRecent;
              bestSource = source;
              latestTimestamp = timestamp;
            }
          } else {
            console.log(chalk.gray(`   ${source.toUpperCase()}: No conversations found`));
          }
        } catch (sourceError) {
          console.log(chalk.yellow(`   ${source.toUpperCase()}: Error - ${sourceError.message}`));
        }
      }
      
      if (!latestConversation) {
        console.log(chalk.gray('   No conversations found across all sources - skipping update'));
        return;
      }
      
      // Check if conversation has been updated since our last check
      const shouldUpdate = this.shouldUpdateConversation(latestConversation, latestTimestamp, bestSource);
      
      if (!shouldUpdate) {
        console.log(chalk.gray(`   No updates needed (${bestSource}: ${latestTimestamp.toLocaleTimeString()})`));
        return;
      }
      
      // Special handling for encrypted ChatGPT data
      if (bestSource === 'chatgpt') {
        console.log(chalk.yellow(`📊 ChatGPT conversation detected (${latestConversation.id})`));
        console.log(chalk.yellow(`   Note: ChatGPT uses encrypted storage - extracting metadata only`));
        console.log(chalk.yellow(`   Size: ${latestConversation.fileSize} bytes, Updated: ${latestTimestamp.toLocaleTimeString()}`));
      } else {
        console.log(chalk.blue(`📊 Processing ${bestSource.toUpperCase()} conversation: ${latestConversation.id}`));
        console.log(chalk.blue(`   Messages: ${latestConversation.messageCount}, Last activity: ${latestTimestamp.toLocaleTimeString()}`));
      }
      
      await this.updateConversation(latestConversation.id, bestSource);
      
      // Update our tracking
      this.lastUpdateTime = now;
      this.lastConversationId = `${bestSource}:${latestConversation.id}`;
      
      console.log(chalk.green(`✅ Auto-update completed from ${bestSource.toUpperCase()} at ${now.toLocaleTimeString()}`));
      console.log(chalk.gray(`   Next update: ${new Date(now.getTime() + this.intervalMs).toLocaleTimeString()}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Auto-update error:'), error.message);
      // Continue running despite errors
    }
  }

  shouldUpdateConversation(conversation, lastUpdated, source) {
    // Always update if this is our first run
    if (!this.lastUpdateTime) {
      return true;
    }
    
    const conversationKey = `${source}:${conversation.id}`;
    
    // Update if conversation ID or source changed (new conversation or different AI)
    if (conversationKey !== this.lastConversationId) {
      return true;
    }
    
    // Update if conversation was modified since our last update
    if (lastUpdated > this.lastUpdateTime) {
      return true;
    }
    
    // Skip if no new activity
    return false;
  }

  async updateConversation(conversationId, source = 'warp') {
    const extractor = new ContextExtractor();
    
    // Extract conversation
    const conversation = await extractor.extractConversation(conversationId, source);
    
    // Create temporary checkpoint file
    const tempFile = path.join(process.cwd(), `conversation-${source}-${conversationId}.json`);
    
    // Map message types based on AI source
    const mapMessageRole = (msg, aiSource) => {
      switch (aiSource) {
        case 'warp':
          return msg.type === 'USER_QUERY' ? 'user' : 'assistant';
        case 'chatgpt':
          return 'assistant'; // ChatGPT data is encrypted, treat as assistant info
        case 'claude':
          return 'assistant'; // Claude storage data
        case 'cursor':
        case 'copilot':
          return msg.type === 'COPILOT_CHAT' ? 'assistant' : 'user';
        case 'augment':
          return 'assistant'; // Agent edit data
        default:
          return 'assistant';
      }
    };
    
    const checkpointData = {
      id: conversation.id,
      sessionId: conversation.id,
      checkpointNumber: 1,
      startTime: conversation.timespan.start,
      endTime: conversation.timespan.end,
      tokenCount: conversation.messageCount * 50,
      source: source,
      aiAssistant: source.toUpperCase(),
      extractionNote: source === 'chatgpt' ? 'Encrypted data - metadata only' : 'Full extraction',
      messages: conversation.messages.map(msg => ({
        role: mapMessageRole(msg, source),
        content: msg.content,
        timestamp: msg.timestamp,
        working_directory: msg.workingDirectory || conversation.workingDirectories?.[0] || process.cwd(),
        context: {
          ...msg.context,
          aiSource: source,
          extractedAt: new Date().toISOString()
        }
      }))
    };
    
    // Save and process
    fs.writeFileSync(tempFile, JSON.stringify(checkpointData, null, 2));
    
    try {
      await processCheckpoint({ file: tempFile, verbose: false });
    } finally {
      // Always cleanup temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      lastUpdate: this.lastUpdateTime,
      lastConversation: this.lastConversationId,
      nextUpdate: this.isRunning ? new Date(Date.now() + this.intervalMs) : null
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'start';
  
  if (command === 'start') {
    const interval = parseInt(args[1]) || 30;
    const updater = new AutoUpdater(interval);
    updater.start().catch(error => {
      console.error(chalk.red('Failed to start auto-updater:'), error.message);
      process.exit(1);
    });
  } else if (command === '--help' || command === 'help') {
    console.log(chalk.bold('\n🤖 AI Auto-Updater\n'));
    console.log('Usage:');
    console.log(chalk.cyan('  node src/auto-updater.js start [minutes]'));
    console.log(chalk.gray('    Start auto-updater (default: 30 minutes)\n'));
    console.log('Examples:');
    console.log(chalk.green('  node src/auto-updater.js start'));
    console.log(chalk.gray('    # Start with 30-minute intervals'));
    console.log(chalk.green('  node src/auto-updater.js start 15'));
    console.log(chalk.gray('    # Start with 15-minute intervals'));
  } else {
    console.log(chalk.red('Unknown command:'), command);
    console.log(chalk.gray('Run "node src/auto-updater.js help" for usage info'));
    process.exit(1);
  }
}

module.exports = AutoUpdater;