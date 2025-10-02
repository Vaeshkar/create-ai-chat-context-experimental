const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function debugTechnicalDecisions() {
  console.log(chalk.bold.cyan('\n1. DEBUGGING TECHNICAL DECISIONS\n'));
  
  const filePath = path.join('.ai', 'technical-decisions.md');
  const content = await fs.readFile(filePath, 'utf8');
  
  console.log(`File length: ${content.length} chars`);
  console.log(`File lines: ${content.split('\n').length}`);
  
  // Split by ## sections
  const sections = content.split(/^## /m).filter(s => s.trim());
  console.log(`\nTotal sections (split by ^## ): ${sections.length}`);
  
  for (let i = 0; i < Math.min(sections.length, 3); i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    console.log(`\n--- Section ${i + 1} ---`);
    console.log(`Title: ${title.substring(0, 60)}`);
    console.log(`Lines in section: ${lines.length}`);
    
    // Check for skip conditions
    if (section.startsWith('#')) {
      console.log(`  ❌ SKIP: Starts with #`);
      continue;
    }
    if (section.includes('IMPORTANT FOR AI')) {
      console.log(`  ❌ SKIP: Contains IMPORTANT FOR AI`);
      continue;
    }
    if (section.includes('Template')) {
      console.log(`  ❌ SKIP: Contains Template`);
      continue;
    }
    
    // Look for ### Decision
    let hasDecisionSection = false;
    let decisionContent = '';
    let inDecisionSection = false;
    
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      
      if (line === '### Decision') {
        hasDecisionSection = true;
        inDecisionSection = true;
        console.log(`  ✓ Found ### Decision at line ${j}`);
        continue;
      }
      
      if (line.startsWith('###')) {
        inDecisionSection = false;
      }
      
      if (inDecisionSection && line && !line.startsWith('#')) {
        decisionContent += (decisionContent ? ' ' : '') + line;
      }
    }
    
    console.log(`  Has ### Decision: ${hasDecisionSection}`);
    console.log(`  Decision content: ${decisionContent.substring(0, 80)}...`);
    
    if (hasDecisionSection && decisionContent) {
      console.log(`  ✅ WOULD ADD THIS ENTRY`);
    } else {
      console.log(`  ❌ SKIP: No decision content`);
    }
  }
}

async function debugKnownIssues() {
  console.log(chalk.bold.cyan('\n\n2. DEBUGGING KNOWN ISSUES\n'));
  
  const filePath = path.join('.ai', 'known-issues.md');
  const content = await fs.readFile(filePath, 'utf8');
  
  console.log(`File length: ${content.length} chars`);
  console.log(`File lines: ${content.split('\n').length}`);
  
  // Split by ### subsections
  const subsections = content.split(/^### /m).filter(s => s.trim());
  console.log(`\nTotal subsections (split by ^### ): ${subsections.length}`);
  
  for (let i = 0; i < Math.min(subsections.length, 3); i++) {
    const section = subsections[i];
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    console.log(`\n--- Subsection ${i + 1} ---`);
    console.log(`Title: ${title.substring(0, 60)}`);
    console.log(`Lines in section: ${lines.length}`);
    
    // Check for skip conditions
    if (section.startsWith('#')) {
      console.log(`  ❌ SKIP: Starts with #`);
      continue;
    }
    if (section.includes('Template')) {
      console.log(`  ❌ SKIP: Contains Template`);
      continue;
    }
    if (section.includes('None Currently')) {
      console.log(`  ❌ SKIP: Contains None Currently`);
      continue;
    }
    
    // Look for **Problem:**
    let hasProblem = false;
    let problemContent = '';
    let inProblemSection = false;
    
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      
      if (line === '**Problem:**') {
        hasProblem = true;
        inProblemSection = true;
        console.log(`  ✓ Found **Problem:** at line ${j}`);
        continue;
      }
      
      if (line.startsWith('**') && line.endsWith(':**')) {
        inProblemSection = false;
      }
      
      if (inProblemSection && line && !line.startsWith('#') && !line.startsWith('-')) {
        problemContent += (problemContent ? ' ' : '') + line;
      }
    }
    
    console.log(`  Has **Problem:**: ${hasProblem}`);
    console.log(`  Problem content: ${problemContent.substring(0, 80)}...`);
    
    if (hasProblem && problemContent) {
      console.log(`  ✅ WOULD ADD THIS ENTRY`);
    } else {
      console.log(`  ❌ SKIP: No problem content`);
    }
  }
}

async function debugNextSteps() {
  console.log(chalk.bold.cyan('\n\n3. DEBUGGING NEXT STEPS\n'));
  
  // Try backup first
  let filePath = path.join('.ai', 'next-steps.md.backup');
  if (!(await fs.pathExists(filePath))) {
    filePath = path.join('.ai', 'next-steps.md');
  }
  
  console.log(`Reading: ${filePath}`);
  
  const content = await fs.readFile(filePath, 'utf8');
  
  console.log(`File length: ${content.length} chars`);
  console.log(`File lines: ${content.split('\n').length}`);
  
  const lines = content.split('\n');
  let taskCount = 0;
  let doneCount = 0;
  
  for (const line of lines) {
    if (line.trim().startsWith('- [ ]')) {
      taskCount++;
      if (taskCount <= 3) {
        console.log(`  TODO: ${line.trim().substring(6, 60)}`);
      }
    } else if (line.trim().startsWith('- [x]')) {
      doneCount++;
      if (doneCount <= 3) {
        console.log(`  DONE: ${line.trim().substring(6, 60)}`);
      }
    }
  }
  
  console.log(`\nTotal TODO tasks: ${taskCount}`);
  console.log(`Total DONE tasks: ${doneCount}`);
  console.log(`Total tasks: ${taskCount + doneCount}`);
  
  if (taskCount + doneCount > 0) {
    console.log(`  ✅ WOULD ADD ${taskCount + doneCount} ENTRIES`);
  } else {
    console.log(`  ❌ NO TASKS FOUND`);
  }
}

async function main() {
  try {
    await debugTechnicalDecisions();
    await debugKnownIssues();
    await debugNextSteps();
    
    console.log(chalk.bold.green('\n\n✅ DEBUG COMPLETE\n'));
  } catch (error) {
    console.error(chalk.red('ERROR:'), error.message);
    console.error(error.stack);
  }
}

main();

