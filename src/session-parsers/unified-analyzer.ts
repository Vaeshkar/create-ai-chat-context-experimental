import { AugmentSessionParser } from './augment-parser';
import { WarpSessionParser } from './warp-parser';

interface UnifiedSession {
  sessionId: string;
  source: 'augment' | 'warp' | 'combined';
  timespan: {
    start: Date;
    end: Date;
    durationMinutes: number;
  };
  commands: Array<{
    command: string;
    timestamp: Date;
    output?: string;
    source: 'augment' | 'warp';
    metadata?: any;
  }>;
  context: {
    projectNames: string[];
    workingDirectories: string[];
    gitBranches: string[];
    technologies: string[];
    keyInsights: string[];
  };
  workSession: {
    focusAreas: string[];
    achievements: string[];
    challenges: string[];
    nextSteps: string[];
  };
}

interface SessionAnalysisResult {
  totalSessions: number;
  totalCommands: number;
  totalWorkingTime: number;
  mostActiveDays: Array<{ date: string; sessions: number; duration: number }>;
  topProjects: Array<{ project: string; sessions: number; totalTime: number }>;
  technologyUsage: Array<{ tech: string; frequency: number }>;
  sessions: UnifiedSession[];
}

export class UnifiedSessionAnalyzer {
  private augmentParser: AugmentSessionParser;
  private warpParser: WarpSessionParser;

  constructor() {
    this.augmentParser = new AugmentSessionParser();
    this.warpParser = new WarpSessionParser();
  }

  async analyzeRecentSessions(hours: number = 24): Promise<SessionAnalysisResult> {
    const [augmentSessions, warpSessions] = await Promise.all([
      this.augmentParser.getRecentSessions(hours),
      this.warpParser.getRecentSessions(hours)
    ]);

    const unifiedSessions = this.combineAndEnrichSessions(augmentSessions, warpSessions);
    
    return this.generateAnalysisResult(unifiedSessions);
  }

  async findWorkingSessions(minDurationMinutes: number = 30): Promise<UnifiedSession[]> {
    const [augmentSessions, warpSessions] = await Promise.all([
      this.augmentParser.parseCommandHistory(),
      this.warpParser.parseNetworkLog()
    ]);

    const unifiedSessions = this.combineAndEnrichSessions(augmentSessions, warpSessions);
    
    return unifiedSessions.filter(session => 
      session.timespan.durationMinutes >= minDurationMinutes
    );
  }

  async findProjectSessions(projectName: string): Promise<UnifiedSession[]> {
    const [augmentSessions, warpSessions] = await Promise.all([
      this.augmentParser.findSessionsByProject(projectName),
      this.warpParser.findSessionsByProject(projectName)
    ]);

    return this.combineAndEnrichSessions(augmentSessions, warpSessions);
  }

  private combineAndEnrichSessions(augmentSessions: any[], warpSessions: any[]): UnifiedSession[] {
    const unifiedSessions: UnifiedSession[] = [];

    // Process Augment sessions
    for (const session of augmentSessions) {
      const unifiedSession: UnifiedSession = {
        sessionId: session.sessionId,
        source: 'augment',
        timespan: session.timespan,
        commands: session.commands.map((cmd: any) => ({
          command: cmd.originalCommand,
          timestamp: new Date(cmd.timestamp),
          source: 'augment' as const,
          metadata: {
            executionTime: cmd.executionTimeSeconds,
            timeout: cmd.timeoutUsed
          }
        })),
        context: {
          projectNames: this.extractProjectNames(session.projectContext),
          workingDirectories: this.extractWorkingDirs(session.projectContext),
          gitBranches: [],
          technologies: this.detectTechnologies(session.commands),
          keyInsights: session.projectContext
        },
        workSession: this.analyzeWorkSession(session.commands)
      };

      unifiedSessions.push(unifiedSession);
    }

    // Process Warp sessions
    for (const session of warpSessions) {
      const unifiedSession: UnifiedSession = {
        sessionId: session.sessionId,
        source: 'warp',
        timespan: session.timespan,
        commands: session.commands.map((cmd: any) => ({
          command: cmd.command,
          timestamp: cmd.timestamp,
          output: cmd.output,
          source: 'warp' as const,
          metadata: {
            exitCode: cmd.exitCode,
            pwd: cmd.pwd,
            gitBranch: cmd.gitBranch,
            executionTime: cmd.executionTimeMs
          }
        })),
        context: {
          projectNames: this.extractProjectNamesFromCommands(session.commands),
          workingDirectories: session.context.workingDirectories,
          gitBranches: session.context.gitBranches,
          technologies: this.detectTechnologies(session.commands),
          keyInsights: []
        },
        workSession: this.analyzeWorkSession(session.commands)
      };

      unifiedSessions.push(unifiedSession);
    }

    // Try to merge overlapping sessions from different sources
    const mergedSessions = this.mergeOverlappingSessions(unifiedSessions);

    // Sort by start time (newest first)
    return mergedSessions.sort((a, b) => 
      b.timespan.start.getTime() - a.timespan.start.getTime()
    );
  }

