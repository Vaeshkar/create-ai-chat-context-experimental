const { handleConvertCommand } = require('./src/convert');

console.log('Starting conversion test...\n');

handleConvertCommand({ toAiNative: true, backup: true })
  .then(() => {
    console.log('\n✅ Conversion completed successfully!');
  })
  .catch(err => {
    console.error('\n❌ Error during conversion:');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
  });

