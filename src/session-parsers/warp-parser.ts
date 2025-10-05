import { readFile } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';

interface WarpNetworkLogEntry {
  timestamp: string;
  method?: string;
  url?: string;
  body?: {
    command?: string;
    output?: string;
    exit_code?: number;
    start_ts?: string;
    completed_ts?: string;
    pwd?: string;
    shell?: string;
    username?: string;
    hostname?: string;
    session_id?: number;
    git_branch?: string;
    block_id?: string;
  };
}

interface WarpSession {
  sessionId: string;
  commands: WarpCommand[];
  timespan: {
    start: Date;
    end: Date;
    durationMinutes: number;
  };
  context: {
    hostname: string;
    username: string;
    shell: string;
    gitBranches: string[];
    workingDirectories: string[];
  };
}

interface WarpCommand {
  command: string;
  output?: string;
  exitCode: number;
  timestamp: Date;
  pwd: string;
  gitBranch?: string;
  executionTimeMs?: number;
}

export class WarpSessionParser {
  private readonly warpPath: string;

  constructor() {
    this.warpPath = join(
      homedir(),
      'Library/Application Support/dev.warp.Warp-Stable'
    );
  }

  async parseNetworkLog(): Promise<WarpSession[]> {
    try {
      const logPath = join(this.warpPath, 'warp_network.log');
      const logData = await readFile(logPath, 'utf-8');
      
      const entries = this.parseLogEntries(logData);
      const sessions = this.groupIntoSessions(entries);
      
      return sessions;
    } catch (error) {
      console.error('Failed to parse Warp network log:', error);
      return [];
    }
  }

  private parseLogEntries(logData: string): WarpNetworkLogEntry[] {
    const entries: WarpNetworkLogEntry[] = [];
    const lines = logData.split('\n');
    
    let currentEntry: Partial<WarpNetworkLogEntry> = {};
    let inBodySection = false;
    let bodyLines: string[] = [];

    for (const line of lines) {
      // Check for timestamp line (start of new entry)
      const timestampMatch = line.match(/^\[([^\]]+)\]: (Request|Response)/);
      if (timestampMatch) {
        // Save previous entry if we have one
        if (currentEntry.timestamp && inBodySection && bodyLines.length > 0) {
          try {
            const bodyText = bodyLines.join('\n');
            currentEntry.body = JSON.parse(bodyText);
          } catch (e) {
            // Skip malformed JSON
          }
        }
        if (currentEntry.timestamp) {
          entries.push(currentEntry as WarpNetworkLogEntry);
        }

        // Start new entry
        currentEntry = {
          timestamp: timestampMatch[1]
        };
        inBodySection = false;
        bodyLines = [];
      }
      
      // Extract URL and method from Request lines
      if (line.includes('method:') && line.includes('url:')) {
        const methodMatch = line.match(/method: (\w+)/);
        const urlMatch = line.match(/url: [^,]+ "([^"]+)"/);
        
        if (methodMatch) currentEntry.method = methodMatch[1];
        if (urlMatch) currentEntry.url = urlMatch[1];
      }

