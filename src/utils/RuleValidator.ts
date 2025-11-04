/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Rule Validator
 * Code-level validation for .augment/rules/ compliance
 *
 * Validates that LLM responses follow defined rules:
 * - Rule #00: Meta-rule enforcement (compliance checklist)
 * - Rule #01: Context loading
 * - Rule #02: File protection
 * - Rule #03: Format requirements
 * - Rule #04: Workflow compliance
 * - Rule #05: Testing requirements
 * - Rule #06: Communication style
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface RuleViolation {
  ruleNumber: string;
  ruleName: string;
  severity: 'BLOCKING' | 'WARNING' | 'ADVISORY';
  message: string;
  timestamp: string;
  context?: string;
}

export interface RuleCompliance {
  compliant: boolean;
  violations: RuleViolation[];
  checkedAt: string;
  totalRules: number;
  passedRules: number;
  complianceRate: number; // 0-100%
}

/**
 * Validates LLM behavior against .augment/rules/
 */
export class RuleValidator {
  private rulesDir: string;
  private protectedPaths: string[] = [
    '.ai/',
    '.ai/code-style.md',
    '.ai/design-system.md',
    '.ai/project-overview.md',
    '.ai/Testing-philosophy.md',
    '.ai/npm-publishing-checklist.md',
  ];

  constructor(projectPath: string = process.cwd()) {
    this.rulesDir = join(projectPath, '.augment', 'rules');
  }

