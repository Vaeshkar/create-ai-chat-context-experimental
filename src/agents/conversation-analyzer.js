/**
 * Smart Conversation Analyzer
 * Extracts meaningful insights, decisions, and summaries from terminal conversations
 * Designed to provide actionable context for future AI sessions
 */

class ConversationAnalyzer {
  constructor() {
    // Pattern matching for common development activities
    this.patterns = {
      // Implementation patterns - More conservative limits to avoid raw data
      implementation: {
        created: /(?:created?|added?|implemented?|built?)\s+([^\n\r]{5,500})(?:\.|\n|\r|$)/gi,
        modified: /(?:updated?|modified?|changed?|edited?|fixed?)\s+([^\n\r]{5,500})(?:\.|\n|\r|$)/gi,
        removed: /(?:removed?|deleted?|cleaned up?)\s+([^\n\r]{5,500})(?:\.|\n|\r|$)/gi,
        refactored: /(?:refactored?|restructured?|reorganized?)\s+([^\n\r]{5,500})(?:\.|\n|\r|$)/gi
      },

      // Decision patterns - More conservative limits to avoid raw data
      decisions: {
        chose: /(?:chose|decided|selected|picked|opted for)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        because: /(?:because|since|due to|as)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        instead: /(?:instead of|rather than|over)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi
      },

      // Problem/solution patterns - More conservative limits to avoid raw data
      problems: {
        issue: /(?:issue|problem|bug|error)\s*:?\s*([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        fixed: /(?:fixed|resolved|solved)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        workaround: /(?:workaround|temporary fix)\s*:?\s*([^\n\r]{5,400})(?:\.|\n|\r|$)/gi
      },

      // Learning patterns - More conservative limits to avoid raw data
      insights: {
        learned: /(?:learned|discovered|found out|realized)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        important: /(?:important|crucial|critical|key|essential)\s+([^\n\r]{5,400})(?:\.|\n|\r|$)/gi,
        note: /(?:note|remember|keep in mind)\s*:?\s*([^\n\r]{5,400})(?:\.|\n|\r|$)/gi
      }
    };

    // File/tech patterns
    this.techPatterns = {
      files: /(?:file|script|component|module)\s+([a-zA-Z0-9\-_.\/]+\.[a-zA-Z0-9]+)/gi,
      commands: /(?:npm|git|node|python|pip|cargo|go|rustc)\s+([a-zA-Z0-9\-_ ]+)/gi,
      packages: /(?:installed?|added?|using)\s+([a-zA-Z0-9\-_@\/]+)/gi,
      directories: /(\/[a-zA-Z0-9\-_\.\/]+\/[a-zA-Z0-9\-_\.]*)/gi
    };
  }

  /**
   * Analyze a full conversation and extract meaningful insights
   */
  analyzeConversation(conversation) {
    const analysis = {
      id: conversation.id,
      shortId: conversation.id.substring(0, 8),
      messageCount: conversation.messageCount,
      timespan: {
        start: conversation.created_at,
        end: conversation.last_modified_at,
        duration: new Date(conversation.last_modified_at) - new Date(conversation.created_at)
      },
      summary: this.generateSummary(conversation),
      accomplishments: this.extractAccomplishments(conversation),
      decisions: this.extractDecisions(conversation),
      problems: this.extractProblems(conversation),
      insights: this.extractInsights(conversation),
      technologies: this.extractTechnologies(conversation),
      nextSteps: this.generateNextSteps(conversation)
    };

    return analysis;
  }

  /**
   * Generate a high-level summary of what happened in the conversation
   */
  generateSummary(conversation) {
    const messages = conversation.messages || [];
    if (messages.length === 0) {
      return "Empty conversation with no messages";
    }

    const workingDirs = [...new Set(messages.map(m => m.working_directory).filter(Boolean))];
    const timespan = Math.round((new Date(conversation.last_modified_at) - new Date(conversation.created_at)) / (1000 * 60));
    
    let summary = `${messages.length}-message conversation`;
    
    if (timespan > 0) {
      if (timespan < 60) {
        summary += ` over ${timespan} minutes`;
      } else {
        const hours = Math.round(timespan / 60 * 10) / 10;
        summary += ` over ${hours} hours`;
      }
    }

    if (workingDirs.length > 0) {
      const projectNames = workingDirs.map(dir => {
        const parts = dir.split('/');
        return parts[parts.length - 1] || parts[parts.length - 2] || 'project';
      });
      summary += ` in ${[...new Set(projectNames)].join(', ')}`;
    }

    // Add activity hint based on message count
    if (messages.length > 500) {
      summary += " (major development session)";
    } else if (messages.length > 100) {
      summary += " (substantial work session)";
    } else if (messages.length > 20) {
      summary += " (focused session)";
    } else {
      summary += " (brief session)";
    }

    return summary;
  }

  /**
   * Extract concrete accomplishments from the conversation
   */
  extractAccomplishments(conversation) {
    const accomplishments = [];
    const allText = this.getCombinedText(conversation);

    // Extract implementation activities
    for (const [category, pattern] of Object.entries(this.patterns.implementation)) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const accomplishment = this.cleanText(match[1]);
        if (accomplishment && accomplishment.length > 10 && this.isValidContent(accomplishment)) {
          accomplishments.push({
            type: category,
            description: accomplishment,
            category: 'implementation'
          });
        }
      }
    }

    // Deduplicate and prioritize
    return this.deduplicateAndSort(accomplishments).slice(0, 6);
  }

