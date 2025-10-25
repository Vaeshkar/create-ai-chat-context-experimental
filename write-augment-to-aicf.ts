import { AugmentLevelDBReader } from './dist/esm/readers/AugmentLevelDBReader.js';
import { MemoryFileWriter } from './dist/esm/writers/MemoryFileWriter.js';
import { ConversationOrchestrator } from './dist/esm/orchestrators/ConversationOrchestrator.js';

async function main() {
  console.log('🚀 Writing Augment conversations directly to .aicf/recent/...\n');

  const reader = new AugmentLevelDBReader(process.cwd());
  const result = await reader.readAllConversations();

  if (!result.ok) {
    console.error('❌ Error:', result.error.message);
    process.exit(1);
  }

  const conversations = result.value;
  console.log(`✅ Read ${conversations.length} conversations`);

  const writer = new MemoryFileWriter();
  const orchestrator = new ConversationOrchestrator();
  
  let written = 0;
  let failed = 0;

  // Group by conversation ID
  const byConvId = new Map<string, typeof conversations>();
  for (const conv of conversations) {
    if (!byConvId.has(conv.conversationId)) {
      byConvId.set(conv.conversationId, []);
    }
    byConvId.get(conv.conversationId)!.push(conv);
  }

  console.log(`📊 Processing ${byConvId.size} unique conversations...\n`);

  for (const [convId, convs] of byConvId) {
    try {
      // Create conversation object
      const conversation = {
        id: convId,
        messages: convs.map(c => ({
          id: c.conversationId,
          role: 'user' as const,
          content: c.rawData.substring(0, 500),
          timestamp: c.timestamp,
        })),
        timestamp: convs[0].timestamp,
        source: 'augment',
      };

      // Analyze
      const analysisResult = orchestrator.analyze(conversation, JSON.stringify(convs));
      if (!analysisResult.ok) {
        failed++;
        continue;
      }

      // Generate AICF
      const aicf = writer.generateAICF(analysisResult.value, convId);

      // Write to file
      writer.writeAICF(convId, aicf, process.cwd());
      written++;

      if (written % 100 === 0) {
        console.log(`  ✓ Written ${written} conversations...`);
      }
    } catch (e) {
      failed++;
    }
  }

  console.log(`\n✅ Complete:`);
  console.log(`   Written: ${written}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
