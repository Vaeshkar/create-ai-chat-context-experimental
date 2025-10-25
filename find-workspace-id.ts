import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const workspaceStoragePath = join(
  homedir(),
  'Library/Application Support/Code/User/workspaceStorage'
);

console.log('Scanning workspace storage for create-ai-chat-context-experimental...\n');

const workspaces = readdirSync(workspaceStoragePath);

for (const wsId of workspaces) {
  const workspaceJsonPath = join(workspaceStoragePath, wsId, 'workspace.json');
  try {
    const content = readFileSync(workspaceJsonPath, 'utf-8');
    const json = JSON.parse(content);
    
    const folder = json.folder || (json.folders?.[0]?.path);
    if (folder && folder.includes('create-ai-chat-context-experimental')) {
      console.log(`✓ Found workspace: ${wsId}`);
      console.log(`  Folder: ${folder}`);
      
      // Check if Augment data exists
      const augmentPath = join(workspaceStoragePath, wsId, 'Augment.vscode-augment/augment-kv-store');
      try {
        const files = readdirSync(augmentPath);
        console.log(`  Augment LevelDB files: ${files.length}`);
        files.forEach(f => console.log(`    - ${f}`));
      } catch (e) {
        console.log(`  No Augment data found`);
      }
      console.log();
    }
  } catch (e) {
    // Skip
  }
}
