const AgentRouter = require('./agent-router');
const fs = require('fs');
const path = require('path');
const { ContextExtractor } = require('../context-extractor');

/**
 * Intelligent Conversation Parser with specialized routing
 * Routes content to appropriate .aicf files and prevents duplication
 */
class IntelligentConversationParser {
  constructor(options = {}) {
    this.name = 'IntelligentConversationParser';
    this.version = '3.0.0';
    this.router = new AgentRouter();
    this.processedChunks = new Set();
    this.verbose = options.verbose || false;
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Detect AI platform from conversation data
   * @param {Object} conversationData - Raw conversation data
   * @returns {string} AI platform identifier
   */
  detectAIPlatform(conversationData) {
    // Check explicit source fields
    if (conversationData.source) {
      return conversationData.source.toLowerCase();
    }
    
    if (conversationData.aiAssistant) {
      return conversationData.aiAssistant.toLowerCase();
    }
    
    // Check message context for aiSource
    if (conversationData.messages && conversationData.messages.length > 0) {
      const firstMessage = conversationData.messages[0];
      if (firstMessage.context && firstMessage.context.aiSource) {
        return firstMessage.context.aiSource.toLowerCase();
      }
    }
    
    // Try to detect from conversation structure or content
    if (conversationData.messages) {
      const messageTypes = conversationData.messages.map(m => m.type).filter(Boolean);
      
      if (messageTypes.includes('USER_QUERY') || messageTypes.includes('AI_ACTION')) {
        return 'warp';
      }
      if (messageTypes.includes('COPILOT_CHAT')) {
        return 'copilot';
      }
    }
    
    // Default fallback
    return 'unknown';
  }

  /**
   * Process conversation and route to specialized files
   */
  async processConversation(conversationData, options = {}) {
    try {
      console.log(`🧠 ${this.name} processing conversation...`);

      // Validate input
      if (!conversationData) {
        throw new Error('No conversation data provided');
      }

      // Detect AI platform from conversation data
      const aiPlatform = this.detectAIPlatform(conversationData);
      console.log(`🤖 Detected AI platform: ${aiPlatform}`);
      
      // Store platform for use in parsing methods
      this.currentPlatform = aiPlatform;

      // NEW: Check if we should use direct SQLite access (only for Warp)
      if (options.useDirectSQLite && conversationData.id && aiPlatform === 'warp') {
        console.log(`📈 Using direct SQLite access for conversation: ${conversationData.id}`);
        return await this.processFromSQLite(conversationData.id, options);
      } else if (options.useDirectSQLite && aiPlatform === 'augment') {
        console.log(`⚠️ Skipping SQLite access for Augment - using direct message processing`);
        // Continue with regular processing for Augment
      }

      // Extract chunk ID
      const chunkId = conversationData.metadata?.chunkId || 
                     conversationData.session_id || 
                     conversationData.id ||
                     `chunk-${Date.now()}`;

      // Check for duplicate processing
      if (this.processedChunks.has(chunkId)) {
        console.log(`⚠️ Skipping duplicate chunk: ${chunkId}`);
        return { success: true, message: 'Duplicate chunk skipped', chunkId };
      }

      this.processedChunks.add(chunkId);

      // Analyze conversation content using platform-specific analysis if available
      let analysis;
      if (this.currentPlatform === 'augment') {
        console.log(`🔍 Using Augment-specific conversation analysis`);
        analysis = this.analyzeAugmentConversation({ messages: conversationData.messages }, conversationData.messages || []);
      } else {
        console.log(`🔍 Using generic conversation analysis`);
        analysis = this.analyzeConversation(conversationData);
      }

      // Classify content for routing
      const classifications = this.router.classifyContent(conversationData);
      console.log(`📂 Content classified as: ${classifications.join(', ')}`);

      // Generate specialized content for each classification
      const routingResults = [];
      
      for (const classification of classifications) {
        const content = this.generateSpecializedContent(classification, analysis, conversationData);
        const routedContent = this.router.routeContent(classification, content, chunkId);

        if (routedContent) {
          await this.writeToFile(routedContent);
          routingResults.push({
            file: routedContent.targetFile,
            contentType: routedContent.contentType
          });
        }
      }

      console.log(`✅ ${this.name} completed - wrote to ${routingResults.length} files`);

      return {
        success: true,
        chunkId,
        analysis,
        routingResults,
        // Include structured sections for conversation-log.md compatibility (especially for Augment)
        structuredSections: this.createStructuredSections(analysis)
      };

    } catch (error) {
      console.error(`❌ ${this.name} error:`, error.message);
      return {
        success: false,
        error: error.message,
        chunkId: conversationData?.metadata?.chunkId || 'unknown'
      };
    }
  }

  /**
   * Process conversation using direct SQLite access for rich data
   */
  async processFromSQLite(conversationId, options = {}) {
    try {
      console.log(`🔍 Extracting rich conversation data from SQLite...`);
      
      // Initialize context extractor and get full conversation
      let contextExtractor;
      try {
        // Try to import again to ensure fresh context
        const { ContextExtractor: FreshContextExtractor } = require('../context-extractor');
        contextExtractor = new FreshContextExtractor();
      } catch (constructorError) {
        console.error(`🚨 ContextExtractor constructor failed:`, constructorError.message);
        throw new Error(`ContextExtractor constructor failed: ${constructorError.message}`);
      }
      
      const richConversation = await contextExtractor.extractConversation(conversationId, 'warp');
      
      console.log(`📊 Retrieved ${richConversation.messageCount} messages from SQLite`);
      
      // Perform intelligent extraction with full message context
      const analysis = this.analyzeRichConversation(richConversation);
      
      // Classify and route content based on rich analysis
      const classifications = this.classifyRichContent(richConversation, analysis);
      console.log(`📂 Rich content classified as: ${classifications.join(', ')}`);
      
      // Generate and write rich content for each classification
      const routingResults = [];
      
      for (const classification of classifications) {
        const content = this.generateRichContent(classification, analysis, richConversation);
        const routedContent = this.router.routeContent(classification, content, conversationId);
        
        if (routedContent) {
          await this.writeToFile(routedContent);
          routingResults.push({
            file: routedContent.targetFile,
            contentType: routedContent.contentType,
            richData: true
          });
        }
      }
      
      console.log(`✅ ${this.name} SQLite processing completed - wrote rich content to ${routingResults.length} files`);
      
      return {
        success: true,
        chunkId: conversationId,
        analysis,
        routingResults,
        richDataExtracted: true,
        messageCount: richConversation.messageCount,
        // Include structured data for file writer compatibility
        structuredSections: this.createStructuredSections(analysis)
      };
      
    } catch (error) {
      console.error(`❌ SQLite processing error:`, error.message);
      // Fallback to regular processing WITHOUT SQLite access to prevent infinite loop
      console.log(`⚠️ Falling back to regular processing...`);
      
      // For Augment: Try to get the original conversation data instead of creating fake fallback
      // The processConversation method should be called with the original conversationData
      // that contains the real messages, not a synthetic fallback message
      
      // Process without SQLite flag to prevent recursion
      const fallbackOptions = { ...options, useDirectSQLite: false };
      
      // Use the original conversationData from the parent call instead of synthetic fallback
      // We need to get the original conversation from the checkpoint data
      return {
        success: false,
        error: `Augment SQLite fallback not implemented - conversation data should be processed directly`,
        fallbackToRegularProcessing: true
      };
    }
  }

  /**
   * Analyze rich conversation data to extract meaningful insights
   */
  analyzeRichConversation(richConversation) {
    const messages = richConversation.messages || [];
    
    // Use platform-specific analysis if available
    if (this.currentPlatform && this.currentPlatform !== 'unknown') {
      return this.analyzeConversationByPlatform(richConversation, this.currentPlatform);
    }
    
    // Fallback to generic analysis
    const userMessages = messages.filter(m => m.type === 'USER_QUERY');
    const aiMessages = messages.filter(m => m.type === 'AI_ACTION');
    
    return {
      // Extract actual user intents from queries
      userIntents: this.extractRealUserIntents(userMessages),
      
      // Extract actual AI actions from responses
      aiActions: this.extractRealAIActions(aiMessages),
      
      // Find actual technical work performed
      technicalWork: this.extractTechnicalWork(aiMessages),
      
      // Extract real decisions made
      decisions: this.extractRealDecisions(messages),
      
      // Find actual insights and discoveries
      insights: this.extractRealInsights(messages),
      
      // Generate conversation flow
      flow: this.generateRichFlow(messages),
      
      // Extract cleanup/maintenance work
      cleanupWork: this.extractCleanupWork(messages),
      
      // Get file modifications
      fileModifications: this.extractFileModifications(aiMessages)
    };
  }

  /**
   * Classify rich content for routing
   */
  classifyRichContent(richConversation, analysis) {
    const classifications = [];
    
    // Platform-specific classification
    if (analysis.platform === 'augment') {
      // Simplified Augment classification to avoid errors
      return ['conversation_flow']; // Keep it simple for now
    }
    
    // Default rich content classification for other platforms
    // Always include conversation flow
    classifications.push('conversation_flow');
    
    // Add classification based on actual content
    if (analysis.decisions.length > 0) {
      classifications.push('decision');
    }
    
    if (analysis.technicalWork.length > 0 || analysis.fileModifications.length > 0) {
      classifications.push('technical_insight');
    }
    
    if (analysis.cleanupWork.length > 0) {
      classifications.push('task_progress');
    }
    
    if (analysis.insights.length > 0) {
      classifications.push('issue_discovered');
    }
    
    return classifications;
  }

  /**
   * Analyze conversation to extract meaningful insights
   */
  analyzeConversation(conversationData) {
    // Get content from different possible sources
    const content = this.extractContent(conversationData);
    
    return {
      userIntent: this.extractUserIntent(content.userInput),
      aiActions: this.extractAIActions(content.aiResponse),
      keyTopics: this.extractKeyTopics(content.combined),
      insights: this.extractInsights(content.combined),
      decisions: this.extractDecisions(content.combined),
      flow: this.generateFlow(content)
    };
  }

  /**
   * Extract content from various conversation data formats
   */
  extractContent(conversationData) {
    let userInput = '';
    let aiResponse = '';
    
    // DEBUG: Log the conversation data structure
    if (this.verbose) {
      console.log('📋 DEBUG - Conversation Data Structure:');
      console.log(`   Platform: ${this.currentPlatform}`);
      console.log(`   Source: ${conversationData.source}`);
      console.log(`   Messages: ${conversationData.messages?.length || 0}`);
      if (conversationData.messages && conversationData.messages.length > 0) {
        console.log(`   First message content: ${conversationData.messages[0].content?.substring(0, 100)}...`);
        console.log(`   First message type: ${conversationData.messages[0].type}`);
      }
    }
    
    // Handle different data formats
    if (conversationData.user_input && conversationData.ai_response) {
      userInput = conversationData.user_input;
      aiResponse = conversationData.ai_response;
    } else if (conversationData.messages && Array.isArray(conversationData.messages)) {
      conversationData.messages.forEach(msg => {
        if (msg.role === 'user' || msg.type === 'user') {
          userInput += msg.content + ' ';
        } else if (msg.role === 'assistant' || msg.type === 'assistant') {
          aiResponse += msg.content + ' ';
        }
      });
    } else if (typeof conversationData === 'string') {
      // Handle string input
      const parts = conversationData.split('\n');
      userInput = parts[0] || '';
      aiResponse = parts.slice(1).join('\n') || '';
    }

    const result = {
      userInput: userInput.trim(),
      aiResponse: aiResponse.trim(),
      combined: (userInput + ' ' + aiResponse).trim()
    };
    
    // DEBUG: Log extracted content
    if (this.verbose && this.currentPlatform === 'augment') {
      console.log('📋 DEBUG - Extracted Content:');
      console.log(`   User Input: ${result.userInput.substring(0, 100)}...`);
      console.log(`   AI Response: ${result.aiResponse.substring(0, 100)}...`);
    }
    
    return result;
  }

  /**
   * Extract real user intents from actual queries
   */
  extractRealUserIntents(userMessages) {
    const cleanMessages = [];
    
    for (const msg of userMessages.slice(-20)) { // Look at more messages to find clean ones
      const content = msg.content;
      
      // Skip JSON tool calls and system messages
      if (content.includes('ActionResult') || content.includes('"id":') || content.startsWith('[{')) {
        continue;
      }
      
      // Clean up the content
      const cleanText = content.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '').trim();
      
      // Only include meaningful user queries
      if (cleanText.length > 20) {
        cleanMessages.push({
          timestamp: msg.timestamp,
          intent: cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText,
          fullQuery: cleanText
        });
      }
    }
    
    return cleanMessages.slice(-10); // Return last 10 clean queries
  }

