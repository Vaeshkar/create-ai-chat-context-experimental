/**
 * Session Dump Processor - Handles rich structured session dumps
 * 
 * Processes our detailed JSON session dumps and extracts:
 * - technical_work -> technical-context.aicf
 * - decisions -> decisions.aicf  
 * - insights -> various .aicf files based on content
 * - user_inputs/ai_responses -> conversation-memory.aicf
 */

const fs = require('fs');
const path = require('path');

class SessionDumpProcessor {
  constructor() {
    this.name = 'SessionDumpProcessor';
    this.version = '1.0.0';
    
    // File routing based on content type
    this.routes = {
      technical_work: '.aicf/technical-context.aicf',
      decisions: '.aicf/decisions.aicf',
      insights: '.aicf/conversation-memory.aicf', // Context-based routing
      conversation: '.aicf/conversation-memory.aicf',
      next_steps: '.aicf/work-state.aicf'
    };
  }

  /**
   * Process a session dump JSON file
   */
  async processSessionDump(sessionDumpData, options = {}) {
    try {
      console.log(`🧠 ${this.name} processing session dump...`);

      // Parse if string, use if object
      const dump = typeof sessionDumpData === 'string' ? 
        JSON.parse(sessionDumpData) : sessionDumpData;

      const results = [];

      // Extract and route different types of content
      if (dump.conversation_dump) {
        const { conversation_dump } = dump;

        // Process technical work
        if (conversation_dump.technical_work && conversation_dump.technical_work.length > 0) {
          const techContent = this.processTechnicalWork(conversation_dump.technical_work, dump);
          await this.writeToFile(this.routes.technical_work, techContent);
          results.push('technical-context.aicf');
        }

        // Process decisions
        if (conversation_dump.decisions && conversation_dump.decisions.length > 0) {
          const decisionContent = this.processDecisions(conversation_dump.decisions, dump);
          await this.writeToFile(this.routes.decisions, decisionContent);
          results.push('decisions.aicf');
        }

        // Process insights (route based on importance)
        if (conversation_dump.insights && conversation_dump.insights.length > 0) {
          const insightResults = await this.processInsights(conversation_dump.insights, dump);
          results.push(...insightResults);
        }

        // Process conversation flow
        const conversationContent = this.processConversationFlow(conversation_dump, dump);
        await this.writeToFile(this.routes.conversation, conversationContent);
        results.push('conversation-memory.aicf');

        // Process next steps
        if (conversation_dump.next_steps && conversation_dump.next_steps.length > 0) {
          const nextStepsContent = this.processNextSteps(conversation_dump.next_steps, dump);
          await this.writeToFile(this.routes.next_steps, nextStepsContent);
          results.push('work-state.aicf');
        }
      }

      console.log(`✅ ${this.name} completed - wrote to ${results.length} files: ${results.join(', ')}`);

      return {
        success: true,
        sessionId: dump.session_id,
        filesUpdated: results
      };

    } catch (error) {
      console.error(`❌ ${this.name} error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process technical work into technical-context.aicf format
   */
  processTechnicalWork(technicalWork, dump) {
    const timestamp = dump.timestamp || new Date().toISOString();
    const sessionId = dump.session_id || 'unknown';

    let content = `@TECHNICAL:${sessionId}\n`;
    content += `timestamp=${timestamp}\n`;

    technicalWork.forEach((work, index) => {
      content += `task_${index + 1}=${work.task}|${work.details}\n`;
    });

    content += `session_trigger=${dump.trigger}\n`;
    content += `total_tasks=${technicalWork.length}\n\n`;

    return content;
  }

  /**
   * Process decisions into decisions.aicf format
   */
  processDecisions(decisions, dump) {
    const timestamp = dump.timestamp || new Date().toISOString();
    const sessionId = dump.session_id || 'unknown';

    let content = `@DECISIONS:${sessionId}\n`;
    content += `timestamp=${timestamp}\n`;

    decisions.forEach((decision, index) => {
      content += `decision_${index + 1}=${decision.decision}\n`;
      content += `rationale_${index + 1}=${decision.rationale}\n`;
      content += `impact_${index + 1}=${decision.impact}\n`;
    });

    content += `total_decisions=${decisions.length}\n\n`;

    return content;
  }

  /**
   * Process insights - route based on importance
   */
  async processInsights(insights, dump) {
    const results = [];
    const timestamp = dump.timestamp || new Date().toISOString();
    const sessionId = dump.session_id || 'unknown';

    // Group insights by importance/type
    const criticalInsights = insights.filter(i => i.importance === 'CRITICAL');
    const technicalInsights = insights.filter(i => 
      i.insight.toLowerCase().includes('technical') || 
      i.insight.toLowerCase().includes('system') ||
      i.insight.toLowerCase().includes('architecture')
    );
    const generalInsights = insights.filter(i => !criticalInsights.includes(i) && !technicalInsights.includes(i));

    // Route critical insights to conversation-memory
    if (criticalInsights.length > 0) {
      let content = `@INSIGHTS:${sessionId}:CRITICAL\n`;
      content += `timestamp=${timestamp}\n`;
      criticalInsights.forEach((insight, index) => {
        content += `critical_insight_${index + 1}=${insight.insight}|${insight.importance}\n`;
      });
      content += `\n`;
      
      await this.writeToFile(this.routes.insights, content);
      results.push('conversation-memory.aicf');
    }

    // Route technical insights to technical-context
    if (technicalInsights.length > 0) {
      let content = `@TECHNICAL_INSIGHTS:${sessionId}\n`;
      content += `timestamp=${timestamp}\n`;
      technicalInsights.forEach((insight, index) => {
        content += `tech_insight_${index + 1}=${insight.insight}|${insight.importance}\n`;
      });
      content += `\n`;
      
      await this.writeToFile(this.routes.technical_work, content);
      if (!results.includes('technical-context.aicf')) {
        results.push('technical-context.aicf');
      }
    }

    return results;
  }

  /**
   * Process conversation flow into conversation-memory.aicf
   */
  processConversationFlow(conversationDump, dump) {
    const timestamp = dump.timestamp || new Date().toISOString();
    const sessionId = dump.session_id || 'unknown';

    let content = `@CONVERSATION:${sessionId}\n`;
    content += `timestamp=${timestamp}\n`;
    content += `trigger=${dump.trigger}\n`;
    
    if (dump.trigger_details) {
      const details = dump.trigger_details;
      content += `gap_duration=${details.gap_duration || 'unknown'}\n`;
      content += `commands_since=${details.commands_since_ai_response || details.commands_since_last_dump || 0}\n`;
    }

    // Summarize user inputs
    if (conversationDump.user_inputs) {
      content += `user_inputs=${conversationDump.user_inputs.length}\n`;
      content += `user_topics=${conversationDump.user_inputs.map(u => u.context).join('|')}\n`;
    }

    // Summarize AI responses  
    if (conversationDump.ai_responses) {
      content += `ai_responses=${conversationDump.ai_responses.length}\n`;
      content += `ai_actions=${conversationDump.ai_responses.map(r => r.actions_taken ? r.actions_taken.join(',') : 'processing').join('|')}\n`;
    }

    content += `processing_status=completed\n\n`;

    return content;
  }

  /**
   * Process next steps into work-state.aicf
   */
  processNextSteps(nextSteps, dump) {
    const timestamp = dump.timestamp || new Date().toISOString();
    const sessionId = dump.session_id || 'unknown';

    let content = `@NEXT_STEPS:${sessionId}\n`;
    content += `timestamp=${timestamp}\n`;

    nextSteps.forEach((step, index) => {
      content += `step_${index + 1}=${step}\n`;
    });

    content += `total_steps=${nextSteps.length}\n`;
    content += `status=planned\n\n`;

    return content;
  }

  /**
   * Write content to target file
   */
  async writeToFile(targetPath, content) {
    const fullPath = path.join(process.cwd(), targetPath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append content to file
    fs.appendFileSync(fullPath, content);
    
    console.log(`📝 Wrote to ${targetPath}`);
  }
}

module.exports = SessionDumpProcessor;