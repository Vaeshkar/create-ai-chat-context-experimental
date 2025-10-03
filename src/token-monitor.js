/**
 * Token Monitoring System
 * Estimates conversation token usage and suggests session wrap-up
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * Rough token estimation (GPT-style tokenization approximation)
 */
function estimateTokens(text) {
  if (!text) return 0;
  
  // Rough approximation: 1 token ≈ 4 characters for English text
  // This is a simplified estimate - real tokenization varies
  const chars = text.length;
  const roughTokens = Math.ceil(chars / 4);
  
  // Adjust for different content types
  if (text.includes("```")) {
    // Code blocks tend to be more token-dense
    return Math.ceil(roughTokens * 1.2);
  }
  
  if (text.includes("|")) {
    // Structured data (like AICF) is more token-efficient
    return Math.ceil(roughTokens * 0.8);
  }
  
  return roughTokens;
}

/**
 * Analyze current project token usage
 */
async function analyzeTokenUsage() {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, ".ai");
  const aicfDir = path.join(cwd, ".aicf");
  
  let analysis = {
    totalTokens: 0,
    aiTokens: 0,
    aicfTokens: 0,
    conversationTokens: 0,
    contextWindowUsage: 0,
    files: {},
    hasAICF: fs.existsSync(aicfDir),
    recommendation: ""
  };

  // Analyze .ai/ files
  if (fs.existsSync(aiDir)) {
    const aiFiles = await fs.readdir(aiDir);
    
    for (const file of aiFiles) {
      const filePath = path.join(aiDir, file);
      if (fs.statSync(filePath).isFile() && file.endsWith('.md')) {
        const content = await fs.readFile(filePath, 'utf8');
        const tokens = estimateTokens(content);
        analysis.files[`.ai/${file}`] = tokens;
        analysis.aiTokens += tokens;
        
        if (file === 'conversation-log.md') {
          analysis.conversationTokens = tokens;
        }
      }
    }
  }

  // Analyze .aicf/ files if they exist
  if (analysis.hasAICF) {
    const aicfFiles = await fs.readdir(aicfDir);
    
    for (const file of aicfFiles) {
      const filePath = path.join(aicfDir, file);
      if (fs.statSync(filePath).isFile()) {
        const content = await fs.readFile(filePath, 'utf8');
        const tokens = estimateTokens(content);
        analysis.files[`.aicf/${file}`] = tokens;
        analysis.aicfTokens += tokens;
      }
    }
  }

  analysis.totalTokens = analysis.aiTokens + analysis.aicfTokens;
  
  // Estimate context window usage (assuming ~200K token context window)
  analysis.contextWindowUsage = Math.min((analysis.totalTokens / 200000) * 100, 100);
  
  // Generate recommendations
  if (analysis.totalTokens > 150000) {
    analysis.recommendation = "URGENT: Consider session wrap-up and AICF migration";
  } else if (analysis.totalTokens > 100000) {
    analysis.recommendation = "HIGH: Session getting large, consider finishing soon";
  } else if (analysis.totalTokens > 50000) {
    analysis.recommendation = "MEDIUM: Session growing, monitor token usage";
  } else {
    analysis.recommendation = "LOW: Token usage healthy";
  }

  return analysis;
}

/**
 * Display token monitoring report
 */
function displayTokenReport(analysis) {
  console.log(chalk.bold("\n📊 Token Usage Monitor\n"));
  
  // Overall stats
  console.log(chalk.bold("📈 Overall Statistics:"));
  console.log(chalk.cyan(`   Total Tokens: ${analysis.totalTokens.toLocaleString()}`));
  console.log(chalk.cyan(`   Context Usage: ${analysis.contextWindowUsage.toFixed(1)}%`));
  
  if (analysis.hasAICF) {
    const savings = analysis.aiTokens - analysis.aicfTokens;
    const savingsPercent = ((savings / analysis.aiTokens) * 100).toFixed(1);
    console.log(chalk.green(`   AICF Savings: ${savings.toLocaleString()} tokens (${savingsPercent}%)`));
  }

  // Conversation-specific
  if (analysis.conversationTokens > 0) {
    console.log(chalk.bold("\n💬 Conversation Analysis:"));
    console.log(chalk.cyan(`   Conversation Log: ${analysis.conversationTokens.toLocaleString()} tokens`));
    
    if (analysis.conversationTokens > 20000) {
      console.log(chalk.yellow(`   ⚠️  Large conversation history detected!`));
    }
  }

  // File breakdown
  console.log(chalk.bold("\n📁 File Breakdown:"));
  const sortedFiles = Object.entries(analysis.files)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);
    
  for (const [file, tokens] of sortedFiles) {
    const color = tokens > 10000 ? chalk.yellow : tokens > 5000 ? chalk.cyan : chalk.gray;
    console.log(color(`   ${file}: ${tokens.toLocaleString()} tokens`));
  }

  // Recommendations
  console.log(chalk.bold("\n🎯 Recommendation:"));
  const level = analysis.recommendation.split(":")[0];
  const message = analysis.recommendation.split(":")[1];
  
  const levelColor = level === "URGENT" ? chalk.red : 
                    level === "HIGH" ? chalk.yellow :
                    level === "MEDIUM" ? chalk.blue : chalk.green;
  
  console.log(levelColor(`   ${level}:`) + chalk.white(message));

  // Action suggestions
  if (analysis.totalTokens > 50000) {
    console.log(chalk.bold("\n🚀 Suggested Actions:"));
    console.log(chalk.green("   npx aic finish --aicf    ") + chalk.gray("# Finish session & migrate to AICF"));
    console.log(chalk.green("   npx aic archive --keep 5 ") + chalk.gray("# Archive old conversations"));
    console.log(chalk.green("   npx aic summary --keep 5 ") + chalk.gray("# Summarize old conversations"));
    
    if (!analysis.hasAICF) {
      console.log(chalk.green("   npx aic migrate --to-aicf") + chalk.gray("# Convert to AICF 3.0 (85% reduction)"));
    }
  }

  console.log();
}

/**
 * Check if session should be wrapped up based on token usage
 */
async function shouldWrapUpSession() {
  const analysis = await analyzeTokenUsage();
  
  // Suggest wrap-up if approaching token limits
  if (analysis.totalTokens > 100000 || analysis.conversationTokens > 25000) {
    return {
      shouldWrapUp: true,
      reason: analysis.recommendation,
      analysis
    };
  }

  return {
    shouldWrapUp: false,
    reason: "Token usage within healthy limits",
    analysis
  };
}

module.exports = {
  estimateTokens,
  analyzeTokenUsage,
  displayTokenReport,
  shouldWrapUpSession
};