const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Import SQLite-based system components
const IntelligentConversationParser = require('./agents/intelligent-conversation-parser');
// Keep legacy agents for backwards compatibility
const { FileWriterAgent } = require('./agents/file-writer');
const { MemoryDropOffAgent } = require('./agents/memory-dropoff');

/**
 * CheckpointOrchestrator - Coordinates all specialized logic agents to process
 * conversation dumps into both .ai/ and .aicf/ formats with zero API costs
 */
class CheckpointOrchestrator {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    
    // Initialize SQLite-based system
    this.agents = {
      intelligentParser: new IntelligentConversationParser(options),
      // Legacy agents for backwards compatibility
      fileWriter: new FileWriterAgent(options),
      memoryDropOff: new MemoryDropOffAgent(options)
    };
    
    this.log = this.verbose ? console.log : () => {};
  }

  /**
   * Main entry point - processes a conversation dump through all agents
   * @param {Object} rawDump - Raw conversation dump data
   * @returns {Object} Processing results
   */
  async processCheckpoint(rawDump) {
    const startTime = Date.now();
    this.log(chalk.blue(`📦 Processing checkpoint: ${rawDump.sessionId}-CP${rawDump.checkpointNumber}`));
    
    try {
      // Validate input
      this.validateInput(rawDump);
      
      // Phase 1: Parallel agent processing
      const agentResults = await this.runAgentsParallel(rawDump);
      
      // Phase 2: Combine and structure results
      const structuredData = this.combineResults(agentResults, rawDump);
      
      // Phase 3: Write to files
      const writeResults = await this.writeToFiles(structuredData);
      
      // Phase 4: Memory management (if needed)
      await this.processMemoryDecay();
      
      const processingTime = Date.now() - startTime;
      this.log(chalk.green(`✅ Checkpoint processed in ${processingTime}ms`));
      
      return {
        success: true,
        sessionId: rawDump.sessionId,
        checkpointNumber: rawDump.checkpointNumber,
        processingTime,
        agentsExecuted: Object.keys(agentResults).length,
        filesUpdated: writeResults.filesUpdated,
        memoryDecayApplied: writeResults.memoryDecayApplied
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(chalk.red(`❌ Checkpoint processing failed after ${processingTime}ms:`), error.message);
      
      return {
        success: false,
        error: error.message,
        processingTime,
        sessionId: rawDump.sessionId,
        checkpointNumber: rawDump.checkpointNumber
      };
    }
  }

  /**
   * Run all specialized agents in parallel for maximum performance
   * @param {Object} rawDump - Raw conversation data
   * @returns {Object} Combined agent results
   */
  async runAgentsParallel(rawDump) {
    this.log(chalk.cyan('🧠 Running intelligent routing system...'));
    
    // Check if JSON master record is available
    const jsonRecord = rawDump.jsonMasterRecord || null;
    if (jsonRecord) {
      this.log(chalk.blue('📄 JSON master record available - using intelligent routing'));
    }
    
    // Use intelligent routing parser as primary processor
    try {
      // Enable SQLite access if we have a conversation ID
      const processingOptions = { 
        verbose: this.verbose,
        useDirectSQLite: true // Enable SQLite direct access
      };
      
      const intelligentResult = await this.agents.intelligentParser.processConversation(rawDump, processingOptions);
      
      if (intelligentResult.success) {
        this.log(chalk.green(`✅ Intelligent routing completed - distributed to ${intelligentResult.routingResults?.length || 0} files`));
        
        // Use structured sections if available, otherwise return basic format
        if (intelligentResult.structuredSections) {
          this.log(chalk.blue(`📊 Using structured sections for conversation log compatibility`));
          return {
            // Map structured sections to expected agent format
            conversationParser: intelligentResult.structuredSections.flow,
            decisionExtractor: intelligentResult.structuredSections.decisions,
            insightAnalyzer: intelligentResult.structuredSections.insights,
            stateTracker: intelligentResult.structuredSections.state
          };
        } else {
          // Fallback to old format
          return {
            intelligentParser: {
              section: '@INTELLIGENT_ROUTING',
              content: 'content_distributed_to_specialized_files',
              metadata: {
                success: true,
                chunkId: intelligentResult.chunkId,
                filesUpdated: intelligentResult.routingResults,
                itemsFound: intelligentResult.routingResults?.length || 0
              }
            }
          };
        }
      } else {
        this.log(chalk.yellow('⚠️ Intelligent routing failed, falling back to legacy agents'));
        return await this.runLegacyAgents(rawDump, jsonRecord);
      }
    } catch (error) {
      this.log(chalk.yellow(`⚠️ Intelligent routing error: ${error.message}, falling back to legacy agents`));
      return await this.runLegacyAgents(rawDump, jsonRecord);
    }
  }
  
  /**
   * Fallback to legacy agents if intelligent routing fails
   */
  async runLegacyAgents(rawDump, jsonRecord) {
    this.log(chalk.cyan('🤖 Running legacy agents in parallel...'));
    
    const agentTasks = [
      { 
        name: 'conversationParser', 
        task: this.agents.conversationParser.parse(rawDump.messages, jsonRecord) 
      },
      { 
        name: 'decisionExtractor', 
        task: this.agents.decisionExtractor.extract(rawDump.messages, jsonRecord) 
      },
      { 
        name: 'insightAnalyzer', 
        task: this.agents.insightAnalyzer.analyze(rawDump.messages, jsonRecord) 
      },
      { 
        name: 'stateTracker', 
        task: this.agents.stateTracker.track(rawDump.messages, rawDump, jsonRecord) 
      }
    ];
    
    try {
      const results = await Promise.allSettled(agentTasks.map(({ task }) => task));
      const agentResults = {};
      
      agentTasks.forEach(({ name }, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          agentResults[name] = result.value;
          this.log(chalk.green(`  ✅ ${name}: ${result.value.metadata?.itemsFound || 'completed'} items`));
        } else {
          agentResults[name] = { 
            section: `@ERROR_${name.toUpperCase()}`, 
            content: `Processing failed: ${result.reason.message}`,
            metadata: { error: true }
          };
          this.log(chalk.red(`  ❌ ${name}: ${result.reason.message}`));
        }
      });
      
      return agentResults;
      
    } catch (error) {
      throw new Error(`Agent parallel processing failed: ${error.message}`);
    }
  }

  /**
   * Combine all agent results into structured format
   * @param {Object} agentResults - Results from all agents
   * @param {Object} rawDump - Original raw data for metadata
   * @returns {Object} Structured data ready for file writing
   */
  combineResults(agentResults, rawDump) {
    this.log(chalk.cyan('🔄 Combining agent results...'));
    
    return {
      metadata: {
        sessionId: rawDump.sessionId,
        checkpointNumber: rawDump.checkpointNumber,
        timestamp: new Date().toISOString(),
        startTime: rawDump.startTime,
        endTime: rawDump.endTime,
        messageCount: rawDump.messages.length,
        tokenCount: rawDump.tokenCount,
        processingDate: new Date().toISOString().split('T')[0]
      },
      sections: {
        flow: agentResults.conversationParser || { section: '@FLOW', content: '', metadata: {} },
        decisions: agentResults.decisionExtractor || { section: '@DECISIONS', content: [], metadata: {} },
        insights: agentResults.insightAnalyzer || { section: '@INSIGHTS', content: [], metadata: {} },
        state: agentResults.stateTracker || { section: '@STATE', content: {}, metadata: {} }
      }
    };
  }

  /**
   * Write structured data to both AICF and AI formats
   * @param {Object} structuredData - Combined and structured agent results
   * @returns {Object} Write operation results
   */
  async writeToFiles(structuredData) {
    this.log(chalk.cyan('💾 Writing to .aicf and .ai files...'));
    
    // Use MarkdownUpdater for rich conversation-log.md entries (not generic FileWriter)
    const MarkdownUpdater = require('./agents/markdown-updater');
    const markdownUpdater = new MarkdownUpdater({ verbose: this.verbose });
    
    // Write rich markdown content
    this.log(chalk.blue('📝 Using MarkdownUpdater for rich conversation-log.md content...'));
    const markdownResult = await markdownUpdater.updateAllMarkdownFiles();
    
    // Also use FileWriter for .aicf files (but not for conversation-log.md)
    const writeResult = await this.agents.fileWriter.write(structuredData.sections, structuredData.metadata);
    
    // Combine results
    const allFilesUpdated = [...writeResult.filesUpdated, ...markdownResult.updated.map(f => `.ai/${f}`)];
    
    this.log(chalk.green(`  ✅ Updated ${allFilesUpdated.length} files`));
    allFilesUpdated.forEach(file => {
      this.log(chalk.dim(`    - ${file}`));
    });
    
    return {
      filesUpdated: allFilesUpdated,
      memoryDecayApplied: false // Will be set by memory decay process
    };
  }

  /**
   * Apply memory decay strategy if needed
   */
  async processMemoryDecay() {
    try {
      const decayNeeded = await this.checkMemoryDecayNeeded();
      
      if (decayNeeded) {
        this.log(chalk.cyan('🧹 Applying memory decay strategy...'));
        const decayResult = await this.agents.memoryDropOff.processMemoryDecay();
        this.log(chalk.green(`  ✅ Memory decay applied: ${decayResult.itemsProcessed} conversations processed`));
        return decayResult;
      }
      
      return { applied: false, reason: 'Not needed yet' };
    } catch (error) {
      this.log(chalk.yellow(`⚠️  Memory decay skipped: ${error.message}`));
      return { applied: false, error: error.message };
    }
  }

  /**
   * Check if memory decay is needed based on file sizes or conversation count
   */
  async checkMemoryDecayNeeded() {
    try {
      const aicfPath = path.join(this.projectRoot, '.aicf');
      const conversationsFile = path.join(aicfPath, 'conversations.aicf');
      
      if (!(await this.fileExists(conversationsFile))) {
        return false;
      }
      
      const stats = await fs.stat(conversationsFile);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Apply decay if file is larger than 1MB or every 50 checkpoints
      return fileSizeMB > 1.0;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate input data structure
   * @param {Object} rawDump - Raw conversation dump
   */
  validateInput(rawDump) {
    const required = ['sessionId', 'checkpointNumber', 'messages'];
    
    for (const field of required) {
      if (!rawDump[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!Array.isArray(rawDump.messages)) {
      throw new Error('Messages must be an array');
    }
    
    if (rawDump.messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }
  }

  /**
   * Utility function to check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process multiple checkpoints in batch
   * @param {Array} checkpoints - Array of checkpoint data
   */
  async processBatch(checkpoints) {
    const results = [];
    
    this.log(chalk.blue(`📦 Processing ${checkpoints.length} checkpoints in batch...`));
    
    for (const checkpoint of checkpoints) {
      const result = await this.processCheckpoint(checkpoint);
      results.push(result);
      
      if (!result.success) {
        this.log(chalk.red(`❌ Batch processing stopped due to error in checkpoint ${checkpoint.sessionId}-CP${checkpoint.checkpointNumber}`));
        break;
      }
    }
    
    const successful = results.filter(r => r.success).length;
    this.log(chalk.green(`✅ Batch processing complete: ${successful}/${checkpoints.length} successful`));
    
    return results;
  }
}

module.exports = { CheckpointOrchestrator };