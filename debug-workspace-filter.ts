import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const vscodeStoragePath = join(
  homedir(),
  'Library/Application Support/Code/User/workspaceStorage'
);

const currentProjectPath = process.cwd();
const currentProjectName = currentProjectPath.split('/').pop() || 'unknown';

console.log(`Current project path: ${currentProjectPath}`);
console.log(`Current project name: ${currentProjectName}\n`);

console.log('Scanning workspaces:\n');

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

  const workspaceJsonPath = join(vscodeStoragePath, workspaceId, 'workspace.json');
  let workspaceName = workspaceId;

  try {
    if (existsSync(workspaceJsonPath)) {
      const workspaceJson = JSON.parse(readFileSync(workspaceJsonPath, 'utf-8'));
      let folderPath: string | undefined;

      if (workspaceJson.folder) {
        folderPath = workspaceJson.folder;
      } else if (workspaceJson.folders && workspaceJson.folders.length > 0) {
        folderPath = workspaceJson.folders[0].path;
      }

      if (folderPath) {
        folderPath = folderPath.replace(/^file:\/\//, '');
        workspaceName = folderPath.split('/').pop() || workspaceId;
      }
    }
  } catch (e) {
    // Use workspaceId as fallback
  }

  const matches = workspaceName.includes(currentProjectName);
  console.log(`Workspace: ${workspaceName}`);
  console.log(`  ID: ${workspaceId}`);
  console.log(`  Matches filter? ${matches}`);
  console.log(`  Filter check: "${workspaceName}".includes("${currentProjectName}") = ${matches}\n`);
}
