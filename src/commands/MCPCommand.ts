/**
 * MCP Command
 * Start AETHER MCP server for Model Context Protocol integration
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import chalk from 'chalk';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { getPackageRoot } from '../utils/PackageRoot.js';

export interface MCPCommandOptions {
  /** Project directory (where .lill/ is located) */
  projectDir?: string;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * MCP Command
 * Starts AETHER MCP server for integration with Augment, Claude Desktop, etc.
 */
export class MCPCommand {
  /**
   * Execute MCP command
   */
  async execute(options: MCPCommandOptions = {}): Promise<Result<void>> {
    try {
      const projectDir = options.projectDir || process.cwd();
      const verbose = options.verbose || false;

      // Path to MCP server (use getPackageRoot to find it)
      const packageRoot = getPackageRoot();
      const serverPath = join(packageRoot, 'dist/esm/aether/src/mcp/server.js');

      if (verbose) {
        console.error(chalk.blue('🚀 Starting AETHER MCP Server...'));
        console.error(chalk.gray(`   Project: ${projectDir}`));
        console.error(chalk.gray(`   Server: ${serverPath}`));
        console.error();
      }

      // Spawn MCP server process
      const child = spawn('node', [serverPath], {
        env: {
          ...process.env,
          AETHER_PROJECT_DIR: projectDir,
          AETHER_VERBOSE: verbose ? 'true' : 'false',
        },
        stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
      });

      // Handle errors
      child.on('error', (error) => {
        console.error(chalk.red('❌ Failed to start MCP server:'), error.message);
        process.exit(1);
      });

      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(chalk.red(`❌ MCP server exited with code ${code}`));
          process.exit(code);
        }
      });

      // MCP uses stdio for communication
      // Pipe stdin/stdout between parent and child
      process.stdin.pipe(child.stdin);
      child.stdout.pipe(process.stdout);

      // Keep process alive
      await new Promise(() => {}); // Never resolves (server runs indefinitely)

      return Ok(undefined);
    } catch (error) {
      return Err(
        new Error(
          `Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }
}
