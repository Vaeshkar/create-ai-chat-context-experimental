/**
 * Debug script to check Claude CLI watcher
 */

import { ClaudeCliWatcher } from './dist/esm/watchers/ClaudeCliWatcher.js';

async function debug() {
  console.log('\n🔍 Debugging Claude CLI Watcher\n');
  console.log('='.repeat(60));

  const watcher = new ClaudeCliWatcher();

  console.log('\n1. Checking if available...');
  const isAvailable = watcher.isAvailable();
  console.log(`   Available: ${isAvailable}`);

  if (!isAvailable) {
    console.log('   ❌ Claude CLI watcher not available');
    process.exit(1);
  }

  console.log('\n2. Getting available projects...');
  const projectsResult = watcher.getAvailableProjects();
  console.log(`   Projects Result OK: ${projectsResult.ok}`);

  if (!projectsResult.ok) {
    console.log(`   Error: ${projectsResult.error.message}`);
    process.exit(1);
  }

  const projects = projectsResult.value;
  console.log(`   Projects found: ${projects.length}`);

  if (projects.length === 0) {
    console.log('   ❌ No projects found');
    process.exit(1);
  }

  // Show first 3 projects
  console.log('\n   First 3 projects:');
  for (let i = 0; i < Math.min(3, projects.length); i++) {
    console.log(`     ${i + 1}. ${projects[i]}`);
  }

  // Use the first project
  const projectPath = projects[0];
  console.log(`\n3. Getting sessions for project: ${projectPath}`);
  const result = watcher.getProjectSessions(projectPath);
  console.log(`   Result OK: ${result.ok}`);

  if (!result.ok) {
    console.log(`   Error: ${result.error.message}`);
    process.exit(1);
  }

  const messages = result.value;
  console.log(`   Messages found: ${messages.length}`);

  if (messages.length > 0) {
    console.log('\n3. First 3 messages:');
    for (let i = 0; i < Math.min(3, messages.length); i++) {
      const msg = messages[i];
      console.log(`\n   Message ${i + 1}:`);
      console.log(`     - ID: ${msg.id}`);
      console.log(`     - Role: ${msg.role}`);
      console.log(`     - Content length: ${msg.content.length}`);
      console.log(`     - Timestamp: ${msg.timestamp}`);
      console.log(`     - Conversation ID: ${msg.conversationId}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Debug complete!\n');
}

debug().catch(console.error);
