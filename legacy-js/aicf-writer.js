#!/usr/bin/env node

/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Copyright (c) 2025 Dennis van Leeuwen
 */

/**
 * AICF Writer - Atomic, thread-safe writing to AI Context Format files
 * Handles safe appends, index updates, and data integrity
 */

const fs = require('fs');
const path = require('path');

class AICFWriter {
  constructor(aicfDir = '.aicf') {
    this.aicfDir = aicfDir;
    this.locks = new Map(); // Simple file locking mechanism
  }

  /**
   * Acquire a simple lock for a file
   */
  async acquireLock(fileName) {
    const lockKey = `${this.aicfDir}/${fileName}`;
    
    while (this.locks.has(lockKey)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.locks.set(lockKey, Date.now());
    return lockKey;
  }

  /**
   * Release a file lock
   */
  releaseLock(lockKey) {
    this.locks.delete(lockKey);
  }

  /**
   * Get next line number for a file
   */
  getNextLineNumber(filePath) {
    if (!fs.existsSync(filePath)) {
      return 1;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    if (lines.length === 0) return 1;
    
    // Extract line number from last line
    const lastLine = lines[lines.length - 1];
    const [lineNum] = lastLine.split('|', 1);
    return parseInt(lineNum) + 1;
  }

  /**
   * Append conversation data atomically
   */
  async appendConversation(conversationData) {
    const fileName = 'conversations.aicf';
    const filePath = path.join(this.aicfDir, fileName);
    const lockKey = await this.acquireLock(fileName);

    try {
      const nextLine = this.getNextLineNumber(filePath);
      const timestamp = new Date().toISOString();
      
      const lines = [
        `${nextLine}|@CONVERSATION:${conversationData.id}`,
        `${nextLine + 1}|timestamp_start=${conversationData.timestamp_start || timestamp}`,
        `${nextLine + 2}|timestamp_end=${conversationData.timestamp_end || timestamp}`,
        `${nextLine + 3}|messages=${conversationData.messages || 1}`,
        `${nextLine + 4}|tokens=${conversationData.tokens || 0}`,
        `${nextLine + 5}|`,
        `${nextLine + 6}|@STATE`
      ];

      // Add optional metadata
      let lineOffset = 7;
      if (conversationData.metadata) {
        Object.entries(conversationData.metadata).forEach(([key, value]) => {
          lines.push(`${nextLine + lineOffset}|${key}=${value}`);
          lineOffset++;
        });
      }

      // Add final separator
      lines.push(`${nextLine + lineOffset}|`);

      const content = lines.join('\n') + '\n';
      fs.appendFileSync(filePath, content);

      // Update index
      await this.updateIndex('conversations', 1);

      return { success: true, linesAdded: lines.length };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Add decision record atomically
   */
  async addDecision(decisionData) {
    const fileName = 'decisions.aicf';
    const filePath = path.join(this.aicfDir, fileName);
    const lockKey = await this.acquireLock(fileName);

    try {
      const nextLine = this.getNextLineNumber(filePath);
      const timestamp = new Date().toISOString();
      
      const lines = [
        `${nextLine}|@DECISION:${decisionData.id || 'decision_' + Date.now()}`,
        `${nextLine + 1}|timestamp=${timestamp}`,
        `${nextLine + 2}|description=${decisionData.description || ''}`,
        `${nextLine + 3}|impact=${decisionData.impact || 'MEDIUM'}`,
        `${nextLine + 4}|confidence=${decisionData.confidence || 'MEDIUM'}`,
        `${nextLine + 5}|source=${decisionData.source || 'manual'}`,
        `${nextLine + 6}|`
      ];

      const content = lines.join('\n') + '\n';
      fs.appendFileSync(filePath, content);

      // Update index
      await this.updateIndex('decisions', 1);

      return { success: true, linesAdded: lines.length };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Add insight record
   */
  async addInsight(insightData) {
    const fileName = 'technical-context.aicf';
    const filePath = path.join(this.aicfDir, fileName);
    const lockKey = await this.acquireLock(fileName);

    try {
      const nextLine = this.getNextLineNumber(filePath);
      
      // Format: @INSIGHTS insight_text|category|priority|confidence
      const line = `${nextLine}|@INSIGHTS ${insightData.text}|${insightData.category || 'GENERAL'}|${insightData.priority || 'MEDIUM'}|${insightData.confidence || 'MEDIUM'}`;
      
      fs.appendFileSync(filePath, line + '\n');

      return { success: true, linesAdded: 1 };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Update work state
   */
  async updateWorkState(workData) {
    const fileName = 'work-state.aicf';
    const filePath = path.join(this.aicfDir, fileName);
    const lockKey = await this.acquireLock(fileName);

    try {
      const nextLine = this.getNextLineNumber(filePath);
      const timestamp = new Date().toISOString();
      
      const lines = [
        `${nextLine}|@WORK:${workData.id}`,
        `${nextLine + 1}|timestamp=${timestamp}`,
        `${nextLine + 2}|status=${workData.status || 'progressing'}`,
        `${nextLine + 3}|actions=${workData.actions || 'processing'}`,
        `${nextLine + 4}|flow=${workData.flow || 'user_general_inquiry|session_completed_successfully'}`,
        `${nextLine + 5}|`
      ];

      // Add cleanup_actions if provided
      if (workData.cleanup_actions) {
        lines.splice(-1, 0, `${nextLine + 5}|cleanup_actions="""${workData.cleanup_actions}"""`);
        lines[lines.length - 1] = `${nextLine + 6}|`;
      }

      const content = lines.join('\n') + '\n';
      fs.appendFileSync(filePath, content);

      return { success: true, linesAdded: lines.length };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Update the master index file
   */
  async updateIndex(section, increment = 1) {
    const fileName = 'index.aicf';
    const filePath = path.join(this.aicfDir, fileName);
    const lockKey = await this.acquireLock(fileName);

    try {
      if (!fs.existsSync(filePath)) {
        // Create initial index
        const initialContent = [
          '1|@AICF_VERSION',
          '2|3.0.0',
          '3|',
          '4|@PROJECT',
          '5|name=create-ai-chat-context',
          '6|version=2.0.0',
          '7|language=javascript',
          '8|last_update=' + new Date().toISOString(),
          '9|',
          '10|@COUNTS',
          '11|conversations=0',
          '12|decisions=0',
          '13|tasks=0',
          '14|issues=0',
          '15|components=0',
          '16|'
        ].join('\n') + '\n';
        
        fs.writeFileSync(filePath, initialContent);
      }

      // Read current index
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Update the specific count
      const updatedLines = lines.map(line => {
        const [lineNum, data] = line.split('|', 2);
        if (data && data.startsWith(`${section}=`)) {
          const currentCount = parseInt(data.split('=')[1]) || 0;
          return `${lineNum}|${section}=${currentCount + increment}`;
        }
        return line;
      });

      // Update last_update timestamp
      const timestampUpdated = updatedLines.map(line => {
        const [lineNum, data] = line.split('|', 2);
        if (data && data.startsWith('last_update=')) {
          return `${lineNum}|last_update=${new Date().toISOString()}`;
        }
        return line;
      });

      fs.writeFileSync(filePath, timestampUpdated.join('\n'));

      return { success: true };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  /**
   * Backup a file before major operations
   */
  backupFile(fileName) {
    const filePath = path.join(this.aicfDir, fileName);
    const backupPath = path.join(this.aicfDir, `${fileName}.backup.${Date.now()}`);
    
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    }
    
    return null;
  }

  /**
   * Validate AICF file integrity
   */
  validateFile(fileName) {
    const filePath = path.join(this.aicfDir, fileName);
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File does not exist' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    let errors = [];
    let expectedLine = 1;
    
    lines.forEach((line, index) => {
      const [lineNum, data] = line.split('|', 2);
      const actualLineNum = parseInt(lineNum);
      
      if (isNaN(actualLineNum)) {
        errors.push(`Line ${index + 1}: Invalid line number format`);
      } else if (actualLineNum !== expectedLine) {
        errors.push(`Line ${index + 1}: Expected line number ${expectedLine}, got ${actualLineNum}`);
      }
      
      expectedLine = actualLineNum + 1;
    });

    return {
      valid: errors.length === 0,
      errors,
      totalLines: lines.length
    };
  }
}

// CLI usage and testing
if (require.main === module) {
  const writer = new AICFWriter();
  
  async function testWriter() {
    console.log('🔧 AICF Writer Demo\n');
    
    // Test adding a conversation
    const convResult = await writer.appendConversation({
      id: 'test-conversation-' + Date.now(),
      messages: 5,
      tokens: 250,
      metadata: {
        source: 'test',
        quality: 'high'
      }
    });
    console.log('📝 Added Conversation:', convResult);
    
    // Test adding a decision
    const decisionResult = await writer.addDecision({
      description: 'Test decision for AICF system',
      impact: 'HIGH',
      confidence: 'HIGH',
      source: 'test'
    });
    console.log('🎯 Added Decision:', decisionResult);
    
    // Test adding insight
    const insightResult = await writer.addInsight({
      text: 'AICF Writer system functioning correctly',
      category: 'TESTING',
      priority: 'HIGH',
      confidence: 'HIGH'
    });
    console.log('💡 Added Insight:', insightResult);
    
    // Validate files
    const validationResults = ['conversations.aicf', 'decisions.aicf', 'technical-context.aicf']
      .map(file => ({ file, ...writer.validateFile(file) }));
    
    console.log('\n🔍 File Validation Results:');
    validationResults.forEach(result => {
      console.log(`  ${result.file}: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
      if (!result.valid) {
        result.errors.forEach(error => console.log(`    - ${error}`));
      }
    });
  }
  
  testWriter().catch(console.error);
}

module.exports = AICFWriter;