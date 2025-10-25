import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const cacheDir = join(process.cwd(), '.cache/llm/augment/.conversations');
const files = readdirSync(cacheDir).filter(f => f.startsWith('chunk-') && f.endsWith('.json'));

console.log(`Total Augment chunks: ${files.length}\n`);

const conversations = new Set<string>();
const sources = new Map<string, number>();

for (const file of files) {
  const content = readFileSync(join(cacheDir, file), 'utf-8');
  const chunk = JSON.parse(content);
  
  if (chunk.conversationId) {
    conversations.add(chunk.conversationId);
  }
  
  const source = chunk.source || 'unknown';
  sources.set(source, (sources.get(source) || 0) + 1);
}

console.log(`Unique conversations: ${conversations.size}`);
console.log(`\nSources:`);
for (const [source, count] of sources) {
  console.log(`  ${source}: ${count} chunks`);
}

console.log(`\nConversation IDs:`);
let i = 1;
for (const convId of conversations) {
  console.log(`  ${i}. ${convId}`);
  i++;
}
