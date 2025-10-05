import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface AugmentCommandRecord {
  originalCommand: string;
  executionTimeSeconds: number | null;
  timeoutUsed: number;
  timestamp: number;
}

interface AugmentCommandHistory {
  records: AugmentCommandRecord[];
}

interface AugmentSession {
  sessionId: string;
  commands: AugmentCommandRecord[];
  timespan: {
    start: Date;
    end: Date;
    durationMinutes: number;
  };
  workingDirectory?: string;
  projectContext: string[];
}

export class AugmentSessionParser {
  private readonly augmentPath: string;

  constructor() {
    this.augmentPath = join(
      homedir(),
      'Library/Application Support/Code/User/workspaceStorage/e2c7b971353f6b71f11978d7b2402e67/Augment.vscode-augment/augment-user-assets'
    );
  }

  async parseCommandHistory(): Promise<AugmentSession[]> {
    try {
      const historyPath = join(this.augmentPath, 'commandExecutionHistory');
      const historyData = await readFile(historyPath, 'utf-8');
      const history: AugmentCommandHistory = JSON.parse(historyData);

      // Group commands into sessions based on temporal proximity and git activity
      const sessions = this.groupIntoSessions(history.records);
      
      return sessions;
    } catch (error) {
      console.error('Failed to parse Augment command history:', error);
      return [];
    }
  }

  private groupIntoSessions(records: AugmentCommandRecord[]): AugmentSession[] {
    if (!records || records.length === 0) return [];

    // Sort by timestamp (newest first, but we'll reverse for processing)
    const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
    
    const sessions: AugmentSession[] = [];
    let currentSession: AugmentCommandRecord[] = [];
    let sessionStartTime = sortedRecords[0].timestamp;
    let lastCommandTime = sessionStartTime;

    for (const record of sortedRecords) {
      const timeDiff = record.timestamp - lastCommandTime;
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

      // If more than 30 minutes gap, start a new session
      if (timeDiff > thirtyMinutes && currentSession.length > 0) {
        sessions.push(this.createSession(currentSession, sessionStartTime));
        currentSession = [record];
        sessionStartTime = record.timestamp;
      } else {
        currentSession.push(record);
      }

      lastCommandTime = record.timestamp;
    }

    // Add the last session
    if (currentSession.length > 0) {
      sessions.push(this.createSession(currentSession, sessionStartTime));
    }

    // Sort sessions by start time (newest first)
    return sessions.sort((a, b) => b.timespan.start.getTime() - a.timespan.start.getTime());
  }

  private createSession(commands: AugmentCommandRecord[], startTime: number): AugmentSession {
    const endTime = Math.max(...commands.map(c => c.timestamp));
    const duration = (endTime - startTime) / (1000 * 60); // minutes

    // Extract project context from git commits and file operations
    const projectContext = this.extractProjectContext(commands);

    return {
      sessionId: `augment-${startTime}`,
      commands,
      timespan: {
        start: new Date(startTime),
        end: new Date(endTime),
        durationMinutes: Math.round(duration)
      },
      projectContext
    };
  }

  private extractProjectContext(commands: AugmentCommandRecord[]): string[] {
    const context: Set<string> = new Set();

    for (const cmd of commands) {
      const command = cmd.originalCommand;

      // Extract git commit messages for project context
      if (command.startsWith('git commit -m')) {
        const commitMsg = this.extractCommitMessage(command);
        if (commitMsg) {
          context.add(`Git commit: ${commitMsg.substring(0, 100)}...`);
        }
      }

      // Extract project names from directory operations
      if (command.includes('cd ') && !command.includes('node_modules')) {
        const dirMatch = command.match(/cd\s+([^\s&|;]+)/);
        if (dirMatch) {
          context.add(`Working in: ${dirMatch[1]}`);
        }
      }

      // Extract key file operations
      if (command.match(/\.(ts|tsx|js|jsx|py|md|json)(\s|$)/)) {
        context.add(`File operations: ${command.substring(0, 50)}...`);
      }

      // Extract npm/development commands
      if (command.startsWith('npm ') || command.startsWith('npx ') || command.startsWith('yarn ')) {
        context.add(`Development: ${command.substring(0, 50)}...`);
      }
    }

    return Array.from(context);
  }

  private extractCommitMessage(gitCommitCommand: string): string | null {
    // Extract message from git commit -m "message"
    const match = gitCommitCommand.match(/git commit -m ["'](.+?)["']/s);
    return match ? match[1] : null;
  }

  async getRecentSessions(hours: number = 24): Promise<AugmentSession[]> {
    const sessions = await this.parseCommandHistory();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return sessions.filter(session => session.timespan.start > cutoff);
  }

  async findSessionsByProject(projectName: string): Promise<AugmentSession[]> {
    const sessions = await this.parseCommandHistory();
    
    return sessions.filter(session => 
      session.projectContext.some(context => 
        context.toLowerCase().includes(projectName.toLowerCase())
      )
    );
  }

  async generateSessionSummary(session: AugmentSession): Promise<string> {
    const { timespan, commands, projectContext } = session;
    
    const summary = [
      `## Session Summary (${timespan.durationMinutes} minutes)`,
      `**Duration:** ${timespan.start.toLocaleString()} - ${timespan.end.toLocaleString()}`,
      `**Commands executed:** ${commands.length}`,
      '',
      '### Project Context:',
      ...projectContext.map(ctx => `- ${ctx}`),
      '',
      '### Key Commands:',
      ...this.getKeyCommands(commands).map(cmd => `- ${cmd}`),
    ];

    return summary.join('\n');
  }

  private getKeyCommands(commands: AugmentCommandRecord[]): string[] {
    const keyCommands: string[] = [];
    
    // Get git commits
    const commits = commands.filter(cmd => 
      cmd.originalCommand.startsWith('git commit -m')
    ).slice(0, 3);
    
    keyCommands.push(...commits.map(cmd => cmd.originalCommand));

    // Get significant build/run commands
    const buildCommands = commands.filter(cmd => 
      cmd.originalCommand.match(/^(npm|npx|yarn)\s+(run\s+)?(build|dev|start|test)/)
    ).slice(0, 2);
    
    keyCommands.push(...buildCommands.map(cmd => cmd.originalCommand));

    return keyCommands;
  }
}