  /**
   * Extract real AI actions from responses
   */
  extractRealAIActions(aiMessages) {
    const actions = [];
    for (const msg of aiMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes('edit_files') || content.includes('create_file')) {
        actions.push({ type: 'file_modification', timestamp: msg.timestamp, details: msg.content.substring(0, 200) });
      }
      if (content.includes('run_command')) {
        actions.push({ type: 'command_execution', timestamp: msg.timestamp, details: msg.content.substring(0, 200) });
      }
      if (content.includes('cleanup') || content.includes('clean up')) {
        actions.push({ type: 'cleanup_work', timestamp: msg.timestamp, details: msg.content.substring(0, 200) });
      }
    }
    return actions;
  }

  /**
   * Extract technical work performed
   */
  extractTechnicalWork(aiMessages) {
    const technicalWork = [];
    for (const msg of aiMessages) {
      if (msg.content.includes('implementation') || msg.content.includes('system') || msg.content.includes('architecture')) {
        technicalWork.push({
          timestamp: msg.timestamp,
          work: msg.content.substring(0, 300) + (msg.content.length > 300 ? '...' : ''),
          type: 'technical_implementation'
        });
      }
    }
    return technicalWork;
  }

  /**
   * Extract real decisions from conversation
   */
  extractRealDecisions(messages) {
    const decisions = [];
    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      if (content.includes('decision') || content.includes('decided') || content.includes('choose') || content.includes('option')) {
        decisions.push({
          timestamp: msg.timestamp,
          decision: msg.content.substring(0, 250) + (msg.content.length > 250 ? '...' : ''),
          type: msg.type
        });
      }
    }
    return decisions;
  }

  /**
   * Extract real insights and discoveries
   */
  extractRealInsights(messages) {
    const insights = [];
    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      if (content.includes('insight') || content.includes('discovered') || content.includes('found that') || content.includes('realized')) {
        insights.push({
          timestamp: msg.timestamp,
          insight: msg.content.substring(0, 250) + (msg.content.length > 250 ? '...' : ''),
          type: msg.type
        });
      }
    }
    return insights;
  }

  /**
   * Generate rich conversation flow
   */
  generateRichFlow(messages) {
    const flowSteps = [];
    const recentMessages = messages.slice(-20); // Last 20 messages for flow
    
    for (const msg of recentMessages) {
      flowSteps.push(`${msg.type}:${msg.timestamp}:${msg.content.substring(0, 100)}`);
    }
    
    return flowSteps.join('|');
  }

  /**
   * Extract cleanup work performed
   */
  extractCleanupWork(messages) {
    const cleanupWork = [];
    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      if (content.includes('cleanup') || content.includes('clean up') || content.includes('truncate') || content.includes('remove')) {
        cleanupWork.push({
          timestamp: msg.timestamp,
          work: msg.content.substring(0, 300) + (msg.content.length > 300 ? '...' : ''),
          type: 'cleanup_maintenance'
        });
      }
    }
    return cleanupWork;
  }

  /**
   * Extract file modifications
   */
  extractFileModifications(aiMessages) {
    const modifications = [];
    for (const msg of aiMessages) {
      if (msg.content.includes('edit_files') || msg.content.includes('create_file')) {
        // Try to extract file paths from the content
        const filePathMatch = msg.content.match(/"file_path":\s*"([^"]+)"/g);
        if (filePathMatch) {
          modifications.push({
            timestamp: msg.timestamp,
            files: filePathMatch.map(match => match.replace(/"file_path":\s*"([^"]+)"/g, '$1')),
            action: msg.content.includes('create_file') ? 'created' : 'modified'
          });
        }
      }
    }
    return modifications;
  }

  /**
   * Analyze conversation using platform-specific logic
   * @param {Object} richConversation - Rich conversation data
   * @param {string} platform - AI platform identifier
   * @returns {Object} Platform-specific analysis
   */
  analyzeConversationByPlatform(richConversation, platform) {
    const messages = richConversation.messages || [];
    
    switch (platform) {
      case 'warp':
        return this.analyzeWarpConversation(richConversation, messages);
      case 'claude':
        return this.analyzeClaudeConversation(richConversation, messages);
      case 'chatgpt':
        return this.analyzeChatGPTConversation(richConversation, messages);
      case 'cursor':
        return this.analyzeCursorConversation(richConversation, messages);
      case 'copilot':
        return this.analyzeCopilotConversation(richConversation, messages);
      case 'augment':
        return this.analyzeAugmentConversation(richConversation, messages);
      default:
        // Fallback to generic analysis
        return this.analyzeGenericConversation(richConversation, messages);
    }
  }

  /**
   * Analyze Warp AI conversation (terminal-based AI assistant)
   */
  analyzeWarpConversation(richConversation, messages) {
    const userQueries = messages.filter(m => m.type === 'USER_QUERY');
    const aiActions = messages.filter(m => m.type === 'AI_ACTION');
    
    // Extract working state from terminal commands and file operations
    const workingOn = this.extractWarpWorkingState(aiActions);
    const blockers = this.extractWarpBlockers(userQueries, aiActions);
    const nextAction = this.extractWarpNextAction(aiActions);
    
    return {
      userIntents: this.extractRealUserIntents(userQueries),
      aiActions: this.extractWarpAIActions(aiActions),
      technicalWork: this.extractWarpTechnicalWork(aiActions),
      decisions: this.extractWarpDecisions(messages),
      insights: this.extractWarpInsights(messages),
      flow: this.generateRichFlow(messages),
      cleanupWork: this.extractCleanupWork(messages),
      fileModifications: this.extractFileModifications(aiActions),
      // State tracking for Warp
      workingOn,
      blockers,
      nextAction,
      platform: 'warp'
    };
  }

  /**
   * Analyze Augment VSCode Extension conversation (agent edit/action data)
   */
  analyzeAugmentConversation(richConversation, messages) {
    // Augment data is agent edit/action focused, not traditional chat
    const agentActions = messages.filter(m => m.type === 'AI_ACTION' || m.source === 'augment-leveldb');
    const fileOperations = this.extractAugmentFileOperations(agentActions);
    const agentInsights = this.extractAugmentAgentInsights(agentActions);
    
    return {
      userIntents: this.extractAugmentUserIntents(agentActions),
      aiActions: this.extractAugmentAIActions(agentActions),
      technicalWork: this.extractAugmentTechnicalWork(agentActions),
      decisions: this.extractAugmentDecisions(agentActions),
      insights: agentInsights,
      flow: this.generateAugmentFlow(agentActions),
      cleanupWork: [],
      fileModifications: fileOperations,
      // Augment-specific state tracking
      workingOn: this.extractAugmentWorkingState(agentActions),
      blockers: this.extractAugmentBlockers(agentActions),
      nextAction: this.extractAugmentNextAction(agentActions),
      platform: 'augment'
    };
  }

  /**
   * Analyze ChatGPT conversation (encrypted, metadata only)
   */
  analyzeChatGPTConversation(richConversation, messages) {
    // ChatGPT data is encrypted, so we work with limited metadata
    return {
      userIntents: [{ intent: 'ChatGPT conversation (encrypted)', timestamp: new Date().toISOString() }],
      aiActions: [{ type: 'metadata_extraction', timestamp: new Date().toISOString(), details: 'Encrypted ChatGPT data processed' }],
      technicalWork: [],
      decisions: [],
      insights: [{ insight: `ChatGPT conversation processed with ${messages.length} encrypted messages`, timestamp: new Date().toISOString(), type: 'METADATA' }],
      flow: 'chatgpt_encrypted_processing',
      cleanupWork: [],
      fileModifications: [],
      // State tracking
      workingOn: 'ChatGPT encrypted conversation',
      blockers: 'Encrypted data - limited extraction',
      nextAction: 'Continue with available metadata',
      platform: 'chatgpt'
    };
  }

  /**
   * Analyze Claude conversation
   */
  analyzeClaudeConversation(richConversation, messages) {
    // Similar structure to Warp but adapted for Claude's patterns
    const userMessages = messages.filter(m => m.role === 'user' || m.type === 'USER');
    const aiMessages = messages.filter(m => m.role === 'assistant' || m.type === 'ASSISTANT');
    
    return {
      userIntents: this.extractClaudeUserIntents(userMessages),
      aiActions: this.extractClaudeAIActions(aiMessages),
      technicalWork: this.extractClaudeTechnicalWork(aiMessages),
      decisions: this.extractClaudeDecisions(messages),
      insights: this.extractClaudeInsights(messages),
      flow: this.generateRichFlow(messages),
      cleanupWork: this.extractCleanupWork(messages),
      fileModifications: this.extractFileModifications(aiMessages),
      // State tracking
      workingOn: this.extractClaudeWorkingState(aiMessages),
      blockers: this.extractClaudeBlockers(messages),
      nextAction: this.extractClaudeNextAction(aiMessages),
      platform: 'claude'
    };
  }

  /**
   * Generic conversation analysis (fallback)
   */
  analyzeGenericConversation(richConversation, messages) {
    const userMessages = messages.filter(m => m.role === 'user' || m.type?.includes('USER'));
    const aiMessages = messages.filter(m => m.role === 'assistant' || m.type?.includes('AI') || m.type?.includes('ASSISTANT'));
    
    return {
      userIntents: this.extractRealUserIntents(userMessages),
      aiActions: this.extractRealAIActions(aiMessages),
      technicalWork: this.extractTechnicalWork(aiMessages),
      decisions: this.extractRealDecisions(messages),
      insights: this.extractRealInsights(messages),
      flow: this.generateRichFlow(messages),
      cleanupWork: this.extractCleanupWork(messages),
      fileModifications: this.extractFileModifications(aiMessages),
      // Generic state tracking
      workingOn: this.extractGenericWorkingState(messages),
      blockers: this.extractGenericBlockers(messages),
      nextAction: this.extractGenericNextAction(messages),
      platform: this.currentPlatform || 'unknown'
    };
  }

  /**
   * Generate rich content based on classification
   */
  generateRichContent(classification, analysis, richConversation) {
    const timestamp = new Date().toISOString();
    const conversationId = richConversation.id;

    switch (classification) {
      case 'conversation_flow':
        return this.generateRichConversationMemoryContent(analysis, timestamp, conversationId, richConversation);
      
      case 'technical_insight':
      case 'architecture_change':
      case 'system_design':
      case 'performance_optimization':
        return this.generateRichTechnicalContent(analysis, timestamp, conversationId);
      
      case 'decision':
      case 'strategy_decision':
      case 'technical_decision':
        return this.generateRichDecisionContent(analysis, timestamp, conversationId);
      
      case 'task_progress':
      case 'project_status':
        return this.generateRichWorkStateContent(analysis, timestamp, conversationId);
      
      default:
        return this.generateDefaultContent(analysis, timestamp, conversationId);
    }
  }

  /**
   * Generate rich content for conversation-memory.aicf with clear source headers
   */
  generateRichConversationMemoryContent(analysis, timestamp, conversationId, richConversation) {
    const sourceHeader = analysis.platform ? `[${analysis.platform.toUpperCase()}]` : '[UNKNOWN]';
    const recentQueries = analysis.userIntents.slice(-5).map(ui => `${ui.timestamp}: ${ui.intent}`).join('\n  ');
    const recentActions = analysis.aiActions.slice(-5).map(action => `${action.timestamp}: ${action.type} - ${action.details}`).join('\n  ');
    
    return `@CONVERSATION:${conversationId}
${sourceHeader}
timestamp=${timestamp}
platform=${analysis.platform || 'unknown'}
source_type=${analysis.platform === 'warp' ? 'terminal_ai' : analysis.platform === 'augment' ? 'vscode_agent' : 'unknown'}
message_count=${richConversation.messageCount}
user_queries="""
  ${recentQueries}
"""
ai_actions="""
  ${recentActions}
"""
flow=${analysis.flow.substring(0, 500)}...
key_topics=${analysis.insights.map(i => i.insight.substring(0, 50)).join('|').substring(0, 200)}
outcome=rich_session_captured
`;
  }

  /**
   * Generate rich technical content
   */
  generateRichTechnicalContent(analysis, timestamp, conversationId) {
    const technicalWork = analysis.technicalWork.map(work => work.work.substring(0, 200)).join('|');
    const fileModifications = analysis.fileModifications.map(mod => `${mod.action}:${mod.files.join(',')}`).join('|');
    
    return `@TECHNICAL:${conversationId}
timestamp=${timestamp}
technical_work="""
${technicalWork}
"""
file_modifications=${fileModifications}
insights=${analysis.insights.map(i => i.insight.substring(0, 100)).join('|')}
topics=RICH_TECHNICAL_EXTRACTION,SQLITE_DIRECT_ACCESS
`;
  }

  /**
   * Generate rich decision content
   */
  generateRichDecisionContent(analysis, timestamp, conversationId) {
    const decisions = analysis.decisions.map(d => `${d.timestamp}:${d.decision.substring(0, 150)}`).join('|');
    
    return `@DECISION:${conversationId}
timestamp=${timestamp}
rich_decisions="""
${decisions}
"""
context=${analysis.flow.substring(0, 200)}...
impact=MEDIUM
confidence=HIGH
`;
  }

  /**
   * Generate rich work state content
   */
  generateRichWorkStateContent(analysis, timestamp, conversationId) {
    const cleanupWork = analysis.cleanupWork.map(work => work.work.substring(0, 150)).join('|');
    
    return `@WORK:${conversationId}
timestamp=${timestamp}
status=progressing
cleanup_actions="""
${cleanupWork}
"""
actions=${analysis.aiActions.map(a => a.type).join(',')}
flow=${analysis.flow.substring(0, 200)}...
`;
  }

  // =================================================================
  // AUGMENT-SPECIFIC EXTRACTION METHODS
  // =================================================================

  /**
   * Extract user intents from Augment agent actions (with real message content)
   */
  extractAugmentUserIntents(agentActions) {
    const intents = [];
    for (const action of agentActions) {
      const content = action.content || '';
      
      // For Augment, the "content" field should contain the actual user message
      if (action.metadata && action.metadata.messageType === 'user_request') {
        // This is a real user request message from Augment
        intents.push({
          timestamp: action.timestamp,
          intent: content, // Use the actual user message content
          inferredFrom: 'augment_leveldb',
          confidence: 'high'
        });
      } else {
        // Fallback: infer intent from agent actions if no direct user message
        if (content.includes('file') || content.includes('edit')) {
          intents.push({
            timestamp: action.timestamp,
            intent: 'File editing/modification requested',
            inferredFrom: 'agent_action',
            confidence: 'medium'
          });
        }
        if (content.includes('implement') || content.includes('add')) {
          intents.push({
            timestamp: action.timestamp,
            intent: 'Feature implementation requested',
            inferredFrom: 'agent_action',
            confidence: 'high'
          });
        }
      }
    }
    return intents.slice(-5); // Last 5 intents (real messages prioritized)
  }

  /**
   * Extract AI actions specific to Augment agent behavior
   */
  extractAugmentAIActions(agentActions) {
    const actions = [];
    for (const action of agentActions) {
      const content = action.content || '';
      actions.push({
        type: 'augment_agent_action',
        timestamp: action.timestamp,
        details: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        workingDirectory: action.workingDirectory,
        source: 'augment_leveldb'
      });
    }
    return actions;
  }

  /**
   * Extract technical work from Augment agent actions
   */
  extractAugmentTechnicalWork(agentActions) {
    const technicalWork = [];
    for (const action of agentActions) {
      const content = action.content || '';
      // Augment actions are inherently technical
      technicalWork.push({
        timestamp: action.timestamp,
        work: `Augment agent action: ${content.substring(0, 250)}`,
        type: 'agent_automation',
        source: 'augment'
      });
    }
    return technicalWork;
  }

  /**
   * Extract decisions from Augment agent actions (implicit decisions)
   */
  extractAugmentDecisions(agentActions) {
    const decisions = [];
    for (const action of agentActions) {
      const content = action.content || '';
      if (content.includes('choose') || content.includes('selected') || content.includes('decision')) {
        decisions.push({
          timestamp: action.timestamp,
          decision: `Agent decision: ${content.substring(0, 200)}`,
          type: 'agent_decision',
          confidence: 'automated'
        });
      }
    }
    return decisions;
  }

  /**
   * Extract insights from Augment agent actions
   */
  extractAugmentAgentInsights(agentActions) {
    const insights = [];
    for (const action of agentActions) {
      const content = action.content || '';
      // Agent actions provide insights into development workflow
      insights.push({
        timestamp: action.timestamp,
        insight: `Augment workflow insight: AI agent performed automated action in development environment`,
        type: 'AGENT_WORKFLOW',
        details: content.substring(0, 150) + (content.length > 150 ? '...' : '')
      });
    }
    return insights.slice(-3); // Most recent insights
  }

  /**
   * Extract file operations from Augment agent actions
   */
  extractAugmentFileOperations(agentActions) {
    const operations = [];
    for (const action of agentActions) {
      if (action.workingDirectory && action.workingDirectory.includes('.ldb')) {
        // File extracted from LevelDB
        operations.push({
          timestamp: action.timestamp,
          files: [action.workingDirectory],
          action: 'extracted_from_leveldb',
          source: 'augment'
        });
      }
    }
    return operations;
  }

  /**
   * Generate Augment-specific conversation flow
   */
  generateAugmentFlow(agentActions) {
    if (!agentActions || agentActions.length === 0) {
      return 'augment_workflow|no_actions_detected';
    }
    const flowSteps = agentActions.map(action => 
      `AGENT_ACTION:${action.timestamp}:${(action.content || '').substring(0, 50)}`
    );
    return flowSteps.join('|');
  }

  /**
   * Extract what Augment agent is working on
   */
  extractAugmentWorkingState(agentActions) {
    if (agentActions.length === 0) return 'No agent actions detected';
    const latestAction = agentActions[agentActions.length - 1];
    return `Augment agent development assistance: ${latestAction.content.substring(0, 100)}`;
  }

  /**
   * Extract Augment-specific blockers
   */
  extractAugmentBlockers(agentActions) {
    // Augment agents typically don't have blockers, they execute actions
    return 'No blockers - agent executed automated actions';
  }

  /**
   * Extract next action for Augment workflow
   */
  extractAugmentNextAction(agentActions) {
    return 'Continue monitoring Augment agent activities and development workflow';
  }

  /**
   * Generate specialized content based on classification
   */
  generateSpecializedContent(classification, analysis, conversationData) {
    const timestamp = new Date().toISOString();
    const chunkId = conversationData.metadata?.chunkId || 'unknown';

    switch (classification) {
      case 'conversation_flow':
        return this.generateConversationMemoryContent(analysis, timestamp, chunkId);
      
      case 'technical_insight':
      case 'architecture_change':
      case 'system_design':
      case 'performance_optimization':
        return this.generateTechnicalContent(analysis, timestamp, chunkId);
      
      case 'decision':
      case 'strategy_decision':
      case 'technical_decision':
        return this.generateDecisionContent(analysis, timestamp, chunkId);
      
      case 'task_progress':
      case 'project_status':
        return this.generateWorkStateContent(analysis, timestamp, chunkId);
      
      default:
        return this.generateDefaultContent(analysis, timestamp, chunkId);
    }
  }

  /**
   * Generate content for conversation-memory.aicf with source headers
   */
  generateConversationMemoryContent(analysis, timestamp, chunkId) {
    const sourceHeader = this.currentPlatform ? `[${this.currentPlatform.toUpperCase()}]` : '[UNKNOWN]';
    // Extract real user intent from analysis
    const realUserIntent = (analysis.userIntents && analysis.userIntents.length > 0) 
      ? analysis.userIntents[0].intent 
      : analysis.userIntent || 'no_intent_detected';
    
    return `@CONVERSATION:${chunkId}
${sourceHeader}
timestamp=${timestamp}
platform=${this.currentPlatform || 'unknown'}
flow=${analysis.flow || 'unknown_flow'}
user_intent=${realUserIntent ? realUserIntent.substring(0, 200) + '...' : 'no_intent'}
ai_actions=${Array.isArray(analysis.aiActions) ? analysis.aiActions.map(a => (typeof a === 'object' ? a.type : a) || 'unknown').join(',') : (analysis.aiActions || 'processing')}
key_topics=${Array.isArray(analysis.keyTopics) ? analysis.keyTopics.join(',') : (analysis.keyTopics || 'GENERAL')}
outcome=session_processed
`;
  }

  /**
   * Generate content for technical-context.aicf
   */
  generateTechnicalContent(analysis, timestamp, chunkId) {
    const insights = Array.isArray(analysis.insights) 
      ? analysis.insights.map(i => typeof i === 'object' ? i.insight || i.details || 'insight' : i).join('|')
      : 'no_insights';
    const topics = Array.isArray(analysis.keyTopics) 
      ? analysis.keyTopics.join(',')
      : 'GENERAL';
    
    return `@TECHNICAL:${chunkId}
timestamp=${timestamp}
platform=${this.currentPlatform || 'unknown'}
insights=${insights}
technical_flow=${analysis.flow || 'unknown_flow'}
topics=${topics}
`;
  }

  /**
   * Generate content for decisions.aicf
   */
  generateDecisionContent(analysis, timestamp, chunkId) {
    const decisions = Array.isArray(analysis.decisions) 
      ? analysis.decisions.map(d => typeof d === 'object' ? d.decision || d.type || 'decision' : d).join('|')
      : 'no_decisions';
    
    return `@DECISION:${chunkId}
timestamp=${timestamp}
platform=${this.currentPlatform || 'unknown'}
decisions=${decisions}
context=${analysis.flow || 'unknown_flow'}
impact=MEDIUM
confidence=HIGH
`;
  }

  /**
   * Generate content for work-state.aicf
   */
  generateWorkStateContent(analysis, timestamp, chunkId) {
    const actions = Array.isArray(analysis.aiActions) 
      ? analysis.aiActions.map(a => typeof a === 'object' ? a.type || a.action || 'action' : a).join(',')
      : 'processing';
    
    return `@WORK:${chunkId}
timestamp=${timestamp}
platform=${this.currentPlatform || 'unknown'}
status=progressing
actions=${actions}
flow=${analysis.flow || 'unknown_flow'}
`;
  }

  /**
   * Generate default content
   */
  generateDefaultContent(analysis, timestamp, chunkId) {
    return `@SESSION:${chunkId}
timestamp=${timestamp}
flow=${analysis.flow}
summary=processed_conversation
`;
  }

  /**
   * Extract user intent from input
   */
  extractUserIntent(userInput) {
    const lower = userInput.toLowerCase();
    
    if (lower.includes('duplication') || lower.includes('.aicf files')) {
      return 'system_optimization_request';
    }
    if (lower.includes('agent') || lower.includes('routing')) {
      return 'system_improvement_request';
    }
    if (lower.includes('check') || lower.includes('status')) {
      return 'system_status_check';
    }
    
    return 'general_inquiry';
  }

  /**
   * Extract AI actions from response
   */
  extractAIActions(aiResponse) {
    const actions = [];
    const lower = aiResponse.toLowerCase();
    
    if (lower.includes('create') || lower.includes('implement')) {
      actions.push('implementation');
    }
    if (lower.includes('route') || lower.includes('distribute')) {
      actions.push('routing_setup');
    }
    if (lower.includes('deduplicate') || lower.includes('prevent')) {
      actions.push('deduplication');
    }
    
    return actions.length ? actions : ['processing'];
  }

  /**
   * Extract key topics
   */
  extractKeyTopics(content) {
    const topics = [];
    const lower = content.toLowerCase();
    
    if (lower.includes('.aicf') || lower.includes('aicf')) {
      topics.push('AICF_SYSTEM');
    }
    if (lower.includes('agent') || lower.includes('router')) {
      topics.push('AGENT_ROUTING');
    }
    if (lower.includes('duplicate') || lower.includes('bloat')) {
      topics.push('DEDUPLICATION');
    }
    if (lower.includes('technical') || lower.includes('system')) {
      topics.push('TECHNICAL_OPTIMIZATION');
    }
    
    return topics.length ? topics : ['GENERAL'];
  }

  /**
   * Extract insights
   */
  extractInsights(content) {
    const insights = [];
    
    if (content.includes('duplication') && content.includes('problem')) {
      insights.push('Identified content duplication issue in AICF system');
    }
    if (content.includes('routing') && content.includes('specialized')) {
      insights.push('Implemented specialized content routing for better organization');
    }
    
    return insights;
  }

  /**
   * Extract decisions
   */
  extractDecisions(content) {
    const decisions = [];
    
    if (content.includes('route') && content.includes('files')) {
      decisions.push('Decided to route content to specialized AICF files');
    }
    if (content.includes('deduplicate')) {
      decisions.push('Implemented deduplication to prevent content bloat');
    }
    
    return decisions;
  }

  /**
   * Generate conversation flow description
   */
  generateFlow(content) {
    const parts = [];
    
    if (content.userInput.includes('duplication')) {
      parts.push('user_reports_duplication_issue');
    } else {
      parts.push('user_general_inquiry');
    }
    
    if (content.aiResponse.includes('routing')) {
      parts.push('ai_implements_content_routing');
    }
    if (content.aiResponse.includes('deduplication')) {
      parts.push('ai_implements_deduplication');
    }
    
    parts.push('session_completed_successfully');
    
    return parts.join('|');
  }

  /**
   * Warp-specific extraction methods
   */
  extractWarpWorkingState(aiActions) {
    const recentActions = aiActions.slice(-10); // Last 10 AI actions
    const workingStates = [];
    
    for (const action of recentActions) {
      const content = action.content.toLowerCase();
      if (content.includes('edit_files') || content.includes('create_file')) {
        workingStates.push('editing files');
      }
      if (content.includes('run_command')) {
        workingStates.push('executing commands');
      }
      if (content.includes('debugging') || content.includes('fixing')) {
        workingStates.push('debugging/fixing issues');
      }
      if (content.includes('testing') || content.includes('verify')) {
        workingStates.push('testing and verification');
      }
      if (content.includes('documentation') || content.includes('readme')) {
        workingStates.push('updating documentation');
      }
    }
    
    // Return most recent or common working state
    return workingStates.length > 0 ? workingStates[workingStates.length - 1] : 'ongoing development';
  }
  
  extractWarpBlockers(userQueries, aiActions) {
    const recentQueries = userQueries.slice(-5);
    const blockers = [];
    
    for (const query of recentQueries) {
      const content = query.content;
      
      // Skip JSON tool calls and system messages
      if (content.includes('ActionResult') || content.includes('"id":') || content.startsWith('[{')) {
        continue;
      }
      
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('error') || lowerContent.includes('issue') || lowerContent.includes('problem')) {
        // Extract clean text, avoiding JSON
        const cleanText = content.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '').trim();
        if (cleanText.length > 10) {
          blockers.push(cleanText.substring(0, 150));
        }
      }
      if (lowerContent.includes('not working') || lowerContent.includes("doesn't work")) {
        const cleanText = content.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '').trim();
        if (cleanText.length > 10) {
          blockers.push('functionality issues: ' + cleanText.substring(0, 100));
        }
      }
    }
    
    return blockers.length > 0 ? blockers.join('; ') : 'no current blockers';
  }
  
  extractWarpNextAction(aiActions) {
    const lastAction = aiActions[aiActions.length - 1];
    if (!lastAction) return 'continue development';
    
    const content = lastAction.content.toLowerCase();
    if (content.includes('test') && !content.includes('tested')) {
      return 'run tests and verify changes';
    }
    if (content.includes('edit_files') || content.includes('create_file')) {
      return 'test the implemented changes';
    }
    if (content.includes('error') || content.includes('fix')) {
      return 'continue debugging and fixing issues';
    }
    if (content.includes('documentation')) {
      return 'review and finalize documentation';
    }
    
    return 'continue with next development task';
  }
  
  extractWarpAIActions(aiActions) {
    return aiActions.map(action => {
      const content = action.content;
      let actionType = 'general_response';
      
      if (content.includes('edit_files')) actionType = 'file_editing';
      else if (content.includes('create_file')) actionType = 'file_creation';
      else if (content.includes('run_command')) actionType = 'command_execution';
      else if (content.includes('read_any_files')) actionType = 'file_reading';
      else if (content.includes('search_codebase')) actionType = 'code_search';
      else if (content.includes('grep')) actionType = 'text_search';
      
      return {
        type: actionType,
        timestamp: action.timestamp,
        details: content.substring(0, 200) + (content.length > 200 ? '...' : '')
      };
    });
  }
  
  extractWarpTechnicalWork(aiActions) {
    const technicalActions = [];
    
    for (const action of aiActions) {
      const content = action.content;
      if (content.includes('implementation') || content.includes('architecture') || content.includes('system')) {
        technicalActions.push({
          timestamp: action.timestamp,
          work: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
          type: 'system_implementation'
        });
      }
      if (content.includes('algorithm') || content.includes('optimization') || content.includes('performance')) {
        technicalActions.push({
          timestamp: action.timestamp,
          work: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
          type: 'performance_optimization'
        });
      }
    }
    
    return technicalActions;
  }
  
  extractWarpDecisions(messages) {
    const decisions = [];
    
    for (const msg of messages) {
      const content = msg.content;
      
      // Skip JSON tool calls and system messages
      if (content.includes('ActionResult') || content.includes('"id":') || content.startsWith('[{')) {
        continue;
      }
      
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('decision') || lowerContent.includes('chose to') || lowerContent.includes('decided to')) {
        
        // Extract clean human-readable text
        const cleanText = content.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '').trim();
        if (cleanText.length > 20) {
          decisions.push({
            timestamp: msg.timestamp,
            decision: cleanText.substring(0, 250) + (cleanText.length > 250 ? '...' : ''),
            type: msg.type || 'unknown'
          });
        }
      }
    }
    
    return decisions;
  }
  
  extractWarpInsights(messages) {
    const insights = [];
    
    for (const msg of messages) {
      const content = msg.content;
      
      // Skip JSON tool calls and system messages
      if (content.includes('ActionResult') || content.includes('"id":') || content.startsWith('[{')) {
        continue;
      }
      
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('insight') || lowerContent.includes('discovered') || lowerContent.includes('found that') || 
          lowerContent.includes('realized') || lowerContent.includes('understanding')) {
        
        // Extract clean human-readable text
        const cleanText = content.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '').trim();
        if (cleanText.length > 20) {
          insights.push({
            timestamp: msg.timestamp,
            insight: cleanText.substring(0, 250) + (cleanText.length > 250 ? '...' : ''),
            type: msg.type || 'unknown'
          });
        }
      }
    }
    
    return insights;
  }
  
  /**
   * Claude-specific extraction methods (stubs for now)
   */
  extractClaudeUserIntents(userMessages) {
    return userMessages.map(msg => ({
      timestamp: msg.timestamp || new Date().toISOString(),
      intent: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content,
      fullQuery: msg.content
    })).slice(-10);
  }
  
  extractClaudeWorkingState(aiMessages) {
    return aiMessages.length > 0 ? 'Claude conversation analysis' : 'no activity';
  }
  
  extractClaudeBlockers(messages) {
    return 'no identified blockers';
  }
  
  extractClaudeNextAction(aiMessages) {
    return 'continue Claude conversation';
  }
  
  extractClaudeAIActions(aiMessages) {
    return aiMessages.map(msg => ({
      type: 'claude_response',
      timestamp: msg.timestamp || new Date().toISOString(),
      details: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '')
    }));
  }
  
  extractClaudeTechnicalWork(aiMessages) {
    return [];
  }
  
  extractClaudeDecisions(messages) {
    return [];
  }
  
  extractClaudeInsights(messages) {
    return [];
  }
  
  /**
   * Generic extraction methods for fallback
   */
  extractGenericWorkingState(messages) {
    if (messages.length === 0) return 'no activity';
    
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();
    
    if (content.includes('working on') || content.includes('implementing')) {
      return 'development work';
    }
    if (content.includes('fixing') || content.includes('debugging')) {
      return 'issue resolution';
    }
    if (content.includes('testing') || content.includes('verifying')) {
      return 'testing and validation';
    }
    
    return 'general conversation';
  }
  
  extractGenericBlockers(messages) {
    const recentMessages = messages.slice(-5);
    const errorMessages = recentMessages.filter(m => 
      m.content.toLowerCase().includes('error') || 
      m.content.toLowerCase().includes('problem') ||
      m.content.toLowerCase().includes('issue')
    );
    
    if (errorMessages.length > 0) {
      return 'issues identified: ' + errorMessages[0].content.substring(0, 100);
    }
    
    return 'no current blockers';
  }
  
  extractGenericNextAction(messages) {
    if (messages.length === 0) return 'start conversation';
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user' || lastMessage.type?.includes('USER')) {
      return 'provide response to user query';
    }
    
    return 'continue conversation';
  }
  
  /**
   * Create structured sections compatible with file writer agent
   * @param {Object} analysis - Analysis results from platform-specific parsing
   * @returns {Object} Structured sections for file writer
   */
  createStructuredSections(analysis) {
    return {
      flow: {
        section: '@FLOW',
        content: analysis.flow || 'conversation_processed',
        metadata: { source: 'intelligent_parser' }
      },
      decisions: {
        section: '@DECISIONS',
        content: (analysis.decisions || []).map(d => ({
          decision: d.decision || d.toString(),
          reasoning: 'extracted_from_conversation',
          impact: 'MEDIUM',
          confidence: 'MEDIUM'
        })),
        metadata: { itemsFound: (analysis.decisions || []).length }
      },
      insights: {
        section: '@INSIGHTS',
        content: (analysis.insights || []).map(i => ({
          insight: i.insight || i.toString(),
          category: 'GENERAL',
          importance: 'MEDIUM',
          confidence: 'MEDIUM'
        })),
        metadata: { itemsFound: (analysis.insights || []).length }
      },
      state: {
        section: '@STATE',
        content: {
          working_on: analysis.workingOn || 'development',
          blockers: analysis.blockers || 'no current blockers',
          next_action: analysis.nextAction || 'continue development',
          progress: {
            score: 85, // Default reasonable score
            completed_tasks: 1,
            total_tasks: 1
          },
          ai_platform: analysis.platform || this.currentPlatform || 'unknown'
        },
        metadata: { source: 'platform_aware_analysis', platform: analysis.platform }
      }
    };
  }
  
  /**
   * Write content to target file
   */
  async writeToFile(routedContent) {
    const targetPath = path.join(process.cwd(), routedContent.targetFile);
    
    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append content to file
    fs.appendFileSync(targetPath, routedContent.content + '\n');
    
    console.log(`📝 Wrote to ${routedContent.targetFile}`);
  }
}

module.exports = IntelligentConversationParser;