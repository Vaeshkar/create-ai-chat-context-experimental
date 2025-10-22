/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Extraction result type definitions
 * Phase 2: TypeScript rewrite - October 2025
 */

/**
 * User intent extracted from conversation
 * FULL content, not truncated
 */
export interface UserIntent {
  timestamp: string;
  intent: string; // ✅ FULL content, not truncated
  inferredFrom: 'conversation_summary' | 'individual_message';
  confidence: 'high' | 'medium' | 'low';
  messageIndex: number;
}

/**
 * AI action extracted from conversation
 * FULL content, not truncated
 */
export interface AIAction {
  type: 'augment_ai_response' | 'augment_agent_action';
  timestamp: string;
  details: string; // ✅ FULL content, not truncated
  source: 'conversation_summary' | 'augment_leveldb';
  messageIndex?: number;
}

/**
 * Technical work extracted from conversation
 * FULL content, not truncated
 */
export interface TechnicalWork {
  timestamp: string;
  work: string; // ✅ FULL content, not truncated
  type: 'technical_conversation' | 'agent_automation';
  source: 'conversation_summary' | 'augment';
  lineIndex?: number;
}

/**
 * Decision extracted from conversation
 */
export interface Decision {
  timestamp: string;
  decision: string;
  context: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Conversation flow tracking
 */
export interface ConversationFlow {
  sequence: string[]; // Array of message types in order
  turns: number; // Number of user-AI exchanges
  dominantRole: 'user' | 'assistant' | 'balanced';
}

/**
 * Working state extracted from conversation
 */
export interface WorkingState {
  currentTask: string;
  blockers: string[];
  nextAction: string;
  lastUpdate: string;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  userIntents: UserIntent[];
  aiActions: AIAction[];
  technicalWork: TechnicalWork[];
  decisions: Decision[];
  flow: ConversationFlow;
  workingState: WorkingState;
}
