const fs = require('fs').promises;
const path = require('path');
const { AgentUtils } = require('./agent-utils');

/**
 * MemoryDropOffAgent - Implements intelligent memory decay strategy
 * Manages memory hierarchy to prevent infinite growth while preserving important information
 */
class MemoryDropOffAgent {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.options = options;
    
    // Memory decay configuration
    this.decayConfig = {
      recent: 7,      // Last 7 days: Full detail
      medium: 30,     // Last 30 days: Key points only
      old: 90,        // 30-90 days: Single line summaries
      archive: 365    // 90+ days: Critical decisions only
    };
  }

  /**
   * Process memory decay for all stored conversations
   * @returns {Object} Processing results
   */
  async processMemoryDecay() {
    try {
      const aicfPath = path.join(this.projectRoot, '.aicf');
      const conversationsFile = path.join(aicfPath, 'conversations.aicf');

      // Check if conversations file exists
      if (!(await this.fileExists(conversationsFile))) {
        return {
          applied: false,
          reason: 'No conversations file found',
          itemsProcessed: 0
        };
      }

      // Read and parse existing conversations
      const rawContent = await fs.readFile(conversationsFile, 'utf-8');
      const conversations = this.parseConversations(rawContent);

      if (conversations.length === 0) {
        return {
          applied: false,
          reason: 'No conversations to process',
          itemsProcessed: 0
        };
      }

      // Apply memory decay strategy
      const processedConversations = this.applyMemoryDecay(conversations);

      // Write back compressed conversations
      const compressedContent = this.formatCompressedConversations(processedConversations);
      await fs.writeFile(conversationsFile, compressedContent);

      // Create backup of original if this is the first compression
      await this.createBackupIfNeeded(conversationsFile, rawContent);

      return {
        applied: true,
        itemsProcessed: conversations.length,
        compressionRatio: this.calculateCompressionRatio(rawContent, compressedContent),
        decayStatistics: this.calculateDecayStatistics(processedConversations)
      };

    } catch (error) {
      return {
        applied: false,
        error: error.message,
        itemsProcessed: 0
      };
    }
  }

  /**
   * Parse conversations from AICF content
   * @param {string} content - Raw AICF content
   * @returns {Array} Array of conversation objects
   */
  parseConversations(content) {
    const conversations = [];
    const lines = content.split('\n');
    let currentConversation = null;
    let currentSection = null;

    lines.forEach(line => {
      line = line.trim();
      
      if (line.startsWith('@CONVERSATION:')) {
        // Save previous conversation
        if (currentConversation) {
          conversations.push(currentConversation);
        }
        
        // Start new conversation
        currentConversation = {
          id: line.replace('@CONVERSATION:', ''),
          metadata: {},
          sections: {},
          originalContent: [],
          timestamp: null,
          ageInDays: 0
        };
        currentSection = null;
      } else if (currentConversation) {
        currentConversation.originalContent.push(line);
        
        // Parse metadata
        if (line.includes('=') && !line.startsWith('@')) {
          const [key, value] = line.split('=');
          currentConversation.metadata[key] = value;
          
          // Extract timestamp for age calculation
          if (key === 'timestamp_end') {
            currentConversation.timestamp = new Date(value);
            currentConversation.ageInDays = this.calculateAgeInDays(currentConversation.timestamp);
          }
        }
        
        // Parse sections
        if (line.startsWith('@')) {
          currentSection = line;
          currentConversation.sections[currentSection] = [];
        } else if (currentSection && line.length > 0) {
          currentConversation.sections[currentSection].push(line);
        }
      }
    });

    // Add last conversation
    if (currentConversation) {
      conversations.push(currentConversation);
    }

    return conversations;
  }

  /**
   * Apply memory decay strategy based on conversation age
   * @param {Array} conversations - Array of conversation objects
   * @returns {Array} Processed conversations with decay applied
   */
  applyMemoryDecay(conversations) {
    return conversations.map(conversation => {
      const age = conversation.ageInDays;
      
      if (age <= this.decayConfig.recent) {
        // Recent: Keep full detail
        return {
          ...conversation,
          decayLevel: 'RECENT',
          compressed: false
        };
      } else if (age <= this.decayConfig.medium) {
        // Medium: Key points only
        return {
          ...conversation,
          decayLevel: 'MEDIUM',
          compressed: true,
          compressedContent: this.compressToKeyPoints(conversation)
        };
      } else if (age <= this.decayConfig.old) {
        // Old: Single line summary
        return {
          ...conversation,
          decayLevel: 'OLD',
          compressed: true,
          compressedContent: this.compressToSingleLine(conversation)
        };
      } else {
        // Archive: Critical decisions only
        return {
          ...conversation,
          decayLevel: 'ARCHIVED',
          compressed: true,
          compressedContent: this.compressToCriticalOnly(conversation)
        };
      }
    });
  }

  /**
   * Compress conversation to key points (medium decay)
   * @param {Object} conversation - Conversation object
   * @returns {Array} Key points
   */
  compressToKeyPoints(conversation) {
    const keyPoints = [];
    
    // Add conversation header (compressed)
    keyPoints.push(`@CONVERSATION:${conversation.id}`);
    keyPoints.push(`timestamp=${conversation.metadata.timestamp_end || 'unknown'}`);
    keyPoints.push(`age=${conversation.ageInDays}d`);
    
    // Extract key decisions (HIGH/CRITICAL only)
    if (conversation.sections['@DECISIONS']) {
      const criticalDecisions = conversation.sections['@DECISIONS'].filter(line => 
        line.includes('IMPACT:CRITICAL') || line.includes('IMPACT:HIGH')
      );
      
      if (criticalDecisions.length > 0) {
        keyPoints.push('@DECISIONS_KEY');
        criticalDecisions.slice(0, 3).forEach(decision => {
          // Simplify decision format: decision|impact
          const parts = decision.split('|');
          if (parts.length >= 3) {
            keyPoints.push(`${parts[0]}|${parts[2]}`);
          }
        });
      }
    }

    // Extract key insights (HIGH/CRITICAL importance only)
    if (conversation.sections['@INSIGHTS']) {
      const criticalInsights = conversation.sections['@INSIGHTS'].filter(line =>
        line.includes('|CRITICAL|') || line.includes('|HIGH|')
      );
      
      if (criticalInsights.length > 0) {
        keyPoints.push('@INSIGHTS_KEY');
        criticalInsights.slice(0, 2).forEach(insight => {
          // Simplify insight format: insight|category
          const parts = insight.split('|');
          if (parts.length >= 2) {
            keyPoints.push(`${parts[0]}|${parts[1]}`);
          }
        });
      }
    }

    // Extract final state
    if (conversation.sections['@STATE']) {
      const workingOn = conversation.sections['@STATE'].find(line => 
        line.startsWith('working_on=')
      );
      if (workingOn) {
        keyPoints.push('@STATE_FINAL');
        keyPoints.push(workingOn);
      }
    }

    keyPoints.push(''); // Empty line separator
    return keyPoints;
  }

  /**
   * Compress conversation to single line (old decay)
   * @param {Object} conversation - Conversation object
   * @returns {Array} Single line summary
   */
  compressToSingleLine(conversation) {
    const date = conversation.timestamp ? 
      conversation.timestamp.toISOString().split('T')[0] : 'unknown';
    
    // Extract most critical decision
    let criticalDecision = 'no_decisions';
    if (conversation.sections['@DECISIONS']) {
      const critical = conversation.sections['@DECISIONS'].find(line =>
        line.includes('IMPACT:CRITICAL')
      );
      if (critical) {
        const parts = critical.split('|');
        criticalDecision = parts[0] || 'unknown_decision';
      }
    }

    // Extract final outcome
    let outcome = 'unknown';
    if (conversation.sections['@STATE']) {
      const workingOn = conversation.sections['@STATE'].find(line =>
        line.startsWith('working_on=')
      );
      if (workingOn) {
        outcome = workingOn.split('=')[1] || 'unknown';
      }
    }

    return [`${date}|${criticalDecision}|outcome:${outcome}`, ''];
  }

  /**
   * Compress to critical information only (archived decay)
   * @param {Object} conversation - Conversation object
   * @returns {Array} Critical information only
   */
  compressToCriticalOnly(conversation) {
    const criticalInfo = [];
    
    // Only keep CRITICAL impact decisions
    if (conversation.sections['@DECISIONS']) {
      const criticalDecisions = conversation.sections['@DECISIONS'].filter(line =>
        line.includes('IMPACT:CRITICAL')
      );
      
      if (criticalDecisions.length > 0) {
        const date = conversation.timestamp ? 
          conversation.timestamp.toISOString().split('T')[0] : 'archived';
        criticalInfo.push(`@ARCHIVED:${date}`);
        
        criticalDecisions.slice(0, 1).forEach(decision => {
          const parts = decision.split('|');
          if (parts.length > 0) {
            criticalInfo.push(`CRITICAL:${parts[0]}`);
          }
        });
        criticalInfo.push('');
      }
    }

    return criticalInfo;
  }

  /**
   * Calculate age in days from timestamp
   * @param {Date} timestamp - Timestamp
   * @returns {number} Age in days
   */
  calculateAgeInDays(timestamp) {
    if (!timestamp) return 999; // Very old if no timestamp
    
    const now = new Date();
    const diffTime = Math.abs(now - timestamp);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format processed conversations back to AICF format
   * @param {Array} conversations - Processed conversations
   * @returns {string} Formatted AICF content
   */
  formatCompressedConversations(conversations) {
    const lines = [];
    
    conversations.forEach(conversation => {
      if (conversation.compressed && conversation.compressedContent) {
        lines.push(...conversation.compressedContent);
      } else {
        // Keep original format for recent conversations
        lines.push(`@CONVERSATION:${conversation.id}`);
        lines.push(...conversation.originalContent);
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * Calculate compression ratio
   * @param {string} originalContent - Original content
   * @param {string} compressedContent - Compressed content
   * @returns {number} Compression ratio percentage
   */
  calculateCompressionRatio(originalContent, compressedContent) {
    const originalSize = originalContent.length;
    const compressedSize = compressedContent.length;
    
    if (originalSize === 0) return 0;
    
    const ratio = ((originalSize - compressedSize) / originalSize) * 100;
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate decay statistics
   * @param {Array} conversations - Processed conversations
   * @returns {Object} Decay statistics
   */
  calculateDecayStatistics(conversations) {
    const stats = {
      total: conversations.length,
      recent: 0,
      medium: 0,
      old: 0,
      archived: 0
    };

    conversations.forEach(conv => {
      stats[conv.decayLevel.toLowerCase()]++;
    });

    return stats;
  }

  /**
   * Create backup of original content if needed
   * @param {string} filePath - Original file path
   * @param {string} content - Original content
   */
  async createBackupIfNeeded(filePath, content) {
    const backupPath = filePath + '.backup';
    
    // Only create backup if it doesn't exist
    if (!(await this.fileExists(backupPath))) {
      await fs.writeFile(backupPath, content);
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get memory decay statistics without applying decay
   * @returns {Object} Current memory statistics
   */
  async getMemoryStatistics() {
    try {
      const aicfPath = path.join(this.projectRoot, '.aicf');
      const conversationsFile = path.join(aicfPath, 'conversations.aicf');

      if (!(await this.fileExists(conversationsFile))) {
        return { error: 'No conversations file found' };
      }

      const rawContent = await fs.readFile(conversationsFile, 'utf-8');
      const conversations = this.parseConversations(rawContent);

      const stats = {
        totalConversations: conversations.length,
        totalSize: rawContent.length,
        ageDistribution: {},
        decayRecommendations: {}
      };

      // Calculate age distribution
      conversations.forEach(conv => {
        const age = conv.ageInDays;
        let category;
        
        if (age <= this.decayConfig.recent) category = 'recent';
        else if (age <= this.decayConfig.medium) category = 'medium';
        else if (age <= this.decayConfig.old) category = 'old';
        else category = 'archived';

        stats.ageDistribution[category] = (stats.ageDistribution[category] || 0) + 1;
      });

      // Generate recommendations
      const candidatesForDecay = conversations.filter(conv => 
        conv.ageInDays > this.decayConfig.recent
      ).length;

      stats.decayRecommendations = {
        candidatesForDecay,
        estimatedCompressionRatio: candidatesForDecay > 0 ? '60-80%' : '0%',
        recommendDecay: candidatesForDecay > 5
      };

      return stats;

    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = { MemoryDropOffAgent };