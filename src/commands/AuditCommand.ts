/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Audit Command
 * Check rule compliance and violations
 * Implements Layer 5 (Audit & Detection) from LLM-ENFORCE-RULES-DESIGN.md
 *
 * Purpose: Monitor compliance and detect violations
 * - Show violations from audit log
 * - Calculate compliance rate
 * - Provide detailed reports
 */

import { AuditLogger } from '../utils/AuditLogger.js';
import { glob } from 'glob';
import { statSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditOptions {
  cwd?: string;
  since?: string; // ISO date string
  verbose?: boolean;
  json?: boolean; // Output as JSON for CI
  report?: boolean; // Show detailed compliance report
}

/**
 * AuditCommand - Check rule compliance
 */
export class AuditCommand {
  private logger: AuditLogger;
  private cwd: string;

  constructor(options: AuditOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.logger = new AuditLogger(this.cwd);
  }

  /**
   * Run audit check
   */
  async run(options: AuditOptions = {}): Promise<void> {
    const since = options.since ? new Date(options.since) : undefined;

    // Get violations from audit log
    const logViolations = await this.logger.getViolations(since);

    // Get compliance entries
    const compliance = await this.logger.getCompliance(since);

    // Check for files in .ai/ that shouldn't be there
    const fileViolations = await this.findFileViolations();

    // Calculate compliance rate
    const complianceRate = await this.logger.getComplianceRate(since);

    // Generate report data
    const reportData = {
      logViolations,
      fileViolations,
      compliance,
      complianceRate,
      violationsByRule: this.groupViolationsByRule(logViolations, fileViolations),
      totalOperations: compliance.length + logViolations.length,
      timestamp: new Date().toISOString(),
    };

    // Output as JSON for CI
    if (options.json) {
      console.log(JSON.stringify(reportData, null, 2));
      return;
    }

    // Display results
    if (options.report) {
      this.displayDetailedReport(reportData, options.verbose || false);
    } else {
      this.displayResults({
        logViolations,
        fileViolations,
        compliance,
        complianceRate,
        verbose: options.verbose || false,
      });
    }
  }

  /**
   * Group violations by rule
   */
  private groupViolationsByRule(
    logViolations: Array<{ rule: string; path: string }>,
    fileViolations: Array<{ rule: string; path: string }>
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const v of [...logViolations, ...fileViolations]) {
      grouped[v.rule] = (grouped[v.rule] || 0) + 1;
    }

    return grouped;
  }

  /**
   * Display detailed compliance report
   */
  private displayDetailedReport(
    reportData: {
      logViolations: Array<{
        timestamp: string;
        rule: string;
        path: string;
        operation: string;
        message?: string;
        stack?: string;
      }>;
      fileViolations: Array<{ rule: string; path: string; timestamp: Date }>;
      compliance: Array<{
        timestamp: string;
        rule: string;
        path: string;
        operation: string;
      }>;
      complianceRate: number;
      violationsByRule: Record<string, number>;
      totalOperations: number;
      timestamp: string;
    },
    verbose: boolean
  ): void {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          📊 AETHER RULE COMPLIANCE REPORT                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📅 Report Generated: ${new Date(reportData.timestamp).toLocaleString()}\n`);

    // Summary
    console.log('📈 SUMMARY\n');
    console.log(`  Total Operations:     ${reportData.totalOperations}`);
    console.log(`  ✅ Compliant:          ${reportData.compliance.length}`);
    console.log(
      `  ❌ Violations:         ${reportData.logViolations.length + reportData.fileViolations.length}`
    );
    console.log(`  📊 Compliance Rate:    ${(reportData.complianceRate * 100).toFixed(1)}%\n`);

    // Violations by rule
    if (Object.keys(reportData.violationsByRule).length > 0) {
      console.log('🚨 VIOLATIONS BY RULE\n');
      const sortedRules = Object.entries(reportData.violationsByRule).sort(([, a], [, b]) => b - a);

      for (const [rule, count] of sortedRules) {
        console.log(`  ${rule.padEnd(30)} ${count} violation(s)`);
      }
      console.log('');
    }

    // Recent violations
    if (reportData.logViolations.length > 0) {
      console.log('📋 RECENT VIOLATIONS (from audit log)\n');
      const recentViolations = reportData.logViolations.slice(0, 10);

      for (const v of recentViolations) {
        console.log(`  [${v.rule}] ${v.path}`);
        console.log(`    Operation: ${v.operation}`);
        console.log(`    Time: ${v.timestamp}`);
        if (v.message) {
          console.log(`    Message: ${v.message}`);
        }
        if (verbose && v.stack) {
          console.log(`    Stack: ${v.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        console.log('');
      }

      if (reportData.logViolations.length > 10) {
        console.log(`  ... and ${reportData.logViolations.length - 10} more\n`);
      }
    }

    // File violations
    if (reportData.fileViolations.length > 0) {
      console.log('📁 FILE SYSTEM VIOLATIONS\n');
      for (const v of reportData.fileViolations) {
        console.log(`  [${v.rule}] ${v.path}`);
        console.log(`    Modified: ${v.timestamp.toISOString()}`);
        console.log('');
      }
    }

    // Recommendations
    if (reportData.fileViolations.length > 0) {
      console.log('💡 RECOMMENDATIONS\n');

      const aiViolations = reportData.fileViolations.filter((v) => v.rule === 'protected-ai-files');
      if (aiViolations.length > 0) {
        console.log('  • Remove files from .ai/ directory:');
        for (const v of aiViolations) {
          console.log(`    rm ${v.path}`);
        }
        console.log('');
      }

      const rootViolations = reportData.fileViolations.filter((v) => v.rule === 'no-root-clutter');
      if (rootViolations.length > 0) {
        console.log('  • Remove planning docs from root:');
        for (const v of rootViolations) {
          console.log(`    rm ${v.path}`);
        }
        console.log('');
      }
    }

    console.log('📖 See .augment/rules/ for rule documentation\n');

    // Exit with error code if violations found
    if (reportData.logViolations.length + reportData.fileViolations.length > 0) {
      console.log('❌ Audit failed: violations detected\n');
      process.exitCode = 1;
    } else {
      console.log('✅ Audit passed: no violations detected\n');
    }
  }

  /**
   * Find file violations (files in protected locations)
   */
  private async findFileViolations(): Promise<
    Array<{ rule: string; path: string; timestamp: Date }>
  > {
    const violations: Array<{ rule: string; path: string; timestamp: Date }> = [];

    // Check for .aicf or .json files in .ai/ directory
    const aiDir = join(this.cwd, '.ai');
    if (existsSync(aiDir)) {
      const aiFiles = glob.sync('.ai/**/*.{aicf,json}', { cwd: this.cwd });

      for (const file of aiFiles) {
        const fullPath = join(this.cwd, file);
        const stats = statSync(fullPath);
        violations.push({
          rule: 'protected-ai-files',
          path: file,
          timestamp: stats.mtime,
        });
      }
    }

    // Check for planning docs in root
    const rootPlanningDocs = glob.sync(
      '{CLEANUP-*,SESSION-*,PHASE-*-COMPLETE,*-PLAN,*-SUMMARY,ACTION_PLAN_*}.md',
      { cwd: this.cwd }
    );

    for (const file of rootPlanningDocs) {
      const fullPath = join(this.cwd, file);
      if (existsSync(fullPath)) {
        const stats = statSync(fullPath);
        violations.push({
          rule: 'no-root-clutter',
          path: file,
          timestamp: stats.mtime,
        });
      }
    }

    return violations;
  }

  /**
   * Display audit results
   */
  private displayResults(results: {
    logViolations: Array<{
      timestamp: string;
      rule: string;
      path: string;
      operation: string;
      message?: string;
      stack?: string;
    }>;
    fileViolations: Array<{ rule: string; path: string; timestamp: Date }>;
    compliance: Array<{
      timestamp: string;
      rule: string;
      path: string;
      operation: string;
    }>;
    complianceRate: number;
    verbose: boolean;
  }): void {
    const { logViolations, fileViolations, compliance, complianceRate, verbose } = results;

    const totalViolations = logViolations.length + fileViolations.length;

    if (totalViolations === 0) {
      console.log('✅ No rule violations found!\n');
      console.log(`📈 Compliance Rate: ${(complianceRate * 100).toFixed(1)}%`);
      console.log(`✅ Compliant Operations: ${compliance.length}`);
      console.log(`❌ Violations: 0\n`);
      return;
    }

    console.log(`🚨 Found ${totalViolations} violation(s):\n`);

    // Display log violations
    if (logViolations.length > 0) {
      console.log('📋 Audit Log Violations:\n');
      for (const v of logViolations) {
        console.log(`  [${v.rule}] ${v.path}`);
        console.log(`    Operation: ${v.operation}`);
        console.log(`    Time: ${v.timestamp}`);
        if (v.message) {
          console.log(`    Message: ${v.message}`);
        }
        if (verbose && v.stack) {
          console.log(`    Stack: ${v.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        console.log('');
      }
    }

    // Display file violations
    if (fileViolations.length > 0) {
      console.log('📁 File System Violations:\n');
      for (const v of fileViolations) {
        console.log(`  [${v.rule}] ${v.path}`);
        console.log(`    Modified: ${v.timestamp.toISOString()}`);
        console.log('');
      }
    }

    // Display compliance stats
    console.log('📊 Compliance Statistics:\n');
    console.log(`  Compliance Rate: ${(complianceRate * 100).toFixed(1)}%`);
    console.log(`  ✅ Compliant Operations: ${compliance.length}`);
    console.log(`  ❌ Violations: ${totalViolations}`);
    console.log('');

    // Display recommendations
    if (fileViolations.length > 0) {
      console.log('💡 Recommendations:\n');

      const aiViolations = fileViolations.filter((v) => v.rule === 'protected-ai-files');
      if (aiViolations.length > 0) {
        console.log('  • Remove files from .ai/ directory:');
        for (const v of aiViolations) {
          console.log(`    rm ${v.path}`);
        }
        console.log('');
      }

      const rootViolations = fileViolations.filter((v) => v.rule === 'no-root-clutter');
      if (rootViolations.length > 0) {
        console.log('  • Remove planning docs from root:');
        for (const v of rootViolations) {
          console.log(`    rm ${v.path}`);
        }
        console.log('');
      }
    }

    console.log('📖 See .augment/rules/ for rule documentation\n');
  }

  /**
   * Clear audit log
   */
  async clear(): Promise<void> {
    await this.logger.clear();
    console.log('✅ Audit log cleared\n');
  }

  /**
   * Show audit log path
   */
  showLogPath(): void {
    console.log(`📁 Audit log: ${this.logger.getLogPath()}\n`);
  }
}
