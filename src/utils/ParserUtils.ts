/**
 * Parser Utilities
 * Common content extraction and cleaning functions for all parsers
 * October 2025
 */

/**
 * Clean message content - unescape quotes, newlines, tabs
 */
export function cleanContent(content: string): string {
  if (!content) return '';

  return content
    .replace(/\\"/g, '"') // Unescape quotes
    .replace(/\\n/g, '\n') // Unescape newlines
    .replace(/\\t/g, '\t') // Unescape tabs
    .trim();
}

/**
 * Extract string content from string or object
 */
export function extractStringContent(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (typeof content === 'object' && content !== null) {
    // Try common property names
    if (typeof content.text === 'string') {
      return content.text.trim();
    }
    if (typeof content.message === 'string') {
      return content.message.trim();
    }
    if (typeof content.content === 'string') {
      return content.content.trim();
    }
    // Fallback: stringify
    return JSON.stringify(content);
  }

  return '';
}

/**
 * Extract content from message blocks (Claude export format)
 */
export function extractContentFromBlocks(blocks: unknown[]): string {
  if (!Array.isArray(blocks)) {
    return '';
  }

  const parts: string[] = [];

  for (const block of blocks) {
    if (typeof block !== 'object' || block === null) {
      continue;
    }

    const b = block as Record<string, unknown>;
    if (!b.data) {
      continue;
    }

    const data = String(b.data);

    switch (b.type) {
      case 'p':
        parts.push(data);
        break;
      case 'pre':
        const lang = b.language ? String(b.language) : '';
        if (lang) {
          parts.push(`\`\`\`${lang}\n${data}\n\`\`\``);
        } else {
          parts.push(`\`\`\`\n${data}\n\`\`\``);
        }
        break;
      case 'ul':
      case 'ol':
      case 'table':
        parts.push(data);
        break;
      default:
        if (data) {
          parts.push(data);
        }
    }
  }

  return parts.join('\n\n').trim();
}

/**
 * Normalize whitespace in content
 */
export function normalizeWhitespace(content: string): string {
  if (!content) return '';

  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '  ') // Convert tabs to spaces
    .replace(/  +/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Validate content is not empty
 */
export function isValidContent(content: unknown): boolean {
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  return false;
}

