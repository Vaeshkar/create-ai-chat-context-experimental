#!/usr/bin/env node

import { program } from 'commander';
import { UnifiedSessionAnalyzer } from '../session-parsers/unified-analyzer';
import { AugmentSessionParser } from '../session-parsers/augment-parser';
import { WarpSessionParser } from '../session-parsers/warp-parser';

const analyzer = new UnifiedSessionAnalyzer();
const augmentParser = new AugmentSessionParser();
const warpParser = new WarpSessionParser();

program
  .name('session-analyzer')
  .description('Analyze development sessions from Augment VSCode extension and Warp terminal')
  .version('1.0.0');

program
  .command('report')
  .description('Generate a comprehensive work report')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .action(async (options) => {
    try {
      console.log(`🔍 Analyzing sessions from the last ${options.hours} hours...`);
      
      const report = await analyzer.generateWorkReport(parseInt(options.hours));
      console.log('\n' + report);
    } catch (error) {
      console.error('❌ Error generating report:', error);
      process.exit(1);
    }
  });

program
  .command('sessions')
  .description('List recent development sessions')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .option('-m, --min-duration <minutes>', 'Minimum session duration', '10')
  .option('-p, --project <name>', 'Filter by project name')
  .action(async (options) => {
    try {
      let sessions;
      
      if (options.project) {
        console.log(`🔍 Finding sessions for project: ${options.project}`);
        sessions = await analyzer.findProjectSessions(options.project);
      } else {
        console.log(`🔍 Finding sessions from the last ${options.hours} hours...`);
        const analysis = await analyzer.analyzeRecentSessions(parseInt(options.hours));
        sessions = analysis.sessions;
      }

      const filteredSessions = sessions.filter(s => 
        s.timespan.durationMinutes >= parseInt(options.minDuration)
      );

      if (filteredSessions.length === 0) {
        console.log('📭 No sessions found matching the criteria');
        return;
      }

      console.log(`\n📊 Found ${filteredSessions.length} sessions:\n`);

      for (const session of filteredSessions.slice(0, 10)) {
        const duration = session.timespan.durationMinutes;
        const projects = session.context.projectNames.join(', ') || 'Unknown';
        const techs = session.context.technologies.slice(0, 3).join(', ');
        
        console.log(`┌─ ${session.source.toUpperCase()} Session (${duration} min)`);
        console.log(`├─ Time: ${session.timespan.start.toLocaleString()}`);
        console.log(`├─ Projects: ${projects}`);
        console.log(`├─ Technologies: ${techs}`);
        console.log(`├─ Commands: ${session.commands.length}`);
        
        if (session.workSession.achievements.length > 0) {
          console.log(`├─ Achievements:`);
          session.workSession.achievements.slice(0, 2).forEach(achievement => {
            console.log(`│  ✅ ${achievement}`);
          });
        }
        
        console.log('└─' + '─'.repeat(50) + '\n');
      }
    } catch (error) {
      console.error('❌ Error listing sessions:', error);
      process.exit(1);
    }
  });