  /**
   * Extract decisions and their reasoning
   */
  extractDecisions(conversation) {
    const decisions = [];
    const allText = this.getCombinedText(conversation);

    for (const [category, pattern] of Object.entries(this.patterns.decisions)) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const decision = this.cleanText(match[1]);
        if (decision && decision.length > 10 && this.isValidContent(decision)) {
          decisions.push({
            type: category,
            description: decision,
            category: 'decision'
          });
        }
      }
    }

    return this.deduplicateAndSort(decisions).slice(0, 4);
  }

  /**
   * Extract problems encountered and solutions
   */
  extractProblems(conversation) {
    const problems = [];
    const allText = this.getCombinedText(conversation);

    for (const [category, pattern] of Object.entries(this.patterns.problems)) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const problem = this.cleanText(match[1]);
        if (problem && problem.length > 10 && this.isValidContent(problem)) {
          problems.push({
            type: category,
            description: problem,
            category: 'problem'
          });
        }
      }
    }

    return this.deduplicateAndSort(problems).slice(0, 4);
  }

  /**
   * Extract key insights and learnings
   */
  extractInsights(conversation) {
    const insights = [];
    const allText = this.getCombinedText(conversation);

    for (const [category, pattern] of Object.entries(this.patterns.insights)) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const insight = this.cleanText(match[1]);
        if (insight && insight.length > 10 && this.isValidContent(insight)) {
          insights.push({
            type: category,
            description: insight,
            category: 'insight'
          });
        }
      }
    }

    return this.deduplicateAndSort(insights).slice(0, 4);
  }

  /**
   * Extract technologies, files, and commands mentioned
   */
  extractTechnologies(conversation) {
    const tech = {
      files: [],
      commands: [],
      packages: [],
      directories: []
    };
    
    const allText = this.getCombinedText(conversation);

    for (const [category, pattern] of Object.entries(this.techPatterns)) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const item = match[1].trim();
        if (item && item.length > 2 && item.length < 100) {
          tech[category].push(item);
        }
      }
    }

    // Deduplicate and limit
    for (const category of Object.keys(tech)) {
      tech[category] = [...new Set(tech[category])].slice(0, 8);
    }

    return tech;
  }

  /**
   * Generate suggested next steps based on conversation content
   */
  generateNextSteps(conversation) {
    const steps = [];
    const allText = this.getCombinedText(conversation);

    // Look for unfinished items
    const todoPatterns = [
      /(?:todo|need to|should|must)\s+(.{5,5000})/gi,
      /(?:next|then|after)\s+(.{5,5000})/gi,
      /(?:will|plan to|going to)\s+(.{5,5000})/gi
    ];

    for (const pattern of todoPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const step = this.cleanText(match[1]);
        if (step && step.length > 5) {
          steps.push(step);
        }
      }
    }

    const deduped = [...new Set(steps)].slice(0, 4);
    
    // If no specific steps found, generate generic ones
    if (deduped.length === 0) {
      if (conversation.messageCount > 100) {
        deduped.push("Review and test the implemented changes");
        deduped.push("Update documentation if needed");
      } else {
        deduped.push("Continue development work");
      }
    }

    return deduped;
  }

  /**
   * Helper: Get combined text from all messages
   */
  getCombinedText(conversation) {
    const messages = conversation.messages || [];
    return messages
      .map(m => m.input || '')
      .join(' ')
      .toLowerCase();
  }

  /**
   * Helper: Clean and normalize extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    // Early filter: Reject extremely long chunks or obvious raw data dumps
    if (text.length > 10000) {
      return ''; // Skip massive data dumps entirely
    }
    
    // Reject text that looks like raw binary data, base64, or corrupted content
    const corruptedPatterns = [
      /[a-zA-Z0-9+/]{100,}/,  // Long base64-like sequences
      /[0-9a-f]{50,}/,        // Long hex sequences  
      /\w{200,}/,             // Extremely long words
      /[^\w\s.,!?;:()\-\/]{20,}/, // Long sequences of special chars
      /(file_path:[^,\s]{50,})/gi,  // Very long file paths in structured data
      /(context:|actionresult:|executionenvironment:)/gi  // Raw API response data
    ];
    
    for (const pattern of corruptedPatterns) {
      if (pattern.test(text)) {
        return ''; // Skip obviously corrupted content
      }
    }
    
    let cleaned = text
      // Handle escaped sequences first
      .replace(/\\n/g, ' ')  // \n -> space
      .replace(/\\r/g, ' ')  // \r -> space  
      .replace(/\\t/g, ' ')  // \t -> space
      .replace(/\\\\/g, '') // \\ -> empty
      // Then handle actual control characters
      .replace(/[\n\r\t]/g, ' ')
      // Remove structured data patterns that aren't human readable
      .replace(/\b\w*_path:\S+/g, '') // Remove file_path: entries
      .replace(/\b(context|actionresult|executionenvironment):[^,\s]+/gi, '') // Remove API data
      .replace(/\b[a-f0-9]{8,}/g, '') // Remove long hex strings
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Remove problematic characters but keep useful punctuation
      .replace(/[{}[\]]/g, '')
      // Clean up quotes but preserve meaningful punctuation
      .replace(/"+/g, '')
      // Remove pipe characters that might be from raw data
      .replace(/\|/g, ' ')
      // Final cleanup
      .trim();
    
    // Final length check - if still too long after cleaning, truncate intelligently
    if (cleaned.length > 1000) {
      const sentences = cleaned.split(/[.!?]+\s+/);
      if (sentences.length > 1) {
        // Keep first sentence if reasonable length
        cleaned = sentences[0].length < 300 ? sentences[0] : cleaned.substring(0, 200);
      } else {
        cleaned = cleaned.substring(0, 200);
      }
      cleaned = cleaned.trim();
      if (!cleaned.match(/[.!?]$/)) {
        cleaned += '...';
      }
    }
    
    return cleaned;
  }

  /**
   * Helper: Validate that content is meaningful and not corrupted
   */
  isValidContent(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Reject very short or very long content
    if (text.length < 10 || text.length > 1000) return false;
    
    // Reject content with too many non-word characters (likely corrupted)
    const wordChars = text.match(/\w/g) || [];
    const totalChars = text.length;
    const wordRatio = wordChars.length / totalChars;
    if (wordRatio < 0.6) return false; // Less than 60% word characters suggests corruption
    
    // Reject content with obvious API/structured data patterns
    const structuredPatterns = [
      /^[a-z]+_[a-z]+:/,     // Structured data keys like "file_path:"
      /^[a-f0-9]{10,}$/,     // Pure hex strings
      /^[A-Za-z0-9+/]{20,}$/,// Base64-like strings
      /\b(actionresult|executionenvironment|context):/gi,
      /\bfile_path:\S+/gi,
      /\bhome_dir:\S+/gi
    ];
    
    for (const pattern of structuredPatterns) {
      if (pattern.test(text)) return false;
    }
    
    // Must contain at least some readable words
    const readableWords = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
    if (readableWords.length < 2) return false;
    
    return true;
  }

  /**
   * Helper: Summarize long text to key points
   */
  summarizeText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    // Clean text first
    text = this.cleanText(text);
    
    // Try to break at sentence boundaries first
    const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      let summary = sentences[0].trim();
      
      // Add more sentences if they fit
      for (let i = 1; i < sentences.length; i++) {
        const nextSentence = sentences[i].trim();
        if (summary.length + nextSentence.length + 2 <= maxLength) {
          summary += '. ' + nextSentence;
        } else {
          break;
        }
      }
      
      // If first sentence is still too long, truncate at word boundaries
      if (summary.length > maxLength) {
        const words = summary.split(' ');
        const targetWords = Math.floor(words.length * (maxLength / summary.length));
        summary = words.slice(0, Math.max(10, targetWords)).join(' ');
        
        // Clean truncation - don't end mid-word or with weird punctuation
        summary = summary.replace(/[,\s]+$/, '');
        if (!summary.match(/[.!?]$/)) {
          summary += this.generateContinuationHint(text, summary);
        }
      }
      
      return summary;
    }
    
    // Fallback for text without clear sentences
    const words = text.split(' ').filter(w => w.length > 0);
    if (words.length <= 20) {
      return text; // Short enough as-is
    }
    
    let summary = words.slice(0, Math.floor(maxLength / 6)).join(' ');
    summary = summary.replace(/[,\s]+$/, '');
    summary += this.generateContinuationHint(text, summary);
    return summary;
  }

  /**
   * Helper: Generate a meaningful hint about what was cut off
   */
  generateContinuationHint(fullText, summarizedPart) {
    const remaining = fullText.substring(summarizedPart.length).trim();
    if (!remaining) return '...';
    
    // Look for key patterns in the remaining text to give hints
    const patterns = [
      { regex: /\bfile[s]?\b.*\.(js|ts|py|go|rs|java|cpp|php|rb)\b/i, hint: ' [+ file details]' },
      { regex: /\b(error|exception|failed|issue|problem)\b/i, hint: ' [+ error details]' },
      { regex: /\b(implemented?|created?|added?|built?)\b/i, hint: ' [+ implementation details]' },
      { regex: /\b(npm|git|node|python|cargo|go)\s+\w+/i, hint: ' [+ command details]' },
      { regex: /\b(fixed|resolved|solved)\b/i, hint: ' [+ solution details]' },
      { regex: /\b(decided?|chose|selected)\b/i, hint: ' [+ decision rationale]' },
      { regex: /\b(learned|discovered|realized)\b/i, hint: ' [+ insights]' },
      { regex: /\b(next|then|after|should|need|todo)\b/i, hint: ' [+ next steps]' },
      { regex: /\b(because|since|due\s+to|as)\b/i, hint: ' [+ reasoning]' },
      { regex: /\b\d+\s*(files?|lines?|changes?|messages?)\b/i, hint: ' [+ metrics]' },
      { regex: /\b(component|function|class|module|api)\b/i, hint: ' [+ code structure]' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(remaining)) {
        return pattern.hint;
      }
    }
    
    // If no specific pattern matches, try to extract a meaningful phrase
    const words = remaining.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      // Look for the first interesting word/phrase
      const meaningfulWords = words.filter(w => 
        !/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(w) &&
        !/^[^a-zA-Z]*$/.test(w) // Skip non-alphabetic "words"
      );
      
      if (meaningfulWords.length > 0) {
        const firstMeaningful = meaningfulWords[0].toLowerCase();
        // Try to categorize the word
        if (/^(file|script|code|component|function|class|module|api)/.test(firstMeaningful)) {
          return ` [+ ${firstMeaningful} details]`;
        } else if (/^(error|issue|problem|bug|fail)/.test(firstMeaningful)) {
          return ` [+ ${firstMeaningful} info]`;
        } else if (meaningfulWords.length >= 2) {
          return ` [+ ${meaningfulWords.slice(0, 2).join(' ')}...]`;
        } else {
          return ` [+ ${firstMeaningful}...]`;
        }
      }
    }
    
    // Generic fallback with rough length indication
    const charCount = remaining.length;
    if (charCount > 500) {
      return ' [+ extensive details]';
    } else if (charCount > 200) {
      return ' [+ more details]';
    } else {
      return ' [+ details]';
    }
  }

  /**
   * Helper: Format items for human-readable display
   */
  formatForDisplay(items, maxItems = 5) {
    if (!items || items.length === 0) {
      return [];
    }
    
    return items
      .slice(0, maxItems)
      .map(item => {
        const summary = this.summarizeText(item.description, 150);
        return `- **${item.type}**: ${summary}`;
      });
  }

  /**
   * Helper: Remove duplicates and sort by relevance
   */
  deduplicateAndSort(items) {
    const seen = new Set();
    const unique = [];

    for (const item of items) {
      const key = item.description.toLowerCase();
      if (!seen.has(key) && key.length > 5) {
        seen.add(key);
        unique.push(item);
      }
    }

    // Sort by description length (longer = more detailed = more useful)
    return unique.sort((a, b) => b.description.length - a.description.length);
  }
}

module.exports = ConversationAnalyzer;