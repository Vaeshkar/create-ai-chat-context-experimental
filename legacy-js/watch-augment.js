#!/usr/bin/env node

/**
 * Augment Memory Watcher - Background service for automatic memory consolidation
 *
 * Monitors Augment VSCode extension's conversation storage and automatically
 * processes new conversations through the checkpoint orchestrator system.
 *
 * NOTE: This is legacy JavaScript. Will be rewritten in TypeScript following
 * Q4 2025 code standards (see .ai/code-style.md in aip-workspace).
 */

const fs = require("fs");
const path = require("path");
const AugmentParser = require("./src/session-parsers/augment-parser");
const { CheckpointOrchestrator } = require("./src/checkpoint-orchestrator");

class AugmentWatcher {
  constructor(options = {}) {
    this.parser = new AugmentParser();
    this.orchestrator = new CheckpointOrchestrator({
      verbose: options.verbose || false,
      projectRoot: options.projectRoot || process.cwd(),
    });
    this.checkInterval = options.interval || 5 * 60 * 1000; // 5 minutes default
    this.stateFile = path.join(
      options.projectRoot || process.cwd(),
      ".aicf",
      ".watcher-state.json"
    );
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        this.state = JSON.parse(fs.readFileSync(this.stateFile, "utf8"));
      } else {
        this.state = {
          lastCheckpoint: Date.now(),
          lastConversationId: null,
          totalConversationsProcessed: 0,
          startedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(
        "Warning: Could not load state, starting fresh:",
        error.message
      );
      this.state = {
        lastCheckpoint: Date.now(),
        lastConversationId: null,
        totalConversationsProcessed: 0,
        startedAt: new Date().toISOString(),
      };
    }
  }

