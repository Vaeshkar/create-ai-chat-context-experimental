/**
 * Manual test for Claude CLI parser with real data
 */

import { ClaudeCliParser } from './src/parsers/ClaudeCliParser.js';
import { ClaudeCliWatcher } from './src/watchers/ClaudeCliWatcher.js';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';

console.log('🧪 Testing Claude CLI Parser with Real Data\n');

// Test 1: Check if Claude CLI is available
console.log('1️⃣ Checking Claude CLI availability...');
const watcher = new ClaudeCliWatcher();
const isAvailable = watcher.isAvailable();
console.log(`   Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);

if (!isAvailable) {
  console.log('\n❌ Claude CLI not found. Exiting.');
  process.exit(1);
}

// Test 2: Get available projects
console.log('\n2️⃣ Getting available projects...');
const projectsResult = watcher.getAvailableProjects();

if (!projectsResult.ok) {
  console.log(`   ❌ Error: ${projectsResult.error.message}`);
  process.exit(1);
}

console.log(`   Found ${projectsResult.value.length} projects:`);
projectsResult.value.forEach((project, i) => {
  console.log(`   ${i + 1}. ${project}`);
});

// Test 3: Parse a specific session file
console.log('\n3️⃣ Parsing session file...');
const sessionPath = join(
  homedir(),
  '.claude',
  'projects',
  '-Users-leeuwen-Programming-create-ai-chat-context-experimental',
  '822ffcbf-8065-4c60-8023-542909a02382.jsonl'
);

console.log(`   File: ${sessionPath}`);

// Read file content
const jsonlContent = readFileSync(sessionPath, 'utf-8');
const sessionId = '822ffcbf-8065-4c60-8023-542909a02382';

const parser = new ClaudeCliParser();
const parseResult = parser.parse(jsonlContent, sessionId);

if (!parseResult.ok) {
  console.log(`   ❌ Parse Error: ${parseResult.error.message}`);
  process.exit(1);
}

const messages = parseResult.value;
console.log(`   ✅ Parsed ${messages.length} messages`);

// Test 4: Display message details
console.log('\n4️⃣ Message Details:');
messages.forEach((msg, i) => {
  console.log(`\n   Message ${i + 1}:`);
  console.log(`   - ID: ${msg.id}`);
  console.log(`   - Role: ${msg.role}`);
  console.log(`   - Timestamp: ${msg.timestamp}`);
  console.log(`   - Content Length: ${msg.content.length} chars`);
  console.log(`   - Content Preview: ${msg.content.substring(0, 100)}...`);

  if (msg.metadata) {
    console.log(`   - Metadata:`);
    console.log(`     - Platform: ${msg.metadata.platform}`);
    console.log(`     - Extracted From: ${msg.metadata.extractedFrom}`);
    console.log(`     - Message Type: ${msg.metadata.messageType}`);
    if (msg.metadata.gitBranch) {
      console.log(`     - Git Branch: ${msg.metadata.gitBranch}`);
    }
    if (msg.metadata.workingDirectory) {
      console.log(`     - Working Dir: ${msg.metadata.workingDirectory}`);
    }
  }
});

// Test 5: Get project sessions from watcher
console.log('\n5️⃣ Testing watcher.getProjectSessions()...');
const projectPath = '-Users-leeuwen-Programming-create-ai-chat-context-experimental';
const projectSessionsResult = watcher.getProjectSessions(projectPath);

if (!projectSessionsResult.ok) {
  console.log(`   ❌ Error: ${projectSessionsResult.error.message}`);
  process.exit(1);
}

console.log(`   ✅ Found ${projectSessionsResult.value.length} messages from project sessions`);

// Test 6: Verify message structure
console.log('\n6️⃣ Verifying message structure...');
let allValid = true;

for (const msg of messages) {
  if (!msg.id || !msg.conversationId || !msg.timestamp || !msg.role || !msg.content) {
    console.log(`   ❌ Invalid message structure: ${JSON.stringify(msg, null, 2)}`);
    allValid = false;
    break;
  }
}

if (allValid) {
  console.log('   ✅ All messages have valid structure');
}

console.log('\n✅ All tests passed!\n');
