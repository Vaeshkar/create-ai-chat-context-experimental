import { Database } from 'sqlite3';
import { promisify } from 'util';
import { join, homedir } from 'path';

interface WarpConversation {
  id: number;
  conversationId: string;
  activeTaskId?: string;
  conversationData: any; // JSON parsed
  lastModifiedAt: string;
  size: number;
}

interface WarpAiQuery {
  id: number;
  exchangeId: string;
  conversationId: string;
  startTs: string;
  input: string;
  workingDirectory?: string;
  outputStatus: string;
  modelId: string;
  planningModelId: string;
  codingModelId: string;
}

interface WarpAiBlock {
  id: number;
  blockId: string;
  conversationId?: string;
  content: string;
  blockType: string;
  createdAt: string;
}

interface ParsedConversation {
  conversationId: string;
  totalMessages: number;
  totalCharacters: number;
  startTime: Date;
  lastModified: Date;
  participants: string[];
  messages: ConversationMessage[];
  queries: WarpAiQuery[];
  workingDirectories: string[];
  summary: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export class WarpConversationParser {
  private readonly dbPath: string;

  constructor() {
    this.dbPath = join(
      homedir(),
      'Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite'
    );
  }

  async parseConversations(): Promise<ParsedConversation[]> {
    return new Promise((resolve, reject) => {
      const db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open Warp database: ${err.message}`));
          return;
        }

        const conversations: ParsedConversation[] = [];

        // Get all conversations with their metadata
        db.all(
          `SELECT id, conversation_id, active_task_id, conversation_data, 
                  last_modified_at, length(conversation_data) as size 
           FROM agent_conversations 
           ORDER BY last_modified_at DESC`,
          async (err, rows: any[]) => {
            if (err) {
              reject(err);
              return;
            }

            for (const row of rows) {
              try {
                const conversation = await this.parseConversationData(db, row);
                conversations.push(conversation);
              } catch (error) {
                console.warn(`Failed to parse conversation ${row.conversation_id}:`, error);
              }
            }

            db.close();
            resolve(conversations);
          }
        );
      });
    });
  }

  private async parseConversationData(db: Database, row: any): Promise<ParsedConversation> {
    const conversationId = row.conversation_id;
    let conversationData: any = {};
    
    try {
      conversationData = JSON.parse(row.conversation_data);
    } catch (error) {
      console.warn(`Invalid JSON in conversation ${conversationId}`);
    }

    // Get related AI queries
    const queries = await this.getAiQueries(db, conversationId);
    
    // Parse messages from conversation data
    const messages = this.extractMessages(conversationData);
    
    // Extract working directories from queries
    const workingDirectories = [...new Set(
      queries
        .map(q => q.workingDirectory)
        .filter(Boolean) as string[]
    )];

    // Generate summary
    const summary = this.generateSummary(messages, queries);

    return {
      conversationId,
      totalMessages: messages.length,
      totalCharacters: row.size,
      startTime: queries.length > 0 ? new Date(queries[0].startTs) : new Date(row.last_modified_at),
      lastModified: new Date(row.last_modified_at),
      participants: this.extractParticipants(messages),
      messages,
      queries,
      workingDirectories,
      summary
    };
  }

  private async getAiQueries(db: Database, conversationId: string): Promise<WarpAiQuery[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, exchange_id, conversation_id, start_ts, input, 
                working_directory, output_status, model_id, 
                planning_model_id, coding_model_id 
         FROM ai_queries 
         WHERE conversation_id = ? 
         ORDER BY start_ts ASC`,
        [conversationId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const queries: WarpAiQuery[] = rows.map(row => ({
            id: row.id,
            exchangeId: row.exchange_id,
            conversationId: row.conversation_id,
            startTs: row.start_ts,
            input: row.input,
            workingDirectory: row.working_directory,
            outputStatus: row.output_status,
            modelId: row.model_id,
            planningModelId: row.planning_model_id,
            codingModelId: row.coding_model_id
          }));

          resolve(queries);
        }
      );
    });
  }