  private mergeOverlappingSessions(sessions: UnifiedSession[]): UnifiedSession[] {
    const mergedSessions: UnifiedSession[] = [];
    const processed = new Set<string>();

    for (const session of sessions) {
      if (processed.has(session.sessionId)) continue;

      // Find overlapping sessions from other sources
      const overlapping = sessions.filter(other => 
        other.sessionId !== session.sessionId &&
        other.source !== session.source &&
        this.sessionsOverlap(session, other)
      );

      if (overlapping.length > 0) {
        // Merge sessions
        const mergedSession = this.mergeSessions(session, overlapping);
        mergedSessions.push(mergedSession);
        
        // Mark all as processed
        processed.add(session.sessionId);
        overlapping.forEach(s => processed.add(s.sessionId));
      } else {
        mergedSessions.push(session);
        processed.add(session.sessionId);
      }
    }

    return mergedSessions;
  }

  private sessionsOverlap(session1: UnifiedSession, session2: UnifiedSession): boolean {
    const overlap = Math.max(0, 
      Math.min(session1.timespan.end.getTime(), session2.timespan.end.getTime()) -
      Math.max(session1.timespan.start.getTime(), session2.timespan.start.getTime())
    );
    
    const overlapMinutes = overlap / (1000 * 60);
    const threshold = 10; // 10 minutes overlap threshold
    
    return overlapMinutes >= threshold;
  }

  private mergeSessions(primary: UnifiedSession, others: UnifiedSession[]): UnifiedSession {
    const allSessions = [primary, ...others];
    
    // Combine all commands and sort by timestamp
    const allCommands = allSessions.flatMap(s => s.commands)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Determine overall timespan
    const allTimes = allSessions.map(s => [s.timespan.start, s.timespan.end]).flat();
    const start = new Date(Math.min(...allTimes.map(t => t.getTime())));
    const end = new Date(Math.max(...allTimes.map(t => t.getTime())));
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);

    // Merge context
    const context = {
      projectNames: [...new Set(allSessions.flatMap(s => s.context.projectNames))],
      workingDirectories: [...new Set(allSessions.flatMap(s => s.context.workingDirectories))],
      gitBranches: [...new Set(allSessions.flatMap(s => s.context.gitBranches))],
      technologies: [...new Set(allSessions.flatMap(s => s.context.technologies))],
      keyInsights: [...new Set(allSessions.flatMap(s => s.context.keyInsights))]
    };

    // Merge work session analysis
    const workSession = {
      focusAreas: [...new Set(allSessions.flatMap(s => s.workSession.focusAreas))],
      achievements: [...new Set(allSessions.flatMap(s => s.workSession.achievements))],
      challenges: [...new Set(allSessions.flatMap(s => s.workSession.challenges))],
      nextSteps: [...new Set(allSessions.flatMap(s => s.workSession.nextSteps))]
    };

