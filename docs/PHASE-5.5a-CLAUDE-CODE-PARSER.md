# Phase 5.5a: Claude Code (CLI) Parser Implementation

**Date:** October 22, 2025  
**Status:** Ready to Implement  
**Goal:** Parse JSONL files from Claude Code CLI

---

## 🎯 What We're Building

A parser that reads Claude Code (CLI) session files and extracts conversations into our standard `Message[]` format.

**Input:** JSONL file from `~/.claude/projects/{project}/{session-id}.jsonl`  
**Output:** `Message[]` with full metadata

---

## 📋 Implementation Plan

### Step 1: Create ClaudeCliParser Class

**File:** `src/parsers/ClaudeCliParser.ts`

```typescript
import { Result, Ok, Err } from '../types/result.js';
import { Message } from '../types/conversation.js';

export interface ClaudeCliMessage {
  type: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  uuid?: string;
  sessionId?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
  thinking?: string;
  metadata?: {
    gitBranch?: string;
    workingDirectory?: string;
    version?: string;
  };
}

export class ClaudeCliParser {
  /**
   * Parse JSONL content from Claude Code session file
   */
  parse(jsonlContent: string, sessionId: string): Result<Message[]> {
    try {
      const messages: Message[] = [];
      const lines = jsonlContent.split('\n').filter(line => line.trim());
      
      let messageIndex = 0;
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as ClaudeCliMessage;
          
          // Skip non-message types
          if (data.type !== 'message') continue;
          
          // Extract content
          const content = this.extractContent(data.content);
          if (!content || content.length === 0) continue;
          
          // Create message
          messages.push({
            id: data.uuid || `claude-cli-${messageIndex}`,
            conversationId: sessionId,
            timestamp: data.timestamp || new Date().toISOString(),
            role: data.role === 'assistant' ? 'assistant' : 'user',
            content,
            metadata: {
              extractedFrom: 'claude-cli-jsonl',
              rawLength: data.content.length,
              messageType: data.role === 'assistant' ? 'ai_response' : 'user_request',
              platform: 'claude-cli',
              tokenUsage: data.tokenUsage,
              thinking: data.thinking,
              gitBranch: data.metadata?.gitBranch,
              workingDirectory: data.metadata?.workingDirectory,
            },
          });
          
          messageIndex++;
        } catch (lineError) {
          // Skip malformed lines
          continue;
        }
      }
      
      return Ok(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to parse Claude CLI JSONL: ${message}`));
    }
  }
  
  /**
   * Extract content from Claude CLI message
   */
  private extractContent(content: string | any): string {
    if (typeof content === 'string') {
      return content.trim();
    }
    
    if (typeof content === 'object' && content !== null) {
      // Handle structured content
      if (content.text) return content.text;
      if (content.message) return content.message;
      return JSON.stringify(content);
    }
    
    return '';
  }
}
```

### Step 2: Create ClaudeCliWatcher Class

**File:** `src/watchers/ClaudeCliWatcher.ts`

```typescript
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, expandUser } from 'path';
import { Result, Ok, Err } from '../types/result.js';
import { Message } from '../types/conversation.js';
import { ClaudeCliParser } from '../parsers/ClaudeCliParser.js';

export class ClaudeCliWatcher {
  private parser = new ClaudeCliParser();
  private projectsPath: string;
  
  constructor() {
    // Expand ~ to home directory
    this.projectsPath = expandUser('~/.claude/projects');
  }
  
  /**
   * Check if Claude CLI is available
   */
  isAvailable(): boolean {
    return existsSync(this.projectsPath);
  }
  
