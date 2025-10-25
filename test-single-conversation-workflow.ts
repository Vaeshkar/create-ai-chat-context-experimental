#!/usr/bin/env node

/**
 * Test workflow: Extract ONE Augment conversation and process it properly
 * 1. Create chunk.json with raw data
 * 2. Parse to .aicf format
 * 3. Parse to .ai markdown
 * 4. Delete chunk.json
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { existsSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { createHash } from 'crypto';

interface AugmentRecord {
  uuid: string;
  conversationId: string;
  request_message: string;
  response_text: string;
  request_nodes?: unknown[];
  response_nodes?: unknown[];
  model_id?: string;
  timestamp?: string;
}

async function main() {
  console.log('🧪 Testing Single Conversation Workflow\n');
  console.log('='.repeat(80) + '\n');

  const vscodeStoragePath = join(
    homedir(),
    'Library/Application Support/Code/User/workspaceStorage'
  );

  const workspaceIds = readdirSync(vscodeStoragePath);

  for (const workspaceId of workspaceIds) {
    const augmentPath = join(
      vscodeStoragePath,
      workspaceId,
      'Augment.vscode-augment',
      'augment-kv-store'
    );

    if (!existsSync(augmentPath)) {
      continue;
    }

    try {
      const db = new ClassicLevel(augmentPath);
      await db.open();

      for await (const [key, value] of db.iterator()) {
        const keyStr = key.toString();

        if (keyStr.startsWith('exchange:')) {
          const valueStr = value.toString();
          const record: AugmentRecord = JSON.parse(valueStr);

          console.log('✅ Found Augment record');
          console.log(`   Conversation ID: ${record.conversationId}`);
          console.log(`   Message UUID: ${record.uuid}`);
          console.log(`   Has request: ${record.request_message ? 'YES' : 'NO'}`);
          console.log(`   Response length: ${record.response_text.length} chars\n`);

          // Step 1: Create chunk.json
          const chunkPath = '.cache/test-chunk.json';
          const chunk = {
            chunkId: 'test-chunk-1',
            conversationId: record.conversationId,
            messageId: record.uuid,
            timestamp: new Date().toISOString(),
            source: 'augment-leveldb',
            rawData: record,
          };

          writeFileSync(chunkPath, JSON.stringify(chunk, null, 2));
          console.log(`📝 Step 1: Created chunk.json at ${chunkPath}`);

          // Step 2: Parse to .aicf format
          const aicfPath = `.aicf/test-conversation-${record.conversationId.substring(0, 8)}.aicf`;
          const aicfContent = generateAICF(record);
          writeFileSync(aicfPath, aicfContent);
          console.log(`📝 Step 2: Created .aicf file at ${aicfPath}`);

          // Step 3: Parse to .ai markdown
          const aiPath = `.ai/test-conversation-${record.conversationId.substring(0, 8)}.md`;
          const aiContent = generateMarkdown(record);
          writeFileSync(aiPath, aiContent);
          console.log(`📝 Step 3: Created .ai file at ${aiPath}`);

          // Step 4: Delete chunk.json
          unlinkSync(chunkPath);
          console.log(`🗑️  Step 4: Deleted chunk.json\n`);

          console.log('='.repeat(80));
          console.log('✅ Workflow complete!\n');
          console.log('Files created:');
          console.log(`  - ${aicfPath}`);
          console.log(`  - ${aiPath}`);

          await db.close();
          return;
        }
      }

      await db.close();
    } catch (error) {
      // Skip locked databases
    }
  }
}

function generateAICF(record: AugmentRecord): string {
  const lines: string[] = [];

  lines.push(`@CONVERSATION:augment-${record.conversationId}`);
  lines.push(`timestamp=${record.timestamp || new Date().toISOString()}`);
  lines.push(`platform=augment`);
  lines.push(`message_id=${record.uuid}`);
  lines.push(`model=${record.model_id || 'unknown'}`);

  if (record.request_message) {
    lines.push(`user_input_length=${record.request_message.length}`);
  }

  lines.push(`ai_response_length=${record.response_text.length}`);
  lines.push(`has_tool_results=${record.request_nodes ? 'yes' : 'no'}`);
  lines.push('');

  return lines.join('\n');
}

function generateMarkdown(record: AugmentRecord): string {
  const lines: string[] = [];

  lines.push(`# Augment Conversation\n`);
  lines.push(`**Conversation ID:** ${record.conversationId}`);
  lines.push(`**Message ID:** ${record.uuid}`);
  lines.push(`**Model:** ${record.model_id || 'Unknown'}`);
  lines.push(`**Timestamp:** ${record.timestamp || new Date().toISOString()}\n`);

  if (record.request_message) {
    lines.push(`## User Input\n`);
    lines.push(record.request_message);
    lines.push('');
  }

  lines.push(`## AI Response\n`);
  lines.push(record.response_text);
  lines.push('');

  if (record.request_nodes && record.request_nodes.length > 0) {
    lines.push(`## Tool Results\n`);
    lines.push(`Found ${record.request_nodes.length} tool result(s)`);
  }

  return lines.join('\n');
}

main().catch(console.error);

