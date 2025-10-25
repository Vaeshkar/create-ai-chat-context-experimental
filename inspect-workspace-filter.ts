/**
 * Inspect Augment conversations to find workspace/project filtering
 *
 * Goal: Find how to filter conversations for ONLY this project
 * (create-ai-chat-context-experimental)
 */

import { AugmentLevelDBReader } from './src/readers/AugmentLevelDBReader.js';

async function main() {
  console.log('🔍 Inspecting Augment Conversations for Workspace Filtering\n');
  console.log('='.repeat(70));

  const reader = new AugmentLevelDBReader();
  const result = await reader.readAllConversations();

  if (!result.ok) {
    console.error('❌ Failed to read conversations:', result.error.message);
    return;
  }

  const conversations = result.value;
  console.log(`\n✅ Found ${conversations.length} total conversations`);

  // Inspect first 10 conversations to find workspace/project info
  console.log('\n📋 Inspecting first 10 conversations for workspace info:\n');

  for (let i = 0; i < Math.min(10, conversations.length); i++) {
    const conv = conversations[i];
    console.log(`\n--- Conversation ${i + 1} ---`);
    console.log(`ID: ${conv.conversationId}`);
    console.log(`Messages: ${conv.messages?.length || 0}`);

    // Check rawData for workspace info
    if (conv.rawData) {
      const rawData = typeof conv.rawData === 'string' ? JSON.parse(conv.rawData) : conv.rawData;

      console.log('\nRaw Data Keys:', Object.keys(rawData));

      // Look for workspace-related fields
      const workspaceFields = [
        'workspace',
        'workspaceId',
        'workspaceName',
        'workspaceFolder',
        'project',
        'projectName',
        'projectPath',
        'projectId',
        'folder',
        'folderPath',
        'folderName',
        'cwd',
        'directory',
        'path',
        'root',
        'rootPath',
        'repository',
        'repo',
        'repoName',
        'repoPath',
        'context',
        'contextPath',
        'contextFolder',
      ];

      for (const field of workspaceFields) {
        if (rawData[field]) {
          console.log(`  ✅ ${field}: ${JSON.stringify(rawData[field]).substring(0, 100)}`);
        }
      }

      // Check nested objects
      if (rawData.metadata) {
        console.log('\nMetadata:', JSON.stringify(rawData.metadata, null, 2).substring(0, 200));
      }

      if (rawData.context) {
        console.log('\nContext:', JSON.stringify(rawData.context, null, 2).substring(0, 200));
      }

      // Check first message for context
      if (conv.messages && conv.messages.length > 0) {
        const firstMsg = conv.messages[0];
        console.log('\nFirst Message Keys:', Object.keys(firstMsg));

        if (firstMsg.metadata) {
          console.log(
            'First Message Metadata:',
            JSON.stringify(firstMsg.metadata, null, 2).substring(0, 200)
          );
        }
      }
    }
  }

  // Search for conversations containing "create-ai-chat-context"
  console.log('\n\n' + '='.repeat(70));
  console.log('🔎 Searching for conversations about "create-ai-chat-context"...\n');

  let projectConversations = 0;
  const projectKeywords = [
    'create-ai-chat-context',
    'create-ai-chat-context-experimental',
    'aicf',
    'phase 6',
    'phase 7',
    'cache-first',
    'memory dropoff',
  ];

  for (const conv of conversations) {
    // Check messages for project keywords
    const hasProjectKeyword =
      conv.messages?.some((msg) => {
        const content = msg.content?.toLowerCase() || '';
        return projectKeywords.some((keyword) => content.includes(keyword.toLowerCase()));
      }) || false;

    if (hasProjectKeyword) {
      projectConversations++;

      if (projectConversations <= 5) {
        console.log(`\n✅ Found project conversation ${projectConversations}:`);
        console.log(`   ID: ${conv.conversationId}`);
        console.log(`   Messages: ${conv.messages?.length || 0}`);

        // Show snippet of first message
        if (conv.messages && conv.messages.length > 0) {
          const firstContent = conv.messages[0].content?.substring(0, 100) || '';
          console.log(`   First message: ${firstContent}...`);
        }

        // Check for workspace info in rawData
        if (conv.rawData) {
          const rawData =
            typeof conv.rawData === 'string' ? JSON.parse(conv.rawData) : conv.rawData;

          // Look for any path-related fields
          const pathFields = Object.keys(rawData).filter(
            (key) =>
              key.toLowerCase().includes('path') ||
              key.toLowerCase().includes('workspace') ||
              key.toLowerCase().includes('folder') ||
              key.toLowerCase().includes('directory')
          );

          if (pathFields.length > 0) {
            console.log(`   Path fields found: ${pathFields.join(', ')}`);
            for (const field of pathFields) {
              console.log(`     ${field}: ${JSON.stringify(rawData[field]).substring(0, 80)}`);
            }
          }
        }
      }
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total conversations: ${conversations.length}`);
  console.log(`   Project conversations (keyword match): ${projectConversations}`);
  console.log(
    `   Percentage: ${((projectConversations / conversations.length) * 100).toFixed(2)}%`
  );

  // Show workspace detection strategy
  console.log('\n\n💡 Workspace Detection Strategy:');
  console.log('   1. Check rawData for workspace/project/path fields');
  console.log('   2. Filter by content keywords (create-ai-chat-context)');
  console.log('   3. Check message metadata for workspace info');
  console.log('   4. Use workspace ID from VSCode workspace storage');

  console.log('\n✅ Inspection complete!');
}

main().catch(console.error);
