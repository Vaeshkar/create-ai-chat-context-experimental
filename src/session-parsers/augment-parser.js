const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Augment VSCode Extension Parser
 * Extracts conversation data from LevelDB files in augment-kv-store directories
 * Similar to warp-parser.js but for Augment's LevelDB storage format
 */
class AugmentParser {
    constructor() {
        this.name = 'Augment VSCode Extension';
        this.augmentPaths = this.findAugmentWorkspaces();
    }

    /**
     * Find all Augment workspace storage directories
     */
    findAugmentWorkspaces() {
        const homeDir = require('os').homedir();
        const vscodeStoragePath = path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage');
        
        try {
            if (!fs.existsSync(vscodeStoragePath)) {
                return [];
            }

            const workspaces = fs.readdirSync(vscodeStoragePath);
            const augmentWorkspaces = [];

            for (const workspace of workspaces) {
                const augmentPath = path.join(vscodeStoragePath, workspace, 'Augment.vscode-augment');
                if (fs.existsSync(augmentPath)) {
                    const kvStorePath = path.join(augmentPath, 'augment-kv-store');
                    if (fs.existsSync(kvStorePath)) {
                        augmentWorkspaces.push({
                            workspaceId: workspace,
                            path: augmentPath,
                            kvStore: kvStorePath,
                            lastAccessed: this.getLastAccessTime(kvStorePath)
                        });
                    }
                }
            }

            // Sort by most recently accessed first
            return augmentWorkspaces.sort((a, b) => b.lastAccessed - a.lastAccessed);
            
        } catch (error) {
            console.warn('Warning: Could not scan Augment workspaces:', error.message);
            return [];
        }
    }

    /**
     * Get the last access time of a directory
     */
    getLastAccessTime(dirPath) {
        try {
            const stats = fs.statSync(dirPath);
            return stats.mtime.getTime();
        } catch {
            return 0;
        }
    }

    /**
     * Check if Augment is available/being used
     */
    isAvailable() {
        return this.augmentPaths.length > 0;
    }

    /**
     * Get current status of Augment workspaces
     */
    getStatus() {
        if (!this.isAvailable()) {
            return {
                available: false,
                message: 'No Augment VSCode workspaces found'
            };
        }

        const totalWorkspaces = this.augmentPaths.length;
        const recentWorkspaces = this.augmentPaths.filter(w => {
            const daysSinceAccess = (Date.now() - w.lastAccessed) / (1000 * 60 * 60 * 24);
            return daysSinceAccess < 30; // Active within last 30 days
        }).length;

        return {
            available: true,
            totalWorkspaces,
            recentWorkspaces,
            message: `Found ${totalWorkspaces} Augment workspaces (${recentWorkspaces} recently active)`
        };
    }

    /**
     * Extract conversation data from Augment LevelDB files
     * Groups individual messages into meaningful conversation sessions
     */
    async extractConversations(workspaceLimit = 3) {
        if (!this.isAvailable()) {
            return [];
        }

        const rawMessages = [];
        const workspacesToProcess = this.augmentPaths.slice(0, workspaceLimit);

        console.log(`Processing ${workspacesToProcess.length} most recent Augment workspaces...`);

        for (const workspace of workspacesToProcess) {
            try {
                const workspaceMessages = await this.extractFromWorkspace(workspace);
                rawMessages.push(...workspaceMessages);
            } catch (error) {
                console.warn(`Warning: Failed to extract from workspace ${workspace.workspaceId}:`, error.message);
            }
        }

        // Group messages into meaningful conversations
        const groupedConversations = this.groupMessagesIntoConversations(rawMessages);

        console.log(`Extracted ${rawMessages.length} messages, grouped into ${groupedConversations.length} conversations from Augment`);
        return groupedConversations;
    }

    /**
     * Extract conversations from a single workspace
     */
    async extractFromWorkspace(workspace) {
        const conversations = [];
        
        try {
            // Get all LDB and LOG files from the kv-store
            const kvStoreFiles = fs.readdirSync(workspace.kvStore)
                .filter(file => file.endsWith('.ldb') || file.endsWith('.log'))
                .map(file => path.join(workspace.kvStore, file));

            // Sort files by modification time (newest first)
            kvStoreFiles.sort((a, b) => {
                try {
                    return fs.statSync(b).mtime - fs.statSync(a).mtime;
                } catch {
                    return 0;
                }
            });

            // Process the most recent files first
            const filesToProcess = kvStoreFiles.slice(0, 5); // Limit to 5 most recent files

            for (const filePath of filesToProcess) {
                try {
                    const fileConversations = await this.extractFromLevelDBFile(filePath, workspace);
                    conversations.push(...fileConversations);
                } catch (error) {
                    console.warn(`Warning: Failed to process ${path.basename(filePath)}:`, error.message);
                }
            }

        } catch (error) {
            console.warn(`Warning: Could not read workspace ${workspace.workspaceId}:`, error.message);
        }

        return conversations;
    }

