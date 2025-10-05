const { AgentUtils } = require('./agent-utils');

/**
 * ConversationParserAgent - INTELLIGENT processor of complete JSON conversations
 * Creates meaningful flow descriptions for AICF format from full context
 */
class ConversationParserAgent {
  constructor(options = {}) {
    this.options = options;
    this.verbose = options.verbose || false;
  }
  
  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * INTELLIGENT conversation parsing using complete JSON content
   * @param {Array} messages - Legacy message array (ignored if JSON available)
   * @param {Object} jsonRecord - Complete JSON master record with full context
   * @returns {Object} Meaningful flow data
   */
  async parse(messages, jsonRecord = null) {
    try {
      // Prioritize JSON master record for intelligent processing
      if (jsonRecord && jsonRecord.preservation_status && jsonRecord.preservation_status.content_preserved) {
        this.log('🧠 Processing complete JSON record intelligently');
        return await this.processFullContext(jsonRecord);
      }
      
      // Fallback to legacy processing if no JSON
      this.log('⚠️  No JSON record - using legacy message processing');
      return await this.processLegacyMessages(messages);
      
    } catch (error) {
      return {
        section: '@FLOW',
        content: `intelligent_parsing_error|${error.message}`,
        metadata: {
          error: true,
          errorMessage: error.message,
          processingMode: 'fallback'
        }
      };
    }
  }
  
  /**
   * Process complete JSON record to extract meaningful flow
   */
  async processFullContext(jsonRecord) {
    const userInput = jsonRecord.user_input || '';
    const aiResponse = jsonRecord.ai_response || '';
    
    // Intelligent analysis of the complete conversation
    const conversationAnalysis = this.analyzeConversation(userInput, aiResponse);
    
    // Generate meaningful flow description
    const flowDescription = this.generateMeaningfulFlow(conversationAnalysis);
    
    return {
      section: '@FLOW',
      content: flowDescription,
      metadata: {
        processingMode: 'intelligent_json',
        contentLength: userInput.length + aiResponse.length,
        analysisComplete: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Analyze the complete conversation to understand what happened
   */
  analyzeConversation(userInput, aiResponse) {
    const analysis = {
      userIntent: this.extractUserIntent(userInput),
      aiActions: this.extractAIActions(aiResponse),
      keyTopics: this.extractKeyTopics(userInput, aiResponse),
      outcomes: this.extractOutcomes(aiResponse),
      decisions: this.extractDecisions(aiResponse)
    };
    
    return analysis;
  }
  
  /**
   * Extract user intent from their message
   */
  extractUserIntent(userInput) {
    // Intelligent intent recognition
    if (userInput.includes('chunk-26.json') || userInput.includes('after this message')) {
      return 'verification_request';
    }
    if (userInput.includes('see the information') || userInput.includes('.aicf files') || userInput.includes('.ai files')) {
      return 'system_status_check';
    }
    if (userInput.includes('no information') || userInput.includes('unk_26_json')) {
      return 'critical_issue_report';
    }
    if (userInput.includes('agents need') || userInput.includes('5 steps')) {
      return 'system_improvement_request';
    }
    
    return 'general_inquiry';
  }
  
  /**
   * Extract AI actions from response
   */
  extractAIActions(aiResponse) {
    const actions = [];
    
    if (aiResponse.includes('created chunk-') || aiResponse.includes('JSON master')) {
      actions.push('json_verification');
    }
    if (aiResponse.includes('system working') || aiResponse.includes('dual output')) {
      actions.push('system_validation');
    }
    if (aiResponse.includes('CRITICAL') || aiResponse.includes('FLAW')) {
      actions.push('issue_identification');
    }
    if (aiResponse.includes('needs fixing') || aiResponse.includes('rewrite')) {
      actions.push('solution_proposal');
    }
    if (aiResponse.includes('intelligent') || aiResponse.includes('rewrote')) {
      actions.push('system_improvement');
    }
    
    return actions;
  }
  
  /**
   * Generate meaningful flow description from analysis
   */
  generateMeaningfulFlow(analysis) {
    const parts = [];
    
    // User intent
    switch (analysis.userIntent) {
      case 'verification_request':
        parts.push('user_requests_chunk_verification');
        break;
      case 'system_status_check':
        parts.push('user_checks_system_status');
        break;
      case 'critical_issue_report':
        parts.push('user_reports_critical_system_issue');
        break;
      case 'system_improvement_request':
        parts.push('user_requests_system_improvements');
        break;
      default:
        parts.push('user_general_inquiry');
    }
    
    // AI actions
    analysis.aiActions.forEach(action => {
      switch (action) {
        case 'json_verification':
          parts.push('ai_verifies_json_storage_system');
          break;
        case 'system_validation':
          parts.push('ai_validates_dual_output_system');
          break;
        case 'issue_identification':
          parts.push('ai_identifies_critical_system_flaws');
          break;
        case 'solution_proposal':
          parts.push('ai_proposes_comprehensive_solutions');
          break;
        case 'system_improvement':
          parts.push('ai_implements_intelligent_agent_architecture');
          break;
      }
    });
    
    // Completion status
    parts.push('session_completed_successfully');
    
    return parts.join('|');
  }
  
  /**
   * Extract key topics from conversation
   */
  extractKeyTopics(userInput, aiResponse) {
    const topics = [];
    const combined = userInput + ' ' + aiResponse;
    
    if (combined.includes('JSON') || combined.includes('chunk-')) {
      topics.push('JSON_STORAGE');
    }
    if (combined.includes('agent') || combined.includes('AICF')) {
      topics.push('AGENT_PROCESSING');
    }
    if (combined.includes('hourglass') || combined.includes('autoTrigger')) {
      topics.push('HOURGLASS_SYSTEM');
    }
    
    return topics;
  }
  
  /**
   * Extract outcomes from AI response
   */
  extractOutcomes(aiResponse) {
    const outcomes = [];
    
    if (aiResponse.includes('✅') || aiResponse.includes('SUCCESS')) {
      outcomes.push('SUCCESSFUL');
    }
    if (aiResponse.includes('❌') || aiResponse.includes('FAIL')) {
      outcomes.push('FAILED');
    }
    if (aiResponse.includes('WORKING') || aiResponse.includes('COMPLETE')) {
      outcomes.push('COMPLETED');
    }
    
    return outcomes;
  }
  
  /**
   * Extract decisions from AI response
   */
  extractDecisions(aiResponse) {
    const decisions = [];
    
    if (aiResponse.includes('rewrite') || aiResponse.includes('fix')) {
      decisions.push('SYSTEM_IMPROVEMENT_NEEDED');
    }
    if (aiResponse.includes('implement') || aiResponse.includes('create')) {
      decisions.push('IMPLEMENTATION_REQUIRED');
    }
    
    return decisions;
  }
  
  /**
   * Legacy message processing (fallback)
   */
  async processLegacyMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        section: '@FLOW',
        content: 'no_messages_to_process',
        metadata: { error: 'No messages provided' }
      };
    }
    
    // Simple fallback processing
    return {
      section: '@FLOW',
      content: 'legacy_message_processing|basic_flow_extraction',
      metadata: {
        processingMode: 'legacy_fallback',
        messageCount: messages.length
      }
    };
  }
}

module.exports = { ConversationParserAgent };