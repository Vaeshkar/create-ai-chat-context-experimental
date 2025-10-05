const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Session Dump Command Handler
 * 
 * Handles the npx aic session_dump command with various options
 */

async function handleSessionDumpCommand(options) {
  // Import classes dynamically to avoid circular dependencies
  const AISessionMonitor = require('./ai-session-monitor');
  const SessionDumpTrigger = require('./session-dump-trigger');
  
  const monitor = new AISessionMonitor({ verbose: true });
  const trigger = new SessionDumpTrigger({ verbose: true });

  // Determine which action to take based on options
  if (options.check) {
    await handleCheckCommand(monitor);
  } else if (options.manual !== undefined) {
    await handleManualCommand(trigger, options.manual);
  } else if (options.watch) {
    await handleWatchCommand(monitor);
  } else if (options.status) {
    await handleStatusCommand();
  } else {
    // Default behavior - AI check
    console.log(chalk.blue('🤖 Running AI session analysis (default behavior)...'));
    await handleCheckCommand(monitor);
  }
}

async function handleCheckCommand(monitor) {
  console.log(chalk.blue('🔍 AI analyzing session for natural dump opportunity...'));
  await monitor.checkAndDecideSessionDump();
  console.log(chalk.green('✅ AI session analysis complete'));
}

async function handleManualCommand(trigger, reason) {
  const dumpReason = reason === true ? 'manual session dump' : reason || 'manual session dump';
  console.log(chalk.blue(`📝 Creating manual session dump: ${dumpReason}`));
  
  const result = await trigger.quickDump(dumpReason, 'NORMAL');
  
  if (result.success) {
    console.log(chalk.green(`✅ Manual session dump complete: ${result.filename}`));
  } else {
    console.error(chalk.red(`❌ Manual dump failed: ${result.error}`));
    process.exit(1);
  }
}

async function handleWatchCommand(monitor) {
  console.log(chalk.cyan('👁️  AI Session Monitor - Continuous watching...'));
  console.log(chalk.dim('   The AI will analyze your activity and decide when to create session dumps'));
  console.log(chalk.dim('   Press Ctrl+C to stop monitoring\n'));
  
  const interval = setInterval(async () => {
    try {
      await monitor.checkAndDecideSessionDump();
    } catch (error) {
      console.error(chalk.red('Monitor error:'), error.message);
    }
  }, 5000); // Check every 5 seconds
  
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(chalk.yellow('\n👋 AI Session Monitor stopped'));
    process.exit(0);
  });
}

async function handleStatusCommand() {
  console.log(chalk.cyan('📊 AI Session Dump System Status\n'));
  
  try {
    const dumpsDir = path.join(process.cwd(), '.meta/session-dumps');
    const aicfDir = path.join(process.cwd(), '.aicf');
    
    // Check session dumps
    if (fs.existsSync(dumpsDir)) {
      const dumps = fs.readdirSync(dumpsDir).filter(f => f.endsWith('.json'));
      console.log(chalk.green(`   Session Dumps: ${dumps.length} total`));
      
      if (dumps.length > 0) {
        const latest = dumps.sort().pop();
        const latestPath = path.join(dumpsDir, latest);
        const stats = fs.statSync(latestPath);
        const age = Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60)); // minutes
        
        console.log(chalk.blue(`   Latest: ${latest}`));
        console.log(chalk.dim(`   Age: ${age} minutes ago`));
      }
    } else {
      console.log(chalk.yellow('   Session Dumps: Directory not found'));
    }
    
    // Check AICF files
    if (fs.existsSync(aicfDir)) {
      const aicfFiles = fs.readdirSync(aicfDir).filter(f => f.endsWith('.aicf'));
      console.log(chalk.green(`   AICF Files: ${aicfFiles.length} active`));
      
      let totalSize = 0;
      aicfFiles.forEach(file => {
        const filePath = path.join(aicfDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
      
      const sizeKB = (totalSize / 1024).toFixed(1);
      const estimatedTokens = Math.ceil(totalSize / 4);
      console.log(chalk.blue(`   Total AICF Size: ${sizeKB}KB (~${estimatedTokens} tokens)`));
    } else {
      console.log(chalk.yellow('   AICF Files: Directory not found'));
    }
    
    // Check AI activity log
    const activityLogPath = path.join(process.cwd(), '.meta/ai-activity-log');
    if (fs.existsSync(activityLogPath)) {
      const logContent = fs.readFileSync(activityLogPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      console.log(chalk.green(`   Activity Log: ${lines.length} entries`));
      
      // Check for recent activity
      const recentActivity = lines.slice(-5).some(line => 
        line.includes('COMMAND_START') || line.includes('AI_RESPONSE_START')
      );
      
      if (recentActivity) {
        console.log(chalk.blue('   Recent Activity: ✅ Active session detected'));
      } else {
        console.log(chalk.dim('   Recent Activity: No recent commands'));
      }
    }
    
    console.log(chalk.cyan('\n💡 Usage Examples:'));
    console.log(chalk.dim('   npx aic session_dump --check        # Let AI decide'));
    console.log(chalk.dim('   npx aic session_dump --manual       # Create manual dump'));
    console.log(chalk.dim('   npx aic session_dump --watch        # Continuous monitoring'));
    
  } catch (error) {
    console.error(chalk.red(`Error checking status: ${error.message}`));
    process.exit(1);
  }
}

module.exports = { handleSessionDumpCommand };