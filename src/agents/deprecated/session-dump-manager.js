/**
 * Session Dump Manager - Handles JSON session dump lifecycle
 * 
 * Manages the complete lifecycle of session dumps:
 * - Storage organization 
 * - AICF extraction triggers
 * - Cleanup scheduling
 * - Human file updates for major sessions
 */

const fs = require('fs').promises;
const path = require('path');
const MemoryLifecycleManager = require('./memory-lifecycle-manager');

class SessionDumpManager {
  constructor(options = {}) {
    this.name = 'SessionDumpManager';
    this.version = '1.0.0';
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Storage paths
    this.paths = {
      sessionDumps: path.join(this.projectRoot, '.meta/session-dumps'),
      archive: path.join(this.projectRoot, '.meta/session-dumps/archive'),
      aicf: path.join(this.projectRoot, '.aicf'),
      ai: path.join(this.projectRoot, '.ai')
    };
    
    // Initialize memory lifecycle manager
    this.lifecycleManager = new MemoryLifecycleManager(options);
  }

  /**
   * Process new session dump
   */
  async processNewSessionDump(sessionDumpPath) {
    try {
      console.log(`📥 ${this.name} processing: ${sessionDumpPath}`);

      // Read and validate session dump
      const sessionData = await this.readSessionDump(sessionDumpPath);
      if (!sessionData) {
        return { success: false, error: 'Invalid session dump' };
      }

      // Determine processing strategy
      const strategy = this.determineProcessingStrategy(sessionData);
      console.log(`📊 Processing strategy: ${strategy.type} (significance: ${strategy.significance})`);

      const results = [];

      // 1. Extract to AICF files (always)
      const aicfResult = await this.extractToAICF(sessionData);
      if (aicfResult.success) {
        results.push(`AICF: ${aicfResult.filesUpdated.length} files`);
      }

      // 2. Update human files (if major session)
      if (strategy.updateHumanFiles) {
        const humanResult = await this.updateHumanFiles(sessionData);
        if (humanResult.success) {
          results.push(`Human: ${humanResult.filesUpdated.length} files`);
        }
      }

      // 3. Schedule cleanup (if needed) 
      if (await this.shouldScheduleCleanup()) {
        await this.scheduleCleanup();
        results.push('Cleanup: scheduled');
      }

      console.log(`✅ ${this.name} completed: ${results.join(', ')}`);

      return {
        success: true,
        strategy,
        results,
        sessionId: sessionData.session_id
      };

    } catch (error) {
      console.error(`❌ ${this.name} error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Read and validate session dump
   */
  async readSessionDump(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Basic validation
      if (!data.session_id || !data.conversation_dump) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error reading session dump: ${error.message}`);
      return null;
    }
  }

  /**
   * Determine processing strategy based on session content
   */
  determineProcessingStrategy(sessionData) {
    const { conversation_dump, processing_info } = sessionData;
    
    // Check significance markers
    const significance = processing_info?.session_significance || 'NORMAL';
    const userInputs = conversation_dump?.user_inputs?.length || 0;
    const decisions = conversation_dump?.decisions?.length || 0;
    const technicalWork = conversation_dump?.technical_work?.length || 0;
    const insights = conversation_dump?.insights?.length || 0;

    // Determine if major session (should update human files)
    const isMajorSession = 
      significance === 'CRITICAL' ||
      significance === 'CRITICAL_ARCHITECTURAL_BREAKTHROUGH' ||
      decisions >= 3 ||
      technicalWork >= 5 ||
      userInputs >= 6 ||
      insights >= 4;

    return {
      type: isMajorSession ? 'MAJOR_SESSION' : 'REGULAR_SESSION',
      significance,
      updateHumanFiles: isMajorSession,
      metrics: { userInputs, decisions, technicalWork, insights }
    };
  }

  /**
   * Extract key information to AICF files
   */
  async extractToAICF(sessionData) {
    try {
      // Use existing SessionDumpProcessor
      const SessionDumpProcessor = require('./session-dump-processor');
      const processor = new SessionDumpProcessor();
      
      const result = await processor.processSessionDump(sessionData);
      
      return {
        success: result.success,
        filesUpdated: result.filesUpdated || [],
        sessionId: result.sessionId
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update human files for major sessions
   */
  async updateHumanFiles(sessionData) {
    try {
      const filesUpdated = [];
      const { session_id, conversation_dump } = sessionData;

      // Update conversation-log.md (always for major sessions)
      await this.updateConversationLog(sessionData);
      filesUpdated.push('conversation-log.md');

      // Update technical-decisions.md (if decisions present)
      if (conversation_dump.decisions?.length > 0) {
        await this.updateTechnicalDecisions(sessionData);
        filesUpdated.push('technical-decisions.md');
      }

      return { success: true, filesUpdated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update conversation-log.md with major session
   */
  async updateConversationLog(sessionData) {
    const logPath = path.join(this.paths.ai, 'conversation-log.md');
    const { session_id, timestamp, conversation_dump } = sessionData;
    
    const date = new Date(timestamp).toISOString().split('T')[0];
    
    // Create entry
    const entry = `
### ${session_id}

**Date:** ${date}
**Type:** SYSTEM BREAKTHROUGH
**Status:** COMPLETED ✅

**Key Accomplishments:**

${conversation_dump.technical_work?.map(work => `- ✅ **${work.task}** - ${work.details}`).join('\n') || ''}

**Major Decisions:**

${conversation_dump.decisions?.map(decision => `- **${decision.decision}**: ${decision.rationale} (Impact: ${decision.impact})`).join('\n') || ''}

**Critical Insights:**

${conversation_dump.insights?.filter(i => i.importance === 'CRITICAL').map(insight => `- **${insight.insight}** (${insight.importance})`).join('\n') || ''}

**Next Steps:**

${conversation_dump.next_steps?.map(step => `- ${step}`).join('\n') || ''}

---

`;

    // Read existing file
    let existingContent = '';
    try {
      existingContent = await fs.readFile(logPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, will create new
    }

    // Find insertion point (after "Most Recent First" header)
    const insertPoint = existingContent.indexOf('---\n\n### ');
    if (insertPoint > -1) {
      const newContent = existingContent.slice(0, insertPoint + 5) + entry + existingContent.slice(insertPoint + 5);
      await fs.writeFile(logPath, newContent);
    } else {
      // Fallback: append to end
      await fs.appendFile(logPath, entry);
    }
  }

  /**
   * Update technical-decisions.md with session decisions
   */
  async updateTechnicalDecisions(sessionData) {
    // Implementation would update technical-decisions.md
    // For now, just log
    console.log('📝 Would update technical-decisions.md');
  }

  /**
   * Check if cleanup should be scheduled
   */
  async shouldScheduleCleanup() {
    try {
      const files = await fs.readdir(this.paths.sessionDumps);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      // Schedule cleanup if more than 10 session dumps
      return jsonFiles.length > 10;
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule cleanup for old session dumps
   */
  async scheduleCleanup() {
    console.log('📅 Running memory lifecycle maintenance...');
    return await this.lifecycleManager.processLifecycle();
  }

  /**
   * Get session dump statistics
   */
  async getStatistics() {
    try {
      const files = await fs.readdir(this.paths.sessionDumps);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      let totalSize = 0;
      for (const file of jsonFiles) {
        const stats = await fs.stat(path.join(this.paths.sessionDumps, file));
        totalSize += stats.size;
      }

      return {
        totalDumps: jsonFiles.length,
        totalSizeBytes: totalSize,
        estimatedTokens: Math.ceil(totalSize / 4)
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = SessionDumpManager;