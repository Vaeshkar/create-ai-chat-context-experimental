/**
 * Markdown Updater Agent
 * Reads directly from AI terminal SQLite database and updates .ai/ markdown files
 * Extracts full conversation data for human-readable documentation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MarkdownUpdater {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.aiDir = '.ai';
    this.terminalDbPath = path.join(os.homedir(), 'Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite');
    this.processedFile = '.terminal-processed-conversations.json';
  }

  /**
   * Update all .md files based on Warp SQLite database
   */
  async updateAllMarkdownFiles() {
    console.log('🔄 Updating .ai/ markdown files from terminal SQLite database...');

    const results = {
      updated: [],
      skipped: [],
      errors: []
    };

    try {
      // Get processed conversations to determine what to include
      const processedConversations = this.getProcessedConversations();
      
      if (processedConversations.length === 0) {
        console.log('⚠️ No processed conversations found. Run warp-auto-processor first.');
        return results;
      }

      // Get full conversation data from SQLite
      const conversationsData = await this.getConversationsFromSQLite(processedConversations);
      
      // Update each markdown file
      const filesToUpdate = [
        'conversation-log.md',
        'technical-decisions.md', 
        'next-steps.md',
        'known-issues.md'
      ];

      for (const mdFile of filesToUpdate) {
        try {
          await this.updateMarkdownFileFromSQLite(mdFile, conversationsData);
          results.updated.push(mdFile);
        } catch (error) {
          console.error(`❌ Error updating ${mdFile}:`, error.message);
          results.errors.push(`${mdFile}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('❌ Error accessing Warp database:', error.message);
      results.errors.push(`Database access: ${error.message}`);
    }

    // Summary
    console.log(`\n📊 Markdown update summary:`);
    console.log(`   ✅ Updated: ${results.updated.length} files`);
    console.log(`   ⏭️  Skipped: ${results.skipped.length} files`);
    console.log(`   ❌ Errors: ${results.errors.length} files`);

    if (results.updated.length > 0) {
      console.log(`\n📝 Updated files:`);
      results.updated.forEach(file => console.log(`   - .ai/${file}`));
    }

    return results;
  }

  /**
   * Get processed conversations from tracking file
   */
  getProcessedConversations() {
    try {
      if (fs.existsSync(this.processedFile)) {
        return JSON.parse(fs.readFileSync(this.processedFile, 'utf-8'));
      }
    } catch (error) {
      console.log('⚠️ Could not load processed conversations list');
    }
    return [];
  }

  /**
   * Get full conversation data from Warp SQLite database
   */
  async getConversationsFromSQLite(conversationIds) {
    const Database = require('better-sqlite3');
    const db = new Database(this.terminalDbPath, { readonly: true });
    
    const conversations = [];
    
    for (const conversationId of conversationIds.slice(0, 5)) { // Recent 5
      try {
        // Get conversation metadata
        const conversation = db.prepare(`
          SELECT 
            conversation_id,
            last_modified_at
          FROM agent_conversations 
          WHERE conversation_id = ?
        `).get(conversationId);

        if (!conversation) continue;

        // Get all queries for this conversation
        const messages = db.prepare(`
          SELECT 
            id,
            exchange_id,
            input,
            start_ts,
            model_id,
            working_directory,
            output_status
          FROM ai_queries 
          WHERE conversation_id = ?
          ORDER BY start_ts ASC
        `).all(conversationId);

        conversations.push({
          id: conversationId,
          ...conversation,
          created_at: messages.length > 0 ? messages[0].start_ts : conversation.last_modified_at,
          messages: messages || [],
          messageCount: messages.length
        });

      } catch (error) {
        console.error(`Error processing conversation ${conversationId}:`, error.message);
      }
    }
    
    db.close();
    return conversations;
  }

  /**
   * Update a markdown file from SQLite conversation data
   */
  async updateMarkdownFileFromSQLite(mdFile, conversationsData) {
    const mdPath = path.join(this.aiDir, mdFile);
    
    let newContent;
    switch (mdFile) {
      case 'conversation-log.md':
        newContent = this.updateConversationLogFromSQLite(conversationsData, mdPath);
        break;
      case 'technical-decisions.md':
        newContent = this.updateTechnicalDecisionsFromSQLite(conversationsData, mdPath);
        break;
      case 'next-steps.md':
        newContent = this.updateNextStepsFromSQLite(conversationsData, mdPath);
        break;
      case 'known-issues.md':
        newContent = this.updateKnownIssuesFromSQLite(conversationsData, mdPath);
        break;
      default:
        console.log(`⚠️ No handler for ${mdFile}, skipping`);
        return;
    }

    if (newContent) {
      fs.writeFileSync(mdPath, newContent, 'utf-8');
      if (this.verbose) {
        console.log(`✅ Updated ${mdPath}`);
      }
    }
  }

  /**
   * Update conversation-log.md from SQLite data
   */
  updateConversationLogFromSQLite(conversationsData, mdPath) {
    if (conversationsData.length === 0) return null;

    // Read existing file to preserve structure
    let existingContent = '';
    if (fs.existsSync(mdPath)) {
      existingContent = fs.readFileSync(mdPath, 'utf-8');
    }

    // Find where to insert new entries - PRESERVE EXISTING HISTORY!
    const historyMarker = '## 📋 CHAT HISTORY (Most Recent First)';
    const templateMarker = '## Template for New Entries';
    
    let beforeHistory = '';
    let existingHistory = '';
    let afterTemplate = '';
    
    if (existingContent.includes(historyMarker)) {
      beforeHistory = existingContent.split(historyMarker)[0] + historyMarker + '\n\n---\n\n';
      
      // CRITICAL FIX: Extract and preserve existing conversation history
      const historySection = existingContent.split(historyMarker)[1];
      if (historySection && existingContent.includes(templateMarker)) {
        existingHistory = historySection.split(templateMarker)[0];
        afterTemplate = '\n\n---\n\n' + existingContent.split(templateMarker).slice(1).join(templateMarker);
      } else {
        // No template marker, everything after history marker is history
        existingHistory = historySection || '';
      }
    } else {
      // Use template if no existing structure
      beforeHistory = this.getConversationLogTemplate().split(historyMarker)[0] + historyMarker + '\n\n---\n\n';
      afterTemplate = '\n\n---\n\n' + this.getConversationLogTemplate().split(templateMarker).slice(1).join(templateMarker);
    }
    
    // Apply memory decay for better human readability
    const processedConversations = this.applyMemoryDecayToConversations(conversationsData);
    
    // Generate entries from processed SQLite data
    const newEntries = processedConversations.map(conv => this.formatConversationEntryFromSQLite(conv)).join('\n\n---\n\n');
    
    // CRITICAL FIX: PREPEND new entries to existing history (don't replace it!)
    return beforeHistory + newEntries + (existingHistory ? '\n\n---\n\n' + existingHistory : '') + afterTemplate;
  }

  /**
   * Apply memory decay strategy for human-readable markdown
   */
  applyMemoryDecayToConversations(conversations) {
    const now = new Date();
    
    return conversations.map(conv => {
      const convDate = new Date(conv.last_modified_at);
      const ageInDays = Math.floor((now - convDate) / (1000 * 60 * 60 * 24));
      
      // Apply different detail levels based on age
      return {
        ...conv,
        ageInDays,
        detailLevel: this.getDetailLevel(ageInDays)
      };
    });
  }

  /**
   * Get detail level based on conversation age
   */
  getDetailLevel(ageInDays) {
    if (ageInDays <= 7) return 'FULL';        // Last week: Full detail
    if (ageInDays <= 30) return 'SUMMARY';    // Last month: Key points only  
    if (ageInDays <= 90) return 'BRIEF';      // Last quarter: One-line summary
    return 'MINIMAL';                         // Older: Just title and date
  }

  /**
   * Format conversation entry using smart analysis
   */
  formatConversationEntryFromSQLite(conv) {
    const ConversationAnalyzer = require('./conversation-analyzer');
    const analyzer = new ConversationAnalyzer();
    
    // Analyze the conversation to extract meaningful content
    const analysis = analyzer.analyzeConversation(conv);
    const date = new Date(conv.last_modified_at).toISOString().split('T')[0];
    const detailLevel = conv.detailLevel || 'FULL';
    
    // Handle minimal entries for very old conversations
    if (detailLevel === 'MINIMAL') {
      return `## Chat ${analysis.shortId} - ${date} - ${conv.ageInDays}d ago\n\n**Summary:** ${analyzer.summarizeText(analysis.summary, 80)}\n`;
    }
    
    // Handle brief entries for old conversations
    if (detailLevel === 'BRIEF') {
      return `## Chat ${analysis.shortId} - ${date} - AI Terminal Session\n\n### Overview\n\n${analyzer.summarizeText(analysis.summary, 120)}\n\n### Key Points\n\n- **Duration:** ${Math.round(analysis.timespan.duration / (1000 * 60))} minutes, ${analysis.messageCount} messages\n- **Main Topics:** ${analysis.accomplishments.slice(0, 2).map(a => analyzer.summarizeText(a.description, 60)).join(', ')}\n`;
    }
    
    // Handle summary entries for month-old conversations (reduced detail)
    if (detailLevel === 'SUMMARY') {
      let entry = `## Chat ${analysis.shortId} - ${date} - AI Terminal Session\n\n`;
      entry += `### Overview\n\n${analysis.summary}\n\n`;
      
      // Only most important sections for SUMMARY level
      if (analysis.accomplishments.length > 0) {
        entry += `### What We Accomplished\n\n`;
        const formattedAccomplishments = analyzer.formatForDisplay(analysis.accomplishments, 2);
        entry += formattedAccomplishments.join('\n') + '\n\n';
      }
      
      if (analysis.decisions.length > 0) {
        entry += `### Key Decisions\n\n`;
        const formattedDecisions = analyzer.formatForDisplay(analysis.decisions, 2);
        entry += formattedDecisions.join('\n') + '\n\n';
      }
      
      // Skip Technologies and detailed session info for SUMMARY level
      entry += `### Session Details\n\n`;
      entry += `- **Duration:** ${Math.round(analysis.timespan.duration / (1000 * 60))} minutes, ${analysis.messageCount} messages\n`;
      
      return entry;
    }
    
    let entry = `## Chat ${analysis.shortId} - ${date} - AI Terminal Session\n\n`;
    
    // High-level summary
    entry += `### Overview\n\n`;
    entry += `${analysis.summary}\n\n`;
    
    // Accomplishments - topic summary
    entry += `### What We Accomplished\n\n`;
    if (analysis.accomplishments.length > 0) {
      const topicSummary = this.createTopicSummary(analysis.accomplishments, 'accomplishments');
      entry += topicSummary;
    } else {
      entry += `- Development session with ${conv.messageCount} messages`;
    }
    
    // Decisions - topic summary (if any significant ones found)
    if (analysis.decisions.length > 0) {
      entry += `\n\n### Key Decisions\n\n`;
      const topicSummary = this.createTopicSummary(analysis.decisions, 'decisions');
      entry += topicSummary;
    }
    
    // Problems/Solutions - topic summary (if any found)
    if (analysis.problems.length > 0) {
      entry += `\n\n### Problems & Solutions\n\n`;
      const topicSummary = this.createTopicSummary(analysis.problems, 'problems');
      entry += topicSummary;
    }
    
    // Key insights - topic summary (if any found)
    if (analysis.insights.length > 0) {
      entry += `\n\n### Key Insights\n\n`;
      const topicSummary = this.createTopicSummary(analysis.insights, 'insights');
      entry += topicSummary;
    }
    
    // Technologies mentioned
    const tech = analysis.technologies;
    const hasSignificantTech = tech.files.length > 0 || tech.commands.length > 0 || tech.packages.length > 0;
    if (hasSignificantTech) {
      entry += `\n\n### Technologies & Files\n\n`;
      if (tech.files.length > 0) {
        entry += `- **Files:** ${tech.files.slice(0, 4).join(', ')}\n`;
      }
      if (tech.commands.length > 0) {
        entry += `- **Commands:** ${tech.commands.slice(0, 4).join(', ')}\n`;
      }
      if (tech.packages.length > 0) {
        entry += `- **Packages:** ${tech.packages.slice(0, 4).join(', ')}\n`;
      }
    }
    
    // Session details
    entry += `\n\n### Session Details\n\n`;
    entry += `- **Duration:** ${Math.round(analysis.timespan.duration / (1000 * 60))} minutes\n`;
    entry += `- **Messages:** ${analysis.messageCount}\n`;
    
    if (conv.messages.length > 0) {
      const models = [...new Set(conv.messages.map(m => m.model_id).filter(Boolean))];
      if (models.length > 0) {
        entry += `- **Models:** ${models.join(', ')}\n`;
      }
      
      const workingDirs = [...new Set(conv.messages.map(m => m.working_directory).filter(Boolean))];
      if (workingDirs.length > 0) {
        const projectNames = workingDirs.map(dir => {
          const parts = dir.split('/');
          return parts[parts.length - 1] || parts[parts.length - 2] || dir;
        });
        entry += `- **Projects:** ${[...new Set(projectNames)].slice(0, 3).join(', ')}\n`;
      }
    }
    
    entry += `- **ID:** ${conv.id}\n`;
    
    // Next steps - summarized
    entry += `\n\n### Suggested Next Steps\n\n`;
    const summarizedSteps = analysis.nextSteps.map(step => 
      `- ${analyzer.summarizeText(step, 120)}`
    ).slice(0, 4);
    entry += summarizedSteps.join('\n');
    
    return entry;
  }

  /**
   * Create a topic-level summary for a section
   */
  createTopicSummary(items, sectionType) {
    if (!items || items.length === 0) return '';
    
    // Extract key topics and themes
    const topics = this.extractTopicsFromItems(items, sectionType);
    
    if (topics.length === 0) {
      return `- ${items.length} ${sectionType} documented`;
    }
    
    // Create a narrative summary with more detail
    const count = items.length;
    const maxTopics = Math.min(6, topics.length); // Show up to 6 topics
    const topicList = topics.slice(0, maxTopics).join(', ');
    const hasMore = topics.length > maxTopics;
    const moreText = hasMore ? ` (+${topics.length - maxTopics} more)` : '';
    
    if (sectionType === 'accomplishments') {
      if (count === 1) {
        return `- **Primary focus:** ${topicList}`;
      } else if (count <= 2) {
        return `- **Key work:** ${topicList}`;
      } else if (count <= 4) {
        return `- **Development areas:** ${topicList}${moreText}`;
      } else {
        return `- **Major work completed:** ${topicList}${moreText} (${count} items)`;
      }
    } else if (sectionType === 'decisions') {
      if (count === 1) {
        return `- **Key decision:** ${topicList}`;
      } else if (count <= 3) {
        return `- **Main choices:** ${topicList}${moreText}`;
      } else {
        return `- **Strategic decisions:** ${topicList}${moreText} (${count} total)`;
      }
    } else if (sectionType === 'problems') {
      if (count === 1) {
        return `- **Issue resolved:** ${topicList}`;
      } else if (count <= 3) {
        return `- **Problems tackled:** ${topicList}${moreText}`;
      } else {
        return `- **Issues addressed:** ${topicList}${moreText} (${count} resolved)`;
      }
    } else if (sectionType === 'insights') {
      if (count === 1) {
        return `- **Key insight:** ${topicList}`;
      } else if (count <= 3) {
        return `- **Key learnings:** ${topicList}${moreText}`;
      } else {
        return `- **Learning areas:** ${topicList}${moreText} (${count} insights)`;
      }
    }
    
    return `- ${count} ${sectionType}: ${topicList}`;
  }

  /**
   * Extract key topics from items
   */
  extractTopicsFromItems(items, sectionType) {
    const topics = [];
    const ConversationAnalyzer = require('./conversation-analyzer');
    const analyzer = new ConversationAnalyzer();
    
    for (const item of items) {
      const description = item.description || '';
      const cleanDesc = analyzer.cleanText(description);
      
      if (!cleanDesc || cleanDesc.length < 10) continue;
      
      // Extract topic based on section type
      let topic = this.extractSingleTopic(cleanDesc, sectionType);
      if (topic && !topics.includes(topic)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  /**
   * Extract a single topic from text
   */
  extractSingleTopic(text, sectionType) {
    // Patterns to identify key topics based on section type
    const patterns = {
      accomplishments: [
        { regex: /\b(created?|built?|implemented?)\s+([\w\s\-\/\.]{3,40})/i, group: 2 },
        { regex: /\b(modified?|updated?|fixed?)\s+([\w\s\-\/\.]{3,40})/i, group: 2 },
        { regex: /\b(added?)\s+([\w\s\-]{3,40})(?:\s+(feature|component|function|support|integration|system))?/i, group: 2 },
        { regex: /\b(refactored?|restructured?|reorganized?)\s+([\w\s\-]{3,40})/i, group: 2 },
        { regex: /\b(setup|configured?)\s+([\w\s\-]{3,40})/i, group: 2 },
        { regex: /\b(deployed?|published?)\s+([\w\s\-]{3,40})/i, group: 2 }
      ],
      decisions: [
        { regex: /\b(chose|decided|selected|opted for)\s+([\w\s\-]{3,50})/i, group: 2 },
        { regex: /\binstead\s+of\s+([\w\s\-]{3,50})/i, group: 1 },
        { regex: /\bbecause\s+([\w\s\-]{5,50})(?:\.|\s|$)/i, group: 1 },
        { regex: /\b(approach|strategy|method)\s*:?\s+([\w\s\-]{3,40})/i, group: 2 }
      ],
      problems: [
        { regex: /\b(error|issue|problem|bug)\s*:?\s*([\w\s\-]{5,50})/i, group: 2 },
        { regex: /\b(fixed|resolved|solved)\s+([\w\s\-]{5,50})/i, group: 2 },
        { regex: /\bworkaround\s+(?:for\s+)?([\w\s\-]{3,50})/i, group: 1 },
        { regex: /\b(failed|failing)\s+([\w\s\-]{3,40})/i, group: 2 },
        { regex: /\bcannot\s+([\w\s\-]{5,40})/i, group: 1 }
      ],
      insights: [
        { regex: /\b(learned|discovered|realized|found)\s+([\w\s\-]{5,50})/i, group: 2 },
        { regex: /\b(important|crucial|key|essential)\s*:?\s*([\w\s\-]{5,50})/i, group: 2 },
        { regex: /\bnote\s*:?\s*([\w\s\-]{5,50})/i, group: 1 },
        { regex: /\b(understanding|insight)\s*:?\s*([\w\s\-]{5,50})/i, group: 2 }
      ]
    };
    
    const sectionPatterns = patterns[sectionType] || [];
    
    for (const pattern of sectionPatterns) {
      const match = text.match(pattern.regex);
      if (match && match[pattern.group]) {
        let topic = match[pattern.group].trim();
        // Clean up the topic
        topic = topic.replace(/\s+/g, ' ').replace(/[.,;:]$/, '');
        if (topic.length > 3 && topic.length < 50) {
          return topic;
        }
      }
    }
    
    // Fallback: extract first meaningful phrase
    const words = text.split(/\s+/).filter(w => w.length > 2 && !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(w));
    if (words.length >= 2) {
      const topic = words.slice(0, 3).join(' ');
      return topic.length < 50 ? topic : words[0];
    }
    
    return null;
  }

  /**
   * Get conversation log template
   */
  getConversationLogTemplate() {
    return `# Conversation Log

> **📝 IMPORTANT FOR AI ASSISTANTS:**
>
> - **START of session:** Read this file to see what previous chats accomplished
> - **END of session:** Add a new entry at the TOP with today's work

Track key decisions and progress from AI chat sessions.

---

## 📋 CHAT HISTORY (Most Recent First)

---

## Template for New Entries (AI-Optimized Format)

**Add this at the TOP of the "CHAT HISTORY" section:**

\`\`\`markdown
## Chat #X - [Date: YYYY-MM-DD] - [Brief Topic]

### What We Did
- [Primary accomplishment]

### Key Decisions
- **[Decision]:** [Rationale]

### Next Steps
- [What should be done next]
\`\`\`

**Last Updated:** ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Update technical-decisions.md from SQLite conversation data
   */
  updateTechnicalDecisionsFromSQLite(conversationsData, mdPath) {
    let existingContent = '';
    if (fs.existsSync(mdPath)) {
      existingContent = fs.readFileSync(mdPath, 'utf-8');
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Extract technical decisions from recent conversations using smart analyzer
    const ConversationAnalyzer = require('./conversation-analyzer');
    const analyzer = new ConversationAnalyzer();
    const technicalDecisions = [];
    
    for (const conv of conversationsData.slice(0, 3)) {
      const analysis = analyzer.analyzeConversation(conv);
      for (const decision of analysis.decisions) {
        technicalDecisions.push({
          title: `${decision.type.charAt(0).toUpperCase() + decision.type.slice(1)} Decision`,
          description: decision.description,
          conversationId: conv.id.substring(0, 8),
          date: new Date(conv.last_modified_at).toISOString().split('T')[0]
        });
      }
      for (const insight of analysis.insights) {
        technicalDecisions.push({
          title: `Technical Insight`,
          description: insight.description,
          conversationId: conv.id.substring(0, 8),
          date: new Date(conv.last_modified_at).toISOString().split('T')[0]
        });
      }
    }

    if (!existingContent) {
      let content = `# Technical Decisions

Document WHY you made specific technical choices.

---

`;
      
      if (technicalDecisions.length > 0) {
        content += `## Recent Decisions & Insights\n\n`;
        for (const decision of technicalDecisions.slice(0, 5)) {
          content += `## ${decision.title} (${decision.date})\n\n`;
          content += `**Date:** ${decision.date}\n`;
          content += `**Source:** Terminal Conversation ${decision.conversationId}\n\n`;
          content += `### Description\n${decision.description}\n\n`;
          content += `### Context\nExtracted from AI terminal conversation session\n\n`;
          content += `---\n\n`;
        }
      } else {
        content += `## Recent Updates\n\n**Date:** ${today}\n**Source:** Automatic update from terminal SQLite database\n\n### Latest Technical Insights\n\n- Terminal conversation processing pipeline operational\n- SQLite data extraction working correctly\n- Markdown synchronization implemented\n\n---\n\n`;
      }
      
      content += `**Last Updated:** ${today}`;
      return content;
    }

    // Update existing file timestamp
    if (existingContent.includes('**Last Updated:**')) {
      return existingContent.replace(
        /\*\*Last Updated:\*\* .*/,
        `**Last Updated:** ${today}`
      );
    }

    return existingContent + `\n\n**Last Updated:** ${today}`;
  }

  /**
   * Update next-steps.md from SQLite conversation data
   */
  updateNextStepsFromSQLite(conversationsData, mdPath) {
    let existingContent = '';
    if (fs.existsSync(mdPath)) {
      existingContent = fs.readFileSync(mdPath, 'utf-8');
    }

    const today = new Date().toISOString().split('T')[0];

    if (!existingContent) {
      return `# Next Steps

Roadmap and priorities for your project.

---

## ✅ Recently Completed (Last 2 Weeks)

### Terminal Conversation Processing (${today})
- Implemented automatic terminal SQLite conversation extraction
- Created AI-optimized .aicf file generation pipeline  
- Added direct SQLite to markdown synchronization
- Processed ${conversationsData.length} recent conversations
- Result: Full conversation processing and documentation pipeline operational

---

## 🔥 Immediate (This Week)

- [ ] Validate conversation content extraction quality
- [ ] Test markdown file generation from SQLite data
- [ ] Ensure all conversation topics are captured correctly
- [ ] Review automated processing results

---

## 📅 Short-term (This Month)

- [ ] Optimize conversation parsing for better topic extraction
- [ ] Add more sophisticated decision detection
- [ ] Enhance markdown formatting for readability

---

**Last Updated:** ${today}`;
    }

    // Update the recently completed section
    const recentlyCompletedMarker = '## ✅ Recently Completed (Last 2 Weeks)';
    if (existingContent.includes(recentlyCompletedMarker)) {
      const parts = existingContent.split(recentlyCompletedMarker);
      const beforeSection = parts[0] + recentlyCompletedMarker;
      
      // Find the next section
      const nextSectionMatch = parts[1].match(/\n## /);
      let afterSection = '';
      if (nextSectionMatch) {
        afterSection = '\n## ' + parts[1].split('\n## ').slice(1).join('\n## ');
      }

      const newRecentlyCompleted = `

### Terminal SQLite Integration (${today})
- Direct SQLite database conversation extraction
- Enhanced markdown generation with full conversation data
- Processed ${conversationsData.length} conversations with ${conversationsData.reduce((sum, c) => sum + c.messageCount, 0)} total messages
- Result: Rich conversation documentation automatically generated
`;

      return beforeSection + newRecentlyCompleted + afterSection;
    }

    return existingContent + `\n\n**Last Updated:** ${today}`;
  }

  /**
   * Update known-issues.md from SQLite conversation data
   */
  updateKnownIssuesFromSQLite(conversationsData, mdPath) {
    let existingContent = '';
    if (fs.existsSync(mdPath)) {
      existingContent = fs.readFileSync(mdPath, 'utf-8');
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Add status update about conversation processing
    const statusUpdate = `\n\n## Status Update (${today})\n\n### Terminal Conversation Processing\n- ✅ SQLite extraction working correctly\n- ✅ Processed ${conversationsData.length} conversations successfully\n- ✅ Markdown generation operational\n- 📊 Total messages processed: ${conversationsData.reduce((sum, c) => sum + c.messageCount, 0)}\n\n`;

    // Update timestamp
    if (existingContent.includes('**Last Updated:**')) {
      const updatedContent = existingContent.replace(
        /\*\*Last Updated:\*\* .*/,
        `**Last Updated:** ${today}`
      );
      
      // Add status update before the timestamp if not already present
      if (!updatedContent.includes('Status Update')) {
        return updatedContent.replace(
          `**Last Updated:** ${today}`,
          statusUpdate + `**Last Updated:** ${today}`
        );
      }
      
      return updatedContent;
    }

    return existingContent + statusUpdate + `**Last Updated:** ${today}`;
  }

}

module.exports = MarkdownUpdater;