#!/usr/bin/env node

/**
 * Hourglass Context Dump System
 * 
 * Auto-detects conversation chunks between user inputs and processes them
 * with the checkpoint agents for .ai/.aicf file updates.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const chalk = require('chalk');

// Import checkpoint system
const { processCheckpoint } = require('./checkpoint-process');

/**
 * Hourglass Manager - Handles conversation chunk detection and processing
 */
class HourglassManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    this.eventsFile = path.join(this.projectRoot, '.hourglass-events');
    this.sessionFile = path.join(this.projectRoot, '.hourglass-session.json');
    this.conversationBuffer = [];
    this.currentChunk = null;
    this.session = null;
    this.initialized = false;
    
    this.log = this.verbose ? console.log : () => {};
  }
  
  async initializeSession() {
    // Create events file if it doesn't exist
    if (!fsSync.existsSync(this.eventsFile)) {
      await fs.writeFile(this.eventsFile, '');
    }
    
    // Load or create session
    this.session = await this.loadSession();
    this.initialized = true;
    this.log(chalk.blue('⏳ Hourglass Manager initialized'));
  }
  
  async loadSession() {
    try {
      if (fsSync.existsSync(this.sessionFile)) {
        const data = await fs.readFile(this.sessionFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      this.log(chalk.yellow('⚠️  Could not load existing session, starting fresh'));
    }
    
    return {
      sessionId: `hourglass-${Date.now()}`,
      startTime: new Date().toISOString(),
      chunks: [],
      currentChunk: null,
      totalTokens: 0
    };
  }
  
  async saveSession() {
    await fs.writeFile(this.sessionFile, JSON.stringify(this.session, null, 2));
  }
  
  /**
   * Auto-trigger: Call this from AI code execution to signal new user input
   */
  async triggerUserInput(userMessage = null, aiResponse = null) {
    // Ensure initialization
    if (!this.initialized) {
      await this.initializeSession();
    }
    
    const timestamp = new Date().toISOString();
    
    // If there's a current chunk, finish it
    if (this.session.currentChunk) {
      await this.finishCurrentChunk(timestamp, userMessage);
    }
    
    // Start new chunk
    this.session.currentChunk = {
      chunkId: `chunk-${this.session.chunks.length + 1}`,
      startTime: timestamp,
      userInput: userMessage || '[USER INPUT DETECTED]',
      aiResponse: aiResponse || '[AI RESPONSE PENDING]',
      tokenCount: 0,
      messages: []
    };
    
    // Log the trigger event
    const event = `USER_INPUT:${timestamp}:${userMessage ? userMessage.substring(0, 50) : 'detected'}\n`;
    await fs.appendFile(this.eventsFile, event);
    
    this.log(chalk.green(`🕐 Hourglass flipped - Chunk ${this.session.currentChunk.chunkId} started`));
    
    await this.saveSession();
    return this.session.currentChunk.chunkId;
  }
  
  /**
   * Finish current chunk and process it
   */
  async finishCurrentChunk(endTime, nextUserInput = null) {
    if (!this.session.currentChunk) return;
    
    const chunk = this.session.currentChunk;
    const startTime = new Date(chunk.startTime);
    const endTimeObj = new Date(endTime);
    const duration = (endTimeObj - startTime) / 1000; // seconds
    
    // Estimate token count (rough approximation)
    const userTokens = this.estimateTokens(chunk.userInput);
    const aiTokens = this.estimateTokens(chunk.aiResponse);
    const totalTokens = userTokens + aiTokens;
    
    // Complete the chunk
    const completedChunk = {
      ...chunk,
      endTime,
      duration,
      tokenCount: totalTokens,
      nextUserInput: nextUserInput ? nextUserInput.substring(0, 100) : null,
      status: 'completed'
    };
    
    this.session.chunks.push(completedChunk);
    this.session.totalTokens += totalTokens;
    this.session.currentChunk = null;
    
    this.log(chalk.cyan(`📊 ${completedChunk.chunkId} completed:`));
    this.log(chalk.dim(`   Duration: ${Math.round(duration)}s, Tokens: ${totalTokens}`));
    
    // Process the chunk with checkpoint agents
    await this.processChunkWithAgents(completedChunk);
    
    await this.saveSession();
  }
  
  /**
   * Process chunk through checkpoint agents
   */
  async processChunkWithAgents(chunk) {
    try {
      this.log(chalk.blue(`🤖 Processing ${chunk.chunkId} with agents...`));
      
      // Create session dump format for checkpoint agents
      const sessionDump = {
        sessionId: `${this.session.sessionId}-${chunk.chunkId}`,
        checkpointNumber: this.session.chunks.length,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        tokenCount: chunk.tokenCount,
        messages: [
          {
            role: 'user',
            content: chunk.userInput,
            timestamp: chunk.startTime
          },
          {
            role: 'assistant', 
            content: chunk.aiResponse,
            timestamp: chunk.endTime
          }
        ]
      };
      
      // Process through checkpoint system
      const result = await processCheckpoint({ 
        dumpData: sessionDump,
        verbose: this.verbose 
      });
      
      if (result.success) {
        this.log(chalk.green(`✅ ${chunk.chunkId} processed successfully`));
        this.log(chalk.dim(`   Files updated: ${result.filesUpdated ? result.filesUpdated.length : 0}`));
      } else {
        this.log(chalk.red(`❌ ${chunk.chunkId} processing failed: ${result.error}`));
      }
      
    } catch (error) {
      this.log(chalk.red(`❌ Chunk processing error: ${error.message}`));
    }
  }
  
  /**
   * Rough token estimation
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Get session statistics
   */
  async getStats() {
    return {
      sessionId: this.session.sessionId,
      totalChunks: this.session.chunks.length,
      totalTokens: this.session.totalTokens,
      averageTokensPerChunk: this.session.chunks.length > 0 
        ? Math.round(this.session.totalTokens / this.session.chunks.length) 
        : 0,
      currentChunkActive: !!this.session.currentChunk,
      sessionDuration: this.session.chunks.length > 0 
        ? (new Date(this.session.chunks[this.session.chunks.length - 1].endTime) - new Date(this.session.startTime)) / 1000
        : 0
    };
  }
  
  /**
   * Start background monitoring (for CLI usage)
   */
  async startMonitoring() {
    console.log(chalk.blue('⏳ Hourglass monitoring started'));
    console.log(chalk.dim('   Watching for user input events...'));
    console.log(chalk.dim('   Press Ctrl+C to stop\n'));
    
    let lastPosition = 0;
    try {
      const stats = await fs.stat(this.eventsFile);
      lastPosition = stats.size;
    } catch (error) {
      // File doesn't exist yet
    }
    
    // Monitor events file for changes
    const watcher = setInterval(async () => {
      try {
        const stats = await fs.stat(this.eventsFile);
        
        if (stats.size > lastPosition) {
          const content = await fs.readFile(this.eventsFile, 'utf8');
          const newContent = content.slice(lastPosition);
          lastPosition = stats.size;
          
          const lines = newContent.trim().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('USER_INPUT:')) {
              const [, timestamp, userInput] = line.split(':');
              console.log(chalk.green(`🕐 User input detected at ${timestamp.split('T')[1].split('.')[0]}`));
              
              if (this.session.currentChunk) {
                await this.finishCurrentChunk(timestamp, userInput);
              }
            }
          }
        }
      } catch (error) {
        // File might not exist or be readable
      }
    }, 100);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      clearInterval(watcher);
      
      if (this.session.currentChunk) {
        console.log(chalk.yellow('\n⏳ Finishing current chunk...'));
        await this.finishCurrentChunk(new Date().toISOString());
      }
      
      const stats = await this.getStats();
      console.log(chalk.blue('\n📊 Hourglass Session Summary:'));
      console.log(chalk.cyan(`   Session ID: ${stats.sessionId}`));
      console.log(chalk.cyan(`   Total chunks: ${stats.totalChunks}`));
      console.log(chalk.cyan(`   Total tokens: ${stats.totalTokens}`));
      console.log(chalk.cyan(`   Average tokens/chunk: ${stats.averageTokensPerChunk}`));
      console.log(chalk.cyan(`   Session duration: ${Math.round(stats.sessionDuration)}s`));
      
      console.log(chalk.green('\n👋 Hourglass monitoring stopped'));
      process.exit(0);
    });
  }
}

