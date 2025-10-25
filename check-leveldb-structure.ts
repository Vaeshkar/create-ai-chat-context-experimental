import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const dbPath = join(
  homedir(),
  'Library/Application Support/Code/User/workspaceStorage/66f00bfbc4603280bc668e8f373134ed/Augment.vscode-augment/augment-kv-store'
);

// Read the MANIFEST file to understand the structure
const manifestPath = join(dbPath, 'MANIFEST-000019');
const manifest = readFileSync(manifestPath, 'utf-8');

console.log('MANIFEST content:');
console.log(manifest);
console.log('\n---\n');

// Try to read the LOG file
const logPath = join(dbPath, '000024.log');
const log = readFileSync(logPath);

console.log('LOG file (first 500 bytes as hex):');
console.log(log.slice(0, 500).toString('hex'));
console.log('\n---\n');

// Try to find readable strings in the log
console.log('Readable strings in LOG file:');
const text = log.toString('utf-8', 0, Math.min(5000, log.length));
const strings = text.match(/[\x20-\x7E]{4,}/g) || [];
strings.slice(0, 20).forEach(s => console.log(`  "${s}"`));