    /**
     * Extract conversations from a single LevelDB file using strings command
     */
    async extractFromLevelDBFile(filePath, workspace) {
        const conversations = [];

        try {
            // Use strings command to extract text data from LevelDB file
            const command = `strings "${filePath}"`;
            const output = execSync(command, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer
            
            // Look for conversation data patterns
            const conversationMatches = this.parseConversationData(output, filePath, workspace);
            conversations.push(...conversationMatches);

        } catch (error) {
            // If strings command fails, try alternative approach
            if (error.message.includes('too large')) {
                console.warn(`File ${path.basename(filePath)} too large, skipping...`);
            } else {
                console.warn(`Could not extract from ${path.basename(filePath)}:`, error.message);
            }
        }

        return conversations;
    }

    /**
     * Parse conversation data from strings output
     */
    parseConversationData(output, filePath, workspace) {
        const conversations = [];
        
        try {
            // Look for request/response patterns with better context extraction
            const requestMatches = [];
            const responseMatches = [];
            
            // Extract user requests with more context
            const requestPattern = /"request_message"\s*:\s*"([^"]{20,500})"/g;
            let requestMatch;
            while ((requestMatch = requestPattern.exec(output)) !== null) {
                const cleanedRequest = this.cleanMessage(requestMatch[1]);
                if (cleanedRequest && this.isValidConversationMessage(cleanedRequest)) {
                    requestMatches.push({
                        content: cleanedRequest,
                        type: 'user',
                        rawMatch: requestMatch[0]
                    });
                }
            }
            
            // Extract AI responses with more context
            const responsePattern = /"response_text"\s*:\s*"([^"]{20,500})"/g;
            let responseMatch;
            while ((responseMatch = responsePattern.exec(output)) !== null) {
                const cleanedResponse = this.cleanMessage(responseMatch[1]);
                if (cleanedResponse && this.isValidConversationMessage(cleanedResponse)) {
                    responseMatches.push({
                        content: cleanedResponse,
                        type: 'assistant',
                        rawMatch: responseMatch[0]
                    });
                }
            }
            
            // Also look for conversationId patterns to group messages
            const conversationIdPattern = /"conversationId"\s*:\s*"([^"]+)"/g;
            const conversationIds = [];
            let convIdMatch;
            while ((convIdMatch = conversationIdPattern.exec(output)) !== null) {
                if (convIdMatch[1] && convIdMatch[1].length > 5) {
                    conversationIds.push(convIdMatch[1]);
                }
            }
            
            // Create conversation entries for requests
            requestMatches.forEach((request, index) => {
                const conversationId = conversationIds[index] || `unknown-${index}`;
                conversations.push({
                    id: `aug-${workspace.workspaceId}-req-${index}`,
                    conversationId: conversationId.substring(0, 20), // Truncate long IDs
                    timestamp: new Date().toISOString(),
                    source: 'augment',
                    workspaceId: workspace.workspaceId,
                    filePath: path.basename(filePath),
                    content: request.content,
                    type: 'user',
                    metadata: {
                        extractedFrom: 'leveldb-request-message',
                        rawLength: request.content.length,
                        messageType: 'user_request'
                    }
                });
            });
            
            // Create conversation entries for responses
            responseMatches.forEach((response, index) => {
                const conversationId = conversationIds[index] || `unknown-${index}`;
                conversations.push({
                    id: `aug-${workspace.workspaceId}-resp-${index}`,
                    conversationId: conversationId.substring(0, 20),
                    timestamp: new Date().toISOString(),
                    source: 'augment',
                    workspaceId: workspace.workspaceId,
                    filePath: path.basename(filePath),
                    content: response.content,
                    type: 'assistant', 
                    metadata: {
                        extractedFrom: 'leveldb-response-text',
                        rawLength: response.content.length,
                        messageType: 'ai_response'
                    }
                });
            });
            
        } catch (error) {
            console.warn('Error parsing Augment conversation data:', error.message);
        }

        return conversations;
    }

    /**
     * Group individual messages into meaningful conversation sessions
     * Uses conversationId, temporal proximity, and workspace context for grouping
     */
    groupMessagesIntoConversations(rawMessages) {
        if (rawMessages.length === 0) return [];
        
        // Sort messages by timestamp and workspace
        const sortedMessages = rawMessages.sort((a, b) => {
            // First sort by workspace
            if (a.workspaceId !== b.workspaceId) {
                return a.workspaceId.localeCompare(b.workspaceId);
            }
            // Then by timestamp
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        const conversations = [];
        const conversationGroups = new Map();
        
        // Group messages by conversationId or create temporal groups
        for (const message of sortedMessages) {
            let groupKey = null;
            
            // Try to use conversationId if it exists and is meaningful
            if (message.conversationId && 
                message.conversationId !== 'unknown' && 
                !message.conversationId.startsWith('unknown-')) {
                groupKey = `${message.workspaceId}-${message.conversationId}`;
            } else {
                // Create temporal groups: messages within 30 minutes are grouped together
                const messageTime = new Date(message.timestamp).getTime();
                let foundGroup = false;
                
                for (const [existingKey, existingGroup] of conversationGroups.entries()) {
                    if (existingKey.startsWith(`${message.workspaceId}-temporal-`)) {
                        const lastMessageTime = new Date(existingGroup.messages[existingGroup.messages.length - 1].timestamp).getTime();
                        const timeDiff = Math.abs(messageTime - lastMessageTime);
                        
                        // Group if within 30 minutes and same workspace
                        if (timeDiff <= 30 * 60 * 1000) {
                            groupKey = existingKey;
                            foundGroup = true;
                            break;
                        }
                    }
                }
                
                if (!foundGroup) {
                    // Create new temporal group
                    groupKey = `${message.workspaceId}-temporal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
            }
            
            // Add message to group
            if (!conversationGroups.has(groupKey)) {
                conversationGroups.set(groupKey, {
                    messages: [],
                    workspaceId: message.workspaceId,
                    conversationId: message.conversationId || groupKey,
                    filePath: message.filePath,
                    startTime: message.timestamp,
                    endTime: message.timestamp
                });
            }
            
            const group = conversationGroups.get(groupKey);
            group.messages.push(message);
            
            // Update timespan
            if (new Date(message.timestamp) < new Date(group.startTime)) {
                group.startTime = message.timestamp;
            }
            if (new Date(message.timestamp) > new Date(group.endTime)) {
                group.endTime = message.timestamp;
            }
        }
        
        // Convert groups to conversation objects
        let conversationIndex = 0;
        for (const [groupKey, group] of conversationGroups.entries()) {
            if (group.messages.length === 0) continue;
            
            // Create meaningful conversation content from all messages
            const userMessages = group.messages.filter(m => m.type === 'user');
            const assistantMessages = group.messages.filter(m => m.type === 'assistant');
            
            // Build conversation summary
            let conversationContent = '';
            if (userMessages.length > 0 && assistantMessages.length > 0) {
                conversationContent = `Multi-turn conversation: ${userMessages.length} user messages, ${assistantMessages.length} AI responses.\n\n`;
                conversationContent += `Latest user query: ${userMessages[userMessages.length - 1].content.substring(0, 200)}...\n\n`;
                if (assistantMessages.length > 0) {
                    conversationContent += `Latest AI response: ${assistantMessages[assistantMessages.length - 1].content.substring(0, 200)}...`;
                }
            } else if (userMessages.length > 0) {
                conversationContent = `User queries (${userMessages.length}): ${userMessages[userMessages.length - 1].content.substring(0, 300)}...`;
            } else if (assistantMessages.length > 0) {
                conversationContent = `AI responses (${assistantMessages.length}): ${assistantMessages[assistantMessages.length - 1].content.substring(0, 300)}...`;
            }
            
            conversations.push({
                id: `aug-conv-${group.workspaceId.substring(0, 8)}-${conversationIndex++}`,
                conversationId: group.conversationId.substring(0, 20),
                timestamp: group.endTime, // Use latest message time
                source: 'augment',
                workspaceId: group.workspaceId,
                filePath: group.filePath,
                content: conversationContent,
                type: 'conversation',
                messageCount: group.messages.length,
                userMessageCount: userMessages.length,
                assistantMessageCount: assistantMessages.length,
                messages: group.messages,
                timespan: {
                    start: group.startTime,
                    end: group.endTime,
                    duration: new Date(group.endTime) - new Date(group.startTime)
                },
                metadata: {
                    extractedFrom: 'leveldb-grouped-conversation',
                    totalMessages: group.messages.length,
                    userMessages: userMessages.length,
                    assistantMessages: assistantMessages.length,
                    groupingMethod: groupKey.includes('temporal') ? 'temporal' : 'conversationId',
                    rawLength: conversationContent.length
                }
            });
        }
        
        // Sort conversations by timestamp (newest first)
        conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return conversations;
    }

    /**
     * Parse a conversation match into structured data
     */
    parseConversationMatch(match, workspace, filePath) {
        try {
            // Try to extract conversation ID and timestamp
            const conversationIdMatch = match.match(/conversationId['":]+"([^"]+)"/);
            const timestampMatch = match.match(/timestamp['":]+"([^"]+)"/);
            
            if (!conversationIdMatch) return null;

            return {
                id: `aug-${workspace.workspaceId}-${conversationIdMatch[1]}`,
                conversationId: conversationIdMatch[1],
                timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
                source: 'augment',
                workspaceId: workspace.workspaceId,
                filePath: path.basename(filePath),
                content: this.cleanMessage(match),
                type: 'conversation',
                metadata: {
                    extractedFrom: 'leveldb-conversation-history',
                    rawLength: match.length
                }
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Clean and decode message content
     */
    cleanMessage(message) {
        if (!message) return '';
        
        return message
            // Remove JSON escape sequences
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\u([0-9a-f]{4})/gi, (match, code) => {
                try {
                    return String.fromCharCode(parseInt(code, 16));
                } catch {
                    return match;
                }
            })
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Check if a message contains valid conversational content (original method)
     */
    isValidMessage(message) {
        if (!message || message.length < 10) return false;
        
        // Filter out technical noise
        const noisePatterns = [
            /^[{[\]}",:]+$/,
            /^[0-9a-f-]{36}$/, // UUIDs
            /^https?:\/\//,    // URLs only
            /^\/Users\//,      // File paths only
            /^\d{13}$/,        // Timestamps only
            /^[0-9\s\-:T.Z]+$/ // Date/time strings only
        ];

        return !noisePatterns.some(pattern => pattern.test(message.trim()));
    }
    
    /**
     * Enhanced validation for actual conversation messages
     */
    isValidConversationMessage(message) {
        if (!message || message.length < 15) return false;
        
        // More strict validation for meaningful conversation content
        const meaningfulPatterns = [
            /\b(let|can|you|I|the|and|this|that|will|would|could|should|please|help|look|check|test|create|build|implement|fix|update|add|remove)\b/i,
            /[.!?]/, // Contains punctuation
            /\b\w+\s+\w+\s+\w+\b/ // At least 3 words
        ];
        
        // Must match at least one meaningful pattern
        const hasContent = meaningfulPatterns.some(pattern => pattern.test(message));
        
        // Filter out noise and incomplete fragments
        const noisePatterns = [
            /^[{[\]}",:;\s]+$/,
            /^[0-9a-f-]{30,}$/, // Long hex strings/IDs
            /^\d+$/, // Numbers only
            /^[\w\s]*\\[nrt][\w\s]*$/,  // Escaped characters only
            /^[A-Za-z]$/ // Single characters
        ];
        
        const hasNoise = noisePatterns.some(pattern => pattern.test(message.trim()));
        
        return hasContent && !hasNoise;
    }

    /**
     * Get extraction statistics
     */
    getExtractionStats() {
        if (!this.isAvailable()) {
            return { available: false, workspaces: 0, files: 0 };
        }

        let totalFiles = 0;
        let totalSize = 0;

        for (const workspace of this.augmentPaths) {
            try {
                const files = fs.readdirSync(workspace.kvStore);
                const ldbFiles = files.filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
                totalFiles += ldbFiles.length;
                
                for (const file of ldbFiles) {
                    try {
                        const stats = fs.statSync(path.join(workspace.kvStore, file));
                        totalSize += stats.size;
                    } catch {}
                }
            } catch {}
        }

        return {
            available: true,
            workspaces: this.augmentPaths.length,
            files: totalFiles,
            totalSizeMB: Math.round(totalSize / (1024 * 1024)),
            avgFileSizeMB: totalFiles ? Math.round((totalSize / totalFiles) / (1024 * 1024)) : 0
        };
    }
}

module.exports = AugmentParser;