program
  .command('working')
  .description('Find substantial working sessions')
  .option('-m, --min-duration <minutes>', 'Minimum duration in minutes', '60')
  .action(async (options) => {
    try {
      console.log(`🔍 Finding working sessions (${options.minDuration}+ minutes)...`);
      
      const sessions = await analyzer.findWorkingSessions(parseInt(options.minDuration));
      
      if (sessions.length === 0) {
        console.log('📭 No substantial working sessions found');
        return;
      }

      console.log(`\n📊 Found ${sessions.length} substantial working sessions:\n`);

      for (const session of sessions.slice(0, 10)) {
        const hours = Math.round(session.timespan.durationMinutes / 60 * 10) / 10;
        const projects = session.context.projectNames.join(', ') || 'Unknown';
        
        console.log(`🔨 ${session.source.toUpperCase()} Session - ${hours}h`);
        console.log(`   Time: ${session.timespan.start.toLocaleString()} - ${session.timespan.end.toLocaleString()}`);
        console.log(`   Projects: ${projects}`);
        console.log(`   Focus Areas: ${session.workSession.focusAreas.join(', ')}`);
        console.log(`   Commands: ${session.commands.length}`);
        
        if (session.workSession.achievements.length > 0) {
          console.log(`   Key Achievements:`);
          session.workSession.achievements.slice(0, 3).forEach(achievement => {
            console.log(`     ✅ ${achievement}`);
          });
        }
        
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error finding working sessions:', error);
      process.exit(1);
    }
  });

program
  .command('augment')
  .description('Analyze Augment VSCode extension data')
  .option('-s, --sessions', 'Show recent sessions')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .action(async (options) => {
    try {
      if (options.sessions) {
        console.log(`🔍 Analyzing Augment sessions from the last ${options.hours} hours...`);
        
        const sessions = await augmentParser.getRecentSessions(parseInt(options.hours));
        
        if (sessions.length === 0) {
          console.log('📭 No Augment sessions found');
          return;
        }

        console.log(`\n📊 Found ${sessions.length} Augment sessions:\n`);

        for (const session of sessions.slice(0, 5)) {
          const summary = await augmentParser.generateSessionSummary(session);
          console.log(summary);
          console.log('\n' + '─'.repeat(60) + '\n');
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing Augment data:', error);
      process.exit(1);
    }
  });

program
  .command('warp')
  .description('Analyze Warp terminal data')
  .option('-s, --sessions', 'Show recent sessions')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .option('-l, --long', 'Show only long-running sessions (60+ min)')
  .action(async (options) => {
    try {
      if (options.long) {
        console.log('🔍 Finding long-running Warp sessions (60+ minutes)...');
        
        const sessions = await warpParser.findLongRunningSessions(60);
        
        if (sessions.length === 0) {
          console.log('📭 No long-running Warp sessions found');
          return;
        }

        console.log(`\n📊 Found ${sessions.length} long-running sessions:\n`);

        for (const session of sessions.slice(0, 5)) {
          const summary = await warpParser.generateSessionSummary(session);
          console.log(summary);
          console.log('\n' + '─'.repeat(60) + '\n');
        }
      } else if (options.sessions) {
        console.log(`🔍 Analyzing Warp sessions from the last ${options.hours} hours...`);
        
        const sessions = await warpParser.getRecentSessions(parseInt(options.hours));
        
        if (sessions.length === 0) {
          console.log('📭 No Warp sessions found');
          return;
        }

        console.log(`\n📊 Found ${sessions.length} Warp sessions:\n`);

        for (const session of sessions.slice(0, 5)) {
          const summary = await warpParser.generateSessionSummary(session);
          console.log(summary);
          console.log('\n' + '─'.repeat(60) + '\n');
        }
      }
    } catch (error) {
      console.error('❌ Error analyzing Warp data:', error);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export session data for AI context')
  .option('-h, --hours <hours>', 'Hours to look back', '24')
  .option('-p, --project <name>', 'Filter by project name')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (options) => {
    try {
      let sessions;
      
      if (options.project) {
        console.log(`🔍 Exporting sessions for project: ${options.project}`, '(to stderr for output clarity)');
        sessions = await analyzer.findProjectSessions(options.project);
      } else {
        console.log(`🔍 Exporting sessions from the last ${options.hours} hours...`, '(to stderr for output clarity)');
        const analysis = await analyzer.analyzeRecentSessions(parseInt(options.hours));
        sessions = analysis.sessions;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        criteria: {
          hours: options.hours,
          project: options.project || null
        },
        summary: {
          totalSessions: sessions.length,
          totalCommands: sessions.reduce((sum, s) => sum + s.commands.length, 0),
          totalDuration: sessions.reduce((sum, s) => sum + s.timespan.durationMinutes, 0)
        },
        sessions: sessions.map(session => ({
          ...session,
          // Convert dates to ISO strings for JSON serialization
          timespan: {
            ...session.timespan,
            start: session.timespan.start.toISOString(),
            end: session.timespan.end.toISOString()
          },
          commands: session.commands.map(cmd => ({
            ...cmd,
            timestamp: cmd.timestamp.toISOString()
          }))
        }))
      };

      const output = JSON.stringify(exportData, null, 2);

      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, output);
        console.log(`✅ Session data exported to ${options.output}` + '\n', '(sessions:', sessions.length, ', commands:', exportData.summary.totalCommands + ')');
      } else {
        // Output to stdout
        console.log('\n' + '─'.repeat(20) + ' SESSION DATA EXPORT ' + '─'.repeat(20) + '\n');
        console.log(output);
      }
    } catch (error) {
      console.error('❌ Error exporting sessions:', error);
      process.exit(1);
    }
  });

// Add help examples
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ session-analyzer report --hours 48           # Generate 48-hour activity report');
  console.log('  $ session-analyzer sessions --min-duration 30 # List sessions 30+ minutes');
  console.log('  $ session-analyzer working --min-duration 120 # Find 2+ hour work sessions');
  console.log('  $ session-analyzer sessions --project "toy-store" # Sessions for specific project');
  console.log('  $ session-analyzer export --hours 72 --output context.json # Export for AI');
  console.log('  $ session-analyzer augment --sessions          # Analyze Augment data only');
  console.log('  $ session-analyzer warp --sessions --long     # Analyze Warp long sessions');
  console.log('');
});

// Parse command line arguments
program.parse();