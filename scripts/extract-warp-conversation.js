#!/usr/bin/env node
const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(
  process.env.HOME,
  process.env.HOME || process.env.USERPROFILE
);

function extractConversation(conversationId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to open Warp database: ${err.message}`));
        return;
      }

      // Get conversation data
      db.get(
        "SELECT conversation_id, conversation_data, last_modified_at FROM agent_conversations WHERE conversation_id = ?",
        [conversationId],
        (err, conversation) => {
          if (err) {
            reject(err);
            return;
          }

          if (!conversation) {
            reject(new Error(`Conversation ${conversationId} not found`));
            return;
          }

          // Get AI queries for this conversation
          db.all(
            "SELECT input, working_directory, start_ts, output_status FROM ai_queries WHERE conversation_id = ? ORDER BY start_ts",
            [conversationId],
            (err, queries) => {
              if (err) {
                reject(err);
                return;
              }

              db.close((closeErr) => {
                if (closeErr) {
                  reject(
                    new Error(
                      `Failed to close Warp database: ${closeErr.message}`
                    )
                  );
                  return;
                }

                // Parse conversation data
                let conversationData = {};
                try {
                  conversationData = JSON.parse(conversation.conversation_data);
                } catch (error) {
                  console.warn("Could not parse conversation data as JSON");
                }

                // Parse queries to extract actual messages
                const messages = [];
                for (const query of queries) {
                  try {
                    const queryData = JSON.parse(query.input);
                    if (Array.isArray(queryData)) {
                      for (const item of queryData) {
                        if (item.Query && item.Query.text) {
                          messages.push({
                            type: "user_query",
                            content: item.Query.text,
                            timestamp: query.start_ts,
                            working_directory: query.working_directory,
                            context: item.Query.context,
                          });
                        } else if (
                          item.ActionResult &&
                          item.ActionResult.result
                        ) {
                          const result = item.ActionResult.result;
                          let content = "Action performed";

                          if (result.RequestCommandOutput) {
                            const cmdResult =
                              result.RequestCommandOutput.result;
                            if (cmdResult.Success) {
                              content = `Command: ${cmdResult.Success.command}\nOutput: ${cmdResult.Success.output}`;
                            }
                          } else if (result.GetFiles) {
                            const files = result.GetFiles.result;
                            if (files.Success) {
                              content = `Files accessed: ${files.Success.files
                                .map((f) => f.file_name)
                                .join(", ")}`;
                            }
                          }

                          messages.push({
                            type: "ai_action",
                            content: content,
                            timestamp: query.start_ts,
                            working_directory: query.working_directory,
                            action_id: item.ActionResult.id,
                          });
                        }
                      }
                    }
                  } catch (error) {
                    // If not JSON, treat as plain text
                    messages.push({
                      type: "user_query",
                      content: query.input,
                      timestamp: query.start_ts,
                      working_directory: query.working_directory,
                    });
                  }
                }

                resolve({
                  conversationId: conversation.conversation_id,
                  lastModified: conversation.last_modified_at,
                  conversationData,
                  messages,
                  summary: {
                    totalMessages: messages.length,
                    totalQueries: queries.length,
                    workingDirectories: [
                      ...new Set(
                        queries.map((q) => q.working_directory).filter(Boolean)
                      ),
                    ],
                    timespan: {
                      start: queries.length > 0 ? queries[0].start_ts : null,
                      end:
                        queries.length > 0
                          ? queries[queries.length - 1].start_ts
                          : null,
                    },
                  },
                });
              });
            }
          );
        }
      );
    });
  });
}

function listConversations() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to open Warp database: ${err.message}`));
        return;
      }

      db.all(
        "SELECT conversation_id, length(conversation_data) as size, last_modified_at FROM agent_conversations ORDER BY last_modified_at DESC LIMIT 10",
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          db.close();
          resolve(rows);
        }
      );
    });
  });
}