    return {
      sessionId: `merged-${primary.sessionId}`,
      source: 'combined',
      timespan: {
        start,
        end,
        durationMinutes: Math.round(duration)
      },
      commands: allCommands,
      context,
      workSession
    };
  }

  private extractProjectNames(projectContext: string[]): string[] {
    const projects: Set<string> = new Set();
    
    for (const context of projectContext) {
      // Extract from "Working in: /path/to/project"
      const workingMatch = context.match(/Working in: .*\/([^\/]+)$/);
      if (workingMatch) {
        projects.add(workingMatch[1]);
      }
      
      // Extract from git commits
      const commitMatch = context.match(/Git commit: (.+?)\.\.\./);
      if (commitMatch) {
        // Try to extract project name from commit message
        const projectFromCommit = this.extractProjectFromText(commitMatch[1]);
        if (projectFromCommit) {
          projects.add(projectFromCommit);
        }
      }
    }
    
    return Array.from(projects);
  }

  private extractProjectNamesFromCommands(commands: any[]): string[] {
    const projects: Set<string> = new Set();
    
    for (const cmd of commands) {
      if (cmd.pwd) {
        const pathParts = cmd.pwd.split('/');
        const projectName = pathParts[pathParts.length - 1];
        if (projectName && !projectName.startsWith('.')) {
          projects.add(projectName);
        }
      }
    }
    
    return Array.from(projects);
  }

  private extractWorkingDirs(projectContext: string[]): string[] {
    const dirs: Set<string> = new Set();
    
    for (const context of projectContext) {
      const workingMatch = context.match(/Working in: (.+)/);
      if (workingMatch) {
        dirs.add(workingMatch[1]);
      }
    }
    
    return Array.from(dirs);
  }

  private detectTechnologies(commands: any[]): string[] {
    const techPatterns = {
      'Node.js': /\b(npm|npx|node|yarn)\b/,
      'Python': /\b(python|pip|pytest|django|flask)\b/,
      'Git': /\b(git)\b/,
      'Docker': /\b(docker|dockerfile)\b/,
      'React': /\b(react|jsx|tsx)\b/,
      'TypeScript': /\b(tsc|typescript|\.ts|\.tsx)\b/,
      'Next.js': /\b(next|nextjs)\b/,
      'Rust': /\b(cargo|rust|\.rs)\b/,
      'Go': /\b(go\s+|golang)\b/,
      'MongoDB': /\b(mongo|mongodb)\b/,
      'PostgreSQL': /\b(pg|postgres|psql)\b/,
      'Redis': /\b(redis)\b/,
      'Webpack': /\b(webpack)\b/,
      'Vite': /\b(vite)\b/,
      'ESLint': /\b(eslint)\b/,
      'Jest': /\b(jest)\b/,
      'Cypress': /\b(cypress)\b/
    };
    
    const technologies: Set<string> = new Set();
    
    for (const cmd of commands) {
      const command = (cmd.originalCommand || cmd.command || '').toLowerCase();
      
      for (const [tech, pattern] of Object.entries(techPatterns)) {
        if (pattern.test(command)) {
          technologies.add(tech);
        }
      }
    }
    
    return Array.from(technologies);
  }

  private analyzeWorkSession(commands: any[]): UnifiedSession['workSession'] {
    const focusAreas: Set<string> = new Set();
    const achievements: Set<string> = new Set();
    const challenges: Set<string> = new Set();
    const nextSteps: Set<string> = new Set();

    for (const cmd of commands) {
      const command = (cmd.originalCommand || cmd.command || '').toLowerCase();
      
      // Detect focus areas
      if (command.includes('test')) focusAreas.add('Testing');
      if (command.includes('build') || command.includes('compile')) focusAreas.add('Building/Compilation');
      if (command.includes('git commit')) focusAreas.add('Version Control');
      if (command.includes('deploy')) focusAreas.add('Deployment');
      if (command.includes('debug') || command.includes('log')) focusAreas.add('Debugging');
      if (command.includes('install') || command.includes('add')) focusAreas.add('Dependency Management');
      
      // Detect achievements from git commits
      if (command.startsWith('git commit')) {
        const message = this.extractCommitMessage(command);
        if (message) {
          if (message.includes('fix') || message.includes('resolve')) {
            achievements.add(`Fixed: ${message.substring(0, 50)}...`);
          } else if (message.includes('add') || message.includes('implement')) {
            achievements.add(`Implemented: ${message.substring(0, 50)}...`);
          } else if (message.includes('refactor') || message.includes('improve')) {
            achievements.add(`Improved: ${message.substring(0, 50)}...`);
          }
        }
      }
      
      // Detect challenges from error patterns
      if (cmd.exitCode && cmd.exitCode !== 0) {
        challenges.add(`Command failed: ${command.substring(0, 40)}...`);
      }
    }

    return {
      focusAreas: Array.from(focusAreas),
      achievements: Array.from(achievements).slice(0, 5), // Limit to top 5
      challenges: Array.from(challenges).slice(0, 3), // Limit to top 3
      nextSteps: [] // Would need more context to infer next steps
    };
  }

  private extractCommitMessage(command: string): string | null {
    const match = command.match(/git commit -m ["'](.+?)["']/s);
    return match ? match[1] : null;
  }

  private extractProjectFromText(text: string): string | null {
    // Simple heuristics to extract project names from commit messages
    const patterns = [
      /\b([a-z-]+(?:-[a-z]+)*)\s*:/i, // project: message
      /\b(feat|fix|docs|refactor|test)\(([^)]+)\):/i, // conventional commits
      /\b([a-z-]{3,})\s+/i // standalone project-like words
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.length > 1) {
        const candidate = match[match.length - 1];
        if (candidate.length >= 3 && candidate.length <= 30) {
          return candidate;
        }
      }
    }
    
    return null;
  }

  private generateAnalysisResult(sessions: UnifiedSession[]): SessionAnalysisResult {
    const totalCommands = sessions.reduce((sum, session) => sum + session.commands.length, 0);
    const totalWorkingTime = sessions.reduce((sum, session) => sum + session.timespan.durationMinutes, 0);

    // Group by date for activity analysis
    const dayActivity = new Map<string, { sessions: number; duration: number }>();
    for (const session of sessions) {
      const dateKey = session.timespan.start.toISOString().split('T')[0];
      const current = dayActivity.get(dateKey) || { sessions: 0, duration: 0 };
      current.sessions++;
      current.duration += session.timespan.durationMinutes;
      dayActivity.set(dateKey, current);
    }

    const mostActiveDays = Array.from(dayActivity.entries())
      .map(([date, activity]) => ({ date, ...activity }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 7);

    // Analyze project activity
    const projectActivity = new Map<string, { sessions: number; totalTime: number }>();
    for (const session of sessions) {
      for (const project of session.context.projectNames) {
        const current = projectActivity.get(project) || { sessions: 0, totalTime: 0 };
        current.sessions++;
        current.totalTime += session.timespan.durationMinutes;
        projectActivity.set(project, current);
      }
    }

    const topProjects = Array.from(projectActivity.entries())
      .map(([project, activity]) => ({ project, ...activity }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    // Analyze technology usage
    const techFrequency = new Map<string, number>();
    for (const session of sessions) {
      for (const tech of session.context.technologies) {
        techFrequency.set(tech, (techFrequency.get(tech) || 0) + 1);
      }
    }

    const technologyUsage = Array.from(techFrequency.entries())
      .map(([tech, frequency]) => ({ tech, frequency }))
      .sort((a, b) => b.frequency - a.frequency);

    return {
      totalSessions: sessions.length,
      totalCommands,
      totalWorkingTime,
      mostActiveDays,
      topProjects,
      technologyUsage,
      sessions
    };
  }

  async generateWorkReport(hours: number = 24): Promise<string> {
    const analysis = await this.analyzeRecentSessions(hours);
    
    const report = [
      `# Development Activity Report (Last ${hours} hours)`,
      '',
      `## Overview`,
      `- **Total Sessions:** ${analysis.totalSessions}`,
      `- **Total Commands:** ${analysis.totalCommands}`,
      `- **Total Working Time:** ${Math.round(analysis.totalWorkingTime / 60 * 10) / 10} hours`,
      '',
      `## Most Active Projects`,
      ...analysis.topProjects.slice(0, 5).map(p => 
        `- **${p.project}**: ${p.sessions} sessions, ${Math.round(p.totalTime)} minutes`
      ),
      '',
      `## Technology Usage`,
      ...analysis.technologyUsage.slice(0, 8).map(t => 
        `- ${t.tech}: ${t.frequency} sessions`
      ),
      '',
      `## Recent Sessions`,
      ...analysis.sessions.slice(0, 3).map(session => {
        const duration = session.timespan.durationMinutes;
        const projects = session.context.projectNames.join(', ') || 'Unknown';
        const technologies = session.context.technologies.slice(0, 3).join(', ');
        
        return [
          `### ${session.source.toUpperCase()} Session (${duration} min)`,
          `**Time:** ${session.timespan.start.toLocaleString()} - ${session.timespan.end.toLocaleString()}`,
          `**Projects:** ${projects}`,
          `**Technologies:** ${technologies}`,
          `**Commands:** ${session.commands.length}`,
          ...session.workSession.achievements.slice(0, 2).map(a => `- ✅ ${a}`),
          ''
        ].join('\n');
      })
    ];

    return report.join('\n');
  }
}