/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cjsDir = path.join(__dirname, '../dist/cjs');

/**
 * Fix CJS extensions in compiled output
 * Converts ESM imports to CJS requires and adds .js extensions to relative imports
 */
function fixExtensions(dir: string): void {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf-8');

      // Fix ESM imports to CJS requires
      content = content.replace(
        /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
        'const { $1 } = require("$2")'
      );

      content = content.replace(
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        'const $1 = require("$2")'
      );

      // Fix relative imports to add .js extension
      content = content.replace(/require\(['"](\.[^'"]+)(?<!\.js)['"]\)/g, 'require("$1.js")');

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
}

if (fs.existsSync(cjsDir)) {
  fixExtensions(cjsDir);

  // Rename index.js to index.cjs for proper CommonJS entry point
  const indexJsPath = path.join(cjsDir, 'index.js');
  const indexCjsPath = path.join(cjsDir, 'index.cjs');

  if (fs.existsSync(indexJsPath)) {
    fs.renameSync(indexJsPath, indexCjsPath);
  }

  // Also rename the source map
  const mapJsPath = path.join(cjsDir, 'index.js.map');
  const mapCjsPath = path.join(cjsDir, 'index.cjs.map');

  if (fs.existsSync(mapJsPath)) {
    fs.renameSync(mapJsPath, mapCjsPath);
  }

  console.log('✅ Fixed CJS extensions');
}