async function main() {
  const command = process.argv[2];
  const conversationId = process.argv[3];

  try {
    if (command === "list") {
      console.log("🔍 Recent Warp AI Conversations:\n");
      const conversations = await listConversations();

      for (const conv of conversations) {
        console.log(`📝 ${conv.conversation_id}`);
        console.log(`   Size: ${conv.size} characters`);
        console.log(`   Modified: ${conv.last_modified_at}`);
        console.log("");
      }
    } else if (command === "extract" && conversationId) {
      console.log(`🔍 Extracting conversation: ${conversationId}\n`);
      const conversation = await extractConversation(conversationId);

      console.log(`📊 Conversation Summary:`);
      console.log(`   ID: ${conversation.conversationId}`);
      console.log(`   Messages: ${conversation.summary.totalMessages}`);
      console.log(`   Queries: ${conversation.summary.totalQueries}`);
      console.log(
        `   Working Directories: ${conversation.summary.workingDirectories.join(
          ", "
        )}`
      );
      console.log(
        `   Timespan: ${conversation.summary.timespan.start} - ${conversation.summary.timespan.end}`
      );
      console.log(`   Last Modified: ${conversation.lastModified}`);
      console.log("");

      // NOW: Process the conversation through AI system
      console.log("🧠 Processing conversation through AI system...");

      try {
        const IntelligentConversationParser = require("./src/agents/intelligent-conversation-parser");
        const parser = new IntelligentConversationParser({ verbose: true });

        // Convert to format expected by AI system
        const aiConversationData = {
          id: conversationId,
          messages: conversation.messages,
          metadata: {
            source: "warp-extractor",
            chunkId: conversationId,
            totalMessages: conversation.summary.totalMessages,
            workingDirectories: conversation.summary.workingDirectories,
          },
        };

        // Process with SQLite access DISABLED temporarily to avoid constructor issue
        const result = await parser.processConversation(aiConversationData, {
          useDirectSQLite: false, // TEMPORARILY DISABLED
          verbose: true,
        });

        if (result.success) {
          console.log(`\n✅ AI processing completed successfully!`);
          console.log(
            `📂 Content routed to ${
              result.routingResults?.length || 0
            } specialized files`
          );
          if (result.routingResults) {
            for (const routing of result.routingResults) {
              console.log(`   • ${routing.file} (${routing.contentType})`);
            }
          }
          if (result.richDataExtracted) {
            console.log(
              `📊 Rich data extracted: ${result.messageCount} messages processed`
            );
          }
        } else {
          console.log(`\n⚠️ AI processing failed: ${result.error}`);
        }
      } catch (aiError) {
        console.error(`\n❌ AI processing error:`, aiError.message);
      }

      console.log("\n💬 Messages:");
      console.log("=".repeat(60));

      // Define icons for each message type for clarity and future extensibility
      const messageTypeIcons = {
        user_query: "👤",
        ai_action: "🤖",
        query: "💬",
        // Add more types and icons as needed
      };

      for (const message of conversation.messages) {
        const timestamp = new Date(message.timestamp).toLocaleString();
        const icon = messageTypeIcons[message.type] || "💬";

        console.log(`\n${icon} [${timestamp}] ${message.type.toUpperCase()}`);
        if (message.working_directory) {
          console.log(`   📁 ${message.working_directory}`);
        }
        console.log(`   💬 ${message.content}`);

        if (message.context && message.context.length > 0) {
          console.log(
            `   🔍 Context: ${JSON.stringify(message.context, null, 2)}`
          );
        }
      }

      console.log("\n📋 Todo Lists and Tasks:");
      console.log("=".repeat(60));

      if (conversation.conversationData.todo_lists) {
        for (const todoList of conversation.conversationData.todo_lists) {
          if (todoList.completed_items && todoList.completed_items.length > 0) {
            console.log("\n✅ Completed Tasks:");
            for (const item of todoList.completed_items) {
              console.log(`   • ${item.title}`);
              if (item.description) {
                console.log(`     ${item.description}`);
              }
            }
          }

          if (todoList.pending_items && todoList.pending_items.length > 0) {
            console.log("\n⏳ Pending Tasks:");
            for (const item of todoList.pending_items) {
              console.log(`   • ${item.title}`);
              if (item.description) {
                console.log(`     ${item.description}`);
              }
            }
          }
        }
      }
    } else {
      console.log("Usage:");
      console.log("  node extract-warp-conversation.js list");
      console.log(
        "  node extract-warp-conversation.js extract <conversation-id>"
      );
      console.log("");
      console.log("Examples:");
      console.log("  node extract-warp-conversation.js list");
      console.log(
        "  node extract-warp-conversation.js extract 1237cec7-c68c-4f77-986f-0746e5fc4655"
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
