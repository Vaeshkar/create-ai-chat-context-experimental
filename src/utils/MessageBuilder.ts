/**
 * Message Builder
 * Consistent message creation across all parsers
 * October 2025
 */

import { randomUUID } from 'crypto';
import type { Message } from '../types/index.js';

export interface MessageCreateOptions {
  id?: string;
  conversationId: string;
  timestamp?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  prefix?: string; // For auto-generated IDs
  index?: number; // For auto-generated IDs
}

/**
 * Build messages consistently
 */
export class MessageBuilder {
  /**
   * Create a message with standard structure
   */
  static create(options: MessageCreateOptions): Message {
    return {
      id: options.id || this.generateId(options.prefix, options.index),
      conversationId: options.conversationId,
      timestamp: options.timestamp || new Date().toISOString(),
      role: options.role,
      content: options.content,
      ...(options.metadata && { metadata: options.metadata }),
    };
  }

  /**
   * Add or merge metadata to a message
   */
  static withMetadata(message: Message, metadata: Record<string, unknown>): Message {
    return {
      ...message,
      metadata: {
        ...message.metadata,
        ...metadata,
      },
    };
  }

  /**
   * Generate consistent ID
   */
  static generateId(prefix?: string, index?: number): string {
    if (prefix && index !== undefined) {
      return `${prefix}-${index}`;
    }
    if (prefix) {
      return `${prefix}-${randomUUID()}`;
    }
    return randomUUID();
  }

  /**
   * Create message with platform metadata
   */
  static createWithPlatform(
    options: MessageCreateOptions & {
      platform: string;
      extractedFrom: string;
      messageType: 'user_request' | 'ai_response';
      rawLength?: number;
    }
  ): Message {
    const metadata: Record<string, unknown> = {
      platform: options.platform,
      extractedFrom: options.extractedFrom,
      messageType: options.messageType,
      ...(options.rawLength && { rawLength: options.rawLength }),
      ...options.metadata,
    };

    return this.create({
      ...options,
      metadata,
    });
  }
}

