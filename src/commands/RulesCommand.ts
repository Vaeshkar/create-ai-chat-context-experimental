/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Rules Command
 * CLI interface for rule management and compliance checking
 *
 * Commands:
 * - aic rules check     - Check rule compliance
 * - aic rules report    - Generate compliance report
 * - aic rules list      - List all rules
 * - aic rules validate  - Validate a specific operation
 */

import { RuleValidator } from '../utils/RuleValidator.js';
import type { RuleViolation } from '../utils/RuleValidator.js';

export class RulesCommand {
  private validator: RuleValidator;

  constructor(projectPath: string = process.cwd()) {
    this.validator = new RuleValidator(projectPath);
  }

  /**
   * Main command handler
   */
  async run(subcommand: string, args: string[] = []): Promise<void> {
    switch (subcommand) {
      case 'check':
        await this.check();
        break;
      case 'report':
        await this.report(parseInt(args[0] || '7'));
        break;
      case 'list':
        await this.list();
        break;
      case 'validate':
        await this.validate(args[0], args[1]);
        break;
      default:
        this.showHelp();
    }
  }

  /**
   * Check current rule compliance
   */
  private async check(): Promise<void> {
    console.log('🔍 Checking rule compliance...\n');

    const result = await this.validator.validateCompliance({});

    if (!result.ok) {
      console.error(`❌ Error: ${result.error.message}`);
      return;
    }

    const compliance = result.value;

    // Show compliance summary
    console.log('📊 Compliance Summary:');
    console.log(`   Total Rules: ${compliance.totalRules}`);
    console.log(`   Passed: ${compliance.passedRules}`);
    console.log(`   Violations: ${compliance.violations.length}`);
    console.log(`   Compliance Rate: ${compliance.complianceRate.toFixed(1)}%`);
    console.log('');

    if (compliance.compliant) {
      console.log('✅ All rules compliant!');
    } else {
      console.log('⚠️  Violations detected:\n');
      for (const violation of compliance.violations) {
        this.printViolation(violation);
      }
    }
  }

  /**
   * Generate compliance report
   */
  private async report(days: number = 7): Promise<void> {
    console.log(`📊 Rule Compliance Report (Last ${days} Days)\n`);

    const result = await this.validator.generateComplianceReport(days);

    if (!result.ok) {
      console.error(`❌ Error: ${result.error.message}`);
      return;
    }

    const report = result.value;

    console.log(`Total Checks: ${report.totalChecks}`);
    console.log(`Violations: ${report.violations.length}`);
    console.log(`Compliance Rate: ${report.complianceRate.toFixed(1)}%`);
    console.log('');

    if (report.violations.length === 0) {
      console.log('✅ No violations in the last ' + days + ' days!');
      return;
    }

    // Group violations by rule
    const byRule = new Map<string, RuleViolation[]>();
    for (const violation of report.violations) {
      const existing = byRule.get(violation.ruleNumber) || [];
      existing.push(violation);
      byRule.set(violation.ruleNumber, existing);
    }

    console.log('Violations by Rule:');
    for (const [ruleNum, violations] of Array.from(byRule.entries()).sort()) {
      console.log(`  - Rule #${ruleNum}: ${violations.length} violations`);
    }

    console.log('\nMost Recent Violations:');
    const recent = report.violations.slice(0, 5);
    for (const violation of recent) {
      this.printViolation(violation);
    }

    if (report.violations.length > 5) {
      console.log(`\n... and ${report.violations.length - 5} more`);
    }
  }

  /**
   * List all rules
   */
  private async list(): Promise<void> {
    console.log('📋 Available Rules:\n');

    const result = await this.validator.checkRulesExist();

    if (!result.ok) {
      console.error(`❌ Error: ${result.error.message}`);
      return;
    }

    const { exists, ruleCount, rules } = result.value;

    if (!exists || ruleCount === 0) {
      console.log('⚠️  No rules found in .augment/rules/');
      console.log('');
      console.log('To set up rules, run:');
      console.log('  aic rules init');
      return;
    }

    console.log(`Found ${ruleCount} rules:\n`);

    for (const ruleFile of rules) {
      const ruleNumber = ruleFile.split('-')[0];
      const loadResult = await this.validator.loadRule(ruleNumber || '00');

      if (loadResult.ok) {
        const rule = loadResult.value;
        console.log(`  ${ruleFile}`);
        console.log(`    Title: ${rule.title}`);
        console.log(`    Priority: ${rule.priority}`);
        console.log('');
      }
    }
  }

  /**
   * Validate a specific operation
   */
  private async validate(operation: string, filePath: string): Promise<void> {
    if (!operation || !filePath) {
      console.error('❌ Usage: aic rules validate <operation> <file-path>');
      console.error('   Example: aic rules validate write .ai/test.md');
      return;
    }

    console.log(`🔍 Validating: ${operation} ${filePath}\n`);

    const result = await this.validator.validateCompliance({
      operation,
      filePath,
    });

    if (!result.ok) {
      console.error(`❌ Error: ${result.error.message}`);
      return;
    }

    const compliance = result.value;

    if (compliance.compliant) {
      console.log(`✅ Operation allowed: ${operation} ${filePath}`);
    } else {
      console.log(`❌ Operation blocked: ${operation} ${filePath}\n`);
      for (const violation of compliance.violations) {
        this.printViolation(violation);
      }
      console.log('\nOperation cannot proceed.');
    }
  }

  /**
   * Print a violation with formatting
   */
  private printViolation(violation: RuleViolation): void {
    const icon = violation.severity === 'BLOCKING' ? '🚨' : violation.severity === 'WARNING' ? '⚠️' : 'ℹ️';

    console.log(`${icon} Rule #${violation.ruleNumber} (${violation.ruleName})`);
    console.log(`   Severity: ${violation.severity}`);
    console.log(`   ${violation.message}`);
    if (violation.context) {
      console.log(`   ${violation.context}`);
    }
    console.log('');
  }

  /**
   * Show help text
   */
  private showHelp(): void {
    console.log('Usage: aic rules <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  check              Check current rule compliance');
    console.log('  report [days]      Generate compliance report (default: 7 days)');
    console.log('  list               List all rules');
    console.log('  validate <op> <path>  Validate a specific operation');
    console.log('');
    console.log('Examples:');
    console.log('  aic rules check');
    console.log('  aic rules report 30');
    console.log('  aic rules list');
    console.log('  aic rules validate write .ai/test.md');
    console.log('');
    console.log('For more info, see: docs/AUGMENT-RULE-SETUP-GUIDE.md');
  }
}
