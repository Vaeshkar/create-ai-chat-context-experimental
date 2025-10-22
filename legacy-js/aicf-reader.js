#!/usr/bin/env node

/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) 2025 Dennis van Leeuwen
 */

/**
 * AICF Reader - Programmatic access to AI Context Format files
 * Provides efficient O(1) and semantic access to compressed conversation data
 */

const fs = require('fs');
const path = require('path');

class AICFReader {
  constructor(aicfDir = '.aicf') {
    this.aicfDir = aicfDir;
    this.indexCache = null;
    this.lastIndexRead = 0;
  }

  /**
   * Read and cache the master index
   */
  getIndex() {
    const indexPath = path.join(this.aicfDir, 'index.aicf');
    const stats = fs.statSync(indexPath);
    
    // Cache index if not changed
    if (this.indexCache && stats.mtimeMs <= this.lastIndexRead) {
      return this.indexCache;
    }

    const content = fs.readFileSync(indexPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    const index = {};
    let currentSection = null;
    
    lines.forEach(line => {
      const [lineNum, data] = line.split('|', 2);
      if (!data) return;
      
      if (data.startsWith('@')) {
        currentSection = data.substring(1);
        index[currentSection] = {};
      } else if (currentSection && data.includes('=')) {
        const [key, value] = data.split('=', 2);
        index[currentSection][key] = value;
      }
    });

    this.indexCache = index;
    this.lastIndexRead = stats.mtimeMs;
    return index;
  }

  /**
   * Get the last N conversations
   */
  getLastConversations(count = 5) {
    const conversationsPath = path.join(this.aicfDir, 'conversations.aicf');
    if (!fs.existsSync(conversationsPath)) return [];

    const content = fs.readFileSync(conversationsPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    const conversations = [];
    let currentConv = null;
    
    // Parse from end to get most recent first
    for (let i = lines.length - 1; i >= 0 && conversations.length < count; i--) {
      const [lineNum, data] = lines[i].split('|', 2);
      if (!data) continue;
      
      if (data.startsWith('@CONVERSATION:')) {
        if (currentConv) {
          conversations.unshift(currentConv);
        }
        currentConv = {
          id: data.substring(14),
          line: parseInt(lineNum),
          metadata: {}
        };
      } else if (currentConv && data.includes('=')) {
        const [key, value] = data.split('=', 2);
        currentConv.metadata[key] = value;
      }
    }
    
    if (currentConv && conversations.length < count) {
      conversations.unshift(currentConv);
    }
    
    return conversations;
  }

  /**
   * Get decisions by date range
   */
  getDecisionsByDate(startDate, endDate = new Date()) {
    const decisionsPath = path.join(this.aicfDir, 'decisions.aicf');
    if (!fs.existsSync(decisionsPath)) return [];

    const content = fs.readFileSync(decisionsPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    const decisions = [];
    let currentDecision = null;
    
    lines.forEach(line => {
      const [lineNum, data] = line.split('|', 2);
      if (!data) return;
      
      if (data.startsWith('@DECISION:')) {
        if (currentDecision) {
          decisions.push(currentDecision);
        }
        currentDecision = {
          id: data.substring(10),
          line: parseInt(lineNum),
          metadata: {}
        };
      } else if (currentDecision && data.includes('=')) {
        const [key, value] = data.split('=', 2);
        currentDecision.metadata[key] = value;
      }
    });
    
    if (currentDecision) {
      decisions.push(currentDecision);
    }
    
    // Filter by date range
    return decisions.filter(decision => {
      const timestamp = decision.metadata.timestamp;
      if (!timestamp) return false;
      
      const decisionDate = new Date(timestamp);
      return decisionDate >= startDate && decisionDate <= endDate;
    });
  }

  /**
   * Get current work state
   */
  getCurrentWorkState() {
    const workPath = path.join(this.aicfDir, 'work-state.aicf');
    if (!fs.existsSync(workPath)) return null;

    const content = fs.readFileSync(workPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    // Get the most recent work entry
    let currentWork = null;
    let latestTimestamp = 0;
    
    lines.forEach(line => {
      const [lineNum, data] = line.split('|', 2);
      if (!data) return;
      
      if (data.startsWith('@WORK:')) {
        currentWork = {
          id: data.substring(6),
          line: parseInt(lineNum),
          metadata: {}
        };
      } else if (currentWork && data.includes('=')) {
        const [key, value] = data.split('=', 2);
        currentWork.metadata[key] = value;
        
        // Track most recent by timestamp
        if (key === 'timestamp') {
          const timestamp = new Date(value).getTime();
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
          }
        }
      }
    });
    
    return currentWork;
  }

  /**
   * Search insights by priority level
   */
  getInsightsByPriority(priority = 'HIGH') {
    const contextPath = path.join(this.aicfDir, 'technical-context.aicf');
    if (!fs.existsSync(contextPath)) return [];

    const content = fs.readFileSync(contextPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    const insights = [];
    
    lines.forEach(line => {
      const [lineNum, data] = line.split('|', 2);
      if (!data) return;
      
      if (data.startsWith('@INSIGHTS')) {
        // Parse insight data - format: insight_text|category|priority|confidence
        const parts = data.split('|');
        if (parts.length >= 4 && parts[2] === priority) {
          insights.push({
            line: parseInt(lineNum),
            text: parts[0].substring(10), // Remove @INSIGHTS
            category: parts[1],
            priority: parts[2],
            confidence: parts[3]
          });
        }
      }
    });
    
    return insights;
  }

  /**
   * Get project statistics
   */
  getStats() {
    const index = this.getIndex();
    
    return {
      project: index.PROJECT || {},
      counts: index.COUNTS || {},
      state: index.STATE || {},
      lastUpdate: index.PROJECT?.last_update || 'unknown'
    };
  }

  /**
   * Search across all files for a term
   */
  search(term, fileTypes = ['conversations', 'decisions', 'work-state', 'technical-context']) {
    const results = [];
    
    fileTypes.forEach(fileType => {
      const filePath = path.join(this.aicfDir, `${fileType}.aicf`);
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(term.toLowerCase())) {
          const [lineNum, data] = line.split('|', 2);
          results.push({
            file: fileType,
            line: parseInt(lineNum) || (index + 1),
            content: data || line,
            context: lines.slice(Math.max(0, index - 1), index + 2).join('\n')
          });
        }
      });
    });
    
    return results;
  }
}

// CLI usage
if (require.main === module) {
  const reader = new AICFReader();
  
  console.log('🔍 AICF Reader Demo\n');
  
  // Show project stats
  const stats = reader.getStats();
  console.log('📊 Project Statistics:', stats);
  console.log('');
  
  // Show last conversations
  const conversations = reader.getLastConversations(3);
  console.log('💬 Last 3 Conversations:', conversations);
  console.log('');
  
  // Show current work
  const work = reader.getCurrentWorkState();
  console.log('🔄 Current Work State:', work);
  console.log('');
  
  // Show high priority insights
  const insights = reader.getInsightsByPriority('HIGH');
  console.log('💡 High Priority Insights:', insights.length);
}

module.exports = AICFReader;