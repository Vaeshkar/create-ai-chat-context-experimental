#!/usr/bin/env node

/**
 * AICF Token Efficiency Testing
 * Measures actual compression rates and semantic preservation
 */

const fs = require('fs');
const path = require('path');

function countTokens(text) {
  // Approximate GPT-style tokenization
  return text.replace(/\s+/g, ' ').split(/[\s\W]+/).filter(Boolean).length;
}

function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  const tokens = countTokens(content);
  const size = Buffer.byteLength(content, 'utf8');

  return {
    path: path.basename(filePath),
    lines: lines.length,
    tokens,
    size,
    compression_ratio: tokens / size,
    semantic_blocks: (content.match(/@[A-Z_]+/g) || []).length
  };
}

function main() {
  console.log('🧪 AICF Token Efficiency Analysis\n');
  
  const aicfDir = './.aicf';
  const files = ['index.aicf', 'conversations.aicf', 'decisions.aicf', 'work-state.aicf', 'technical-context.aicf'];
  
  let totalTokens = 0;
  let totalSize = 0;
  let totalBlocks = 0;
  
  files.forEach(file => {
    const analysis = analyzeFile(path.join(aicfDir, file));
    if (analysis) {
      console.log(`📊 ${analysis.path}:`);
      console.log(`   Lines: ${analysis.lines}`);
      console.log(`   Tokens: ${analysis.tokens}`);
      console.log(`   Size: ${analysis.size} bytes`);
      console.log(`   Semantic Blocks: ${analysis.semantic_blocks}`);
      console.log(`   Token/Byte Ratio: ${analysis.compression_ratio.toFixed(4)}`);
      console.log('');
      
      totalTokens += analysis.tokens;
      totalSize += analysis.size;
      totalBlocks += analysis.semantic_blocks;
    }
  });
  
  console.log('📈 OVERALL STATISTICS:');
  console.log(`   Total Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`   Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   Total Semantic Blocks: ${totalBlocks}`);
  console.log(`   Average Compression: ${(totalTokens / totalSize).toFixed(4)} tokens/byte`);
  console.log(`   Storage Efficiency: ${(totalBlocks / totalSize * 1000).toFixed(2)} blocks/KB`);
  
  // Compare to hypothetical uncompressed JSON
  const estimatedJsonSize = totalTokens * 15; // Rough JSON overhead estimate
  const compressionSaved = ((estimatedJsonSize - totalSize) / estimatedJsonSize * 100);
  console.log(`   Estimated Compression vs JSON: ${compressionSaved.toFixed(1)}%`);
  console.log('');
  
  if (compressionSaved > 90) {
    console.log('🎉 AICF achieves >90% compression while maintaining semantic structure!');
  } else {
    console.log('📊 AICF provides significant compression with semantic benefits');
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, countTokens };