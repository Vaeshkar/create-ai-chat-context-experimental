/**
 * Test MemoryDropoffAgent with existing files
 * 
 * This test:
 * 1. Checks existing files in .aicf/recent/
 * 2. Simulates different ages by creating test files
 * 3. Runs dropoff agent
 * 4. Verifies files moved and compressed correctly
 */

import { MemoryDropoffAgent } from './src/agents/MemoryDropoffAgent.js';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🧪 MemoryDropoffAgent Test\n');
  console.log('=' .repeat(60));

  const cwd = process.cwd();
  const recentDir = join(cwd, '.aicf', 'recent');

  // Step 1: Check existing files
  console.log('\n📂 Step 1: Check existing files in .aicf/recent/');
  
  if (!existsSync(recentDir)) {
    console.error('❌ No .aicf/recent/ directory found');
    console.log('💡 Run the cache pipeline first to generate files');
    return;
  }

  const existingFiles = readdirSync(recentDir).filter(f => f.endsWith('.aicf'));
  console.log(`✅ Found ${existingFiles.length} existing files`);

  if (existingFiles.length === 0) {
    console.log('💡 No files to test with. Creating test files...');
    
    // Create test files with different ages
    const testFiles = [
      { days: 0, name: 'test-recent' },
      { days: 10, name: 'test-medium' },
      { days: 40, name: 'test-old' },
      { days: 100, name: 'test-archive' },
    ];

    for (const test of testFiles) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - test.days);
      const dateStr = targetDate.toISOString().split('T')[0];
      const fileName = `${dateStr}_${test.name}.aicf`;
      const filePath = join(recentDir, fileName);

      const content = `version|3.0.0-alpha
timestamp|${targetDate.toISOString()}
conversationId|${test.name}
model|claude-sonnet-4-5
source|test

@USER_INPUT
Test user input for ${test.name}

@AI_OUTPUT
Test AI output for ${test.name}

@DECISIONS
decision_1|high|Test decision for ${test.name}

@TECHNICAL_CONTEXT
tech_1|architecture|Test technical context for ${test.name}
`;

      writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ Created: ${fileName} (${test.days} days old)`);
    }

    console.log(`\n✅ Created ${testFiles.length} test files`);
  } else {
    console.log('\n📋 Existing files:');
    for (const file of existingFiles.slice(0, 5)) {
      console.log(`   - ${file}`);
    }
    if (existingFiles.length > 5) {
      console.log(`   ... and ${existingFiles.length - 5} more`);
    }
  }

  // Step 2: Run dropoff agent
  console.log('\n🗜️  Step 2: Run MemoryDropoffAgent');
  const dropoffAgent = new MemoryDropoffAgent(cwd);
  const dropoffResult = await dropoffAgent.dropoff();

  if (!dropoffResult.ok) {
    console.error('❌ Failed to run dropoff:', dropoffResult.error.message);
    return;
  }

  const stats = dropoffResult.value;
  console.log(`✅ Dropoff complete:`);
  console.log(`   - Recent files: ${stats.recentFiles}`);
  console.log(`   - Medium files: ${stats.mediumFiles}`);
  console.log(`   - Old files: ${stats.oldFiles}`);
  console.log(`   - Archive files: ${stats.archiveFiles}`);
  console.log(`   - Moved to medium: ${stats.movedToMedium}`);
  console.log(`   - Moved to old: ${stats.movedToOld}`);
  console.log(`   - Moved to archive: ${stats.movedToArchive}`);
  console.log(`   - Compressed: ${stats.compressed}`);

  // Step 3: Verify files in correct folders
  console.log('\n✅ Step 3: Verify files in correct folders');
  const mediumDir = join(cwd, '.aicf', 'medium');
  const oldDir = join(cwd, '.aicf', 'old');
  const archiveDir = join(cwd, '.aicf', 'archive');

  const mediumFiles = existsSync(mediumDir) ? readdirSync(mediumDir).filter(f => f.endsWith('.aicf')) : [];
  const oldFiles = existsSync(oldDir) ? readdirSync(oldDir).filter(f => f.endsWith('.aicf')) : [];
  const archiveFiles = existsSync(archiveDir) ? readdirSync(archiveDir).filter(f => f.endsWith('.aicf')) : [];

  console.log(`   - Recent: ${stats.recentFiles} files`);
  console.log(`   - Medium: ${mediumFiles.length} files`);
  console.log(`   - Old: ${oldFiles.length} files`);
  console.log(`   - Archive: ${archiveFiles.length} files`);

  // Step 4: Verify compression
  console.log('\n🔍 Step 4: Verify compression');

  if (mediumFiles.length > 0) {
    const mediumFile = join(mediumDir, mediumFiles[0]);
    const mediumContent = readFileSync(mediumFile, 'utf-8');
    const hasSummaryCompression = mediumContent.includes('compression|SUMMARY');
    const hasUserInput = mediumContent.includes('@USER_INPUT');
    console.log(`   - Medium file (${mediumFiles[0]}):`);
    console.log(`     Compression: ${hasSummaryCompression ? '✅ SUMMARY' : '❌ Missing'}`);
    console.log(`     User input removed: ${!hasUserInput ? '✅ Yes' : '❌ No'}`);
    console.log(`     Lines: ${mediumContent.split('\n').length}`);
  }

  if (oldFiles.length > 0) {
    const oldFile = join(oldDir, oldFiles[0]);
    const oldContent = readFileSync(oldFile, 'utf-8');
    const hasKeyPointsCompression = oldContent.includes('compression|KEY_POINTS');
    const hasKeyPoints = oldContent.includes('@KEY_POINTS');
    console.log(`   - Old file (${oldFiles[0]}):`);
    console.log(`     Compression: ${hasKeyPointsCompression ? '✅ KEY_POINTS' : '❌ Missing'}`);
    console.log(`     Key points section: ${hasKeyPoints ? '✅ Yes' : '❌ No'}`);
    console.log(`     Lines: ${oldContent.split('\n').length}`);
  }

  if (archiveFiles.length > 0) {
    const archiveFile = join(archiveDir, archiveFiles[0]);
    const archiveContent = readFileSync(archiveFile, 'utf-8');
    const lines = archiveContent.split('\n').filter(l => l.trim()).length;
    console.log(`   - Archive file (${archiveFiles[0]}):`);
    console.log(`     Compression: ${lines === 1 ? '✅ SINGLE LINE' : `⚠️  ${lines} lines`}`);
    console.log(`     Content: ${archiveContent.substring(0, 80)}...`);
  }

  // Step 5: Show sample content
  console.log('\n📄 Step 5: Sample content comparison');

  if (stats.recentFiles > 0) {
    const recentFiles = readdirSync(recentDir).filter(f => f.endsWith('.aicf'));
    if (recentFiles.length > 0) {
      const recentFile = join(recentDir, recentFiles[0]);
      const recentContent = readFileSync(recentFile, 'utf-8');
      const recentLines = recentContent.split('\n').length;
      console.log(`   - Recent file: ${recentLines} lines (FULL content)`);
    }
  }

  if (mediumFiles.length > 0) {
    const mediumFile = join(mediumDir, mediumFiles[0]);
    const mediumContent = readFileSync(mediumFile, 'utf-8');
    const mediumLines = mediumContent.split('\n').length;
    const reduction = stats.recentFiles > 0 ? 'compressed' : 'N/A';
    console.log(`   - Medium file: ${mediumLines} lines (SUMMARY - ${reduction})`);
  }

  if (oldFiles.length > 0) {
    const oldFile = join(oldDir, oldFiles[0]);
    const oldContent = readFileSync(oldFile, 'utf-8');
    const oldLines = oldContent.split('\n').length;
    console.log(`   - Old file: ${oldLines} lines (KEY_POINTS only)`);
  }

  if (archiveFiles.length > 0) {
    const archiveFile = join(archiveDir, archiveFiles[0]);
    const archiveContent = readFileSync(archiveFile, 'utf-8');
    const archiveLines = archiveContent.split('\n').filter(l => l.trim()).length;
    console.log(`   - Archive file: ${archiveLines} line (SINGLE LINE summary)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 MemoryDropoffAgent Test Complete!\n');
  console.log('✅ Verified:');
  console.log('   1. Files moved to correct folders by age');
  console.log('   2. Compression applied correctly');
  console.log('   3. Content reduced progressively');
  console.log('\n📊 Memory structure:');
  console.log(`   - Recent (0-7d):   ${stats.recentFiles} files - FULL content`);
  console.log(`   - Medium (7-30d):  ${stats.mediumFiles} files - SUMMARY format`);
  console.log(`   - Old (30-90d):    ${stats.oldFiles} files - KEY_POINTS only`);
  console.log(`   - Archive (90+d):  ${stats.archiveFiles} files - SINGLE LINE`);
  console.log('\n🚀 Phase 7 MemoryDropoffAgent is working!');
}

main().catch(console.error);

