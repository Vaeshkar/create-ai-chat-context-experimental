#!/usr/bin/env node

/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) 2025 Dennis van Leeuwen
 */

/**
 * AICF API - Complete interface for AI Context Format
 * Combines reading, writing, querying, and analytics in one powerful API
 */

const fs = require('fs');
const path = require('path');

// Import our classes
const AICFReader = require('./aicf-reader');
const AICFWriter = require('./aicf-writer');

class AICFAPI {
  constructor(aicfDir = '.aicf') {
    this.reader = new AICFReader(aicfDir);
    this.writer = new AICFWriter(aicfDir);
    this.aicfDir = aicfDir;
  }

  // ===== READING METHODS =====

  /**
   * Get comprehensive project overview
   */
  getProjectOverview() {
    const stats = this.reader.getStats();
    const lastConversations = this.reader.getLastConversations(5);
    const workState = this.reader.getCurrentWorkState();
    const recentDecisions = this.reader.getDecisionsByDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    return {
      stats,
      recent: {
        conversations: lastConversations,
        decisions: recentDecisions,
        workState
      },
      summary: this.generateProjectSummary(stats, workState, recentDecisions)
    };
  }

  /**
   * Generate AI-friendly project summary
   */
  generateProjectSummary(stats, workState, decisions) {
    const projectName = stats.project.name || 'Unknown Project';
    const conversationCount = stats.counts.conversations || 0;
    const decisionCount = stats.counts.decisions || 0;
    const lastUpdate = stats.lastUpdate;

    let summary = `Project: ${projectName}\n`;
    summary += `Status: ${stats.state.status || 'Active'}\n`;
    summary += `Conversations: ${conversationCount}, Decisions: ${decisionCount}\n`;
    summary += `Last Updated: ${lastUpdate}\n`;

    if (workState) {
      summary += `Current Work: ${workState.id} (${workState.metadata.status})\n`;
    }

    if (decisions.length > 0) {
      summary += `Recent Decisions: ${decisions.length} in last 7 days\n`;
      const highImpact = decisions.filter(d => d.metadata.impact === 'HIGH').length;
      if (highImpact > 0) {
        summary += `High Impact Decisions: ${highImpact}\n`;
      }
    }

    return summary;
  }

  /**
   * Query the AICF database with natural language
   */
  query(queryText) {
    const results = {
      conversations: [],
      decisions: [],
      insights: [],
      workStates: [],
      relevanceScore: 0
    };

    // Extract query intent
    const intent = this.parseQueryIntent(queryText);
    
    switch (intent.type) {
      case 'recent_activity':
        results.conversations = this.reader.getLastConversations(intent.count || 10);
        results.workStates = [this.reader.getCurrentWorkState()].filter(Boolean);
        results.relevanceScore = 0.9;
        break;

      case 'decisions':
        const dateRange = intent.dateRange || { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        };
        results.decisions = this.reader.getDecisionsByDate(dateRange.start, dateRange.end);
        results.relevanceScore = 0.85;
        break;

      case 'insights':
        results.insights = this.reader.getInsightsByPriority(intent.priority || 'HIGH');
        results.relevanceScore = 0.8;
        break;

      case 'search':
        const searchResults = this.reader.search(intent.term);
        searchResults.forEach(result => {
          if (result.file === 'conversations') results.conversations.push(result);
          else if (result.file === 'decisions') results.decisions.push(result);
          else if (result.file === 'technical-context') results.insights.push(result);
          else if (result.file === 'work-state') results.workStates.push(result);
        });
        results.relevanceScore = 0.7;
        break;

      default:
        // Fallback: general search
        const generalResults = this.reader.search(queryText);
        generalResults.forEach(result => {
          if (result.file === 'conversations') results.conversations.push(result);
          else if (result.file === 'decisions') results.decisions.push(result);
        });
        results.relevanceScore = 0.5;
    }

    return results;
  }

  /**
   * Parse natural language query intent
   */
  parseQueryIntent(queryText) {
    const lower = queryText.toLowerCase();
    
    if (lower.includes('recent') || lower.includes('latest') || lower.includes('last')) {
      const countMatch = lower.match(/(\d+)/);
      return {
        type: 'recent_activity',
        count: countMatch ? parseInt(countMatch[1]) : 5
      };
    }

    if (lower.includes('decision') || lower.includes('decide')) {
      return { type: 'decisions' };
    }

    if (lower.includes('insight') || lower.includes('learning')) {
      const priority = lower.includes('high') ? 'HIGH' : 
                      lower.includes('critical') ? 'CRITICAL' : 'MEDIUM';
      return { type: 'insights', priority };
    }

    if (lower.includes('search') || lower.includes('find')) {
      const searchTerm = queryText.replace(/^.*?(search|find)\s+/i, '');
      return { type: 'search', term: searchTerm };
    }

    return { type: 'general', term: queryText };
  }

