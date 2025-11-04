/**
 * Test QuadIndex Query
 * Tests loading QuadIndex from snapshot and checking stats
 */

import { QuadIndex } from 'lill-core';
import { SnapshotManager } from 'lill-core';
import chalk from 'chalk';

async function testQuadIndexQuery() {
  console.log(chalk.blue('🔍 Testing QuadIndex...\n'));

  // Initialize QuadIndex
  const quadIndex = new QuadIndex();
  const snapshotManager = new SnapshotManager();

  // Restore from latest snapshot
  console.log(chalk.gray('📥 Restoring from latest snapshot...'));
  const restoreResult = await snapshotManager.restore(quadIndex, 'rolling');

  if (!restoreResult.success) {
    console.log(
      chalk.red(`❌ Failed to restore snapshot: ${restoreResult.error || 'Unknown error'}`)
    );
    return;
  }

  console.log(chalk.green(`✅ Restored from snapshot\n`));

  // Get stats
  const stats = quadIndex.getStats();
  console.log(chalk.blue('📊 QuadIndex Stats:'));
  console.log(chalk.gray(`   Total principles: ${stats.data.metadata.total}`));
  console.log(chalk.gray(`   Vector store: ${stats.data.vector.indexed} indexed`));
  console.log(chalk.gray(`   Metadata store: ${stats.data.metadata.total} total`));
  console.log(
    chalk.gray(`   Graph store: ${stats.data.graph.nodes} nodes, ${stats.data.graph.edges} edges`)
  );
  console.log(
    chalk.gray(
      `   Reasoning store: ${stats.data.reasoning.hypotheticals} hypotheticals, ${stats.data.reasoning.rejected} rejected`
    )
  );
  console.log('');

  // Summary
  console.log(chalk.blue('📊 Test Summary:'));
  if (stats.data.metadata.total > 0) {
    console.log(chalk.green(`   ✅ QuadIndex is working!`));
    console.log(chalk.gray(`   ✅ ${stats.data.metadata.total} principles indexed`));
    console.log(chalk.gray(`   ✅ Snapshot can be restored`));
  } else {
    console.log(chalk.yellow('   ⚠️  QuadIndex is empty'));
  }
  console.log('');
}

// Run the test
testQuadIndexQuery().catch((error) => {
  console.error(chalk.red('❌ Error:'), error);
  process.exit(1);
});
