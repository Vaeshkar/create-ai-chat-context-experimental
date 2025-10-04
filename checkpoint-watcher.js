#!/usr/bin/env node

/**
 * Simple Checkpoint Watcher
 * Creates a file watcher that triggers checkpoint when .checkpoint-trigger is created
 * No external dependencies - pure Node.js
 */

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Checkpoint Watcher Active');
console.log('📝 Create .checkpoint-trigger file to trigger checkpoint');
console.log('🛑 Press Ctrl+C to stop');
console.log('');

const triggerFile = '.checkpoint-trigger';
const projectRoot = process.cwd();

// Watch for file creation
fs.watch(projectRoot, (eventType, filename) => {
  if (filename === triggerFile && eventType === 'rename') {
    // Check if file was created (not deleted)
    if (fs.existsSync(path.join(projectRoot, triggerFile))) {
      console.log('🚀 Checkpoint trigger detected!');
      executeCheckpoint();
      
      // Remove trigger file
      try {
        fs.unlinkSync(path.join(projectRoot, triggerFile));
        console.log('🧹 Cleaned up trigger file');
      } catch (error) {
        console.log('⚠️  Could not clean up trigger file:', error.message);
      }
    }
  }
});

function executeCheckpoint() {
  console.log('⏳ Executing checkpoint...');
  
  exec('npx aic checkpoint --demo --verbose', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Checkpoint failed:', error.message);
      return;
    }
    
    console.log('✅ Checkpoint completed successfully!');
    console.log(stdout);
    
    if (stderr) {
      console.log('⚠️  Warnings:', stderr);
    }
    
    console.log('');
    console.log('🔍 Watching for next checkpoint trigger...');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Checkpoint watcher stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Checkpoint watcher stopped');
  process.exit(0);
});