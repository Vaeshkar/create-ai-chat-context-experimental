const { AgentUtils } = require('./agent-utils');

/**
 * ConversationParserAgent - INTELLIGENT processor of complete JSON conversations
 * Creates meaningful flow descriptions for AICF format from full context
 */
class ConversationParserAgent {
  constructor(