  saveState() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.state.lastSaved = new Date().toISOString();
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error("Error saving state:", error.message);
    }
  }

  async start() {
    console.log(
      "╔════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║         Augment Memory Watcher - Background Service           ║"
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝"
    );
    console.log("");
    console.log("👁️  Status: ACTIVE");
    console.log(
      `⏱️  Interval: Every ${this.checkInterval / 1000 / 60} minutes`
    );
    console.log(`📂 Project: ${this.orchestrator.projectRoot}`);
    console.log(`💾 State: ${this.stateFile}`);
    console.log(
      `📊 Total processed: ${this.state.totalConversationsProcessed} conversations`
    );
    console.log("");
    console.log("Press Ctrl+C to stop");
    console.log("");
    console.log(
      "─────────────────────────────────────────────────────────────────"
    );
    console.log("");

    // Initial check
    await this.checkForNewConversations();

    // Set up interval
    this.interval = setInterval(async () => {
      await this.checkForNewConversations();
    }, this.checkInterval);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("");
      console.log(
        "─────────────────────────────────────────────────────────────────"
      );
      console.log("");
      console.log("👋 Stopping watcher...");
      clearInterval(this.interval);
      this.saveState();
      console.log("✅ State saved");
      console.log(
        `📊 Session stats: ${this.state.totalConversationsProcessed} conversations processed`
      );
      console.log("");
      console.log("Goodbye! 👋");
      console.log("");
      process.exit(0);
    });
  }

  async checkForNewConversations() {
    const checkTime = new Date().toLocaleTimeString();
    console.log(`🔍 [${checkTime}] Checking for new conversations...`);

    try {
      // Check if Augment is available
      if (!this.parser.isAvailable()) {
        console.log("   ⚠️  Augment not found or no workspaces available");
        return;
      }

      // Get conversations from most recent workspace
      const conversations = await this.parser.extractConversations(1);

      if (conversations.length === 0) {
        console.log("   ℹ️  No conversations found in Augment storage");
        return;
      }

      // Filter for new conversations since last checkpoint
      const newConversations = conversations.filter((c) => {
        const convTime = new Date(c.timestamp).getTime();
        const isNew = convTime > this.state.lastCheckpoint;
        const isDifferent = c.conversationId !== this.state.lastConversationId;
        return isNew || isDifferent;
      });

      if (newConversations.length === 0) {
        console.log("   ✓ No new conversations since last check");
        return;
      }

      console.log(`   📝 Found ${newConversations.length} new conversation(s)`);
      const processed = await this.processConversations(newConversations);

      // Update state
      this.state.lastCheckpoint = Date.now();
      if (newConversations.length > 0) {
        const lastConv = newConversations[newConversations.length - 1];
        this.state.lastConversationId = lastConv.conversationId;
      }
      this.state.totalConversationsProcessed += processed;
      this.saveState();

      console.log(
        `   ✅ Successfully processed ${processed}/${newConversations.length} conversation(s)`
      );
      console.log(
        `   📊 Total lifetime: ${this.state.totalConversationsProcessed} conversations`
      );
    } catch (error) {
      console.error("   ❌ Error during check:", error.message);
      if (this.orchestrator.verbose) {
        console.error("   Stack:", error.stack);
      }
    }

    console.log("");
  }

  async processConversations(conversations) {
    let successCount = 0;

    for (const conv of conversations) {
      try {
        // Validate conversation has messages
        if (!conv.messages || conv.messages.length === 0) {
          console.log(
            `   ⚠️  Skipping conversation ${conv.conversationId}: no messages`
          );
          continue;
        }

        // Create checkpoint dump format
        const dump = {
          sessionId: conv.conversationId || `aug-${Date.now()}`,
          checkpointNumber: 1,
          source: "augment", // ✅ Explicitly set source for platform detection
          startTime: conv.timestamp || new Date().toISOString(),
          endTime: new Date().toISOString(),
          tokenCount: conv.messages.reduce(
            (sum, m) => sum + Math.ceil((m.content || "").length / 4),
            0
          ),
          messages: conv.messages.map((m) => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.content || "",
            timestamp: m.timestamp || new Date().toISOString(),
          })),
        };

        // Process through orchestrator
        const result = await this.orchestrator.processCheckpoint(dump);

        if (result.success) {
          successCount++;
        } else {
          console.error(
            `   ⚠️  Failed to process conversation ${conv.conversationId}:`,
            result.error
          );
        }
      } catch (error) {
        console.error(`   ⚠️  Error processing conversation:`, error.message);
      }
    }

    return successCount;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse options
  const options = {
    verbose: args.includes("--verbose") || args.includes("-v"),
    projectRoot: process.cwd(),
  };

  // Check for custom interval
  const intervalArg = args.find((arg) => arg.startsWith("--interval="));
  if (intervalArg) {
    const minutes = parseInt(intervalArg.split("=")[1]);
    if (!isNaN(minutes) && minutes > 0) {
      options.interval = minutes * 60 * 1000;
      console.log(`Using custom interval: ${minutes} minutes`);
    }
  }

  // Check for help
  if (args.includes("--help") || args.includes("-h")) {
    console.log("");
    console.log("Augment Memory Watcher - Automatic conversation processing");
    console.log("");
    console.log("Usage: node watch-augment.js [options]");
    console.log("");
    console.log("Options:");
    console.log("  --interval=N    Check every N minutes (default: 5)");
    console.log("  --verbose, -v   Show detailed logs");
    console.log("  --once          Run once and exit (for git hooks)");
    console.log("  --help, -h      Show this help");
    console.log("");
    console.log("Examples:");
    console.log(
      "  node watch-augment.js                    # Check every 5 minutes"
    );
    console.log(
      "  node watch-augment.js --interval=1       # Check every minute"
    );
    console.log(
      "  node watch-augment.js --verbose          # Detailed logging"
    );
    console.log(
      "  node watch-augment.js --once             # Run once (git hook)"
    );
    console.log("");
    process.exit(0);
  }

  // Check for --once flag (for git hooks)
  if (args.includes("--once")) {
    const watcher = new AugmentWatcher(options);
    watcher
      .checkForNewConversations()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error("Error:", error.message);
        process.exit(1);
      });
    return;
  }

  // Start continuous watcher
  const watcher = new AugmentWatcher(options);
  watcher.start().catch((error) => {
    console.error("Fatal error starting watcher:", error);
    process.exit(1);
  });
}

module.exports = AugmentWatcher;
