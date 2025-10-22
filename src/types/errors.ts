/**
 * Error type definitions
 * Phase 2: TypeScript rewrite - October 2025
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * File operation error
 */
export class FileOperationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('FILE_OPERATION_ERROR', message, details);
    this.name = 'FileOperationError';
  }
}

/**
 * Conversation parsing error
 */
export class ConversationParsingError extends AppError {
  constructor(message: string, details?: unknown) {
    super('CONVERSATION_PARSING_ERROR', message, details);
    this.name = 'ConversationParsingError';
  }
}

/**
 * Extraction error
 */
export class ExtractionError extends AppError {
  constructor(message: string, details?: unknown) {
    super('EXTRACTION_ERROR', message, details);
    this.name = 'ExtractionError';
  }
}

/**
 * Platform detection error
 */
export class PlatformDetectionError extends AppError {
  constructor(message: string, details?: unknown) {
    super('PLATFORM_DETECTION_ERROR', message, details);
    this.name = 'PlatformDetectionError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}
