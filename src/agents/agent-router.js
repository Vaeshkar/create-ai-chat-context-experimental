/**
 * Agent Router - Distributes content to appropriate .aicf files
 * 
 * This routes different types of content to specialized .aicf files
 * instead of dumping everything into conversations.aicf
 */

class AgentRouter {
  constructor() {
    this.routes = {
      // Conversation flow and session summaries - use conversation-memory.aicf
      'conversation_flow': '.aicf/conversation-memory.aicf',
      'session_summary': '.aicf/conversation-memory.aicf',
      'user_interactions': '.aicf/conversation-memory.aicf',
      
      // Technical discoveries, architecture, system design
      'technical_insight': '.aicf/technical-context.aicf',
      'architecture_change': '.aicf/technical-context.aicf',
      'system_design': '.aicf/technical-context.aicf',
      'performance_optimization': '.aicf/technical-context.aicf',
      
      // Decisions and their reasoning
      'decision': '.aicf/decisions.aicf',
      'strategy_decision': '.aicf/decisions.aicf',
      'technical_decision': '.aicf/decisions.aicf',
      
      // Work progress, tasks, project state
      'task_progress': '.aicf/work-state.aicf',
      'project_status': '.aicf/work-state.aicf',
      'blockers': '.aicf/work-state.aicf',
      'next_actions': '.aicf/work-state.aicf',
      
      // Individual tasks and todos
      'task_created': '.aicf/tasks.aicf',
      'task_completed': '.aicf/tasks.aicf',
      'task_update': '.aicf/tasks.aicf',
      
      // Issues, bugs, problems
      'issue_discovered': '.aicf/issues.aicf',
      'bug_found': '.aicf/issues.aicf',
      'problem_identified': '.aicf/issues.aicf',
      'issue_resolved': '.aicf/issues.aicf',
      
      // Design patterns, UI/UX decisions
      'design_decision': '.aicf/design-system.aicf',
      'ui_pattern': '.aicf/design-system.aicf',
      'style_guideline': '.aicf/design-system.aicf'
    };
    
    this.chunkTracker = new Set(); // Track processed chunks to avoid duplicates
  }
  
  /**
   * Route content to appropriate .aicf file based on content type
   */
  routeContent(contentType, content, chunkId) {
    // Prevent duplicate processing
    const contentHash = this.hashContent(content, chunkId);
    if (this.chunkTracker.has(contentHash)) {
      console.log(`Skipping duplicate content: ${contentHash}`);
      return null;
    }
    
    this.chunkTracker.add(contentHash);
    
    // Determine target file
    const targetFile = this.routes[contentType] || '.aicf/conversation-memory.aicf';
    
    return {
      targetFile,
      content,
      contentType,
      chunkId,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Analyze conversation content and classify it
   */
  classifyContent(conversationData) {
    const classifications = [];
    
    // Extract key phrases and classify
    const content = JSON.stringify(conversationData).toLowerCase();
    
    if (content.includes('decided') || content.includes('decision') || content.includes('we chose')) {
      classifications.push('decision');
    }
    
    if (content.includes('architecture') || content.includes('system') || content.includes('technical')) {
      classifications.push('technical_insight');
    }
    
    if (content.includes('task') || content.includes('todo') || content.includes('work on')) {
      classifications.push('task_progress');
    }
    
    if (content.includes('issue') || content.includes('problem') || content.includes('bug')) {
      classifications.push('issue_discovered');
    }
    
    if (content.includes('design') || content.includes('ui') || content.includes('style')) {
      classifications.push('design_decision');
    }
    
    // Default to conversation flow if no specific classification
    if (classifications.length === 0) {
      classifications.push('conversation_flow');
    }
    
    return classifications;
  }
  
  /**
   * Generate content hash for deduplication
   */
  hashContent(content, chunkId) {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const hashInput = `${chunkId}-${contentString.substring(0, 100)}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Get file allocation strategy for better token distribution
   */
  getTokenAllocationStrategy() {
    return {
      'conversation-memory.aicf': 2000, // Rich session summaries
      'technical-context.aicf': 3000,   // Detailed technical content
      'decisions.aicf': 1500,           // Decision rationale
      'work-state.aicf': 1000,          // Current work status
      'tasks.aicf': 1500,               // Task details
      'issues.aicf': 1000,              // Issue descriptions
      'design-system.aicf': 1500        // Design patterns
    };
  }
}

module.exports = AgentRouter;