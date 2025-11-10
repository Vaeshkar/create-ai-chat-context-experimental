/**
 * BuildReasoningIndexCommand - Build reasoning index from conversations
 *
 * Extracts hypotheticals and rejected alternatives from raw conversations
 * and indexes them to ReasoningStore.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { QuadIndex, SnapshotManager } from 'lill-core';
import { ReasoningExtractor, type RawConversation } from '../extractors/ReasoningExtractor.js';

export interface BuildReasoningIndexOptions {
  cwd: string;
  force?: boolean;
  verbose?: boolean;
}

export class BuildReasoningIndexCommand {
  private cwd: string;
  private force: boolean;
  private verbose: boolean;

  constructor(options: BuildReasoningIndexOptions) {
    this.cwd = options.cwd;
    this.force = options.force || false;
    this.verbose = options.verbose || false;
  }

  async execute(): Promise<void> {
    console.log('🧠 Building Reasoning Index...\n');

    // 1. Load QuadIndex from snapshot
    const quadIndex = new QuadIndex();
    const snapshotManager = new SnapshotManager();

    if (this.verbose) {
      console.log('📂 Loading QuadIndex from snapshot...');
    }

    const restoreResult = await snapshotManager.restore(quadIndex, 'rolling');
    if (!restoreResult.success) {
      console.error('❌ Failed to restore QuadIndex:', restoreResult.error);
      process.exit(1);
    }

    if (this.verbose) {
      console.log('✅ QuadIndex loaded\n');
    }

    // 2. Check if ReasoningStore already has data
    const stats = quadIndex.getStats();
    if (stats.success && stats.data.reasoning.hypotheticals > 0 && !this.force) {
      console.log(
        `⚠️  ReasoningStore already has ${stats.data.reasoning.hypotheticals} hypotheticals`
      );
      console.log('   Use --force to rebuild\n');
      return;
    }

    // 3. Load raw conversations
    const rawDir = join(this.cwd, '.lill', 'raw');
    const files = readdirSync(rawDir).filter((f) => f.endsWith('.json'));

    if (files.length === 0) {
      console.log('⚠️  No raw conversations found in .lill/raw/\n');
      return;
    }

    console.log(`📚 Found ${files.length} conversation(s)\n`);

    // 4. Extract reasoning from each conversation
    const extractor = new ReasoningExtractor();
    let totalHypotheticals = 0;
    let totalRejected = 0;

    for (const file of files) {
      const filePath = join(rawDir, file);
      if (this.verbose) {
        console.log(`📖 Processing: ${file}`);
      }

      try {
        const content = readFileSync(filePath, 'utf-8');
        const conversation: RawConversation = JSON.parse(content);

        // Extract reasoning
        const result = extractor.extract(conversation);

        // Add to ReasoningStore
        for (const hypothetical of result.hypotheticals) {
          const addResult = await quadIndex.addHypothetical(hypothetical);
          if (addResult.success) {
            totalHypotheticals++;
            if (this.verbose) {
              console.log(`   ✅ Hypothetical: ${hypothetical.question.substring(0, 60)}...`);
            }
          } else if (this.verbose) {
            console.log(`   ⚠️  Failed to add hypothetical: ${addResult.error}`);
          }
        }

        for (const rejected of result.rejectedAlternatives) {
          const addResult = await quadIndex.addRejected(rejected);
          if (addResult.success) {
            totalRejected++;
            if (this.verbose) {
              console.log(`   ✅ Rejected: ${rejected.option.substring(0, 60)}...`);
            }
          } else if (this.verbose) {
            console.log(`   ⚠️  Failed to add rejected: ${addResult.error}`);
          }
        }

        if (this.verbose) {
          console.log(
            `   📊 Extracted: ${result.hypotheticals.length} hypotheticals, ${result.rejectedAlternatives.length} rejected\n`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to process ${file}:`, error);
      }
    }

    // 5. Save snapshot
    console.log('\n💾 Saving snapshot...');
    const saveResult = await snapshotManager.takeSnapshot(quadIndex, 'rolling');
    if (!saveResult.success) {
      console.error('❌ Failed to save snapshot:', saveResult.error);
      process.exit(1);
    }

    // 6. Show results
    console.log('\n✅ Reasoning Index Built!\n');
    console.log('📊 Results:');
    console.log(`   Hypotheticals: ${totalHypotheticals}`);
    console.log(`   Rejected Alternatives: ${totalRejected}`);
    console.log(`   Total Reasoning Entries: ${totalHypotheticals + totalRejected}\n`);

    // 7. Show updated stats
    const updatedStats = quadIndex.getStats();
    if (updatedStats.success) {
      console.log('📈 QuadIndex Stats:');
      console.log(`   Vector Store: ${updatedStats.data.vector.total} principles`);
      console.log(`   Metadata Store: ${updatedStats.data.metadata.total} principles`);
      console.log(
        `   Graph Store: ${updatedStats.data.graph.nodes} nodes, ${updatedStats.data.graph.edges} edges`
      );
      console.log(
        `   Reasoning Store: ${updatedStats.data.reasoning.hypotheticals} hypotheticals, ${updatedStats.data.reasoning.rejected} rejected\n`
      );
    }
  }
}
