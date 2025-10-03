const { AgentUtils } = require('./agent-utils');

/**
 * ConversationParserAgent - Extracts conversation flow and key events
 * Generates the @FLOW section for AICF format
 */
class ConversationParserAgent {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Parse conversation messages to extract flow and key events
   * @param {Array} messages - Array of conversation messages
   * @returns {Object} Parsed flow data
   */
  async parse(messages) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          section: '@FLOW',
          content: '',
          metadata: { eventsFound: 0, error: 'No messages to parse' }
        };
      }

      // Extract key events from messages
      const keyEvents = this.extractKeyEvents(messages);
      
      // Generate flow sequence
      const flowSequence = this.generateFlowSequence(keyEvents);
      
      // Format for AICF
      const flowContent = this.formatFlow(flowSequence);

      return {
        section: '@FLOW',
        content: flowContent,
        metadata: {
          eventsFound: keyEvents.length,
          totalMessages: messages.length,
          flowLength: flowSequence.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      return {
        section: '@FLOW',
        content: `parse_error|${error.message}`,
        metadata: {
          error: true,
          errorMessage: error.message,
          eventsFound: 0
        }
      };
    }
  }

  /**
   * Extract key events from conversation messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Array of key events
   */
  extractKeyEvents(messages) {
    const keyEvents = [];

    messages.forEach((message, index) => {
      if (!message.content) return;

      const content = message.content;
      const timestamp = AgentUtils.extractTimestamp(message);

      // Check for different types of key events
      const eventTypes = this.identifyEventTypes(content);

      if (eventTypes.length > 0) {
        eventTypes.forEach(eventType => {
          keyEvents.push({
            type: eventType,
            content: content,
            action: this.extractActionFromContent(content, eventType),
            timestamp: timestamp,
            messageIndex: index,
            speaker: this.extractSpeaker(message)
          });
        });
      }
    });

    // Sort by timestamp and deduplicate similar events
    return this.deduplicateEvents(
      keyEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    );
  }

  /**
   * Identify types of events in a message
   * @param {string} content - Message content
   * @returns {Array} Array of event types
   */
  identifyEventTypes(content) {
    const eventTypes = [];

    // Check for different patterns
    if (AgentUtils.matchesPattern(content, 'actions')) {
      eventTypes.push('action');
    }
    
    if (AgentUtils.matchesPattern(content, 'decisions')) {
      eventTypes.push('decision');
    }
    
    if (AgentUtils.matchesPattern(content, 'insights')) {
      eventTypes.push('insight');
    }
    
    if (AgentUtils.matchesPattern(content, 'blockers')) {
      eventTypes.push('blocker');
    }

    // Check for question-answer patterns
    if (this.isQuestion(content)) {
      eventTypes.push('question');
    }
    
    if (this.isAnswer(content)) {
      eventTypes.push('answer');
    }

    // Check for task-related events
    if (this.isTaskStart(content)) {
      eventTypes.push('task_start');
    }
    
    if (this.isTaskComplete(content)) {
      eventTypes.push('task_complete');
    }

    return eventTypes;
  }

  /**
   * Extract actionable content based on event type
   * @param {string} content - Message content
   * @param {string} eventType - Type of event
   * @returns {string} Extracted action
   */
  extractActionFromContent(content, eventType) {
    switch (eventType) {
      case 'action':
        return AgentUtils.extractAction(content);
      
      case 'decision':
        return this.extractDecisionAction(content);
      
      case 'insight':
        return this.extractInsightAction(content);
      
      case 'question':
        return this.extractQuestionAction(content);
        
      case 'answer':
        return this.extractAnswerAction(content);
        
      case 'task_start':
        return this.extractTaskAction(content, 'start');
        
      case 'task_complete':
        return this.extractTaskAction(content, 'complete');
        
      default:
        return AgentUtils.normalizeAction(content.substring(0, 50));
    }
  }

  /**
   * Extract decision-specific actions
   */
  extractDecisionAction(content) {
    const matches = AgentUtils.extractMatches(content, 'decisions', 80);
    if (matches.length > 0) {
      const context = matches[0].context;
      return AgentUtils.normalizeAction(context.replace(matches[0].match, 'decided'));
    }
    return AgentUtils.normalizeAction(content.substring(0, 50));
  }

  /**
   * Extract insight-specific actions
   */
  extractInsightAction(content) {
    const matches = AgentUtils.extractMatches(content, 'insights', 80);
    if (matches.length > 0) {
      const context = matches[0].context;
      return AgentUtils.normalizeAction(context.replace(matches[0].match, 'realized'));
    }
    return AgentUtils.normalizeAction(content.substring(0, 50));
  }

  /**
   * Extract question-specific actions
   */
  extractQuestionAction(content) {
    // Extract the main question topic
    const question = content.replace(/\?.*$/, '').trim();
    return AgentUtils.normalizeAction(`asked_about_${question.substring(0, 30)}`);
  }

  /**
   * Extract answer-specific actions
   */
  extractAnswerAction(content) {
    // Look for answer patterns
    const answerPatterns = [
      /yes/i, /no/i, /maybe/i, /sure/i, /definitely/i,
      /the answer is/i, /here's how/i, /you can/i
    ];
    
    for (const pattern of answerPatterns) {
      if (pattern.test(content)) {
        const match = pattern.exec(content);
        const context = content.substring(match.index, match.index + 40);
        return AgentUtils.normalizeAction(`answered_${context}`);
      }
    }
    
    return AgentUtils.normalizeAction(`provided_answer_about_${content.substring(0, 30)}`);
  }

  /**
   * Extract task-related actions
   */
  extractTaskAction(content, type) {
    const taskPatterns = [
      /task/i, /work/i, /build/i, /create/i, /implement/i,
      /fix/i, /update/i, /change/i, /add/i, /remove/i
    ];
    
    for (const pattern of taskPatterns) {
      if (pattern.test(content)) {
        const match = pattern.exec(content);
        const context = content.substring(match.index, match.index + 40);
        return AgentUtils.normalizeAction(`${type}_task_${context}`);
      }
    }
    
    return AgentUtils.normalizeAction(`${type}_task`);
  }

  /**
   * Check if content is a question
   */
  isQuestion(content) {
    return content.includes('?') || 
           /^(how|what|why|when|where|who|which|can|could|would|should|is|are|do|does|will)/i.test(content.trim());
  }

  /**
   * Check if content is an answer
   */
  isAnswer(content) {
    const answerPatterns = [
      /^yes/i, /^no/i, /^sure/i, /^definitely/i, /^maybe/i,
      /the answer is/i, /here's how/i, /you can/i, /try/i
    ];
    return answerPatterns.some(pattern => pattern.test(content.trim()));
  }

  /**
   * Check if content indicates task start
   */
  isTaskStart(content) {
    const startPatterns = [
      /let's start/i, /beginning/i, /starting to/i, /going to/i,
      /will build/i, /will create/i, /first step/i
    ];
    return startPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content indicates task completion
   */
  isTaskComplete(content) {
    const completePatterns = [
      /completed/i, /finished/i, /done/i, /ready/i,
      /successfully/i, /works/i, /fixed/i, /solved/i
    ];
    return completePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Extract speaker from message
   */
  extractSpeaker(message) {
    if (message.role) return message.role;
    if (message.author) return message.author;
    if (message.user) return message.user;
    if (message.speaker) return message.speaker;
    return 'unknown';
  }

  /**
   * Remove duplicate or very similar events
   */
  deduplicateEvents(events) {
    const uniqueEvents = [];
    const seen = new Set();

    events.forEach(event => {
      // Create a key based on type and normalized action
      const key = `${event.type}:${event.action}`;
      
      // Check for temporal proximity (events within 1 minute are considered duplicates)
      const isTemporalDuplicate = uniqueEvents.some(existing => {
        const timeDiff = Math.abs(new Date(event.timestamp) - new Date(existing.timestamp));
        return existing.type === event.type && 
               existing.action === event.action && 
               timeDiff < 60000; // 1 minute
      });

      if (!seen.has(key) && !isTemporalDuplicate) {
        seen.add(key);
        uniqueEvents.push(event);
      }
    });

    return uniqueEvents;
  }

  /**
   * Generate flow sequence from key events
   */
  generateFlowSequence(keyEvents) {
    return keyEvents.map(event => ({
      action: event.action,
      type: event.type,
      speaker: event.speaker,
      timestamp: event.timestamp
    }));
  }

  /**
   * Format flow for AICF output
   */
  formatFlow(flowSequence) {
    if (flowSequence.length === 0) {
      return 'no_significant_events';
    }

    // Create pipe-delimited flow sequence
    const flowActions = flowSequence.map(item => item.action).join('|');
    
    // If too long, truncate and add indicator
    const maxLength = 500;
    if (flowActions.length > maxLength) {
      return flowActions.substring(0, maxLength - 10) + '|truncated';
    }

    return flowActions;
  }
}

module.exports = { ConversationParserAgent };