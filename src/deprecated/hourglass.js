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
      totalTokens: 0,
    };
  }

  async saveSession() {
    await fs.writeFile(this.sessionFile, JSON.stringify(this.session, null, 2));
  }

  /**
   * Auto-trigger: Call this from AI code execution to signal new user input
   * FIXED: Now captures COMPLETE session content including all AI work
   */
  async triggerUserInput(userMessage = null, aiResponse = null, fullSessionContent = null) {
    // Ensure initialization
    if (!this.initialized) {
      await this.initializeSession();
    }

    const timestamp = new Date().toISOString();

    // If there's a current chunk, finish it with COMPLETE content
    if (this.session.currentChunk) {
      await this.finishCurrentChunkWithFullContent(timestamp, userMessage, fullSessionContent);
    }

    // Start new chunk
    this.session.currentChunk = {
      chunkId: `chunk-${this.session.chunks.length + 1}`,
      startTime: timestamp,
      userInput: userMessage || '[USER INPUT DETECTED]',
      aiResponse: '[SESSION_IN_PROGRESS]', // Will be updated with complete content
      fullSessionContent: '', // Will accumulate all AI work
      tokenCount: 0,
      messages: [],
    };

    // Log the trigger event
    const event = `USER_INPUT:${timestamp}:${userMessage ? userMessage.substring(0, 50) : 'detected'}\n`;
    await fs.appendFile(this.eventsFile, event);

    this.log(
      chalk.green(`🕐 Hourglass flipped - Chunk ${this.session.currentChunk.chunkId} started`)
    );
    this.log(chalk.blue(`📝 Will capture COMPLETE session content including all AI work`));

    await this.saveSession();
    return this.session.currentChunk.chunkId;
  }

  /**
   * Finish current chunk and process it (legacy method)
   */
  async finishCurrentChunk(endTime, nextUserInput = null) {
    return await this.finishCurrentChunkWithFullContent(endTime, nextUserInput, null);
  }

  /**
   * Finish current chunk with COMPLETE session content capture
   * FIXED: Now captures all AI work between user inputs
   */
  async finishCurrentChunkWithFullContent(
    endTime,
    nextUserInput = null,
    fullSessionContent = null
  ) {
    if (!this.session.currentChunk) return;

    const chunk = this.session.currentChunk;
    const startTime = new Date(chunk.startTime);
    const endTimeObj = new Date(endTime);
    const duration = (endTimeObj - startTime) / 1000; // seconds

    // Use full session content if provided, otherwise fall back to basic response
    const completeAIResponse =
      fullSessionContent || chunk.aiResponse || chunk.fullSessionContent || '[NO_CONTENT_CAPTURED]';

    // Estimate token count for complete content
    const userTokens = this.estimateTokens(chunk.userInput);
    const aiTokens = this.estimateTokens(completeAIResponse);
    const totalTokens = userTokens + aiTokens;

    // Complete the chunk with FULL content
    const completedChunk = {
      ...chunk,
      endTime,
      duration,
      aiResponse: completeAIResponse, // COMPLETE AI work, not just initial response
      tokenCount: totalTokens,
      nextUserInput: nextUserInput ? nextUserInput.substring(0, 100) : null,
      status: 'completed',
      contentCaptureMode: 'full_session',
    };

    this.session.chunks.push(completedChunk);
    this.session.totalTokens += totalTokens;
    this.session.currentChunk = null;

    this.log(chalk.cyan(`📊 ${completedChunk.chunkId} completed with FULL content:`));
    this.log(chalk.dim(`   Duration: ${Math.round(duration)}s, Tokens: ${totalTokens}`));
    this.log(
      chalk.green(`   ✅ Complete session content captured (${completeAIResponse.length} chars)`)
    );

    // Process the chunk with checkpoint agents
    await this.processChunkWithAgents(completedChunk);

    await this.saveSession();
  }

  /**
   * Save complete conversation as JSON master record
   */
  async saveConversationJSON(chunk) {
    const conversationRecord = {
      sessionId: `${this.session.sessionId}-${chunk.chunkId}`,
      chunkId: chunk.chunkId,
      timestamp: chunk.endTime,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      duration: chunk.duration,
      tokenCount: chunk.tokenCount,
      user_input: chunk.userInput, // COMPLETE user input - no truncation
      ai_response: chunk.aiResponse, // COMPLETE AI response - no truncation
      environment: {
        timestamp: chunk.endTime,
        session_info: {
          total_chunks: this.session.chunks.length,
          total_tokens: this.session.totalTokens,
        },
      },
      preservation_status: {
        content_preserved: true,
        compression_applied: false,
        source: 'hourglass-master-storage',
      },
    };

    // Save JSON master record
    const jsonFile = path.join(
      this.projectRoot,
      '.cache/llm/augment/.conversations',
      `${chunk.chunkId}.json`
    );
    await fs.writeFile(jsonFile, JSON.stringify(conversationRecord, null, 2));

    this.log(chalk.green(`💾 JSON master record saved: ${jsonFile}`));
    return conversationRecord;
  }

  /**
   * Process chunk through checkpoint agents
   */
  async processChunkWithAgents(chunk) {
    try {
      this.log(chalk.blue(`🤖 Processing ${chunk.chunkId} with agents...`));

      // STEP 1: Save complete JSON master record first
      const jsonRecord = await this.saveConversationJSON(chunk);
      const jsonFile = path.join(
        this.projectRoot,
        '.cache/llm/augment/.conversations',
        `${chunk.chunkId}.json`
      );

      // STEP 2: Create session dump format for checkpoint agents
      // Now agents will read from the complete JSON instead of truncated data
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
            timestamp: chunk.startTime,
          },
          {
            role: 'assistant',
            content: chunk.aiResponse,
            timestamp: chunk.endTime,
          },
        ],
        // Include reference to JSON master record
        jsonMasterRecord: jsonFile,
        fullContentAvailable: true,
      };

      // Process through checkpoint system
      const result = await processCheckpoint({
        dumpData: sessionDump,
        jsonRecord: jsonRecord, // Pass complete JSON to agents
        verbose: this.verbose,
      });

      if (result.success) {
        this.log(chalk.green(`✅ ${chunk.chunkId} processed successfully`));
        this.log(
          chalk.dim(`   Files updated: ${result.filesUpdated ? result.filesUpdated.length : 0}`)
        );
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
      averageTokensPerChunk:
        this.session.chunks.length > 0
          ? Math.round(this.session.totalTokens / this.session.chunks.length)
          : 0,
      currentChunkActive: !!this.session.currentChunk,
      sessionDuration:
        this.session.chunks.length > 0
          ? (new Date(this.session.chunks[this.session.chunks.length - 1].endTime) -
              new Date(this.session.startTime)) /
            1000
          : 0,
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

          const lines = newContent
            .trim()
            .split('\n')
            .filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('USER_INPUT:')) {
              const [, timestamp, userInput] = line.split(':');
              console.log(
                chalk.green(`🕐 User input detected at ${timestamp.split('T')[1].split('.')[0]}`)
              );

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
 *
 * CRITICAL: aiResponse should contain the FULL AI response content,
 * not just a summary. This preserves complete conversation context.
 */
async function autoTrigger(userMessage = null, aiResponse = null) {
  const hourglass = new HourglassManager({ verbose: false });
  return await hourglass.triggerUserInput(userMessage, aiResponse);
}

/**
 * Enhanced auto-trigger that captures complete conversation context
 * FIXED: Now captures ALL AI work between user inputs, not just initial response
 */
async function autoTriggerFullContext(userInput, fullAIResponse) {
  // This function should receive the COMPLETE AI response text
  // including all formatting, code blocks, explanations, etc.
  return await autoTrigger(userInput, fullAIResponse);
}

/**
 * COMPLETE SESSION TRIGGER - Captures entire session from user input to user input
 * This is what should be called when user types next message
 */
async function autoTriggerCompleteSession(userMessage, completeSessionContent) {
  const hourglass = new HourglassManager({ verbose: true });
  return await hourglass.triggerUserInput(userMessage, null, completeSessionContent);
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
      autoTrigger(userMsg, aiMsg).then((chunkId) => {
        console.log(chalk.green(`✅ Hourglass triggered: ${chunkId}`));
      });
      break;

    case 'stats':
      const statsHourglass = new HourglassManager();
      statsHourglass
        .initializeSession()
        .then(() => {
          return statsHourglass.getStats();
        })
        .then((stats) => {
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
  autoTrigger,
  autoTriggerFullContext,
  autoTriggerCompleteSession,
};