  private extractMessages(conversationData: any): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    try {
      // Handle different conversation data structures
      if (conversationData.messages && Array.isArray(conversationData.messages)) {
        for (const msg of conversationData.messages) {
          messages.push({
            role: msg.role || 'user',
            content: msg.content || msg.text || '',
            timestamp: new Date(msg.timestamp || msg.created_at || Date.now()),
            metadata: msg
          });
        }
      } else if (conversationData.exchanges && Array.isArray(conversationData.exchanges)) {
        for (const exchange of conversationData.exchanges) {
          if (exchange.user_message) {
            messages.push({
              role: 'user',
              content: exchange.user_message,
              timestamp: new Date(exchange.timestamp || Date.now())
            });
          }
          if (exchange.assistant_message || exchange.response) {
            messages.push({
              role: 'assistant',
              content: exchange.assistant_message || exchange.response,
              timestamp: new Date(exchange.timestamp || Date.now())
            });
          }
        }
      } else {
        // Try to extract any text content
        const content = this.extractTextContent(conversationData);
        if (content) {
          messages.push({
            role: 'assistant',
            content,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.warn('Error extracting messages:', error);
    }

    return messages;
  }

  private extractTextContent(obj: any): string {
    if (typeof obj === 'string') return obj;
    if (typeof obj !== 'object' || obj === null) return '';

    let text = '';
    for (const key in obj) {
      if (key.toLowerCase().includes('content') || 
          key.toLowerCase().includes('message') || 
          key.toLowerCase().includes('text')) {
        const value = obj[key];
        if (typeof value === 'string') {
          text += value + '\n';
        }
      } else if (typeof obj[key] === 'object') {
        text += this.extractTextContent(obj[key]);
      }
    }
    return text.trim();
  }

  private extractParticipants(messages: ConversationMessage[]): string[] {
    const participants = new Set<string>();
    for (const msg of messages) {
      participants.add(msg.role);
    }
    return Array.from(participants);
  }

  private generateSummary(messages: ConversationMessage[], queries: WarpAiQuery[]): string {
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    const topics = this.extractTopics(messages);
    const directories = [...new Set(queries.map(q => q.workingDirectory).filter(Boolean))];

    return `Conversation with ${userMessages} user messages and ${assistantMessages} assistant responses. ` +
           `Topics: ${topics.join(', ')}. ` +
           (directories.length > 0 ? `Working directories: ${directories.join(', ')}` : '');
  }

  private extractTopics(messages: ConversationMessage[]): string[] {
    const topics = new Set<string>();
    const topicPatterns = [
      /\b(debug|debugging|error|fix|bug)\b/i,
      /\b(code|coding|program|script|function)\b/i,
      /\b(file|files|directory|folder)\b/i,
      /\b(install|npm|package|dependency)\b/i,
      /\b(git|commit|push|pull|branch)\b/i,
      /\b(test|testing|spec)\b/i,
      /\b(build|compile|deploy)\b/i,
      /\b(database|sql|query)\b/i,
      /\b(api|endpoint|request|response)\b/i,
      /\b(react|typescript|javascript|node)\b/i
    ];

    const topicNames = [
      'debugging', 'coding', 'files', 'dependencies', 'git', 
      'testing', 'build', 'database', 'api', 'frontend'
    ];

    for (const msg of messages) {
      for (let i = 0; i < topicPatterns.length; i++) {
        if (topicPatterns[i].test(msg.content)) {
          topics.add(topicNames[i]);
        }
      }
    }

    return Array.from(topics);
  }

  async getConversationById(conversationId: string): Promise<ParsedConversation | null> {
    const conversations = await this.parseConversations();
    return conversations.find(c => c.conversationId === conversationId) || null;
  }

  async getRecentConversations(hours: number = 24): Promise<ParsedConversation[]> {
    const conversations = await this.parseConversations();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return conversations.filter(c => c.lastModified > cutoff);
  }

  async exportConversationContext(conversationId?: string): Promise<any> {
    const conversations = conversationId 
      ? [await this.getConversationById(conversationId)].filter(Boolean)
      : await this.parseConversations();

    return {
      exportedAt: new Date().toISOString(),
      source: 'warp-conversations',
      totalConversations: conversations.length,
      conversations: conversations.map(c => ({
        ...c,
        startTime: c.startTime.toISOString(),
        lastModified: c.lastModified.toISOString(),
        messages: c.messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString()
        }))
      }))
    };
  }
}