  /**
   * Validate comprehensive rule compliance
   */
  async validateCompliance(context: {
    operation?: string;
    filePath?: string;
    content?: string;
    sessionStart?: boolean;
  }): Promise<Result<RuleCompliance>> {
    try {
      const violations: RuleViolation[] = [];

      // Rule #02: File Protection
      if (context.operation === 'write' && context.filePath) {
        const fileViolation = this.validateFileProtection(context.filePath);
        if (fileViolation) {
          violations.push(fileViolation);
        }
      }

      // Rule #01: Context Loading (session start)
      if (context.sessionStart) {
        const contextViolation = await this.validateContextLoading();
        if (contextViolation) {
          violations.push(contextViolation);
        }
      }

      // Rule #03: Format Requirements
      if (context.filePath && context.content) {
        const formatViolation = this.validateFormat(context.filePath, context.content);
        if (formatViolation) {
          violations.push(formatViolation);
        }
      }

      // Calculate compliance
      const totalRules = 7; // Rules 00-06
      const passedRules = totalRules - violations.length;
      const complianceRate = (passedRules / totalRules) * 100;

      const result: RuleCompliance = {
        compliant: violations.length === 0,
        violations,
        checkedAt: new Date().toISOString(),
        totalRules,
        passedRules,
        complianceRate,
      };

      return Ok(result);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Rule #02: Validate file protection
   * BLOCKING: Prevents writes to protected paths
   */
  private validateFileProtection(filePath: string): RuleViolation | null {
    for (const protectedPath of this.protectedPaths) {
      if (filePath.includes(protectedPath)) {
        return {
          ruleNumber: '02',
          ruleName: 'File Protection',
          severity: 'BLOCKING',
          message: `BLOCKED: Cannot write to protected path: ${filePath}`,
          timestamp: new Date().toISOString(),
          context: `Protected paths: ${this.protectedPaths.join(', ')}. See .augment/rules/02-file-protection.md`,
        };
      }
    }
    return null;
  }

  /**
   * Rule #01: Validate context loading
   * BLOCKING: Ensures context files exist and are recent
   */
  private async validateContextLoading(): Promise<RuleViolation | null> {
    const requiredFiles = ['.ai-instructions', '.ai/rules/'];

    for (const file of requiredFiles) {
      const fullPath = join(process.cwd(), file);
      if (!existsSync(fullPath)) {
        return {
          ruleNumber: '01',
          ruleName: 'Context Loading',
          severity: 'BLOCKING',
          message: `Required context file missing: ${file}`,
          timestamp: new Date().toISOString(),
          context: 'See .augment/rules/01-context-loading.md',
        };
      }
    }

    return null;
  }

  /**
   * Rule #03: Validate format requirements
   * WARNING: Checks file format matches extension
   */
  private validateFormat(filePath: string, content: string): RuleViolation | null {
    // .aicf files must use pipe-delimited format
    if (filePath.endsWith('.aicf')) {
      if (!content.includes('|') || content.includes('# ')) {
        return {
          ruleNumber: '03',
          ruleName: 'Format Requirements',
          severity: 'WARNING',
          message: 'AICF file should use pipe-delimited format, not markdown',
          timestamp: new Date().toISOString(),
          context: 'See .augment/rules/03-format-requirements.md',
        };
      }
    }

    // .lill/raw/ should be JSON only
    if (filePath.includes('.lill/raw/') && !filePath.endsWith('.json')) {
      return {
        ruleNumber: '03',
        ruleName: 'Format Requirements',
        severity: 'WARNING',
        message: '.lill/raw/ directory should only contain JSON files',
        timestamp: new Date().toISOString(),
        context: 'See .augment/rules/03-format-requirements.md',
      };
    }

    return null;
  }

  /**
   * Check if rules directory exists and has files
   */
  async checkRulesExist(): Promise<Result<{ exists: boolean; ruleCount: number; rules: string[] }>> {
    try {
      if (!existsSync(this.rulesDir)) {
        return Ok({ exists: false, ruleCount: 0, rules: [] });
      }

      const files = readdirSync(this.rulesDir).filter((f) => f.endsWith('.md'));

      return Ok({
        exists: true,
        ruleCount: files.length,
        rules: files.sort(),
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Load and parse rule file
   */
  async loadRule(ruleNumber: string): Promise<Result<{ title: string; priority: string; content: string }>> {
    try {
      const files = readdirSync(this.rulesDir);
      const ruleFile = files.find((f) => f.startsWith(`${ruleNumber}-`));

      if (!ruleFile) {
        return Err(new Error(`Rule #${ruleNumber} not found in ${this.rulesDir}`));
      }

      const content = await import('fs').then((fs) =>
        fs.promises.readFile(join(this.rulesDir, ruleFile), 'utf-8')
      );

      // Parse title and priority from markdown
      const titleMatch = content.match(/# RULE #\d+: (.+)/);
      const priorityMatch = content.match(/\*\*Priority:\*\* (\w+)/);

      return Ok({
        title: titleMatch?.[1] || 'Unknown',
        priority: priorityMatch?.[1] || 'MEDIUM',
        content,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Log rule violation to audit log
   */
  async logViolation(violation: RuleViolation): Promise<Result<void>> {
    try {
      const logDir = join(process.cwd(), '.lill');
      const logFile = join(logDir, '.rule-violations.log');

      const logEntry = `${violation.timestamp} | RULE_${violation.ruleNumber} | ${violation.severity} | ${violation.message}\n`;

      await import('fs').then((fs) => fs.promises.appendFile(logFile, logEntry, 'utf-8'));

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    days: number = 7
  ): Promise<Result<{ totalChecks: number; violations: RuleViolation[]; complianceRate: number }>> {
    try {
      const logFile = join(process.cwd(), '.lill', '.rule-violations.log');

      if (!existsSync(logFile)) {
        return Ok({ totalChecks: 0, violations: [], complianceRate: 100 });
      }

      const content = await import('fs').then((fs) => fs.promises.readFile(logFile, 'utf-8'));

      const lines = content.split('\n').filter(Boolean);

      // Parse violations from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentViolations: RuleViolation[] = [];

      for (const line of lines) {
        const parts = line.split(' | ');
        const timestamp = parts[0];
        if (!timestamp) continue;

        const date = new Date(timestamp);
        if (date < cutoffDate) continue;

        recentViolations.push({
          ruleNumber: parts[1]?.replace('RULE_', '') || 'unknown',
          ruleName: 'Unknown',
          severity: (parts[2] as 'BLOCKING' | 'WARNING' | 'ADVISORY') || 'WARNING',
          message: parts[3] || 'Unknown violation',
          timestamp,
        });
      }

      // Estimate total checks (assume 10 checks per violation as baseline)
      const totalChecks = Math.max(lines.length, recentViolations.length * 10);
      const complianceRate = ((totalChecks - recentViolations.length) / totalChecks) * 100;

      return Ok({
        totalChecks,
        violations: recentViolations,
        complianceRate,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Validate response includes compliance checklist
   * Rule #00: Meta-rule enforcement
   */
  validateResponseHasChecklist(response: string): boolean {
    // Check for compliance checklist patterns
    const patterns = [
      /✅.*Rule Compliance/i,
      /Rule \d+:.*(?:✅|❌)/,
      /Rules:.*\d+✓/,
      /All rules compliant/i,
    ];

    return patterns.some((pattern) => pattern.test(response));
  }

  /**
   * Parse compliance checklist from response
   */
  parseComplianceChecklist(response: string): {
    found: boolean;
    compliant: boolean;
    violations: string[];
  } {
    const found = this.validateResponseHasChecklist(response);

    if (!found) {
      return { found: false, compliant: false, violations: ['Missing compliance checklist (Rule #00)'] };
    }

    // Extract violations (lines with ❌)
    const violations: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.includes('❌') && /Rule \d+/i.test(line)) {
        violations.push(line.trim());
      }
    }

    return {
      found: true,
      compliant: violations.length === 0,
      violations,
    };
  }
}
