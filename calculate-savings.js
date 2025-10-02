const fs = require('fs');

// Read both files
const before = fs.readFileSync('.ai/conversation-log.md.backup', 'utf8');
const after = fs.readFileSync('.ai/conversation-log.md', 'utf8');

// Count words
const beforeWords = before.split(/\s+/).filter(w => w.length > 0).length;
const afterWords = after.split(/\s+/).filter(w => w.length > 0).length;

// Estimate tokens (1.33 tokens per word)
const beforeTokens = Math.ceil(beforeWords * 1.33);
const afterTokens = Math.ceil(afterWords * 1.33);

// Calculate savings
const savings = beforeTokens - afterTokens;
const percentage = Math.round((savings / beforeTokens) * 100);

console.log('\n🎉 AICF CONVERSION RESULTS\n');
console.log('📊 Token Comparison:');
console.log(`   Before (mixed format): ${beforeTokens.toLocaleString()} tokens (${beforeWords.toLocaleString()} words)`);
console.log(`   After (AICF format):   ${afterTokens.toLocaleString()} tokens (${afterWords.toLocaleString()} words)`);
console.log(`   Savings:               ${savings.toLocaleString()} tokens (${percentage}% reduction!)\n`);

console.log('📈 Impact:');
if (percentage >= 80) {
  const multiplier = Math.round(100 / (100 - percentage));
  console.log(`   🚀 Can keep ${multiplier}x more history in context!\n`);
} else if (percentage >= 50) {
  console.log(`   ✅ Significant token savings!\n`);
} else {
  console.log(`   ℹ️  Moderate token savings\n`);
}

console.log('📝 File Sizes:');
console.log(`   Before: ${(before.length / 1024).toFixed(2)} KB`);
console.log(`   After:  ${(after.length / 1024).toFixed(2)} KB`);
console.log(`   Reduction: ${Math.round((1 - after.length / before.length) * 100)}%\n`);

