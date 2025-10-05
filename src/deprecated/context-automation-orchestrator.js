#!/usr/bin/env node

/**
 * Universal AI Context Automation Orchestrator
 * 
 * Combines and enhances all existing automation systems:
 * - Context Extraction (Warp, Augment, etc.)
 * - Token Monitoring & Session Management
 * - Hourglass Auto-Detection
 * - Automatic Checkpoint Processing
 * - Real-time Background Monitoring
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { EventEmitter } = require('events');

// Import our existing systems
const { ContextExtractor } = require('./context-extractor');
const { analyzeTokenUsage, shouldWrapUpSession } = require('./token-monitor');
const { HourglassManager } = require('./hourglass');
const AutoSessionDump = require('./auto-session-dump');
const { processCheckpoint } = require('./checkpoint-process');

/**
 * Universal Context Automation Orchestrator
 * The brain that coordinates all automation systems
 */
class ContextAutomationOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.projectRoot = options.projectRoot || process.cwd();
        this.verbose = options.verbose || false;
        this.enabled = options.enabled !== false; // Default: enabled
        
        // Configuration
        this.config = {
            // Real-time monitoring intervals (in ms)
            contextExtractionInterval: 60000, // Check every 1 minute
            tokenMonitoringInterval: 120000,  // Check every 2 minutes
            
            // Thresholds
            tokenThreshold: 12000,
            conversationAgeThreshold: 30, // minutes
            
            // Auto-extraction settings
            autoExtractSources: ['warp', 'augment'], // Sources to monitor
            maxConversationsPerCheck: 5,
            
            // File paths
            stateFile: path.join(this.projectRoot, '.meta/automation-state.json'),
            logFile: path.join(this.projectRoot, '.meta/automation.log')
        };
        
        // Initialize subsystems
        this.contextExtractor = new ContextExtractor();
        this.hourglassManager = new HourglassManager({ 
            projectRoot: this.projectRoot, 
            verbose: this.verbose 
        });
        this.autoSessionDump = new AutoSessionDump({ 
            projectRoot: this.projectRoot, 
            verbose: this.verbose 
        });
        
        // State management
        this.state = {
            isRunning: false,
            lastContextCheck: null,
            lastTokenCheck: null,
            processedConversations: new Set(),
            sessionStart: Date.now(),
            totalConversationsProcessed: 0,
            stats: {
                contextsExtracted: 0,
                sessionsProcessed: 0,
                tokensProcessed: 0
            }
        };
        
        this.loadState();
        this.log = this.verbose ? console.log.bind(console) : () => {};
    }

    /**
     * Load persistent state
     */
    loadState() {
        try {
            if (fs.existsSync(this.config.stateFile)) {
                const savedState = JSON.parse(fs.readFileSync(this.config.stateFile, 'utf8'));
                this.state = { ...this.state, ...savedState };
                // Convert Set back from array
                this.state.processedConversations = new Set(savedState.processedConversations || []);
            }
        } catch (error) {
            this.log(chalk.yellow('⚠️  Could not load automation state, starting fresh'));
        }
    }

    /**
     * Save persistent state
     */
    saveState() {
        try {
            const stateToSave = {
                ...this.state,
                // Convert Set to array for JSON serialization
                processedConversations: Array.from(this.state.processedConversations)
            };
            
            fs.ensureDirSync(path.dirname(this.config.stateFile));
            fs.writeFileSync(this.config.stateFile, JSON.stringify(stateToSave, null, 2));
        } catch (error) {
            this.log(chalk.red('❌ Could not save automation state:', error.message));
        }
    }

    /**
     * Start the universal automation system
     */
    async start() {
        if (this.state.isRunning) {
            console.log(chalk.yellow('⚠️  Automation already running'));
            return;
        }

        console.log(chalk.blue('🚀 Starting Universal AI Context Automation...'));
        console.log(chalk.dim(`   Project: ${this.projectRoot}`));
        console.log(chalk.dim(`   Sources: ${this.config.autoExtractSources.join(', ')}`));
        console.log(chalk.dim(`   Token threshold: ${this.config.tokenThreshold}`));
        console.log('');

        this.state.isRunning = true;
        this.state.sessionStart = Date.now();
        
        // Initialize subsystems
        await this.hourglassManager.initializeSession();
        
        // Start monitoring loops
        this.startContextMonitoring();
        this.startTokenMonitoring();
        this.startEventListening();
        
        console.log(chalk.green('✅ Universal automation started successfully'));
        console.log(chalk.dim('   Press Ctrl+C to stop gracefully\n'));
        
        // Emit started event
        this.emit('started');
        
        return this;
    }

    /**
     * Real-time context extraction monitoring
     */
    startContextMonitoring() {
        const monitor = async () => {
            if (!this.state.isRunning) return;
            
            try {
                this.log(chalk.cyan('🔍 Checking for new AI conversations...'));
                
                for (const source of this.config.autoExtractSources) {
                    await this.checkSourceForNewConversations(source);
                }
                
                this.state.lastContextCheck = Date.now();
                this.saveState();
                
            } catch (error) {
                this.log(chalk.red('❌ Context monitoring error:', error.message));
            }
            
            // Schedule next check
            if (this.state.isRunning) {
                setTimeout(monitor, this.config.contextExtractionInterval);
            }
        };
        
        // Start immediately, then repeat
        monitor();
    }

    /**
     * Check a specific source for new conversations
     */
    async checkSourceForNewConversations(source) {
        try {
            if (!this.contextExtractor.isSourceAvailable(source)) {
                this.log(chalk.dim(`   ${source}: not available`));
                return;
            }

            const conversations = await this.contextExtractor.listConversations(
                source, 
                { limit: this.config.maxConversationsPerCheck }
            );

            let newConversationsFound = 0;

            for (const conversation of conversations) {
                const conversationKey = `${source}:${conversation.id}`;
                
                // Check if we've already processed this conversation
                if (this.state.processedConversations.has(conversationKey)) {
                    continue;
                }

                // Check if conversation is recent enough to process
                const conversationAge = (Date.now() - new Date(conversation.updated)) / (1000 * 60);
                if (conversationAge > this.config.conversationAgeThreshold) {
                    continue; // Too old
                }

                this.log(chalk.green(`📥 New ${source} conversation: ${conversation.id} (${conversation.messageCount} messages)`));
                
                // Extract and process
                await this.extractAndProcessConversation(source, conversation.id);
                
                // Mark as processed
                this.state.processedConversations.add(conversationKey);
                newConversationsFound++;
                this.state.stats.contextsExtracted++;
            }

            if (newConversationsFound > 0) {
                this.log(chalk.blue(`   ${source}: ${newConversationsFound} new conversations processed`));
                this.emit('conversationsProcessed', { source, count: newConversationsFound });
            } else {
                this.log(chalk.dim(`   ${source}: no new conversations`));
            }

        } catch (error) {
            this.log(chalk.red(`❌ Error checking ${source}:`, error.message));
        }
    }

    /**
     * Extract and process a conversation through the full pipeline
     */
    async extractAndProcessConversation(source, conversationId) {
        try {
            this.log(chalk.cyan(`🔄 Processing ${source} conversation ${conversationId}...`));
            
            // Extract conversation
            const conversation = await this.contextExtractor.extractConversation(conversationId, source);
            
            // Convert to checkpoint format
            const checkpointData = {
                sessionId: `${source}-${conversationId}`,
                checkpointNumber: 1,
                startTime: conversation.timespan.start,
                endTime: conversation.timespan.end,
                tokenCount: conversation.messageCount * 50, // Rough estimate
                messages: conversation.messages.map(msg => ({
                    role: msg.type === 'USER_QUERY' ? 'user' : 'assistant',
                    content: msg.content,
                    timestamp: msg.timestamp,
                    working_directory: msg.workingDirectory,
                    context: msg.context
                }))
            };

            // Process through checkpoint system
            const result = await processCheckpoint({ 
                dumpData: checkpointData,
                verbose: false
            });

            if (result && result.filesUpdated) {
                this.log(chalk.green(`✅ ${source} conversation processed, updated ${result.filesUpdated.length} files`));
                this.state.stats.sessionsProcessed++;
                this.state.totalConversationsProcessed++;
            }

            this.emit('conversationProcessed', { source, conversationId, result });

        } catch (error) {
            this.log(chalk.red(`❌ Error processing ${source} conversation ${conversationId}:`, error.message));
        }
    }

    /**
     * Token monitoring and session management
     */
    startTokenMonitoring() {
        const monitor = async () => {
            if (!this.state.isRunning) return;
            
            try {
                // Check if session should be wrapped up
                const wrapUpCheck = await shouldWrapUpSession();
                
                if (wrapUpCheck.shouldWrapUp) {
                    this.log(chalk.yellow(`⚠️  ${wrapUpCheck.reason}`));
                    this.emit('sessionWrapUpSuggested', wrapUpCheck);
                    
                    // Auto-trigger session dump if tokens are very high
                    const autoTriggerDump = await this.autoSessionDump.checkAndTrigger();
                    if (autoTriggerDump) {
                        this.log(chalk.green('🤖 Auto session dump triggered'));
                        this.state.stats.sessionsProcessed++;
                    }
                }
                
                this.state.lastTokenCheck = Date.now();
                this.saveState();
                
            } catch (error) {
                this.log(chalk.red('❌ Token monitoring error:', error.message));
            }
            
            // Schedule next check
            if (this.state.isRunning) {
                setTimeout(monitor, this.config.tokenMonitoringInterval);
            }
        };
        
        // Start after a brief delay
        setTimeout(monitor, 5000);
    }

    /**
     * Listen for system events
     */
    startEventListening() {
        // Handle process signals
        process.on('SIGINT', () => {
            this.stop();
        });

        process.on('SIGTERM', () => {
            this.stop();
        });
    }

    /**
     * Get current automation statistics
     */
    getStats() {
        return {
            isRunning: this.state.isRunning,
            sessionDuration: Math.round((Date.now() - this.state.sessionStart) / 1000),
            totalConversationsProcessed: this.state.totalConversationsProcessed,
            stats: this.state.stats,
            lastChecks: {
                context: this.state.lastContextCheck ? new Date(this.state.lastContextCheck).toISOString() : null,
                tokens: this.state.lastTokenCheck ? new Date(this.state.lastTokenCheck).toISOString() : null
            },
            sourcesAvailable: this.contextExtractor.getAvailableSources(),
            processedConversations: this.state.processedConversations.size
        };
    }

    /**
     * Stop the automation system gracefully
     */
    async stop() {
        if (!this.state.isRunning) {
            return;
        }

        console.log(chalk.yellow('\n⏳ Stopping automation gracefully...'));
        
        this.state.isRunning = false;
        
        // Save final state
        this.saveState();
        
        // Show final stats
        const stats = this.getStats();
        console.log(chalk.blue('\n📊 Automation Session Summary:'));
        console.log(chalk.cyan(`   Session Duration: ${Math.round(stats.sessionDuration)}s`));
        console.log(chalk.cyan(`   Conversations Processed: ${stats.totalConversationsProcessed}`));
        console.log(chalk.cyan(`   Contexts Extracted: ${stats.stats.contextsExtracted}`));
        console.log(chalk.cyan(`   Sessions Processed: ${stats.stats.sessionsProcessed}`));
        console.log(chalk.cyan(`   Available Sources: ${stats.sourcesAvailable.join(', ')}`));
        
        this.emit('stopped', stats);
        
        console.log(chalk.green('\n👋 Universal AI Context Automation stopped'));
        process.exit(0);
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const action = process.argv[2];
    const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    
    switch (action) {
        case 'start':
            const orchestrator = new ContextAutomationOrchestrator({ verbose });
            orchestrator.start();
            break;
            
        case 'status':
            const statusOrchestrator = new ContextAutomationOrchestrator();
            const stats = statusOrchestrator.getStats();
            
            console.log(chalk.blue('📊 Automation Status:'));
            console.log(chalk.cyan(`   Running: ${stats.isRunning}`));
            console.log(chalk.cyan(`   Session Duration: ${Math.round(stats.sessionDuration)}s`));
            console.log(chalk.cyan(`   Conversations Processed: ${stats.totalConversationsProcessed}`));
            console.log(chalk.cyan(`   Available Sources: ${stats.sourcesAvailable.join(', ')}`));
            break;
            
        default:
            console.log(chalk.blue('🤖 Universal AI Context Automation Orchestrator\n'));
            console.log('Usage:');
            console.log('  node src/context-automation-orchestrator.js start [--verbose]   # Start automation');
            console.log('  node src/context-automation-orchestrator.js status             # Show status');
            console.log('');
            console.log('Features:');
            console.log('  • Real-time context extraction from Warp, Augment, etc.');
            console.log('  • Automatic token monitoring and session management');
            console.log('  • Intelligent conversation processing with logic agents');
            console.log('  • Background monitoring with graceful shutdown');
            console.log('  • Persistent state and comprehensive logging');
    }
}

module.exports = {
    ContextAutomationOrchestrator
};