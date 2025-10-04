#!/usr/bin/env node
// Optional: Automatic checkpoint trigger on file changes
// Usage: node watch-and-checkpoint.js

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Watching for project changes...');
console.log('📝 Will trigger checkpoint on significant changes');

// Watch .ai and .aicf directories
const watchDirs = ['.ai', '.aicf', 'src', 'lib'].filter(dir => 
  fs.existsSync(dir)
);

watchDirs.forEach(dir => {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.includes('.md')) {
      console.log(`📄 File changed: ${dir}/${filename}`);
      
      // Optional: Auto-trigger checkpoint after significant changes
      // Uncomment next line to enable:
      // exec('npx aic checkpoint --auto', (err, stdout) => {
      //   if (!err) console.log('✅ Auto-checkpoint completed');
      // });
    }
  });
});

console.log(`👁️  Watching: ${watchDirs.join(', ')}`);
console.log('Press Ctrl+C to stop');