  // ===== WRITING METHODS =====

  /**
   * Log a complete conversation session
   */
  async logConversation(conversationData) {
    return await this.writer.appendConversation(conversationData);
  }

  /**
   * Record a decision with full context
   */
  async recordDecision(decisionData) {
    // Auto-generate insight from decision if impact is HIGH
    if (decisionData.impact === 'HIGH' || decisionData.impact === 'CRITICAL') {
      await this.writer.addInsight({
        text: `Decision: ${decisionData.description}`,
        category: 'DECISION',
        priority: decisionData.impact,
        confidence: decisionData.confidence || 'MEDIUM'
      });
    }

    return await this.writer.addDecision(decisionData);
  }

  /**
   * Capture insight with automatic categorization
   */
  async captureInsight(text, metadata = {}) {
    // Auto-categorize based on content
    const category = this.categorizInsight(text);
    const priority = this.prioritizeInsight(text);

    return await this.writer.addInsight({
      text,
      category: metadata.category || category,
      priority: metadata.priority || priority,
      confidence: metadata.confidence || 'MEDIUM'
    });
  }

  /**
   * Auto-categorize insight based on content
   */
  categorizInsight(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('performance') || lower.includes('optimization') || lower.includes('speed')) {
      return 'PERFORMANCE';
    }
    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('auth')) {
      return 'SECURITY';
    }
    if (lower.includes('user') || lower.includes('experience') || lower.includes('interface')) {
      return 'UX';
    }
    if (lower.includes('technical') || lower.includes('architecture') || lower.includes('system')) {
      return 'TECHNICAL';
    }
    if (lower.includes('business') || lower.includes('strategy') || lower.includes('market')) {
      return 'BUSINESS';
    }
    
    return 'GENERAL';
  }

  /**
   * Auto-prioritize insight based on content
   */
  prioritizeInsight(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('breaking')) {
      return 'CRITICAL';
    }
    if (lower.includes('important') || lower.includes('significant') || lower.includes('major')) {
      return 'HIGH';
    }
    if (lower.includes('minor') || lower.includes('small') || lower.includes('note')) {
      return 'LOW';
    }
    
    return 'MEDIUM';
  }

  // ===== ANALYTICS METHODS =====

  /**
   * Generate comprehensive analytics report
   */
  generateAnalytics() {
    const stats = this.reader.getStats();
    const insights = this.reader.getInsightsByPriority('HIGH');
    const recentDecisions = this.reader.getDecisionsByDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
      overview: {
        totalConversations: parseInt(stats.counts.conversations) || 0,
        totalDecisions: parseInt(stats.counts.decisions) || 0,
        projectAge: this.calculateProjectAge(stats.project.last_update),
        activityLevel: this.calculateActivityLevel(recentDecisions)
      },
      insights: {
        highPriority: insights.length,
        categories: this.groupInsightsByCategory(insights),
        trends: this.analyzeTrends(recentDecisions)
      },
      recommendations: this.generateRecommendations(stats, insights, recentDecisions)
    };
  }

  /**
   * Calculate project age in days
   */
  calculateProjectAge(lastUpdate) {
    if (!lastUpdate) return 0;
    const then = new Date(lastUpdate);
    const now = new Date();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate activity level based on recent decisions
   */
  calculateActivityLevel(decisions) {
    if (decisions.length === 0) return 'LOW';
    if (decisions.length >= 10) return 'HIGH';
    if (decisions.length >= 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Group insights by category for analytics
   */
  groupInsightsByCategory(insights) {
    const categories = {};
    insights.forEach(insight => {
      const category = insight.category || 'GENERAL';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  /**
   * Analyze trends in decisions and insights
   */
  analyzeTrends(decisions) {
    const trends = {
      decisionVelocity: decisions.length, // decisions per month
      impactDistribution: {},
      confidenceLevel: 0
    };

    decisions.forEach(decision => {
      const impact = decision.metadata.impact || 'MEDIUM';
      trends.impactDistribution[impact] = (trends.impactDistribution[impact] || 0) + 1;
    });

    // Calculate average confidence
    const confidenceLevels = decisions
      .map(d => d.metadata.confidence)
      .filter(Boolean);
      
    if (confidenceLevels.length > 0) {
      const confidenceScore = confidenceLevels.reduce((sum, level) => {
        return sum + (level === 'HIGH' ? 3 : level === 'MEDIUM' ? 2 : 1);
      }, 0);
      trends.confidenceLevel = confidenceScore / confidenceLevels.length;
    }

    return trends;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(stats, insights, decisions) {
    const recommendations = [];

    // Based on activity level
    if (decisions.length === 0) {
      recommendations.push({
        type: 'ACTIVITY',
        priority: 'MEDIUM',
        text: 'Consider logging more decisions to improve project tracking'
      });
    }

    // Based on insights
    if (insights.length < 5) {
      recommendations.push({
        type: 'INSIGHTS',
        priority: 'LOW',
        text: 'Capture more high-priority insights to improve project intelligence'
      });
    }

    // Based on decision confidence
    const lowConfidenceDecisions = decisions.filter(d => d.metadata.confidence === 'LOW');
    if (lowConfidenceDecisions.length > decisions.length * 0.5) {
      recommendations.push({
        type: 'QUALITY',
        priority: 'HIGH',
        text: 'High number of low-confidence decisions detected - consider additional validation'
      });
    }

    return recommendations;
  }

  // ===== UTILITY METHODS =====

  /**
   * Export AICF data to different formats
   */
  exportData(format = 'json') {
    const overview = this.getProjectOverview();
    const analytics = this.generateAnalytics();

    const exportData = {
      timestamp: new Date().toISOString(),
      overview,
      analytics,
      raw: {
        conversations: this.reader.getLastConversations(100),
        decisions: this.reader.getDecisionsByDate(new Date(0)), // All decisions
        insights: this.reader.getInsightsByPriority('ALL')
      }
    };

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      
      case 'markdown':
        return this.convertToMarkdown(exportData);
      
      case 'csv':
        return this.convertToCSV(exportData);
      
      default:
        return exportData;
    }
  }

  /**
   * Convert data to markdown format
   */
  convertToMarkdown(data) {
    let markdown = `# AICF Export Report\n\n`;
    markdown += `**Generated:** ${data.timestamp}\n\n`;
    markdown += `## Project Overview\n\n`;
    markdown += data.overview.summary + '\n\n';
    markdown += `## Analytics\n\n`;
    markdown += `- Total Conversations: ${data.analytics.overview.totalConversations}\n`;
    markdown += `- Total Decisions: ${data.analytics.overview.totalDecisions}\n`;
    markdown += `- Activity Level: ${data.analytics.overview.activityLevel}\n`;
    markdown += `- High Priority Insights: ${data.analytics.insights.highPriority}\n\n`;
    
    if (data.analytics.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      data.analytics.recommendations.forEach(rec => {
        markdown += `- **${rec.type}** (${rec.priority}): ${rec.text}\n`;
      });
    }

    return markdown;
  }

  /**
   * Health check for AICF system
   */
  healthCheck() {
    const health = {
      status: 'healthy',
      issues: [],
      metrics: {}
    };

    // Check file integrity
    ['index.aicf', 'conversations.aicf', 'decisions.aicf', 'work-state.aicf', 'technical-context.aicf']
      .forEach(fileName => {
        const validation = this.writer.validateFile(fileName);
        health.metrics[fileName] = {
          exists: validation.valid !== false || validation.error !== 'File does not exist',
          valid: validation.valid,
          lines: validation.totalLines || 0
        };
        
        if (!validation.valid && validation.error !== 'File does not exist') {
          health.issues.push(`${fileName}: ${validation.error || 'Validation failed'}`);
          health.status = 'degraded';
        }
      });

    // Check for data consistency
    const stats = this.reader.getStats();
    if (!stats.project.name) {
      health.issues.push('Missing project name in index');
      health.status = 'degraded';
    }

    return health;
  }
}

// CLI usage
if (require.main === module) {
  const api = new AICFAPI();
  
  console.log('🚀 AICF API Demo\n');
  
  // Health check
  const health = api.healthCheck();
  console.log('🏥 Health Check:', health.status);
  if (health.issues.length > 0) {
    console.log('   Issues:', health.issues);
  }
  console.log('');
  
  // Project overview
  const overview = api.getProjectOverview();
  console.log('📊 Project Overview:');
  console.log(overview.summary);
  console.log('');
  
  // Analytics
  const analytics = api.generateAnalytics();
  console.log('📈 Analytics:', analytics.overview);
  console.log('');
  
  // Query examples
  console.log('🔍 Query Examples:');
  console.log('Recent activity:', api.query('show me recent activity').relevanceScore);
  console.log('Decisions:', api.query('what decisions were made').relevanceScore);
  console.log('');
  
  // Export sample
  console.log('📤 Export capability: Available in JSON, Markdown, CSV');
}

module.exports = AICFAPI;