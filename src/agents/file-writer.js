const fs = require('fs').promises;
const path = require('path');
const { AgentUtils } = require('./agent-utils');

/**
 * FileWriterAgent - Writes updates to both .aicf and .ai formats
 * Handles dual-format output for AI-optimized and human-readable formats
 */
class FileWriterAgent {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.options = options;
  }

  /**
   * Write structured data to both AICF and AI formats
   * @param {Object} sections - Processed sections from all agents
   * @param {Object} metadata - Conversation metadata
   * @returns {Object} Write operation results
   */
  async write(sections, metadata) {
    try {
      const results = {
        filesUpdated: [],
        aicfContent: null,
        markdownContent: null,
        status: 'success'
      };

      // Write AICF format (AI-optimized)
      const aicfResult = await this.writeAICF(sections, metadata);
      if (aicfResult.success) {
        results.filesUpdated.push(aicfResult.filePath);
        results.aicfContent = aicfResult.content;
      }

      // Write human-readable format updates
      const markdownResult = await this.writeMarkdown(sections, metadata);
      if (markdownResult.success) {
        results.filesUpdated.push(...markdownResult.filesUpdated);
        results.markdownContent = markdownResult.content;
      }

      return results;

    } catch (error) {
      return {
        filesUpdated: [],
        status: 'error',
        error: error.message,
        aicfContent: null,
        markdownContent: null
      };
    }
  }

  /**
   * Write AICF format (AI-optimized pipe-delimited format)
   * @param {Object} sections - Processed sections
   * @param {Object} metadata - Conversation metadata
   * @returns {Object} Write result
   */
  async writeAICF(sections, metadata) {
    try {
      const aicfPath = path.join(this.projectRoot, '.aicf');
      const conversationsFile = path.join(aicfPath, 'conversations.aicf');

      // Ensure .aicf directory exists
      await this.ensureDirectoryExists(aicfPath);

      // Format AICF content
      const aicfContent = this.formatAICF(sections, metadata);

      // Append to conversations file (checkpoint-based)
      await this.appendToFile(conversationsFile, aicfContent);

      return {
        success: true,
        filePath: conversationsFile,
        content: aicfContent
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        filePath: null,
        content: null
      };
    }
  }

  /**
   * Write human-readable markdown format updates
   * @param {Object} sections - Processed sections
   * @param {Object} metadata - Conversation metadata
   * @returns {Object} Write result
   */
  async writeMarkdown(sections, metadata) {
    try {
      const aiPath = path.join(this.projectRoot, '.ai');
      const filesUpdated = [];

      // Ensure .ai directory exists
      await this.ensureDirectoryExists(aiPath);

      // Update conversation log
      const conversationLogResult = await this.updateConversationLog(sections, metadata, aiPath);
      if (conversationLogResult.success) {
        filesUpdated.push(conversationLogResult.filePath);
      }

      // Update technical decisions if we have decisions
      if (sections.decisions && sections.decisions.content && sections.decisions.content.length > 0) {
        const decisionsResult = await this.updateTechnicalDecisions(sections.decisions, metadata, aiPath);
        if (decisionsResult.success) {
          filesUpdated.push(decisionsResult.filePath);
        }
      }

      // Update next steps if we have state information
      if (sections.state && sections.state.content) {
        const nextStepsResult = await this.updateNextSteps(sections.state, metadata, aiPath);
        if (nextStepsResult.success) {
          filesUpdated.push(nextStepsResult.filePath);
        }
      }

      return {
        success: true,
        filesUpdated: filesUpdated,
        content: 'Multiple files updated'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        filesUpdated: [],
        content: null
      };
    }
  }

  /**
   * Format content for AICF (AI-native format)
   * @param {Object} sections - All agent sections
   * @param {Object} metadata - Conversation metadata
   * @returns {string} Formatted AICF content
   */
  formatAICF(sections, metadata) {
    const lines = [];

    // Conversation header
    lines.push(`@CONVERSATION:${metadata.sessionId}-CP${metadata.checkpointNumber}`);
    lines.push(`timestamp_start=${metadata.startTime || metadata.timestamp}`);
    lines.push(`timestamp_end=${metadata.timestamp}`);
    lines.push(`messages=${metadata.messageCount || 0}`);
    lines.push(`tokens=${metadata.tokenCount || 0}`);
    lines.push('');

    // @FLOW section
    if (sections.flow && sections.flow.content) {
      lines.push('@FLOW');
      lines.push(sections.flow.content);
      lines.push('');
    }

    // @INSIGHTS section
    if (sections.insights && sections.insights.content && sections.insights.content.length > 0) {
      lines.push('@INSIGHTS');
      sections.insights.content.forEach(insight => {
        const insightLine = [
          insight.insight || 'unknown',
          insight.category || 'GENERAL',
          insight.importance || 'MEDIUM',
          insight.confidence || 'MEDIUM'
        ].join('|');
        lines.push(insightLine);
      });
      lines.push('');
    }

    // @DECISIONS section
    if (sections.decisions && sections.decisions.content && sections.decisions.content.length > 0) {
      lines.push('@DECISIONS');
      sections.decisions.content.forEach(decision => {
        const decisionLine = [
          decision.decision || 'unknown',
          decision.reasoning || 'unclear',
          `IMPACT:${decision.impact || 'MEDIUM'}`,
          `CONF:${decision.confidence || 'MEDIUM'}`
        ].join('|');
        lines.push(decisionLine);
      });
      lines.push('');
    }

    // @STATE section
    if (sections.state && sections.state.content) {
      lines.push('@STATE');
      const state = sections.state.content;
      Object.entries(state).forEach(([key, value]) => {
        if (typeof value === 'object') {
          lines.push(`${key}=${JSON.stringify(value)}`);
        } else {
          lines.push(`${key}=${value}`);
        }
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Update conversation log in markdown format
   * @param {Object} sections - All sections
   * @param {Object} metadata - Conversation metadata
   * @param {string} aiPath - Path to .ai directory
   * @returns {Object} Update result
   */
  async updateConversationLog(sections, metadata, aiPath) {
    try {
      const conversationLogPath = path.join(aiPath, 'conversation-log.md');
      const date = new Date(metadata.timestamp).toISOString().split('T')[0];
      const sessionId = metadata.sessionId || 'unknown';
      const checkpointNumber = metadata.checkpointNumber || 0;

      // Create conversation entry
      const entry = this.formatConversationEntry(sections, metadata, date, sessionId, checkpointNumber);

      // Append to conversation log
      await this.appendToFile(conversationLogPath, entry);

      return {
        success: true,
        filePath: conversationLogPath
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        filePath: null
      };
    }
  }

  /**
   * Format conversation log entry
   * @param {Object} sections - All sections
   * @param {Object} metadata - Conversation metadata
   * @param {string} date - Date string
   * @param {string} sessionId - Session ID
   * @param {number} checkpointNumber - Checkpoint number
   * @returns {string} Formatted entry
   */
  formatConversationEntry(sections, metadata, date, sessionId, checkpointNumber) {
    const lines = [];

    lines.push(`\n**${date} - ${sessionId} Checkpoint ${checkpointNumber}:**\n`);

    // Add working status (only if meaningful data exists)
    if (sections.state && sections.state.content && sections.state.content.working_on && 
        sections.state.content.working_on !== 'unknown' && sections.state.content.working_on !== undefined) {
      lines.push(`- 🔄 **Working on:** ${sections.state.content.working_on}`);
    }

    // Add key insights
    if (sections.insights && sections.insights.content && sections.insights.content.length > 0) {
      lines.push('- 💡 **Key insights:**');
      sections.insights.content.slice(0, 3).forEach(insight => {
        lines.push(`  - ${insight.insight}`);
      });
    }

    // Add decisions
    if (sections.decisions && sections.decisions.content && sections.decisions.content.length > 0) {
      lines.push('- 📋 **Decisions:**');
      sections.decisions.content.slice(0, 2).forEach(decision => {
        lines.push(`  - ${decision.decision} (${decision.impact})`);
      });
    }

    // Add progress
    if (sections.state && sections.state.content && sections.state.content.progress) {
      const progress = sections.state.content.progress;
      if (progress.score > 0) {
        lines.push(`- 📈 **Progress:** ${progress.completed_tasks}/${progress.total_tasks} tasks (${progress.score}%)`);
      }
    }

    // Add blockers (only if meaningful data exists)
    if (sections.state && sections.state.content && sections.state.content.blockers && 
        sections.state.content.blockers !== 'none' && sections.state.content.blockers !== undefined) {
      lines.push(`- 🚫 **Blockers:** ${sections.state.content.blockers}`);
    }

    // Add next action (only if meaningful data exists)
    if (sections.state && sections.state.content && sections.state.content.next_action && 
        sections.state.content.next_action !== 'to_be_determined' && sections.state.content.next_action !== undefined) {
      lines.push(`- ⏭️ **Next:** ${sections.state.content.next_action}`);
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Update technical decisions file
   * @param {Object} decisions - Decisions section
   * @param {Object} metadata - Conversation metadata
   * @param {string} aiPath - Path to .ai directory
   * @returns {Object} Update result
   */
  async updateTechnicalDecisions(decisions, metadata, aiPath) {
    try {
      const decisionsPath = path.join(aiPath, 'technical-decisions.md');
      const date = new Date(metadata.timestamp).toISOString().split('T')[0];

      // Create decisions entries
      const entries = [];
      decisions.content.forEach(decision => {
        if (decision.impact === 'CRITICAL' || decision.impact === 'HIGH') {
          entries.push(this.formatDecisionEntry(decision, date, metadata));
        }
      });

      if (entries.length > 0) {
        const content = `\n## Decisions from ${date} (${metadata.sessionId})\n\n` + entries.join('\n');
        await this.appendToFile(decisionsPath, content);
      }

      return {
        success: true,
        filePath: decisionsPath
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        filePath: null
      };
    }
  }

  /**
   * Format decision entry for markdown
   * @param {Object} decision - Decision object
   * @param {string} date - Date string
   * @param {Object} metadata - Conversation metadata
   * @returns {string} Formatted decision entry
   */
  formatDecisionEntry(decision, date, metadata) {
    const lines = [];
    
    lines.push(`### ${decision.decision}`);
    lines.push(`**Impact:** ${decision.impact} | **Category:** ${decision.category} | **Confidence:** ${decision.confidence}`);
    lines.push('');
    lines.push(`**Reasoning:** ${decision.reasoning}`);
    
    if (decision.alternatives && decision.alternatives.length > 0) {
      lines.push('');
      lines.push('**Alternatives considered:**');
      decision.alternatives.forEach(alt => {
        lines.push(`- ${alt}`);
      });
    }
    
    lines.push('');
    return lines.join('\n');
  }

  /**
   * Update next steps file
   * @param {Object} state - State section
   * @param {Object} metadata - Conversation metadata
   * @param {string} aiPath - Path to .ai directory
   * @returns {Object} Update result
   */
  async updateNextSteps(state, metadata, aiPath) {
    try {
      const nextStepsPath = path.join(aiPath, 'next-steps.md');
      const date = new Date(metadata.timestamp).toISOString().split('T')[0];
      
      // Read existing content to find the right section to update
      let existingContent = '';
      try {
        existingContent = await fs.readFile(nextStepsPath, 'utf-8');
      } catch (error) {
        // File doesn't exist yet, will create
      }

      // Create next steps entry
      const entry = this.formatNextStepsEntry(state.content, date, metadata);
      
      // Find or create "Recently Completed" section and add entry
      let updatedContent;
      if (existingContent.includes('## ✅ Recently Completed')) {
        // Insert after the "Recently Completed" header
        updatedContent = existingContent.replace(
          '## ✅ Recently Completed (Last 2 Weeks)',
          `## ✅ Recently Completed (Last 2 Weeks)\n${entry}`
        );
      } else {
        // Add the entry at the beginning
        updatedContent = entry + '\n' + existingContent;
      }

      await fs.writeFile(nextStepsPath, updatedContent);

      return {
        success: true,
        filePath: nextStepsPath
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        filePath: null
      };
    }
  }

  /**
   * Format next steps entry
   * @param {Object} state - State content
   * @param {string} date - Date string
   * @param {Object} metadata - Conversation metadata
   * @returns {string} Formatted next steps entry
   */
  formatNextStepsEntry(state, date, metadata) {
    const lines = [];
    
    lines.push(`\n**${date} - ${metadata.sessionId} Checkpoint ${metadata.checkpointNumber}:**\n`);
    
    if (state.working_on !== 'unknown') {
      lines.push(`- ✅ **Progressed on** ${state.working_on}`);
    }
    
    if (state.progress && state.progress.completed_tasks > 0) {
      lines.push(`- ✅ **Completed** ${state.progress.completed_tasks} tasks`);
    }
    
    if (state.session_status === 'completed_tasks') {
      lines.push(`- ✅ **Session completed** with tasks finished`);
    }
    
    lines.push('');
    return lines.join('\n');
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Append content to file
   * @param {string} filePath - File path
   * @param {string} content - Content to append
   */
  async appendToFile(filePath, content) {
    try {
      await fs.appendFile(filePath, content);
    } catch (error) {
      // If file doesn't exist, create it
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, content);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {boolean} True if exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { FileWriterAgent };