  /**
   * Get all Claude CLI sessions for a project
   */
  async getProjectSessions(projectPath: string): Promise<Result<Message[]>> {
    try {
      const projectDir = join(this.projectsPath, projectPath);
      
      if (!existsSync(projectDir)) {
        return Err(new Error(`Project directory not found: ${projectDir}`));
      }
      
      const files = readdirSync(projectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      const allMessages: Message[] = [];
      
      for (const file of jsonlFiles) {
        const filePath = join(projectDir, file);
        const sessionId = file.replace('.jsonl', '');
        
        try {
          const content = readFileSync(filePath, 'utf-8');
          const result = this.parser.parse(content, sessionId);
          
          if (result.ok) {
            allMessages.push(...result.value);
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      return Ok(allMessages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get Claude CLI sessions: ${message}`));
    }
  }
  
  /**
   * Get latest session for a project
   */
  async getLatestSession(projectPath: string): Promise<Result<Message[]>> {
    try {
      const projectDir = join(this.projectsPath, projectPath);
      
      if (!existsSync(projectDir)) {
        return Err(new Error(`Project directory not found: ${projectDir}`));
      }
      
      const files = readdirSync(projectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      if (jsonlFiles.length === 0) {
        return Ok([]);
      }
      
      // Get most recent file
      const latestFile = jsonlFiles.sort().pop()!;
      const filePath = join(projectDir, latestFile);
      const sessionId = latestFile.replace('.jsonl', '');
      
      const content = readFileSync(filePath, 'utf-8');
      return this.parser.parse(content, sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return Err(new Error(`Failed to get latest Claude CLI session: ${message}`));
    }
  }
}
```

### Step 3: Create Tests

**File:** `src/parsers/ClaudeCliParser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ClaudeCliParser } from './ClaudeCliParser.js';

describe('ClaudeCliParser', () => {
  const parser = new ClaudeCliParser();
  
  it('should parse valid JSONL content', () => {
    const jsonl = `{"type":"message","role":"user","content":"Hello","timestamp":"2025-10-22T10:00:00Z","uuid":"msg-1"}
{"type":"message","role":"assistant","content":"Hi there!","timestamp":"2025-10-22T10:00:01Z","uuid":"msg-2"}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value).toHaveLength(2);
    expect(result.value[0].role).toBe('user');
    expect(result.value[1].role).toBe('assistant');
  });
  
  it('should skip non-message types', () => {
    const jsonl = `{"type":"metadata","data":"..."}
{"type":"message","role":"user","content":"Hello","timestamp":"2025-10-22T10:00:00Z"}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value).toHaveLength(1);
  });
  
  it('should handle token usage metadata', () => {
    const jsonl = `{"type":"message","role":"assistant","content":"Response","tokenUsage":{"input":100,"output":50}}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value[0].metadata?.tokenUsage).toEqual({ input: 100, output: 50 });
  });
  
  it('should handle thinking blocks', () => {
    const jsonl = `{"type":"message","role":"assistant","content":"Response","thinking":"Let me think..."}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value[0].metadata?.thinking).toBe('Let me think...');
  });
  
  it('should handle git branch and working directory', () => {
    const jsonl = `{"type":"message","role":"user","content":"Hello","metadata":{"gitBranch":"main","workingDirectory":"/path/to/project"}}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value[0].metadata?.gitBranch).toBe('main');
    expect(result.value[0].metadata?.workingDirectory).toBe('/path/to/project');
  });
  
  it('should skip empty lines', () => {
    const jsonl = `{"type":"message","role":"user","content":"Hello"}

{"type":"message","role":"assistant","content":"Hi"}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value).toHaveLength(2);
  });
  
  it('should handle malformed JSON lines gracefully', () => {
    const jsonl = `{"type":"message","role":"user","content":"Hello"}
{invalid json}
{"type":"message","role":"assistant","content":"Hi"}`;
    
    const result = parser.parse(jsonl, 'session-123');
    
    expect(result.ok).toBe(true);
    expect(result.value).toHaveLength(2); // Skips malformed line
  });
});
```

---

## 🚀 Implementation Steps

1. **Create ClaudeCliParser.ts** - Parse JSONL format
2. **Create ClaudeCliWatcher.ts** - Watch for new sessions
3. **Create tests** - Comprehensive test coverage
4. **Integrate into watcher** - Add to main watcher loop
5. **Update config** - Add claude-cli to watcher config
6. **Test with real data** - Use your actual session file

---

## 📊 Expected Output

After parsing your session file:
```
Session: afd5bf86-45b7-4554-bdc5-176d1161e230
Messages: 104 lines
├── User messages: ~52
├── Assistant messages: ~52
├── Token usage tracked: ✅
├── Thinking blocks: ✅
├── Git branch: main
└── Working directory: /Users/leeuwen/Programming/create-ai-chat-context-experimental
```

---

## ✅ Ready to Start?

Should I implement Phase 5.5a now?

