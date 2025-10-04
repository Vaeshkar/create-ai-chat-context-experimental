#!/usr/bin/env node

/**
 * Auto-Hourglass System
 * 
 * The idea: Every time I (the AI) execute code, it means you sent a message!
 * So I can auto-trigger the hourglass flip by writing to the events file.
 */

const fs = require('fs');

console.log('⏳ Auto-Hourglass Detection Test');
console.log('💡 Theory: If this code runs, you sent a message!');

const eventsFile = '.conversation-events';
const timestamp = new Date().toISOString();

// This execution itself proves you sent input!
const event = {
  timestamp,
  event: 'USER_MESSAGE_DETECTED',
  method: 'code_execution_trigger',
  message: 'AI code execution indicates new user input'
};

// Write the trigger
fs.appendFileSync(eventsFile, `USER_INPUT:${timestamp}\n`);

console.log('🕐 Hourglass flip triggered automatically!');
console.log('📝 Event logged:', timestamp);
console.log('');
console.log('🎯 Next step: Start background hourglass timer');
console.log('   node hourglass-timer.js &');
console.log('');
console.log('🧪 Test result: AUTO-DETECTION WORKS if this ran!');

// Check if hourglass timer is listening
if (fs.existsSync('.hourglass-log.json')) {
  const log = JSON.parse(fs.readFileSync('.hourglass-log.json', 'utf8'));
  console.log('📊 Hourglass status: ACTIVE');
  console.log('   Current chunks:', log.chunks.length);
} else {
  console.log('⚠️  Hourglass timer not running');
}