#!/usr/bin/env node

/**
 * AI Session Monitor - Intelligent session dump decision system
 * 
 * Monitors the AI activity log and makes intelligent decisions about 
 * when to trigger session dumps based on natural conversation flow.
 * 
 * This is the semi-automatic compromise approach we decided on.
 */

const fs = require('fs');
const path = require('path');
const SessionDumpTrigger = require('./session-dump-trigger');

class AISessionMonitor {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.activityLogPath = path.join(this.projectRoot, '.meta/ai-activity-log');
    this.stateFile = path.join(this.projectRoot, '.meta/ai-session-state.json');
    this.sessionTrigger = new SessionDumpTrigger(options);
    
    this.loadState();
    this.verbose = options.verbose || false;
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } else {
        this.state = {
          lastProcessedLine: 0,
          sessionActive: false,
          sessionStartTime: null,
          commandCount: 0,
          lastSessionDump: null,
          conversationContext: []
        };
      }
    } catch (error) {
      this.state = {
        lastProcessedLine: 0,
        sessionActive: false,
        sessionStartTime: null,
        commandCount: 0,
        lastSessionDump: null,
        conversationContext: []
      };
    }
  }

  saveState() {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * Main monitoring function - checks activity log and makes decisions
   */
  async checkAndDecideSessionDump() {
    if (!fs.existsSync(this.activityLogPath)) {
      if (this.verbose) console.log('📋 No activity log found yet');
      return;
    }

    const newActivity = this.getNewActivity();
    if (newActivity.length === 0) {
      return;
    }

    // Process new activity lines
    for (const line of newActivity) {
      await this.processActivityLine(line);
    }

    // Make session dump decision
    const decision = this.shouldTriggerSessionDump();
    if (decision.shouldTrigger) {
      await this.triggerSessionDump(decision.reason, decision.significance);
    }

    this.saveState();
  }

  getNewActivity() {
    const content = fs.readFileSync(this.activityLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const newLines = lines.slice(this.state.lastProcessedLine);
    this.state.lastProcessedLine = lines.length;
    
    return newLines;
  }

  async processActivityLine(line) {
    if (this.verbose) console.log(`📋 Processing: ${line.substring(0, 80)}...`);

    // Track session activity
    if (line.includes('AI_RESPONSE_START') || line.includes('COMMAND_START')) {
      if (!this.state.sessionActive) {
        this.startSession();
      }
      this.state.commandCount++;
    }
    
    // Track conversation context
    if (line.includes('COMMAND_START') && !line.includes('echo')) {
      const command = this.extractCommand(line);
      if (command) {
        this.state.conversationContext.push({
          type: 'command',
          command: command,
          timestamp: this.extractTimestamp(line)
        });
      }
    }

    // Check for session dump processing (to avoid duplicates)
    if (line.includes('SESSION_DUMP_PROCESSED')) {
      this.state.lastSessionDump = this.extractTimestamp(line);
      if (this.verbose) console.log('📝 Session dump already processed - resetting context');
      this.resetConversationContext();
    }

    // Keep context manageable
    if (this.state.conversationContext.length > 20) {
      this.state.conversationContext = this.state.conversationContext.slice(-15);
    }
  }

  startSession() {
    this.state.sessionActive = true;
    this.state.sessionStartTime = Date.now();
    this.state.commandCount = 0;
    if (this.verbose) console.log('🕐 AI Session detected as active');
  }

  /**
   * Intelligent decision making for session dumps
   */
  shouldTriggerSessionDump() {
    const now = Date.now();
    
    // Don't trigger too frequently (minimum 5 minutes between dumps)
    if (this.state.lastSessionDump) {
      const timeSinceLastDump = now - new Date(this.state.lastSessionDump).getTime();
      if (timeSinceLastDump < 5 * 60 * 1000) {
        return { shouldTrigger: false, reason: 'too_recent' };
      }
    }

    // Analyze conversation context
    const context = this.analyzeConversationContext();
    
    // Decision logic based on natural conversation flow
    if (context.hasSignificantWork && context.commandCount >= 3) {
      return {
        shouldTrigger: true,
        reason: 'significant work completed',
        significance: context.significance
      };
    }

    if (context.hasTestingActivity && context.commandCount >= 2) {
      return {
        shouldTrigger: true,
        reason: 'testing session completed',
        significance: 'SYSTEM_VALIDATION'
      };
    }

    if (context.hasFileCreation && context.commandCount >= 2) {
      return {
        shouldTrigger: true,
        reason: 'file creation session',
        significance: 'NORMAL'
      };
    }

    // Time-based trigger for long sessions
    if (this.state.sessionActive && this.state.commandCount >= 5) {
      const sessionDuration = now - this.state.sessionStartTime;
      if (sessionDuration > 10 * 60 * 1000) { // 10 minutes
        return {
          shouldTrigger: true,
          reason: 'extended session natural break',
          significance: 'NORMAL'
        };
      }
    }

    return { shouldTrigger: false, reason: 'no_trigger_conditions' };
  }

  analyzeConversationContext() {
    const commands = this.state.conversationContext.map(c => c.command).filter(Boolean);
    
    const analysis = {
      commandCount: commands.length,
      hasSignificantWork: false,
      hasTestingActivity: false,
      hasFileCreation: false,
      significance: 'NORMAL'
    };

    // Look for patterns that indicate significant work
    const significantPatterns = [
      'node.*test',
      'npm.*test',
      'git.*commit',
      'git.*push',
      'mkdir',
      'mv.*src/',
      'node.*js'
    ];

    const testingPatterns = [
      'test.*js',
      'npm.*test',
      'node.*test',
      'mocha',
      'jest'
    ];

    const fileCreationPatterns = [
      'mkdir',
      'touch',
      'echo.*>',
      'cp ',
      'mv '
    ];

    // Analyze command patterns
    for (const cmd of commands) {
      if (significantPatterns.some(pattern => new RegExp(pattern).test(cmd))) {
        analysis.hasSignificantWork = true;
        if (cmd.includes('test') || cmd.includes('lifecycle') || cmd.includes('integration')) {
          analysis.significance = 'SYSTEM_VALIDATION';
        }
      }
      
      if (testingPatterns.some(pattern => new RegExp(pattern).test(cmd))) {
        analysis.hasTestingActivity = true;
      }
      
      if (fileCreationPatterns.some(pattern => new RegExp(pattern).test(cmd))) {
        analysis.hasFileCreation = true;
      }
    }

    return analysis;
  }

  async triggerSessionDump(reason, significance) {
    try {
      if (this.verbose) console.log(`🤖 AI Decision: Triggering session dump - ${reason}`);
      
      const conversationData = {
        conversationFlow: [
          {
            type: "ai_decision",
            timestamp: new Date().toISOString(),
            content: `AI-triggered session dump: ${reason}`
          }
        ],
        primaryFocus: reason,
        technologies: ["AI Memory System", "Terminal"],
        insights: [`Session boundary detected: ${reason}`],
        nextSteps: ["Continue monitoring for next natural break"],
        commandCount: this.state.commandCount,
        conversationContext: this.state.conversationContext.slice(-10) // Last 10 items
      };

      const result = await this.sessionTrigger.createSessionDump(conversationData, {
        sessionId: `ai-decision-${Date.now()}`,
        conversationType: "AI_TRIGGERED",
        significance: significance,
        durationMinutes: Math.round((Date.now() - this.state.sessionStartTime) / 60000)
      });

      if (result.success) {
        console.log(`✅ AI-triggered session dump: ${result.filename}`);
        this.resetConversationContext();
        
        // Log the session dump to activity log  
        const logEntry = `SESSION_DUMP_PROCESSED:${new Date().toISOString()}:${result.filename}`;
        fs.appendFileSync(this.activityLogPath, logEntry + '\n');
      } else {
        console.error(`❌ Failed to create AI session dump: ${result.error}`);
      }

    } catch (error) {
      console.error(`❌ Error in AI session dump trigger:`, error.message);
    }
  }

  resetConversationContext() {
    this.state.conversationContext = [];
    this.state.commandCount = 0;
    this.state.sessionActive = false;
  }

  extractCommand(line) {
    const match = line.match(/COMMAND_START:[^:]*:[^:]*:(.+)$/);
    return match ? match[1] : null;
  }

  extractTimestamp(line) {
    const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
    return match ? match[1] : new Date().toISOString();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  const monitor = new AISessionMonitor({ verbose: true });
  
  if (command === 'check') {
    monitor.checkAndDecideSessionDump().then(() => {
      console.log('🔍 AI session monitoring check complete');
    }).catch(error => {
      console.error('❌ AI session monitoring failed:', error);
    });
  } else if (command === 'watch') {
    console.log('👁️ AI Session Monitor - Watching for natural conversation breaks...');
    console.log('Press Ctrl+C to stop');
    
    const interval = setInterval(async () => {
      await monitor.checkAndDecideSessionDump();
    }, 3000); // Check every 3 seconds
    
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n👋 AI Session Monitor stopped');
      process.exit(0);
    });
  } else {
    console.log('Usage: node src/ai-session-monitor.js [check|watch]');
    console.log('  check: One-time check for session dump decision');
    console.log('  watch: Continuously monitor and decide on session dumps');
  }
}

module.exports = AISessionMonitor;