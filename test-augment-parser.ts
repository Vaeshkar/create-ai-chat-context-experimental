#!/usr/bin/env node

/**
 * Test: Extract ONE Augment conversation and verify format
 *
 * This test:
 * 1. Finds ONE conversation about create-ai-chat-context-experimental
 * 2. Parses it to extract decisions, issues, tasks, next steps
 * 3. Generates pipe-delimited rows for each template file
 * 4. Shows the output for verification
 */

import { ClassicLevel } from 'classic-level';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';

interface AugmentRecord {
  uuid: string;
  conversationId: string;
  request_message: string;
  response_text: string;
  model_id?: string;
  timestamp?: string;
}

interface ParsedConversation {
  conversationId: string;
  timestamp: string;
  model: string;
  userInput: string;
  aiResponse: string;
  decisions: string[];
  issues: string[];
  tasks: string[];
  nextSteps: string[];
}

async function main() {
  console.log('🧪 Test: Augment Parser - Format & Parsing Verification\n');
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

          // Filter: Only conversations about create-ai-chat-context-experimental
          const fullText = (record.request_message + ' ' + record.response_text).toLowerCase();
          if (
            !fullText.includes('create-ai-chat-context') &&
            !fullText.includes('aicf') &&
            !fullText.includes('augment')
          ) {
            continue;
          }

          console.log('✅ Found relevant conversation\n');

          // Parse the conversation
          const parsed = parseConversation(record);

          // Display parsed data
          console.log('📊 PARSED DATA:\n');
          console.log(`Conversation ID: ${parsed.conversationId}`);
          console.log(`Timestamp: ${parsed.timestamp}`);
          console.log(`Model: ${parsed.model}`);
          console.log(`User Input Length: ${parsed.userInput.length} chars`);
          console.log(`AI Response Length: ${parsed.aiResponse.length} chars`);
          console.log(`Decisions Found: ${parsed.decisions.length}`);
          console.log(`Issues Found: ${parsed.issues.length}`);
          console.log(`Tasks Found: ${parsed.tasks.length}`);
          console.log(`Next Steps Found: ${parsed.nextSteps.length}\n`);

          // Generate individual conversation files
          console.log('='.repeat(80));
          console.log('📝 INDIVIDUAL CONVERSATION FILES:\n');

          // .ai/{conversationId}.md
          const aiMarkdown = generateAIMarkdown(parsed);
          console.log('.ai/{conversationId}.md:');
          console.log(aiMarkdown.substring(0, 300) + '...\n');

          // .aicf/{conversationId}.aicf
          const aicfContent = generateAICFContent(parsed);
          console.log('.aicf/{conversationId}.aicf:');
          console.log(aicfContent);
          console.log('');

          // Generate pipe-delimited rows for template files
          console.log('='.repeat(80));
          console.log('📝 TEMPLATE FILE ROWS (append):\n');

          // conversations.aicf
          const convRow = generateConversationRow(parsed);
          console.log('conversations.aicf:');
          console.log(convRow);
          console.log('');

          // decisions.aicf
          if (parsed.decisions.length > 0) {
            console.log('decisions.aicf:');
            parsed.decisions.forEach((decision, i) => {
              const row = generateDecisionRow(parsed, i + 1, decision);
              console.log(row);
            });
            console.log('');
          }

          // issues.aicf
          if (parsed.issues.length > 0) {
            console.log('issues.aicf:');
            parsed.issues.forEach((issue, i) => {
              const row = generateIssueRow(parsed, i + 1, issue);
              console.log(row);
            });
            console.log('');
          }

          // tasks.aicf
          if (parsed.tasks.length > 0) {
            console.log('tasks.aicf:');
            parsed.tasks.forEach((task, i) => {
              const row = generateTaskRow(parsed, i + 1, task);
              console.log(row);
            });
            console.log('');
          }

          // technical-context.aicf
          console.log('technical-context.aicf:');
          console.log(generateTechContextRow(parsed));
          console.log('');

          console.log('='.repeat(80));
          console.log('✅ Format verification complete!\n');

          await db.close();
          return;
        }
      }

      await db.close();
    } catch (error) {
      // Skip locked databases
    }
  }

  console.log('❌ No relevant conversations found');
}

function parseConversation(record: AugmentRecord): ParsedConversation {
  const fullText = record.request_message + ' ' + record.response_text;

  return {
    conversationId: record.conversationId,
    timestamp: record.timestamp || new Date().toISOString(),
    model: record.model_id || 'unknown',
    userInput: record.request_message,
    aiResponse: record.response_text,
    decisions: extractDecisions(fullText),
    issues: extractIssues(fullText),
    tasks: extractTasks(fullText),
    nextSteps: extractNextSteps(fullText),
  };
}

function extractDecisions(text: string): string[] {
  const patterns = [
    /decided to ([^.!?]+)/gi,
    /we chose ([^.!?]+)/gi,
    /architecture[:\s]+([^.!?]+)/gi,
    /decision[:\s]+([^.!?]+)/gi,
  ];

  const decisions = new Set<string>();
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const decision = match[1].trim().substring(0, 80);
      if (decision.length > 5) decisions.add(decision);
    }
  });

  return Array.from(decisions);
}

