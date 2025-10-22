/**
 * Add AGPL-3.0 License Headers to All TypeScript Files
 * 
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import fs from 'fs';
import path from 'path';

const AGPL_HEADER = `/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */
`;

function hasLicenseHeader(content: string): boolean {
  return content.includes('AGPL') || content.includes('GNU AFFERO');
}

function addLicenseHeader(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already has license header
    if (hasLicenseHeader(content)) {
      console.log(`✓ Already has license: ${filePath}`);
      return;
    }

    // Add header at the very beginning
    content = AGPL_HEADER + '\n' + content;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Added license header: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
  }
}

function processDirectory(dir: string): void {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      addLicenseHeader(filePath);
    }
  }
}

// Process src and scripts directories
console.log('🔄 Adding AGPL-3.0 license headers to all TypeScript files...\n');
processDirectory('src');
processDirectory('scripts');
console.log('\n✅ License header addition complete!');

