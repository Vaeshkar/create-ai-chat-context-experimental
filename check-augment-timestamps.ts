import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';

async function main() {
  const reader = new AugmentLevelDBReader(process.cwd());
  const result = await reader.readAllConversations();

  if (!result.ok) {
    console.error('Error:', result.error.message);
    process.exit(1);
  }

  const conversations = result.value.slice(0, 20);
  
  for (const conv of conversations) {
    console.log('\n=== Conversation ===');
    console.log('ID:', conv.conversationId);
    console.log('Timestamp:', conv.timestamp);
    console.log('LastModified:', conv.lastModified);
                                                     ons                                              

maimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimample-augment-damaimaimaimaimaimaimaimaimaissicLemaimaimaimaimaimaimaimaimaimaipormaimaimaimaimaimaimaimaimaimaimaimaima'fsmaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimafromaimaimaimaimaimaimaimaimaimaimaimaimaimay maimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimaimai/womaimaimaimaimaimaimaifbc4603280bc668e8f373134ed/Augment.vscode-augment/augment-kv-maimaimaimaimaimaimaimaimaimaimaimaimaimai `augment-sample-${Date.now()}`);
  
  cpSync(srcPath, tempPath, { recursive: true }  cpSync(srcPath, tnew Cla  cpSync(srempPath);
  await db.open();
  
  let count = 0;
  for await (const [key, value] of db.iterator()) {
    if (count++ < 3) {
      console.log('\n=== Entry', count, '===');
      console.log('Key:', key.toString());
                                            e(value.toString());
        console.log('Parsed:', JSON.stringify(parsed, null, 2).substring(0, 500));
      } catch {
        console.log('Raw:', value.toString().substring(0, 500));
      }
    }
  }
  
  await db.close();
  rmSync(tempPath, { recursive: true, force: true });
}

main().catch(console.error);