function extractIssues(text: string): string[] {
  const patterns = [
    /bug[:\s]+([^.!?]+)/gi,
    /problem[:\s]+([^.!?]+)/gi,
    /error[:\s]+([^.!?]+)/gi,
    /issue[:\s]+([^.!?]+)/gi,
    /critical[:\s]+([^.!?]+)/gi,
  ];

  const issues = new Set<string>();
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const issue = match[1].trim().substring(0, 80);
      if (issue.length > 5) issues.add(issue);
    }
  });

  return Array.from(issues);
}

function extractTasks(text: string): string[] {
  const patterns = [
    /todo[:\s]+([^.!?]+)/gi,
    /need to ([^.!?]+)/gi,
    /implement[:\s]+([^.!?]+)/gi,
    /create[:\s]+([^.!?]+)/gi,
  ];

  const tasks = new Set<string>();
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const task = match[1].trim().substring(0, 80);
      if (task.length > 5) tasks.add(task);
    }
  });

  return Array.from(tasks);
}

function extractNextSteps(text: string): string[] {
  const patterns = [
    /next[:\s]+([^.!?]+)/gi,
    /then[:\s]+([^.!?]+)/gi,
    /after that[:\s]+([^.!?]+)/gi,
  ];

  const steps = new Set<string>();
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const step = match[1].trim().substring(0, 80);
      if (step.length > 5) steps.add(step);
    }
  });

  return Array.from(steps);
}

function sanitize(text: string, maxLen: number = 80): string {
  // Remove pipes, newlines, and truncate
  return text
    .replace(/\|/g, '-')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .substring(0, maxLen)
    .trim();
}

function formatTimestamp(isoString: string): string {
  return isoString.replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateConversationRow(parsed: ParsedConversation): string {
  const timestamp = formatTimestamp(parsed.timestamp);
  const title = `Augment-${parsed.conversationId.substring(0, 8)}`;
  const summary = sanitize(parsed.aiResponse, 60);
  const decisions = parsed.decisions.length > 0 ? sanitize(parsed.decisions[0], 40) : 'None';
  const actions = parsed.decisions.length > 0 ? 'Analyzed' : 'Reviewed';

  return `C#|${timestamp}|${title}|${summary}|${parsed.model}|${decisions}|${actions}|COMPLETED`;
}

function generateDecisionRow(parsed: ParsedConversation, index: number, decision: string): string {
  const timestamp = formatTimestamp(parsed.timestamp);
  const safeDecision = sanitize(decision, 60);

  return `D${index}|${timestamp}|Decision ${index}|${safeDecision}|From conversation analysis|Affects project direction|ACTIVE`;
}

function generateIssueRow(parsed: ParsedConversation, index: number, issue: string): string {
  const timestamp = formatTimestamp(parsed.timestamp);
  const safeIssue = sanitize(issue, 60);

  return `I${index}|${timestamp}|Issue ${index}|${safeIssue}|MEDIUM|None|OPEN`;
}

function generateTaskRow(parsed: ParsedConversation, index: number, task: string): string {
  const timestamp = formatTimestamp(parsed.timestamp);
  const safeTask = sanitize(task, 60);

  return `T${index}|M|M|TODO|${safeTask}|None|AI|${timestamp}|`;
}

function generateTechContextRow(parsed: ParsedConversation): string {
  return `TC1|LANGUAGE|primary|TypeScript|From Augment conversation`;
}

function generateAIMarkdown(parsed: ParsedConversation): string {
  const lines: string[] = [];

  lines.push('# Augment Conversation\n');
  lines.push(`**Conversation ID:** ${parsed.conversationId}`);
  lines.push(`**Model:** ${parsed.model}`);
  lines.push(`**Timestamp:** ${parsed.timestamp}\n`);

  if (parsed.userInput && parsed.userInput.length > 0) {
    lines.push('## User Input\n');
    lines.push(parsed.userInput);
    lines.push('');
  }

  lines.push('## AI Response\n');
  lines.push(parsed.aiResponse);
  lines.push('');

  if (parsed.decisions.length > 0) {
    lines.push('## Decisions\n');
    parsed.decisions.forEach((d) => {
      lines.push(`- ${d}`);
    });
    lines.push('');
  }

  if (parsed.issues.length > 0) {
    lines.push('## Issues\n');
    parsed.issues.forEach((i) => {
      lines.push(`- ${i}`);
    });
    lines.push('');
  }

  if (parsed.nextSteps.length > 0) {
    lines.push('## Next Steps\n');
    parsed.nextSteps.forEach((s) => {
      lines.push(`- ${s}`);
    });
  }

  return lines.join('\n');
}

function generateAICFContent(parsed: ParsedConversation): string {
  const lines: string[] = [];

  lines.push(`@CONVERSATION:${parsed.conversationId}`);
  lines.push(`timestamp=${parsed.timestamp}`);
  lines.push(`model=${parsed.model}`);
  lines.push(`user_input_length=${parsed.userInput.length}`);
  lines.push(`ai_response_length=${parsed.aiResponse.length}`);
  lines.push(`decisions=${parsed.decisions.length}`);
  lines.push(`issues=${parsed.issues.length}`);
  lines.push(`tasks=${parsed.tasks.length}`);
  lines.push(`next_steps=${parsed.nextSteps.length}`);

  return lines.join('\n');
}

main().catch(console.error);
