/**
 * Migration Script: Convert old v3.0-alpha AICF files to new JSON format
 *
 * This script:
 * 1. Scans .aicf/recent/ for old v3.0-alpha files
 * 2. Parses the pipe-delimited format
 * 3. Converts to clean JSON structure
 * 4. Writes to .aicf/raw/ for processing by watchers
 * 5. Moves old files to .aicf/archive/migrated/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync } from 'fs';
import { join } from 'path';

interface OldAICFData {
  version: string;
  timestamp: string;
  conversationId: string;
  userIntents: string;
  aiActions: string;
  technicalWork: string;
  decisions: string;
  flow: string;
  workingState: string;
}

interface NewJSONFormat {
  metadata: {
    conversationId: string;
    timestamp: string;
    source: string;
    format: string;
  };
  conversation: {
    topic: string;
    summary: string;
    participants: string[];
  };
  key_exchanges: Array<{
    timestamp: string;
    speaker: string;
    content: string;
    type: string;
  }>;
  insights: string[];
  decisions: string[];
  technical_work: string[];
  next_steps: string[];
}

/**
 * Parse old v3.0-alpha pipe-delimited format
 */
function parseOldAICF(content: string): OldAICFData | null {
  const lines = content.split('\n');
  const data: Partial<OldAICFData> = {};

  for (const line of lines) {
    if (!line.trim()) continue;

    const [key, ...valueParts] = line.split('|');
    const value = valueParts.join('|');

    if (key === 'version') data.version = value;
    else if (key === 'timestamp') data.timestamp = value;
    else if (key === 'conversationId') data.conversationId = value;
    else if (key === 'userIntents') data.userIntents = value;
    else if (key === 'aiActions') data.aiActions = value;
    else if (key === 'technicalWork') data.technicalWork = value;
    else if (key === 'decisions') data.decisions = value;
    else if (key === 'flow') data.flow = value;
    else if (key === 'workingState') data.workingState = value;
  }

  if (!data.conversationId || !data.timestamp) {
    return null;
  }

  return data as OldAICFData;
}

/**
 * Convert old AICF data to new JSON format
 */
function convertToJSON(oldData: OldAICFData): NewJSONFormat {
  // Parse user intents
  const userIntents = oldData.userIntents
    ? oldData.userIntents.split(';').map((intent) => {
        const [timestamp, content, confidence] = intent.split('|');
        return { timestamp, content, confidence };
      })
    : [];

  // Parse AI actions
  const aiActions = oldData.aiActions
    ? oldData.aiActions.split(';').map((action) => {
        const [timestamp, type, ...contentParts] = action.split('|');
        const content = contentParts.join('|');
        return { timestamp, type, content };
      })
    : [];

  // Parse technical work
  const technicalWork = oldData.technicalWork
    ? oldData.technicalWork.split(';').map((work) => {
        const [timestamp, type, content] = work.split('|');
        return { timestamp, type, content };
      })
    : [];

  // Create key exchanges from user intents and AI actions
  const keyExchanges: Array<{
    timestamp: string;
    speaker: string;
    content: string;
    type: string;
  }> = [];

  // Add user intents
  for (const intent of userIntents) {
    if (intent.content) {
      keyExchanges.push({
        timestamp: intent.timestamp || oldData.timestamp,
        speaker: 'user',
        content: intent.content,
        type: 'user_intent',
      });
    }
  }

  // Add AI actions
  for (const action of aiActions) {
    if (action.content) {
      keyExchanges.push({
        timestamp: action.timestamp || oldData.timestamp,
        speaker: 'assistant',
        content: action.content,
        type: action.type || 'response',
      });
    }
  }

  // Sort by timestamp
  keyExchanges.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Extract insights from AI actions
  const insights: string[] = [];
  for (const action of aiActions) {
    if (action.type === 'augment_agent_action' && action.content) {
      insights.push(action.content.substring(0, 200)); // First 200 chars as insight
    }
  }

  // Extract decisions (if any)
  const decisions: string[] = oldData.decisions ? [oldData.decisions] : [];

  // Extract technical work
  const technicalWorkList: string[] = [];
  for (const work of technicalWork) {
    if (work.content) {
      technicalWorkList.push(work.content);
    }
  }

  // Generate summary from first user intent
  const summary =
    userIntents.length > 0 && userIntents[0]?.content
      ? userIntents[0].content.substring(0, 100)
      : 'Conversation migrated from v3.0-alpha';

  return {
    metadata: {
      conversationId: oldData.conversationId,
      timestamp: oldData.timestamp,
      source: 'migration_v3.0-alpha',
      format: 'aicf_v3.1',
    },
    conversation: {
      topic: summary,
      summary: summary,
      participants: ['user', 'assistant'],
    },
    key_exchanges: keyExchanges,
    insights: insights,
    decisions: decisions,
    technical_work: technicalWorkList,
    next_steps: [],
  };
}

/**
 * Main migration function
 */
export async function migrateOldAICF(cwd: string = process.cwd()): Promise<{
  migrated: number;
  skipped: number;
  errors: number;
}> {
  const recentDir = join(cwd, '.aicf', 'recent');
  const rawDir = join(cwd, '.aicf', 'raw');
  const migratedDir = join(cwd, '.aicf', 'archive', 'migrated');

  // Create directories if they don't exist
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(migratedDir, { recursive: true });

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  if (!existsSync(recentDir)) {
    console.log('No .aicf/recent/ directory found. Nothing to migrate.');
    return { migrated, skipped, errors };
  }

  const files = readdirSync(recentDir).filter((f) => f.endsWith('.aicf'));

  console.log(`Found ${files.length} old AICF file(s) to migrate...`);

  for (const file of files) {
    try {
      const filePath = join(recentDir, file);
      const content = readFileSync(filePath, 'utf-8');

      // Check if it's v3.0-alpha format
      if (!content.includes('version|3.0.0-alpha')) {
        console.log(`⏭️  Skipping ${file} (not v3.0-alpha format)`);
        skipped++;
        continue;
      }

      // Parse old format
      const oldData = parseOldAICF(content);
      if (!oldData) {
        console.log(`❌ Failed to parse ${file}`);
        errors++;
        continue;
      }

      // Convert to new JSON format
      const newData = convertToJSON(oldData);

      // Write to .aicf/raw/
      const jsonFilename = file.replace('.aicf', '.json');
      const jsonPath = join(rawDir, jsonFilename);
      writeFileSync(jsonPath, JSON.stringify(newData, null, 2), 'utf-8');

      // Move old file to archive
      const archivedPath = join(migratedDir, file);
      renameSync(filePath, archivedPath);

      console.log(`✅ Migrated ${file} → ${jsonFilename}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error);
      errors++;
    }
  }

  return { migrated, skipped, errors };
}

// Run if called directly (ESM only)
// Note: This check only works in ESM, not CJS
// For CJS, use the CLI command instead: aice migrate-aicf
const isMainModule = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - import.meta is only available in ESM
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
};

if (isMainModule()) {
  const cwd = process.argv[2] || process.cwd();
  migrateOldAICF(cwd)
    .then(({ migrated, skipped, errors }) => {
      console.log('\n📊 Migration Summary:');
      console.log(`   ✅ Migrated: ${migrated}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
      console.log(`   ❌ Errors: ${errors}`);
      console.log('');
      if (migrated > 0) {
        console.log('🎉 Migration complete! The watchers will process the new JSON files.');
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
