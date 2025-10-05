#!/usr/bin/env node

/**
 * Standalone Markdown Updater
 * Updates .ai/ markdown files directly from terminal SQLite database
 */

const MarkdownUpdater = require('../src/agents/markdown-updater');

async function main() {
  console.log('🔄 Updating .ai/ markdown files from terminal SQLite database...\n');
  
  try {
    const markdownUpdater = new MarkdownUpdater({ verbose: true });
    const results = await markdownUpdater.updateAllMarkdownFiles();
    
    console.log('\n🎉 Markdown update completed!');
    
    if (results.errors.length > 0) {
      console.log('\n⚠️ Some errors occurred:');
      results.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}