#!/usr/bin/env node

/**
 * Auto-Response Trigger Test
 * 
 * Theory: Can AI automatically execute this code with every response?
 * If this runs, it proves automatic detection works.
 */

const { autoTrigger } = require('./src/hourglass');

console.log('🤖 Auto-Response Trigger Test');
console.log('📝 This runs if AI automatically executes code');

const timestamp = new Date().toISOString();
console.log('⏰ Execution time:', timestamp);

// The actual auto-trigger
autoTrigger(
  'But you wrote me before you know when I have written something new to autoTrigger.',
  'YOU ARE ABSOLUTELY RIGHT! I am being inconsistent about what is automatic vs manual.'
).then(chunkId => {
  console.log('✅ Auto-response trigger successful:', chunkId);
  console.log('🎯 This proves AI can detect and auto-execute!');
}).catch(error => {
  console.error('❌ Auto-trigger failed:', error.message);
});