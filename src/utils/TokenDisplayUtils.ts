/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Token Display Utilities
 * Provides functions to display token usage breakdown
 */

import chalk from 'chalk';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface AIModel {
  name: string;
  size: number;
}

const ALL_MODELS: AIModel[] = [
  { name: 'Claude Sonnet 4.5', size: 200000 },
  { name: 'Claude Opus 4', size: 200000 },
  { name: 'GPT-5', size: 128000 },
  { name: 'GPT-4o', size: 128000 },
  { name: 'GPT-4 Turbo', size: 128000 },
  { name: 'Gemini 1.5 Pro', size: 1000000 },
  { name: 'Gemini 1.5 Flash', size: 1000000 },
  { name: 'Llama 3.1 (405B)', size: 128000 },
  { name: 'Llama 3.1 (70B)', size: 128000 },
  { name: 'Mistral Large', size: 128000 },
  { name: 'Mixtral 8x22B', size: 65000 },
  { name: 'Command R+', size: 128000 },
  { name: 'PaLM 2', size: 32000 },
  { name: 'Falcon 180B', size: 65000 },
  { name: 'Qwen 1.5 (110B)', size: 32000 },
  { name: 'Grok-1', size: 128000 },
];

/**
 * Get token usage from knowledge base files
 */
async function getTokenUsage(cwd: string): Promise<{ totalWords: number; totalTokens: number }> {
  let totalWords = 0;

  const aicfDir = join(cwd, '.aicf');
  const aiDir = join(cwd, '.ai');

  // Count words in .aicf directory
  try {
    const aicfFiles = readdirSync(aicfDir);
    for (const file of aicfFiles) {
      if (file.endsWith('.aicf')) {
        const content = readFileSync(join(aicfDir, file), 'utf-8');
        const words = content.split(/\s+/).filter((w) => w.length > 0).length;
        totalWords += words;
      }
    }
  } catch {
    // Directory doesn't exist
  }

  // Count words in .ai directory
  try {
    const aiFiles = readdirSync(aiDir);
    for (const file of aiFiles) {
      if (file.endsWith('.md')) {
        const content = readFileSync(join(aiDir, file), 'utf-8');
        const words = content.split(/\s+/).filter((w) => w.length > 0).length;
        totalWords += words;
      }
    }
  } catch {
    // Directory doesn't exist
  }

  const totalTokens = Math.round(totalWords * 1.33);
  return { totalWords, totalTokens };
}

/**
 * Display token usage breakdown
 */
export async function displayTokenUsage(cwd: string, showAll: boolean = false): Promise<void> {
  console.log(chalk.bold.cyan('\n📊 Token Usage Report\n'));

  const usage = await getTokenUsage(cwd);

  if (usage.totalWords === 0) {
    console.log(chalk.yellow('⚠️  No .ai/ or .aicf/ directory found. Run "init" first.\n'));
    return;
  }

  console.log(chalk.bold('📝 Content:'));
  console.log(`   Total words:              ${usage.totalWords.toLocaleString()}`);
  console.log(`   Estimated tokens:         ${usage.totalTokens.toLocaleString()}`);
  console.log();

  console.log(chalk.bold('🤖 Context Window Usage:\n'));

  const modelsToShow = showAll ? ALL_MODELS : ALL_MODELS.slice(0, 4);

  modelsToShow.forEach((model) => {
    const percentage = ((usage.totalTokens / model.size) * 100).toFixed(2);
    const bar = '█'.repeat(Math.min(Math.floor(parseFloat(percentage) / 2), 50));
    const color =
      parseFloat(percentage) < 5
        ? chalk.green
        : parseFloat(percentage) < 15
          ? chalk.yellow
          : chalk.red;

    console.log(
      `   ${model.name.padEnd(25)} ${color(percentage.toString().padStart(6))}%  ${color(bar)}`
    );
  });

  console.log();

  if (!showAll) {
    console.log(
      chalk.gray(
        `💡 Showing ${modelsToShow.length} models. Run 'aether tokens --all' to see all ${ALL_MODELS.length} models\n`
      )
    );
  }
}
