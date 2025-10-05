/**
 * Memory Lifecycle Manager - 3-tier system compatible
 * 
 * Manages memory decay for session dumps and AICF files:
 * - JSON session dumps: 7/30/90-day lifecycle  
 * - AICF files: Compress old entries, keep critical info
 * - Archive management: Move old dumps to archive
 */

const fs = require('fs').promises;
const path = require('path');

class MemoryLifecycleManager {
  constructor(options = {}) {
    this.name = 'MemoryLifecycleManager';
    this.projectRoot = options.projectRoot || process.cwd();
    
    // Lifecycle configuration (in days)
    this.lifecycle = {
      recent: 7,      // Keep full JSON dumps
      medium: 30,     // Compress to key insights  
      old: 90,        // Archive with critical decisions only
      purge: 365      // Delete everything except critical decisions
    };
    
    this.paths = {
      sessionDumps: path.join(this.projectRoot, '.meta/session-dumps'),
      archive: path.join(this.projectRoot, '.meta/session-dumps/archive'),
      aicf: path.join(this.projectRoot, '.aicf'),
      ai: path.join(this.projectRoot, '.ai')
    };
  }

  /**
   * Process complete memory lifecycle for 3-tier system
   */
  async processLifecycle() {
    try {
      console.log(`🔄 ${this.name} processing memory lifecycle...`);
      
      const results = {
        sessionDumps: await this.processSessionDumpLifecycle(),
        aicfFiles: await this.processAICFLifecycle(), 
        statistics: await this.calculateStatistics()
      };
      
      console.log(`✅ ${this.name} completed lifecycle processing`);
      return { success: true, results };
      
    } catch (error) {
      console.error(`❌ ${this.name} error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process session dump lifecycle management
   */
  async processSessionDumpLifecycle() {
    try {
      // Get all session dumps
      const dumps = await this.getSessionDumps();
      const results = {
        processed: 0,
        archived: 0,
        compressed: 0,
        purged: 0
      };

      for (const dump of dumps) {
        const age = this.calculateAgeInDays(dump.timestamp);
        const action = this.determineAction(age, dump);
        
        switch (action) {
          case 'KEEP_FULL':
            // Recent dumps - no action needed
            break;
            
          case 'COMPRESS':
            await this.compressSessionDump(dump);
            results.compressed++;
            break;
            
          case 'ARCHIVE':
            await this.archiveSessionDump(dump);
            results.archived++;
            break;
            
          case 'PURGE':
            await this.purgeSessionDump(dump);
            results.purged++;
            break;
        }
        
        results.processed++;
      }

      return results;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Process AICF file lifecycle (compress old entries)
   */
  async processAICFLifecycle() {
    try {
      const aicfFiles = [
        'conversation-memory.aicf',
        'technical-context.aicf', 
        'decisions.aicf',
        'work-state.aicf'
      ];
      
      const results = {
        filesProcessed: 0,
        entriesCompressed: 0,
        tokensReduced: 0
      };

      for (const fileName of aicfFiles) {
        const filePath = path.join(this.paths.aicf, fileName);
        
        if (await this.fileExists(filePath)) {
          const compressResult = await this.compressAICFFile(filePath);
          results.filesProcessed++;
          results.entriesCompressed += compressResult.entriesCompressed;
          results.tokensReduced += compressResult.tokensReduced;
        }
      }

      return results;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get all session dumps with metadata
   */
  async getSessionDumps() {
    try {
      const files = await fs.readdir(this.paths.sessionDumps);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const dumps = [];
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.paths.sessionDumps, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          dumps.push({
            filename: file,
            filepath: filePath,
            timestamp: new Date(data.timestamp),
            sessionId: data.session_id,
            significance: data.processing_info?.session_significance || 'NORMAL',
            size: content.length
          });
        } catch (error) {
          console.warn(`Warning: Could not process ${file}: ${error.message}`);
        }
      }
      
      return dumps.sort((a, b) => b.timestamp - a.timestamp); // Newest first
    } catch (error) {
      return [];
    }
  }

  /**
   * Determine what action to take for a session dump
   */
  determineAction(ageInDays, dump) {
    // Never purge critical sessions
    if (dump.significance === 'CRITICAL' || dump.significance === 'CRITICAL_ARCHITECTURAL_BREAKTHROUGH') {
      if (ageInDays <= this.lifecycle.medium) {
        return 'KEEP_FULL';
      } else if (ageInDays <= this.lifecycle.old) {
        return 'ARCHIVE'; // Archive but keep full content for critical sessions
      } else {
        return 'ARCHIVE'; // Even very old critical sessions stay archived
      }
    }
    
    // Regular session lifecycle
    if (ageInDays <= this.lifecycle.recent) {
      return 'KEEP_FULL';
    } else if (ageInDays <= this.lifecycle.medium) {
      return 'COMPRESS';
    } else if (ageInDays <= this.lifecycle.old) {
      return 'ARCHIVE';
    } else {
      return 'PURGE';
    }
  }

  /**
   * Compress session dump to key insights only
   */
  async compressSessionDump(dump) {
    try {
      const content = await fs.readFile(dump.filepath, 'utf-8');
      const data = JSON.parse(content);
      
      // Create compressed version with key insights only
      const compressed = {
        session_id: data.session_id,
        timestamp: data.timestamp,
        compressed: true,
        compression_date: new Date().toISOString(),
        key_insights: data.conversation_dump?.insights?.filter(i => i.importance === 'CRITICAL') || [],
        major_decisions: data.conversation_dump?.decisions?.filter(d => d.impact === 'CRITICAL') || [],
        technical_summary: data.conversation_dump?.technical_work?.slice(0, 2) || [], // Keep top 2
        user_inputs: data.conversation_dump?.user_inputs?.length || 0,
        original_size: content.length
      };
      
      // Write compressed version
      const compressedContent = JSON.stringify(compressed, null, 2);
      await fs.writeFile(dump.filepath, compressedContent);
      
      console.log(`🗜️ Compressed ${dump.filename}: ${content.length} → ${compressedContent.length} bytes`);
    } catch (error) {
      console.warn(`Warning: Could not compress ${dump.filename}: ${error.message}`);
    }
  }

  /**
   * Archive session dump
   */
  async archiveSessionDump(dump) {
    try {
      // Ensure archive directory exists
      await fs.mkdir(this.paths.archive, { recursive: true });
      
      const archivePath = path.join(this.paths.archive, dump.filename);
      
      // Move to archive
      await fs.rename(dump.filepath, archivePath);
      
      console.log(`📦 Archived ${dump.filename} to archive/`);
    } catch (error) {
      console.warn(`Warning: Could not archive ${dump.filename}: ${error.message}`);
    }
  }

  /**
   * Purge old session dump (delete)
   */
  async purgeSessionDump(dump) {
    try {
      // For safety, only purge non-critical sessions
      if (dump.significance === 'CRITICAL' || dump.significance === 'CRITICAL_ARCHITECTURAL_BREAKTHROUGH') {
        console.log(`🛡️ Protecting critical session ${dump.filename} from purging`);
        return;
      }
      
      await fs.unlink(dump.filepath);
      console.log(`🗑️ Purged old session dump ${dump.filename}`);
    } catch (error) {
      console.warn(`Warning: Could not purge ${dump.filename}: ${error.message}`);
    }
  }

  /**
   * Compress AICF file by removing old entries
   */
  async compressAICFFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const originalSize = content.length;
      
      // Parse AICF entries
      const entries = this.parseAICFEntries(content);
      
      // Filter entries by age
      const recentEntries = entries.filter(entry => {
        const age = this.calculateAgeFromEntry(entry);
        return age <= this.lifecycle.medium; // Keep entries from last 30 days
      });
      
      // Keep critical entries regardless of age
      const criticalEntries = entries.filter(entry => {
        return entry.content.includes('CRITICAL') || 
               entry.content.includes('IMPACT:CRITICAL') ||
               entry.content.includes('importance=CRITICAL');
      });
      
      // Combine and deduplicate
      const keptEntries = [...recentEntries];
      criticalEntries.forEach(entry => {
        if (!keptEntries.find(e => e.id === entry.id)) {
          keptEntries.push(entry);
        }
      });
      
      // Rebuild file content
      const newContent = keptEntries.map(e => e.content).join('\n\n');
      await fs.writeFile(filePath, newContent);
      
      const entriesRemoved = entries.length - keptEntries.length;
      const tokensReduced = Math.ceil((originalSize - newContent.length) / 4);
      
      if (entriesRemoved > 0) {
        console.log(`🗜️ Compressed ${path.basename(filePath)}: removed ${entriesRemoved} old entries, saved ${tokensReduced} tokens`);
      }
      
      return {
        entriesCompressed: entriesRemoved,
        tokensReduced
      };
      
    } catch (error) {
      console.warn(`Warning: Could not compress AICF file ${filePath}: ${error.message}`);
      return { entriesCompressed: 0, tokensReduced: 0 };
    }
  }

  /**
   * Parse AICF file into entries
   */
  parseAICFEntries(content) {
    const entries = [];
    const sections = content.split(/(?=@[A-Z])/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        entries.push({
          id: `entry_${index}`,
          content: section.trim(),
          timestamp: this.extractTimestampFromSection(section)
        });
      }
    });
    
    return entries;
  }

  /**
   * Extract timestamp from AICF section
   */
  extractTimestampFromSection(section) {
    const timestampMatch = section.match(/timestamp=([^|\n]+)/);
    if (timestampMatch) {
      try {
        return new Date(timestampMatch[1]);
      } catch (error) {
        return new Date(0); // Default to very old
      }
    }
    return new Date(0);
  }

  /**
   * Calculate age from AICF entry
   */
  calculateAgeFromEntry(entry) {
    return this.calculateAgeInDays(entry.timestamp);
  }

  /**
   * Calculate age in days
   */
  calculateAgeInDays(timestamp) {
    const now = new Date();
    const diffTime = Math.abs(now - timestamp);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate statistics
   */
  async calculateStatistics() {
    try {
      const dumps = await this.getSessionDumps();
      const archiveFiles = await this.getArchiveFiles();
      
      return {
        activeDumps: dumps.length,
        archivedDumps: archiveFiles.length,
        totalStorage: dumps.reduce((sum, dump) => sum + dump.size, 0),
        oldestDump: dumps.length > 0 ? this.calculateAgeInDays(dumps[dumps.length - 1].timestamp) : 0,
        criticalSessions: dumps.filter(d => d.significance.includes('CRITICAL')).length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get archived files
   */
  async getArchiveFiles() {
    try {
      const files = await fs.readdir(this.paths.archive);
      return files.filter(f => f.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Manual trigger for lifecycle processing
   */
  async runMaintenanceNow() {
    console.log(`🧹 Running memory lifecycle maintenance...`);
    return await this.processLifecycle();
  }
}

module.exports = MemoryLifecycleManager;