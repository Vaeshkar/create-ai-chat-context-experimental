#!/usr/bin/env node

/**
 * Auto Session Dump - Simple token-based triggering
 * 
 * Triggers session dump when conversation reaches ~12k tokens after AI response
 */

const fs = require('fs');
const path = require('path');

class AutoSessionDump {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.tokenThreshold = options.tokenThreshold || 12000; // ~12k tokens
    this.verbose = options.verbose || false;
    this.stateFile = path.join(this.projectRoot, '.meta/auto-dump-state.json');
    
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } else {
        this.state = {
          lastDumpTime: null,
          estimatedTokens: 0,
          conversationStart: Date.now()
        };
      }
    } catch (error) {
      this.state = {
        lastDumpTime: null,
        estimatedTokens: 0,
        conversationStart: Date.now()
      };
    }
  }

  saveState() {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * Check if we should trigger a session dump
   * Call this after AI responses when conversation might be around 12k tokens
   */
  async checkAndTrigger() {
    if (this.verbose) console.log('🔍 Checking if session dump needed...');
    
    // Check time gap since last meaningful dump
    const lastMeaningfulDump = await this.getLastMeaningfulDump();
    const timeGap = lastMeaningfulDump ? (Date.now() - new Date(lastMeaningfulDump.timestamp).getTime()) / (1000 * 60) : null;
    
    if (this.verbose && timeGap) {
      console.log(`⏰ Time since last meaningful dump: ${Math.round(timeGap)} minutes`);
    }
    
    // Estimate current conversation tokens
    const estimatedTokens = await this.estimateConversationTokens();
    this.state.estimatedTokens = estimatedTokens;
    
    if (this.verbose) console.log(`📊 Estimated tokens: ${estimatedTokens}`);
    
    // Check if we should trigger based on tokens OR significant time gap
    const tokenThresholdReached = estimatedTokens >= this.tokenThreshold;
    const significantTimeGap = timeGap && timeGap >= 20; // 20+ minutes gap
    const shouldTrigger = tokenThresholdReached || significantTimeGap;
    
    if (shouldTrigger) {
      const reason = tokenThresholdReached ? 
        `Token threshold (${this.tokenThreshold}) reached` : 
        `Significant time gap (${Math.round(timeGap)} minutes) since last meaningful dump`;
      
      if (this.verbose) console.log(`🎯 ${reason} - triggering session dump`);
      await this.triggerSessionDump(reason, lastMeaningfulDump);
      this.resetConversation();
    } else {
      if (this.verbose) console.log(`⏳ Not yet at threshold (${estimatedTokens}/${this.tokenThreshold} tokens, ${Math.round(timeGap || 0)}min gap)`);
    }
    
    this.saveState();
    return shouldTrigger;
  }

  /**
   * Estimate conversation tokens by checking various files
   */
  async estimateConversationTokens() {
    let totalSize = 0;
    
    // Check AICF files for current conversation size
    const aicfDir = path.join(this.projectRoot, '.aicf');
    if (fs.existsSync(aicfDir)) {
      const aicfFiles = ['conversation-memory.aicf', 'technical-context.aicf', 'decisions.aicf', 'work-state.aicf'];
      
      for (const file of aicfFiles) {
        const filePath = path.join(aicfDir, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }
    }
    
    // Rough token estimation (4 chars per token)
    return Math.ceil(totalSize / 4);
  }

  /**
   * Get the last meaningful session dump (not empty/minimal ones)
   */
  async getLastMeaningfulDump() {
    try {
      const dumpsDir = path.join(this.projectRoot, '.meta/session-dumps');
      if (!fs.existsSync(dumpsDir)) return null;
      
      const dumps = fs.readdirSync(dumpsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse(); // Latest first
      
      for (const dumpFile of dumps) {
        const dumpPath = path.join(dumpsDir, dumpFile);
        const content = fs.readFileSync(dumpPath, 'utf8');
        const dump = JSON.parse(content);
        
        // Check if this is a meaningful dump (has actual conversation content)
        const hasContent = (
          (dump.conversation_dump?.user_inputs?.length > 0) ||
          (dump.conversation_dump?.ai_responses?.length > 0) ||
          (dump.conversation_dump?.decisions?.length > 1) || // More than just placeholder
          (dump.conversation_dump?.technical_work?.length > 0) ||
          (dump.conversation_dump?.insights?.length > 1) // More than just placeholder
        );
        
        if (hasContent) {
          return { ...dump, filename: dumpFile };
        }
      }
      
      return null;
    } catch (error) {
      if (this.verbose) console.log(`Error finding last meaningful dump: ${error.message}`);
      return null;
    }
  }

  /**
   * Trigger the actual session dump
   */
  async triggerSessionDump(reason, lastDump) {
    try {
      console.log(`🤖 Auto-triggering session dump: ${reason}`);
      
      // Use existing session dump system
      const SessionDumpTrigger = require('./session-dump-trigger');
      const trigger = new SessionDumpTrigger({ verbose: this.verbose });
      
      // Create meaningful conversation data capturing the gap
      const timeSinceLastDump = lastDump ? 
        Math.round((Date.now() - new Date(lastDump.timestamp).getTime()) / (1000 * 60)) : 
        'unknown';
      
      const conversationData = {
        conversationFlow: [
          {
            type: "auto_trigger",
            timestamp: new Date().toISOString(),
            content: `Auto session dump: ${reason}. Capturing ${timeSinceLastDump} minutes of conversation since last meaningful dump (${lastDump?.filename || 'none found'})`
          }
        ],
        primaryFocus: "Capturing conversation gap and natural break",
        technologies: ["AI Memory System", "CLI Integration", "Session Management"],
        insights: [
          `Session captured after ${timeSinceLastDump} minutes gap`,
          `Current tokens: ${this.state.estimatedTokens}`,
          "Important conversation continuity preserved"
        ],
        nextSteps: ["Continue conversation with fresh context", "Monitor for next natural break"],
        estimatedTokens: this.state.estimatedTokens,
        gapInfo: {
          lastMeaningfulDump: lastDump?.filename,
          timeSinceLastDump: timeSinceLastDump,
          reason: reason
        }
      };

      // Use the new real conversation data method instead of fake data
      const result = await trigger.createRealSessionDump(significance);

      if (result.success) {
        console.log(`✅ Auto session dump created: ${result.filename}`);
        
        // Log to activity log
        const activityLogPath = path.join(this.projectRoot, '.meta/ai-activity-log');
        const logEntry = `SESSION_DUMP_PROCESSED:${new Date().toISOString()}:${result.filename}`;
        fs.appendFileSync(activityLogPath, logEntry + '\n');
        
        return true;
      } else {
        console.error(`❌ Auto session dump failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in auto session dump:', error.message);
      return false;
    }
  }

  /**
   * Reset conversation tracking after dump
   */
  resetConversation() {
    this.state.lastDumpTime = Date.now();
    this.state.estimatedTokens = 0;
    this.state.conversationStart = Date.now();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  const autoDump = new AutoSessionDump({ verbose: true });
  
  if (command === 'check') {
    autoDump.checkAndTrigger().then(triggered => {
      if (triggered) {
        console.log('🎉 Session dump triggered automatically');
      } else {
        console.log('⏳ No session dump needed yet');
      }
    }).catch(error => {
      console.error('❌ Auto dump check failed:', error);
      process.exit(1);
    });
  } else if (command === 'status') {
    autoDump.estimateConversationTokens().then(tokens => {
      console.log(`📊 Current estimated tokens: ${tokens}`);
      console.log(`🎯 Threshold: ${autoDump.tokenThreshold} tokens`);
      const percentage = Math.round((tokens / autoDump.tokenThreshold) * 100);
      console.log(`📈 Progress: ${percentage}% to next auto-dump`);
    });
  } else {
    console.log('Usage: node src/auto-session-dump.js [check|status]');
  }
}

module.exports = AutoSessionDump;