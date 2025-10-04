const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { CheckpointOrchestrator } = require('./checkpoint-orchestrator');

/**
 * Process conversation checkpoint using the logic agent orchestrator
 * @param {Object} options - Command options
 */
async function processCheckpoint(options = {}) {
  console.log(chalk.blue('🤖 Checkpoint Orchestrator - AI Memory Processing'));
  console.log(chalk.dim('Processing conversation dump with zero-cost logic agents...\n'));

  try {
    // Initialize orchestrator
    const orchestrator = new CheckpointOrchestrator({
      projectRoot: process.cwd(),
      verbose: options.verbose || false
    });

    // Handle different input modes
    let checkpointData;
    
    if (options.dumpData) {
      // Use provided dump data (from hourglass system)
      checkpointData = options.dumpData;
      console.log(chalk.green(`✅ Using provided session dump data`));
    } else if (options.file) {
      // Load from file
      checkpointData = await loadCheckpointFromFile(options.file);
    } else if (options.demo) {
      // Use demo data for testing
      checkpointData = createDemoCheckpoint();
    } else {
      // Interactive mode - ask for input
      checkpointData = await promptForCheckpointData();
    }

    // Validate checkpoint data
    validateCheckpointData(checkpointData);

    // Process the checkpoint
    console.log(chalk.cyan('Processing checkpoint...'));
    const result = await orchestrator.processCheckpoint(checkpointData);

    // Display results
    displayResults(result, options);

    // Show memory statistics if requested
    if (options.showMemory) {
      await showMemoryStatistics(orchestrator);
    }

    return result;

  } catch (error) {
    console.error(chalk.red('❌ Checkpoint processing failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Load checkpoint data from file
 * @param {string} filePath - Path to checkpoint file
 * @returns {Object} Checkpoint data
 */
async function loadCheckpointFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(chalk.green(`✅ Loaded checkpoint from ${filePath}`));
    return data;
  } catch (error) {
    throw new Error(`Failed to load checkpoint file: ${error.message}`);
  }
}

/**
 * Create demo checkpoint data for testing
 * @returns {Object} Demo checkpoint data
 */
function createDemoCheckpoint() {
  console.log(chalk.yellow('🧪 Using demo checkpoint data for testing'));
  
  return {
    sessionId: 'DEMO',
    checkpointNumber: 1,
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endTime: new Date().toISOString(),
    tokenCount: 15000,
    messages: [
      {
        role: 'user',
        content: 'Let\'s build the logic agent orchestrator for our AI memory system',
        timestamp: new Date(Date.now() - 3000000).toISOString()
      },
      {
        role: 'assistant', 
        content: 'Great idea! We decided to use specialized logic agents instead of expensive AI compression. This will give us zero-cost processing with 100% information preservation.',
        timestamp: new Date(Date.now() - 2800000).toISOString()
      },
      {
        role: 'user',
        content: 'I realized that the key insight is that logic agents can run in parallel and extract specific patterns without any API costs.',
        timestamp: new Date(Date.now() - 2600000).toISOString()
      },
      {
        role: 'assistant',
        content: 'Exactly! We implemented ConversationParserAgent, DecisionExtractorAgent, InsightAnalyzerAgent, StateTrackerAgent, and FileWriterAgent. Currently working on the CLI integration.',
        timestamp: new Date(Date.now() - 2400000).toISOString()
      },
      {
        role: 'user',
        content: 'The next step is to test this with real conversation data and verify the AICF format output.',
        timestamp: new Date(Date.now() - 2200000).toISOString()
      },
      {
        role: 'assistant',
        content: 'Perfect! The system successfully processes conversations into both AICF format for AI consumption and markdown for human readability. All tests are passing.',
        timestamp: new Date(Date.now() - 2000000).toISOString()
      }
    ]
  };
}

/**
 * Prompt for checkpoint data in interactive mode
 * @returns {Object} Checkpoint data
 */
async function promptForCheckpointData() {
  console.log(chalk.yellow('📝 Interactive mode - Please provide checkpoint data'));
  console.log(chalk.dim('For now, using demo data. In the future, this would prompt for input.\n'));
  
  // For now, return demo data. In the future, could use inquirer or similar
  return createDemoCheckpoint();
}

/**
 * Validate checkpoint data structure
 * @param {Object} data - Checkpoint data to validate
 */
function validateCheckpointData(data) {
  const required = ['sessionId', 'checkpointNumber', 'messages'];
  
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (!Array.isArray(data.messages) || data.messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }
  
  console.log(chalk.green(`✅ Checkpoint data validated: ${data.messages.length} messages`));
}

/**
 * Display processing results
 * @param {Object} result - Processing result
 * @param {Object} options - Command options
 */
function displayResults(result, options) {
  console.log('');
  
  if (result.success) {
    console.log(chalk.green('✅ Checkpoint Processing Complete!'));
    console.log('');
    
    // Summary statistics
    console.log(chalk.cyan('📊 Processing Summary:'));
    console.log(`   • Session: ${result.sessionId}-CP${result.checkpointNumber}`);
    console.log(`   • Processing Time: ${result.processingTime}ms`);
    console.log(`   • Agents Executed: ${result.agentsExecuted}`);
    console.log(`   • Files Updated: ${result.filesUpdated.length}`);
    
    // Show updated files
    if (result.filesUpdated.length > 0) {
      console.log('');
      console.log(chalk.cyan('📁 Files Updated:'));
      result.filesUpdated.forEach(file => {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`   • ${relativePath}`);
      });
    }
    
    // Show memory decay info
    if (result.memoryDecayApplied) {
      console.log('');
      console.log(chalk.cyan('🧹 Memory Management:'));
      console.log(`   • Memory decay applied`);
    }
    
  } else {
    console.log(chalk.red('❌ Checkpoint Processing Failed!'));
    console.log(`   Error: ${result.error}`);
    console.log(`   Processing Time: ${result.processingTime}ms`);
  }
  
  console.log('');
}

/**
 * Show memory statistics
 * @param {CheckpointOrchestrator} orchestrator - Orchestrator instance
 */
async function showMemoryStatistics(orchestrator) {
  try {
    console.log(chalk.cyan('📊 Memory Statistics:'));
    
    const memoryAgent = orchestrator.agents.memoryDropOff;
    const stats = await memoryAgent.getMemoryStatistics();
    
    if (stats.error) {
      console.log(chalk.yellow(`   No memory data: ${stats.error}`));
    } else {
      console.log(`   • Total Conversations: ${stats.totalConversations}`);
      console.log(`   • Total Size: ${(stats.totalSize / 1024).toFixed(1)} KB`);
      
      if (stats.ageDistribution) {
        console.log('   • Age Distribution:');
        Object.entries(stats.ageDistribution).forEach(([age, count]) => {
          console.log(`     - ${age}: ${count} conversations`);
        });
      }
      
      if (stats.decayRecommendations && stats.decayRecommendations.recommendDecay) {
        console.log(chalk.yellow(`   • Recommendation: Consider running memory decay`));
        console.log(`     - Candidates: ${stats.decayRecommendations.candidatesForDecay}`);
        console.log(`     - Est. compression: ${stats.decayRecommendations.estimatedCompressionRatio}`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.log(chalk.yellow(`   Could not load memory statistics: ${error.message}`));
  }
}

/**
 * Process memory decay
 * @param {Object} options - Command options
 */
async function processMemoryDecay(options = {}) {
  console.log(chalk.blue('🧹 Memory Decay - Intelligent Memory Management'));
  console.log(chalk.dim('Applying memory decay strategy to optimize storage...\n'));

  try {
    const orchestrator = new CheckpointOrchestrator({
      projectRoot: process.cwd(),
      verbose: options.verbose || false
    });

    const memoryAgent = orchestrator.agents.memoryDropOff;
    
    // Show current statistics
    console.log(chalk.cyan('Current memory state:'));
    const beforeStats = await memoryAgent.getMemoryStatistics();
    
    if (beforeStats.error) {
      console.log(chalk.yellow(`No conversations found: ${beforeStats.error}`));
      return;
    }
    
    console.log(`   • Conversations: ${beforeStats.totalConversations}`);
    console.log(`   • Size: ${(beforeStats.totalSize / 1024).toFixed(1)} KB`);
    console.log('');
    
    // Apply decay
    console.log(chalk.cyan('Applying memory decay...'));
    const result = await memoryAgent.processMemoryDecay();
    
    if (result.applied) {
      console.log(chalk.green('✅ Memory decay applied successfully!'));
      console.log('');
      console.log(chalk.cyan('📊 Decay Results:'));
      console.log(`   • Conversations processed: ${result.itemsProcessed}`);
      console.log(`   • Compression ratio: ${result.compressionRatio}%`);
      
      if (result.decayStatistics) {
        console.log('   • Decay distribution:');
        Object.entries(result.decayStatistics).forEach(([level, count]) => {
          if (level !== 'total' && count > 0) {
            console.log(`     - ${level}: ${count} conversations`);
          }
        });
      }
    } else {
      console.log(chalk.yellow(`⚠️  Memory decay not applied: ${result.reason}`));
      if (result.error) {
        console.error(chalk.red(`Error: ${result.error}`));
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.error(chalk.red('❌ Memory decay failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

module.exports = {
  processCheckpoint,
  processMemoryDecay
};