/**
 * Auto-trigger function - Call this from AI responses
 */
async function autoTrigger(userMessage = null, aiResponse = null) {
  const hourglass = new HourglassManager({ verbose: false });
  return await hourglass.triggerUserInput(userMessage, aiResponse);
}

// CLI usage
if (require.main === module) {
  const action = process.argv[2];
  
  switch (action) {
    case 'monitor':
      const hourglass = new HourglassManager({ verbose: true });
      hourglass.startMonitoring();
      break;
      
    case 'trigger':
      const userMsg = process.argv[3] || null;
      const aiMsg = process.argv[4] || null;
      autoTrigger(userMsg, aiMsg).then(chunkId => {
        console.log(chalk.green(`✅ Hourglass triggered: ${chunkId}`));
      });
      break;
      
    case 'stats':
      const statsHourglass = new HourglassManager();
      statsHourglass.initializeSession().then(() => {
        return statsHourglass.getStats();
      }).then(stats => {
        console.log(chalk.blue('📊 Hourglass Statistics:'));
        console.log(chalk.cyan(`   Total chunks: ${stats.totalChunks}`));
        console.log(chalk.cyan(`   Total tokens: ${stats.totalTokens}`));
        console.log(chalk.cyan(`   Average tokens/chunk: ${stats.averageTokensPerChunk}`));
        console.log(chalk.cyan(`   Current chunk active: ${stats.currentChunkActive}`));
      });
      break;
      
    default:
      console.log(chalk.blue('⏳ Hourglass Context Dump System\n'));
      console.log('Usage:');
      console.log('  node src/hourglass.js monitor    # Start background monitoring');
      console.log('  node src/hourglass.js trigger    # Manual trigger');
      console.log('  node src/hourglass.js stats      # Show statistics');
      console.log('');
      console.log('Auto-trigger from AI code:');
      console.log("  const { autoTrigger } = require('./src/hourglass');");
      console.log("  await autoTrigger('user message', 'ai response');");
  }
}

module.exports = {
  HourglassManager,
  autoTrigger
};