      // Check for body start
      if (line.trim() === 'Body {') {
        inBodySection = true;
        bodyLines = ['{'];
      } else if (inBodySection && line.trim() === '}') {
        bodyLines.push('}');
        // Try to parse the body
        try {
          const bodyText = bodyLines.join('\n');
          currentEntry.body = JSON.parse(bodyText);
        } catch (e) {
          // Skip malformed JSON
        }
        inBodySection = false;
      } else if (inBodySection) {
        bodyLines.push(line);
      }
    }

    // Handle last entry
    if (currentEntry.timestamp && inBodySection && bodyLines.length > 0) {
      try {
        const bodyText = bodyLines.join('\n');
        currentEntry.body = JSON.parse(bodyText);
      } catch (e) {
        // Skip malformed JSON
      }
    }
    if (currentEntry.timestamp) {
      entries.push(currentEntry as WarpNetworkLogEntry);
    }

    return entries.filter(entry => 
      entry.body?.command && 
      entry.url?.includes('/analytics/block')
    );
  }

  private groupIntoSessions(entries: WarpNetworkLogEntry[]): WarpSession[] {
    if (!entries || entries.length === 0) return [];

    // Group by session_id from the logs
    const sessionMap = new Map<number, WarpNetworkLogEntry[]>();
    
    for (const entry of entries) {
      if (entry.body?.session_id) {
        const sessionId = entry.body.session_id;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, []);
        }
        sessionMap.get(sessionId)!.push(entry);
      }
    }

    const sessions: WarpSession[] = [];

    for (const [sessionId, sessionEntries] of sessionMap.entries()) {
      const commands: WarpCommand[] = [];
      const gitBranches = new Set<string>();
      const workingDirectories = new Set<string>();
      
      let hostname = '';
      let username = '';
      let shell = '';
      let minTime = new Date();
      let maxTime = new Date(0);

      for (const entry of sessionEntries) {
        if (!entry.body) continue;

        const { body } = entry;
        if (!body.command) continue;

        const timestamp = new Date(entry.timestamp);
        if (timestamp < minTime) minTime = timestamp;
        if (timestamp > maxTime) maxTime = timestamp;

        // Extract execution time
        let executionTimeMs: number | undefined;
        if (body.start_ts && body.completed_ts) {
          const startTime = new Date(body.start_ts).getTime();
          const endTime = new Date(body.completed_ts).getTime();
          executionTimeMs = endTime - startTime;
        }

        commands.push({
          command: body.command,
          output: body.output,
          exitCode: body.exit_code || 0,
          timestamp,
          pwd: body.pwd || '',
          gitBranch: body.git_branch,
          executionTimeMs
        });

        // Collect context information
        if (body.hostname) hostname = body.hostname;
        if (body.username) username = body.username;
        if (body.shell) shell = body.shell;
        if (body.git_branch) gitBranches.add(body.git_branch);
        if (body.pwd) workingDirectories.add(body.pwd);
      }

      if (commands.length > 0) {
        const duration = (maxTime.getTime() - minTime.getTime()) / (1000 * 60);
        
        sessions.push({
          sessionId: `warp-${sessionId}`,
          commands: commands.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
          timespan: {
            start: minTime,
            end: maxTime,
            durationMinutes: Math.round(duration)
          },
          context: {
            hostname,
            username,
            shell,
            gitBranches: Array.from(gitBranches),
            workingDirectories: Array.from(workingDirectories)
          }
        });
      }
    }

    // Sort sessions by start time (newest first)
    return sessions.sort((a, b) => b.timespan.start.getTime() - a.timespan.start.getTime());
  }

  async getRecentSessions(hours: number = 24): Promise<WarpSession[]> {
    const sessions = await this.parseNetworkLog();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return sessions.filter(session => session.timespan.start > cutoff);
  }

  async findSessionsByProject(projectName: string): Promise<WarpSession[]> {
    const sessions = await this.parseNetworkLog();
    
    return sessions.filter(session => 
      session.context.workingDirectories.some(dir => 
        dir.toLowerCase().includes(projectName.toLowerCase())
      ) ||
      session.commands.some(cmd => 
        cmd.command.toLowerCase().includes(projectName.toLowerCase())
      )
    );
  }

  async generateSessionSummary(session: WarpSession): Promise<string> {
    const { timespan, commands, context } = session;
    const { workingDirectories, gitBranches } = context;
    
    const summary = [
      `## Warp Session Summary (${timespan.durationMinutes} minutes)`,
      `**Duration:** ${timespan.start.toLocaleString()} - ${timespan.end.toLocaleString()}`,
      `**Commands executed:** ${commands.length}`,
      `**Shell:** ${context.shell} on ${context.hostname}`,
      '',
      '### Working Directories:',
      ...workingDirectories.map(dir => `- ${dir}`),
      '',
      '### Git Branches:',
      ...gitBranches.map(branch => `- ${branch}`),
      '',
      '### Key Commands:',
      ...this.getKeyCommands(commands).map(cmd => `- ${cmd.command}`)
    ];

    if (commands.length > 10) {
      summary.push('', '### Command Frequency:');
      const frequency = this.getCommandFrequency(commands);
      summary.push(...Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([cmd, count]) => `- ${cmd}: ${count}x`));
    }

    return summary.join('\n');
  }

  private getKeyCommands(commands: WarpCommand[]): WarpCommand[] {
    const keyCommands: WarpCommand[] = [];
    
    // Get git commits
    const commits = commands.filter(cmd => 
      cmd.command.startsWith('git commit')
    );
    keyCommands.push(...commits.slice(0, 3));

    // Get build/development commands
    const buildCommands = commands.filter(cmd => 
      cmd.command.match(/^(npm|npx|yarn|make|cargo|python|node)\s/)
    );
    keyCommands.push(...buildCommands.slice(0, 5));

    // Get file operations
    const fileOps = commands.filter(cmd => 
      cmd.command.match(/^(cp|mv|rm|mkdir|touch|cat|less|grep|find)\s/)
    );
    keyCommands.push(...fileOps.slice(0, 3));

    return keyCommands.slice(0, 10);
  }

  private getCommandFrequency(commands: WarpCommand[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    for (const cmd of commands) {
      // Get the base command (first word)
      const baseCmd = cmd.command.split(' ')[0];
      frequency[baseCmd] = (frequency[baseCmd] || 0) + 1;
    }

    return frequency;
  }

  async findLongRunningSessions(minMinutes: number = 60): Promise<WarpSession[]> {
    const sessions = await this.parseNetworkLog();
    return sessions.filter(session => session.timespan.durationMinutes >= minMinutes);
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<WarpSession[]> {
    const sessions = await this.parseNetworkLog();
    return sessions.filter(session => 
      session.timespan.start >= startDate && session.timespan.start <= endDate
    );
  }
}