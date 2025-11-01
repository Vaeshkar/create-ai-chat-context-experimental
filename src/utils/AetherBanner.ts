/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * AETHER Banner Utility
 * Provides both static and animated banner displays
 * Inspired by aether_banner.py (Python rich library)
 */

import chalk from 'chalk';

/**
 * Configuration for shimmer animation
 */
const SHIMMER_CONFIG = {
  speed: 150, // milliseconds between glow steps
  cycles: 2, // number of full left→right glow passes
  letters: ['A', 'E', 'T', 'H', 'E', 'R'],
};

/**
 * Static AETHER banner (fast, no animation)
 */
export const STATIC_BANNER = `
╭─────────────────────────────────────────────────────────────────────────────╮
│                                                                             │
│                      ${chalk.bold.white('A')}${chalk.magenta('E')}${chalk.bold.white('T')}${chalk.magenta('H')}${chalk.bold.white('E')}${chalk.magenta('R')}                                          │
│                                                                             │
│              ${chalk.white('Distributed AI Memory System')}                            │
│   ${chalk.gray('Automatic learning • Conversation capture • Principle extraction')}   │
│              ${chalk.dim('95.5% compression • zero semantic loss')}                    │
│                                                                             │
╰─────────────────────────────────────────────────────────────────────────────╯
`;

/**
 * Render logo with shimmer effect at specific position
 */
function renderLogoWithShimmer(glowIndex: number): string {
  const letters = SHIMMER_CONFIG.letters;
  let logo = '';

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (i === glowIndex) {
      // Current letter: bright white, bold
      logo += chalk.bold.white(char);
    } else if (Math.abs(i - glowIndex) === 1) {
      // Adjacent letters: magenta (fade effect)
      logo += chalk.magenta(char);
    } else {
      // Other letters: dimmed grey
      logo += chalk.gray(char);
    }
  }

  return logo;
}

/**
 * Render the full panel with logo and description
 */
function renderPanel(logo: string): string {
  return `
╭─────────────────────────────── ${logo} ───────────────────────────────╮
│                                                                      │
│   ${chalk.white('Distributed AI Memory System')}                                       │
│   ${chalk.gray('Automatic learning • Conversation capture • Principle extraction')}   │
│   ${chalk.dim('95.5% compression • zero semantic loss')}                             │
│                                                                      │
╰──────────────────────────────────────────────────────────────────────╯
`;
}

/**
 * Clear the terminal screen
 */
function clearScreen(): void {
  // ANSI escape code to clear screen and move cursor to top-left
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Display animated shimmer banner
 * A subtle shimmer of light runs through AETHER twice
 * Each letter brightens briefly, then fades — like a neural signal
 */
export async function showAnimatedBanner(): Promise<void> {
  const { speed, cycles, letters } = SHIMMER_CONFIG;

  // Run shimmer animation
  for (let cycle = 0; cycle < cycles; cycle++) {
    for (let i = 0; i < letters.length; i++) {
      clearScreen();
      const logo = renderLogoWithShimmer(i);
      console.log(renderPanel(logo));
      await sleep(speed);
    }
  }

  // Final state: all letters dimmed
  clearScreen();
  const finalLogo = renderLogoWithShimmer(-1); // -1 = no glow
  console.log(renderPanel(finalLogo));
  console.log();
  console.log(chalk.dim('System online. Memory nodes synchronized.'));
  console.log();
}

/**
 * Display static banner (no animation)
 */
export function showStaticBanner(): void {
  console.log(STATIC_BANNER);
  console.log();
  console.log(chalk.dim('System initializing…'));
  console.log();
}

/**
 * Display banner with optional animation
 * @param animated - If true, show shimmer animation. If false, show static banner.
 */
export async function showBanner(animated = false): Promise<void> {
  if (animated) {
    await showAnimatedBanner();
  } else {
    showStaticBanner();
  }
}

