#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const os = require('os');
const AugmentParser = require('./session-parsers/augment-parser');

/**
 * Universal AI Context Extractor
 * 
 * Extracts conversation context from various AI assistants:
 * - Warp AI (SQLite database) - ✅ Production Ready
 * - Claude Desktop (IndexedDB/LocalStorage) - 🔧 Real Data Found
 * - Cursor AI (Extension Storage) - 🔧 Real Data Found
 * - GitHub Copilot (Extension Data) - 🔧 Real Data Found
 * - Augment (Agent edit history) - ✅ Production Ready
 */
class ContextExtractor {
    constructor() {
        this.sources = {
            warp: new WarpContextSource(),
            augment: new AugmentContextSource(),
            claude: new ClaudeContextSource(),
            cursor: new CursorContextSource(),
            copilot: new CopilotContextSource(),
            chatgpt: new ChatGPTContextSource(),
        };
        this.defaultSource = 'warp';
    }

    /**
     * List available conversations from specified source
     * @param {string} source - AI assistant source (warp, claude, etc.)
     * @param {Object} options - Additional options
     * @returns {Array} List of conversations
     */
    async listConversations(source = this.defaultSource, options = {}) {
        const contextSource = this.sources[source];
        if (!contextSource) {
            throw new Error(`Unsupported context source: ${source}`);
        }

        return await contextSource.listConversations(options);
    }

    /**
     * Extract full conversation context from specified source
     * @param {string} conversationId - Conversation identifier
     * @param {string} source - AI assistant source
     * @param {Object} options - Additional options
     * @returns {Object} Full conversation context
     */
    async extractConversation(conversationId, source = this.defaultSource, options = {}) {
        const contextSource = this.sources[source];
        if (!contextSource) {
            throw new Error(`Unsupported context source: ${source}`);
        }

        return await contextSource.extractConversation(conversationId, options);
    }

    /**
     * Get available context sources
     * @returns {Array} List of available sources
     */
    getAvailableSources() {
        return Object.keys(this.sources).filter(source => 
            this.sources[source].isAvailable()
        );
    }

    /**
     * Check if a specific source is available
     * @param {string} source - Source to check
     * @returns {boolean} Whether source is available
     */
    isSourceAvailable(source) {
        return this.sources[source] && this.sources[source].isAvailable();
    }
}

/**
 * Base class for context sources
 */
class ContextSource {
    async listConversations(options = {}) {
        throw new Error('listConversations must be implemented by subclass');
    }

    async extractConversation(conversationId, options = {}) {
        throw new Error('extractConversation must be implemented by subclass');
    }

    isAvailable() {
        throw new Error('isAvailable must be implemented by subclass');
    }
}

/**
 * Warp AI Context Source
 * Extracts conversations from Warp's SQLite database
 */
class WarpContextSource extends ContextSource {
    constructor() {
        super();
        this.dbPath = this.findWarpDatabase();
    }

    findWarpDatabase() {
        const possiblePaths = [
            path.join(os.homedir(), 'Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite'),
            path.join(os.homedir(), 'Library/Application Support/dev.warp.Warp-Stable/warp.sqlite'),
            // Add more possible paths as needed
        ];

        for (const dbPath of possiblePaths) {
            if (fs.existsSync(dbPath)) {
                return dbPath;
            }
        }

        return null;
    }

    isAvailable() {
        return this.dbPath && fs.existsSync(this.dbPath);
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Warp database not found. Please ensure Warp AI is installed.');
        }

        const limit = options.limit || 10;
        const db = new Database(this.dbPath, { readonly: true });

        try {
            // Get unique conversation IDs and their metadata
            const conversations = db.prepare(`
                SELECT DISTINCT
                    ac.conversation_id,
                    MIN(aq.start_ts) as earliest_query,
                    MAX(ac.last_modified_at) as last_updated,
                    COUNT(DISTINCT aq.id) as query_count,
                    COUNT(DISTINCT ac.id) as conversation_count
                FROM agent_conversations ac
                LEFT JOIN ai_queries aq ON ac.conversation_id = aq.conversation_id
                GROUP BY ac.conversation_id
                ORDER BY last_updated DESC
                LIMIT ?
            `).all(limit);

            return conversations.map(conv => ({
                id: conv.conversation_id,
                source: 'warp',
                created: conv.earliest_query ? new Date(conv.earliest_query).toISOString() : null,
                updated: new Date(conv.last_updated).toISOString(),
                messageCount: conv.conversation_count || 0,
                queryCount: conv.query_count || 0
            }));
        } finally {
            db.close();
        }
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Warp database not found. Please ensure Warp AI is installed.');
        }

        const db = new Database(this.dbPath, { readonly: true });

        try {
            // Get conversation metadata from agent_conversations
            const conversation = db.prepare(`
                SELECT conversation_id, last_modified_at, conversation_data
                FROM agent_conversations 
                WHERE conversation_id = ?
                LIMIT 1
            `).get(conversationId);

            if (!conversation) {
                throw new Error(`Conversation ${conversationId} not found`);
            }

            // Get user queries
            const queries = db.prepare(`
                SELECT 
                    'USER_QUERY' as type,
                    start_ts as timestamp,
                    working_directory,
                    input as content,
                    exchange_id
                FROM ai_queries 
                WHERE conversation_id = ?
                ORDER BY start_ts ASC
            `).all(conversationId);

            // Parse conversation data to get AI responses
            let aiActions = [];
            try {
                if (conversation.conversation_data) {
                    const conversationData = JSON.parse(conversation.conversation_data);
                    // Extract AI actions from conversation data
                    // This structure might vary, so we'll be flexible
                    if (conversationData.messages) {
                        aiActions = conversationData.messages
                            .filter(msg => msg.role === 'assistant')
                            .map(msg => ({
                                type: 'AI_ACTION',
                                timestamp: msg.timestamp || conversation.last_modified_at,
                                workingDirectory: null,
                                content: msg.content || 'AI Action performed',
                                context: msg.metadata || null
                            }));
                    }
                }
            } catch (parseError) {
                console.warn('Could not parse conversation_data:', parseError.message);
            }

            // Combine and sort all messages
            const allMessages = [...queries, ...aiActions]
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Get unique working directories
            const workingDirs = [...new Set(allMessages
                .map(m => m.workingDirectory)
                .filter(dir => dir)
            )];

            // Calculate timespan
            const timestamps = allMessages.map(m => new Date(m.timestamp));
            const startTime = timestamps.length > 0 ? Math.min(...timestamps) : new Date();
            const endTime = timestamps.length > 0 ? Math.max(...timestamps) : new Date();

            return {
                id: conversationId,
                source: 'warp',
                created: queries.length > 0 ? queries[0].timestamp : conversation.last_modified_at,
                updated: conversation.last_modified_at,
                messageCount: allMessages.length,
                workingDirectories: workingDirs,
                timespan: {
                    start: new Date(startTime).toISOString(),
                    end: new Date(endTime).toISOString(),
                    duration: endTime - startTime
                },
                messages: allMessages.map(msg => ({
                    type: msg.type,
                    timestamp: msg.timestamp,
                    workingDirectory: msg.workingDirectory,
                    content: msg.content,
                    context: msg.context
                }))
            };
        } finally {
            db.close();
        }
    }
}

/**
 * Augment VS Code Extension Context Source
 * Extracts conversations from Augment's LevelDB storage using AugmentParser
 */
class AugmentContextSource extends ContextSource {
    constructor() {
        super();
        this.parser = new AugmentParser();
    }

    isAvailable() {
        return this.parser.isAvailable();
    }

    getStatus() {
        return this.parser.getStatus();
    }

    getExtractionStats() {
        return this.parser.getExtractionStats();
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            return [];
        }

        const limit = options.limit || 50;
        const workspaceLimit = options.workspaceLimit || 3;
        
        try {
            const conversations = await this.parser.extractConversations(workspaceLimit);
            
            // Convert to standard format and limit results
            return conversations.slice(0, limit).map(conv => ({
                id: conv.id,
                source: 'augment',
                workspaceId: conv.workspaceId,
                conversationId: conv.conversationId,
                created: conv.timespan ? conv.timespan.start : conv.timestamp,
                updated: conv.timestamp,
                messageCount: conv.messageCount || 1,
                userMessageCount: conv.userMessageCount || 0,
                assistantMessageCount: conv.assistantMessageCount || 0,
                type: conv.type,
                filePath: conv.filePath,
                content: conv.content ? conv.content.substring(0, 200) + '...' : '', // Preview
                duration: conv.timespan ? conv.timespan.duration : 0,
                metadata: conv.metadata
            }));

        } catch (error) {
            console.warn('Warning: Could not list Augment conversations:', error.message);
            return [];
        }
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Augment not available.');
        }

        try {
            // Extract conversations and find the one with matching ID
            // Use same workspace limit as listConversations for consistency
            const conversations = await this.parser.extractConversations(options.workspaceLimit || 3);
            const conversation = conversations.find(conv => 
                conv.id === conversationId || 
                conv.conversationId === conversationId
            );

            if (!conversation) {
                throw new Error(`Conversation ${conversationId} not found in Augment data`);
            }

            // Handle both grouped and individual conversations
            const isGroupedConversation = conversation.messages && Array.isArray(conversation.messages);
            
            return {
                id: conversation.id,
                source: 'augment',
                aiAssistant: 'augment', // For platform detection
                conversationId: conversation.conversationId,
                workspaceId: conversation.workspaceId,
                created: conversation.timespan ? conversation.timespan.start : conversation.timestamp,
                updated: conversation.timestamp,
                messageCount: conversation.messageCount || 1,
                content: conversation.content,
                type: conversation.type,
                metadata: {
                    ...conversation.metadata,
                    source: 'augment',
                    chunkId: conversation.id,
                    isGrouped: isGroupedConversation,
                    userMessageCount: conversation.userMessageCount || 0,
                    assistantMessageCount: conversation.assistantMessageCount || 0
                },
                workingDirectories: conversation.filePath ? [conversation.filePath] : [process.cwd()],
                timespan: conversation.timespan || {
                    start: conversation.timestamp,
                    end: conversation.timestamp,
                    duration: 0
                },
                messages: isGroupedConversation ? 
                    // Convert grouped messages to standard format
                    conversation.messages.map(msg => ({
                        type: msg.type === 'user' ? 'USER_QUERY' : 'AI_ACTION',
                        role: msg.type === 'user' ? 'user' : 'assistant',
                        timestamp: msg.timestamp,
                        content: msg.content,
                        source: 'augment-leveldb',
                        workingDirectory: msg.filePath || conversation.filePath || process.cwd(),
                        context: {
                            aiSource: 'augment',
                            extractedFrom: 'leveldb-grouped',
                            messageType: msg.metadata?.messageType
                        }
                    })) :
                    // Single message format (backward compatibility)
                    [{
                        type: conversation.type === 'user' ? 'USER_QUERY' : 'AI_ACTION',
                        role: conversation.type === 'user' ? 'user' : 'assistant',
                        timestamp: conversation.timestamp,
                        content: conversation.content,
                        source: 'augment-leveldb',
                        workingDirectory: conversation.filePath || process.cwd(),
                        context: {
                            aiSource: 'augment',
                            extractedFrom: 'leveldb-single'
                        }
                    }]
            };

        } catch (error) {
            console.warn('Warning: Could not extract Augment conversation:', error.message);
            throw error;
        }
    }
}

/**
 * Cursor AI Context Source
 * Extracts conversations from Cursor's local storage
 */
class CursorContextSource extends ContextSource {
    constructor() {
        super();
        this.cursorPath = path.join(os.homedir(), 'Library/Application Support/Cursor');
    }

    isAvailable() {
        return fs.existsSync(this.cursorPath) && 
               fs.existsSync(path.join(this.cursorPath, 'User/globalStorage/github.copilot-chat'));
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Cursor AI not found. Please ensure Cursor is installed with Copilot enabled.');
        }

        const limit = options.limit || 10;
        const conversations = [];

        try {
            // Check Copilot chat storage in Cursor
            const copilotChatDir = path.join(this.cursorPath, 'User/globalStorage/github.copilot-chat');
            if (fs.existsSync(copilotChatDir)) {
                const files = fs.readdirSync(copilotChatDir)
                    .filter(file => file.endsWith('.json'))
                    .map(file => {
                        const filePath = path.join(copilotChatDir, file);
                        const stats = fs.statSync(filePath);
                        return { file, path: filePath, modified: stats.mtime };
                    })
                    .sort((a, b) => b.modified - a.modified)
                    .slice(0, limit);

                for (const fileInfo of files) {
                    try {
                        const content = JSON.parse(fs.readFileSync(fileInfo.path, 'utf-8'));
                        // Extract conversation metadata based on file structure
                        conversations.push({
                            id: path.basename(fileInfo.file, '.json'),
                            source: 'cursor',
                            created: fileInfo.modified.toISOString(),
                            updated: fileInfo.modified.toISOString(),
                            messageCount: Array.isArray(content) ? content.length : Object.keys(content).length,
                            queryCount: 1,
                            filePath: fileInfo.path
                        });
                    } catch (error) {
                        console.warn(`Could not parse Cursor file ${fileInfo.file}:`, error.message);
                    }
                }
            }

            // Check workspace storage for additional conversation data
            const workspaceStorageDir = path.join(this.cursorPath, 'User/workspaceStorage');
            if (fs.existsSync(workspaceStorageDir)) {
                const workspaces = fs.readdirSync(workspaceStorageDir)
                    .filter(dir => fs.existsSync(path.join(workspaceStorageDir, dir, 'GitHub.copilot-chat')))
                    .slice(0, 5); // Limit workspace search

                for (const workspace of workspaces) {
                    const chatDir = path.join(workspaceStorageDir, workspace, 'GitHub.copilot-chat');
                    const chatFiles = fs.readdirSync(chatDir)
                        .filter(file => file.endsWith('.json'))
                        .slice(0, 3); // Limit files per workspace

                    for (const chatFile of chatFiles) {
                        try {
                            const filePath = path.join(chatDir, chatFile);
                            const stats = fs.statSync(filePath);
                            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                            
                            conversations.push({
                                id: `${workspace}-${path.basename(chatFile, '.json')}`,
                                source: 'cursor',
                                created: stats.ctime.toISOString(),
                                updated: stats.mtime.toISOString(),
                                messageCount: Array.isArray(content) ? content.length : Object.keys(content).length,
                                queryCount: 1,
                                workspace: workspace,
                                filePath: filePath
                            });
                        } catch (error) {
                            console.warn(`Could not parse workspace chat file ${chatFile}:`, error.message);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Error accessing Cursor conversation data:', error.message);
        }

        return conversations
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))
            .slice(0, limit);
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Cursor AI not found.');
        }

        // Find the conversation file based on ID
        let conversationData = null;
        let filePath = null;

        // Check global storage
        const copilotChatDir = path.join(this.cursorPath, 'User/globalStorage/github.copilot-chat');
        if (fs.existsSync(copilotChatDir)) {
            const globalFile = path.join(copilotChatDir, `${conversationId}.json`);
            if (fs.existsSync(globalFile)) {
                conversationData = JSON.parse(fs.readFileSync(globalFile, 'utf-8'));
                filePath = globalFile;
            }
        }

        // Check workspace storage if not found in global
        if (!conversationData) {
            const workspaceStorageDir = path.join(this.cursorPath, 'User/workspaceStorage');
            if (fs.existsSync(workspaceStorageDir)) {
                const workspaces = fs.readdirSync(workspaceStorageDir);
                for (const workspace of workspaces) {
                    if (conversationId.startsWith(workspace)) {
                        const chatDir = path.join(workspaceStorageDir, workspace, 'GitHub.copilot-chat');
                        if (fs.existsSync(chatDir)) {
                            const fileName = conversationId.replace(`${workspace}-`, '') + '.json';
                            const workspaceFile = path.join(chatDir, fileName);
                            if (fs.existsSync(workspaceFile)) {
                                conversationData = JSON.parse(fs.readFileSync(workspaceFile, 'utf-8'));
                                filePath = workspaceFile;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!conversationData) {
            throw new Error(`Cursor conversation ${conversationId} not found`);
        }

        // Parse conversation data into messages
        const messages = [];
        const stats = fs.statSync(filePath);

        if (Array.isArray(conversationData)) {
            // Handle array format
            conversationData.forEach((item, index) => {
                messages.push({
                    type: 'COPILOT_CHAT',
                    timestamp: stats.mtime.toISOString(),
                    content: JSON.stringify(item, null, 2),
                    context: {
                        index: index,
                        source: 'cursor_copilot'
                    }
                });
            });
        } else {
            // Handle object format
            Object.entries(conversationData).forEach(([key, value]) => {
                messages.push({
                    type: 'COPILOT_CHAT',
                    timestamp: stats.mtime.toISOString(),
                    content: `${key}: ${JSON.stringify(value, null, 2)}`,
                    context: {
                        key: key,
                        source: 'cursor_copilot'
                    }
                });
            });
        }

        return {
            id: conversationId,
            source: 'cursor',
            created: stats.ctime.toISOString(),
            updated: stats.mtime.toISOString(),
            messageCount: messages.length,
            workingDirectories: [path.dirname(filePath)],
            timespan: {
                start: stats.ctime.toISOString(),
                end: stats.mtime.toISOString(),
                duration: stats.mtime - stats.ctime
            },
            messages: messages
        };
    }
}

/**
 * Claude Desktop Context Source
 * Extracts conversations from Claude Desktop app storage
 */
class ClaudeContextSource extends ContextSource {
    constructor() {
        super();
        this.claudePath = path.join(os.homedir(), 'Library/Application Support/Claude');
        this.indexedDBPath = path.join(this.claudePath, 'IndexedDB/https_claude.ai_0.indexeddb.leveldb');
        this.localStoragePath = path.join(this.claudePath, 'Local Storage/leveldb');
    }

    isAvailable() {
        return fs.existsSync(this.claudePath) && 
               (fs.existsSync(this.indexedDBPath) || fs.existsSync(this.localStoragePath));
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Claude Desktop not found. Please ensure Claude Desktop is installed.');
        }

        const limit = options.limit || 10;
        const conversations = [];

        try {
            // Check for conversation data in various Claude storage locations
            if (fs.existsSync(this.indexedDBPath)) {
                const files = fs.readdirSync(this.indexedDBPath)
                    .filter(file => file.endsWith('.ldb') || file.endsWith('.log'))
                    .map(file => {
                        const filePath = path.join(this.indexedDBPath, file);
                        const stats = fs.statSync(filePath);
                        return { file, path: filePath, modified: stats.mtime, size: stats.size };
                    })
                    .filter(f => f.size > 0)
                    .sort((a, b) => b.modified - a.modified)
                    .slice(0, limit);

                for (const fileInfo of files) {
                    conversations.push({
                        id: `claude-${path.basename(fileInfo.file, path.extname(fileInfo.file))}`,
                        source: 'claude',
                        created: fileInfo.modified.toISOString(),
                        updated: fileInfo.modified.toISOString(),
                        messageCount: 1, // Approximate - would need to parse LevelDB
                        queryCount: 1,
                        filePath: fileInfo.path,
                        storageType: 'indexeddb'
                    });
                }
            }

            // Check Session Storage and other storage locations
            const sessionStorageDir = path.join(this.claudePath, 'Session Storage');
            if (fs.existsSync(sessionStorageDir)) {
                const sessions = fs.readdirSync(sessionStorageDir)
                    .filter(file => file.endsWith('.log') || file.endsWith('.ldb'))
                    .map(file => {
                        const filePath = path.join(sessionStorageDir, file);
                        const stats = fs.statSync(filePath);
                        return { file, path: filePath, modified: stats.mtime, size: stats.size };
                    })
                    .filter(f => f.size > 100) // Filter out very small files
                    .sort((a, b) => b.modified - a.modified)
                    .slice(0, Math.max(1, limit - conversations.length));

                for (const sessionInfo of sessions) {
                    conversations.push({
                        id: `claude-session-${path.basename(sessionInfo.file, path.extname(sessionInfo.file))}`,
                        source: 'claude',
                        created: sessionInfo.modified.toISOString(),
                        updated: sessionInfo.modified.toISOString(),
                        messageCount: 1,
                        queryCount: 1,
                        filePath: sessionInfo.path,
                        storageType: 'session'
                    });
                }
            }
        } catch (error) {
            console.warn('Error accessing Claude conversation data:', error.message);
        }

        return conversations
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))
            .slice(0, limit);
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Claude Desktop not found.');
        }

        // Find the conversation file based on ID
        let conversationData = null;
        let filePath = null;
        let storageType = 'unknown';

        // Try to locate the file based on conversation ID
        if (conversationId.startsWith('claude-session-')) {
            const fileName = conversationId.replace('claude-session-', '') + '.log';
            filePath = path.join(this.claudePath, 'Session Storage', fileName);
            storageType = 'session';
        } else if (conversationId.startsWith('claude-')) {
            const fileName = conversationId.replace('claude-', '') + '.ldb';
            filePath = path.join(this.indexedDBPath, fileName);
            storageType = 'indexeddb';
        }

        if (!filePath || !fs.existsSync(filePath)) {
            throw new Error(`Claude conversation ${conversationId} not found`);
        }

        // Read the file (this is basic - real implementation would need LevelDB parsing)
        const stats = fs.statSync(filePath);
        let content = '';
        
        try {
            // For text-readable content, try to extract readable portions
            const rawContent = fs.readFileSync(filePath, 'utf-8');
            // Extract human-readable text patterns (very basic approach)
            const textMatches = rawContent.match(/[\x20-\x7E]{10,}/g) || [];
            content = textMatches.join('\n').substring(0, 1000); // Limit size
        } catch {
            // Binary content - just provide metadata
            content = `Binary storage file (${stats.size} bytes)`;
        }

        const messages = [{
            type: 'CLAUDE_STORAGE',
            timestamp: stats.mtime.toISOString(),
            content: content,
            context: {
                storageType: storageType,
                fileSize: stats.size,
                source: 'claude_desktop'
            }
        }];

        return {
            id: conversationId,
            source: 'claude',
            created: stats.ctime.toISOString(),
            updated: stats.mtime.toISOString(),
            messageCount: messages.length,
            workingDirectories: [path.dirname(filePath)],
            timespan: {
                start: stats.ctime.toISOString(),
                end: stats.mtime.toISOString(),
                duration: stats.mtime - stats.ctime
            },
            messages: messages
        };
    }
}

/**
 * GitHub Copilot Context Source
 * Extracts conversations from various IDEs with Copilot
 */
class CopilotContextSource extends ContextSource {
    constructor() {
        super();
        this.vscodeExtensions = path.join(os.homedir(), '.vscode/extensions');
        this.cursorCopilot = path.join(os.homedir(), 'Library/Application Support/Cursor/User/globalStorage/github.copilot-chat');
        this.vscodeGlobalStorage = path.join(os.homedir(), 'Library/Application Support/Code/User/globalStorage/github.copilot-chat');
    }

    isAvailable() {
        return fs.existsSync(this.cursorCopilot) || 
               fs.existsSync(this.vscodeGlobalStorage) ||
               (fs.existsSync(this.vscodeExtensions) && 
                fs.readdirSync(this.vscodeExtensions).some(dir => dir.includes('github.copilot')));
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('GitHub Copilot not found. Please ensure Copilot is installed.');
        }

        const limit = options.limit || 10;
        const conversations = [];

        try {
            // Check Cursor Copilot storage (already covered by CursorContextSource)
            // Check VS Code Copilot storage
            if (fs.existsSync(this.vscodeGlobalStorage)) {
                const files = fs.readdirSync(this.vscodeGlobalStorage)
                    .filter(file => file.endsWith('.json'))
                    .map(file => {
                        const filePath = path.join(this.vscodeGlobalStorage, file);
                        const stats = fs.statSync(filePath);
                        return { file, path: filePath, modified: stats.mtime };
                    })
                    .sort((a, b) => b.modified - a.modified)
                    .slice(0, limit);

                for (const fileInfo of files) {
                    try {
                        const content = JSON.parse(fs.readFileSync(fileInfo.path, 'utf-8'));
                        conversations.push({
                            id: `vscode-${path.basename(fileInfo.file, '.json')}`,
                            source: 'copilot',
                            created: fileInfo.modified.toISOString(),
                            updated: fileInfo.modified.toISOString(),
                            messageCount: Array.isArray(content) ? content.length : Object.keys(content).length,
                            queryCount: 1,
                            filePath: fileInfo.path,
                            ide: 'vscode'
                        });
                    } catch (error) {
                        console.warn(`Could not parse VS Code Copilot file ${fileInfo.file}:`, error.message);
                    }
                }
            }

            // Check extension directories for additional data
            if (fs.existsSync(this.vscodeExtensions)) {
                const copilotDirs = fs.readdirSync(this.vscodeExtensions)
                    .filter(dir => dir.includes('github.copilot'))
                    .slice(0, 2); // Limit to avoid too many directories

                for (const copilotDir of copilotDirs) {
                    const extensionPath = path.join(this.vscodeExtensions, copilotDir);
                    // Look for any conversation-like files
                    const dataFiles = [];
                    try {
                        const walkDir = (dir, depth = 0) => {
                            if (depth > 2) return; // Limit depth
                            const items = fs.readdirSync(dir).slice(0, 10); // Limit items
                            for (const item of items) {
                                const itemPath = path.join(dir, item);
                                const stats = fs.statSync(itemPath);
                                if (stats.isFile() && (item.endsWith('.json') || item.includes('chat'))) {
                                    dataFiles.push({ path: itemPath, stats, name: item });
                                } else if (stats.isDirectory() && depth < 2) {
                                    walkDir(itemPath, depth + 1);
                                }
                            }
                        };
                        walkDir(extensionPath);
                    } catch (error) {
                        console.warn(`Could not scan extension directory ${copilotDir}:`, error.message);
                    }

                    for (const dataFile of dataFiles.slice(0, 3)) {
                        conversations.push({
                            id: `ext-${copilotDir}-${path.basename(dataFile.name, path.extname(dataFile.name))}`,
                            source: 'copilot',
                            created: dataFile.stats.ctime.toISOString(),
                            updated: dataFile.stats.mtime.toISOString(),
                            messageCount: 1,
                            queryCount: 1,
                            filePath: dataFile.path,
                            ide: 'vscode',
                            extension: copilotDir
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Error accessing Copilot conversation data:', error.message);
        }

        return conversations
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))
            .slice(0, limit);
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('GitHub Copilot not found.');
        }

        // Find the conversation file based on ID
        let conversationData = null;
        let filePath = null;
        let ide = 'unknown';

        // VS Code global storage
        if (conversationId.startsWith('vscode-')) {
            const fileName = conversationId.replace('vscode-', '') + '.json';
            filePath = path.join(this.vscodeGlobalStorage, fileName);
            ide = 'vscode';
        }
        // Extension data
        else if (conversationId.startsWith('ext-')) {
            // Parse extension-based ID and find file
            const parts = conversationId.split('-');
            if (parts.length >= 3) {
                const extensionName = parts[1];
                const fileName = parts.slice(2).join('-');
                const extensionPath = path.join(this.vscodeExtensions, extensionName);
                
                // Search for the file in extension directory
                const findFile = (dir, name, depth = 0) => {
                    if (depth > 2) return null;
                    try {
                        const items = fs.readdirSync(dir);
                        for (const item of items) {
                            const itemPath = path.join(dir, item);
                            const stats = fs.statSync(itemPath);
                            if (stats.isFile() && (item === name + '.json' || item === name)) {
                                return itemPath;
                            } else if (stats.isDirectory() && depth < 2) {
                                const found = findFile(itemPath, name, depth + 1);
                                if (found) return found;
                            }
                        }
                    } catch {
                        return null;
                    }
                    return null;
                };
                
                filePath = findFile(extensionPath, fileName);
                ide = 'vscode';
            }
        }

        if (!filePath || !fs.existsSync(filePath)) {
            throw new Error(`Copilot conversation ${conversationId} not found`);
        }

        // Parse conversation data
        const stats = fs.statSync(filePath);
        try {
            conversationData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            // If not JSON, read as text
            conversationData = fs.readFileSync(filePath, 'utf-8');
        }

        // Convert to messages format
        const messages = [];
        
        if (typeof conversationData === 'string') {
            messages.push({
                type: 'COPILOT_DATA',
                timestamp: stats.mtime.toISOString(),
                content: conversationData,
                context: {
                    ide: ide,
                    source: 'copilot_file'
                }
            });
        } else if (Array.isArray(conversationData)) {
            conversationData.forEach((item, index) => {
                messages.push({
                    type: 'COPILOT_DATA',
                    timestamp: stats.mtime.toISOString(),
                    content: JSON.stringify(item, null, 2),
                    context: {
                        index: index,
                        ide: ide,
                        source: 'copilot_array'
                    }
                });
            });
        } else {
            Object.entries(conversationData).forEach(([key, value]) => {
                messages.push({
                    type: 'COPILOT_DATA',
                    timestamp: stats.mtime.toISOString(),
                    content: `${key}: ${JSON.stringify(value, null, 2)}`,
                    context: {
                        key: key,
                        ide: ide,
                        source: 'copilot_object'
                    }
                });
            });
        }

        return {
            id: conversationId,
            source: 'copilot',
            created: stats.ctime.toISOString(),
            updated: stats.mtime.toISOString(),
            messageCount: messages.length,
            workingDirectories: [path.dirname(filePath)],
            timespan: {
                start: stats.ctime.toISOString(),
                end: stats.mtime.toISOString(),
                duration: stats.mtime - stats.ctime
            },
            messages: messages
        };
    }
}

/**
 * ChatGPT Desktop Context Source
 * Extracts conversations from ChatGPT Desktop app storage
 */
class ChatGPTContextSource extends ContextSource {
    constructor() {
        super();
        this.chatgptPath = path.join(os.homedir(), 'Library/Application Support/com.openai.chat');
        this.conversationsPath = null;
        this.userId = null;
        
        // Find the conversations directory with user ID
        if (fs.existsSync(this.chatgptPath)) {
            const dirs = fs.readdirSync(this.chatgptPath)
                .filter(dir => dir.startsWith('conversations-v3-'));
            if (dirs.length > 0) {
                this.conversationsPath = path.join(this.chatgptPath, dirs[0]);
                this.userId = dirs[0].replace('conversations-v3-', '');
            }
        }
    }

    isAvailable() {
        return fs.existsSync(this.chatgptPath) && 
               this.conversationsPath && 
               fs.existsSync(this.conversationsPath);
    }

    async listConversations(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('ChatGPT Desktop not found. Please ensure ChatGPT Desktop app is installed.');
        }

        const limit = options.limit || 10;
        const conversations = [];

        try {
            // Get .data files from conversations directory
            const files = fs.readdirSync(this.conversationsPath)
                .filter(file => file.endsWith('.data'))
                .map(file => {
                    const filePath = path.join(this.conversationsPath, file);
                    const stats = fs.statSync(filePath);
                    const conversationId = path.basename(file, '.data');
                    return {
                        file,
                        path: filePath,
                        modified: stats.mtime,
                        created: stats.ctime,
                        size: stats.size,
                        id: conversationId
                    };
                })
                .sort((a, b) => b.modified - a.modified)
                .slice(0, limit);

            for (const fileInfo of files) {
                conversations.push({
                    id: fileInfo.id,
                    source: 'chatgpt',
                    created: fileInfo.created.toISOString(),
                    updated: fileInfo.modified.toISOString(),
                    messageCount: 1, // Encrypted data - can't determine exact count
                    queryCount: 1,
                    filePath: fileInfo.path,
                    fileSize: fileInfo.size,
                    storageType: 'encrypted_data'
                });
            }

            // Also check for projects if they exist
            const projectDirs = fs.readdirSync(this.chatgptPath)
                .filter(dir => dir.startsWith('project-g-p-'))
                .slice(0, Math.max(1, limit - conversations.length));

            for (const projectDir of projectDirs) {
                const projectPath = path.join(this.chatgptPath, projectDir);
                const stats = fs.statSync(projectPath);
                const projectId = projectDir.replace('project-g-p-', '');
                
                conversations.push({
                    id: `project-${projectId}`,
                    source: 'chatgpt',
                    created: stats.ctime.toISOString(),
                    updated: stats.mtime.toISOString(),
                    messageCount: 1,
                    queryCount: 1,
                    filePath: projectPath,
                    storageType: 'project_data'
                });
            }
        } catch (error) {
            console.warn('Error accessing ChatGPT conversation data:', error.message);
        }

        return conversations
            .sort((a, b) => new Date(b.updated) - new Date(a.updated))
            .slice(0, limit);
    }

    async extractConversation(conversationId, options = {}) {
        if (!this.isAvailable()) {
            throw new Error('ChatGPT Desktop not found.');
        }

        let filePath = null;
        let storageType = 'unknown';

        // Handle project conversations
        if (conversationId.startsWith('project-')) {
            const projectId = conversationId.replace('project-', '');
            filePath = path.join(this.chatgptPath, `project-g-p-${projectId}`);
            storageType = 'project';
        } else {
            // Handle regular conversations
            filePath = path.join(this.conversationsPath, `${conversationId}.data`);
            storageType = 'conversation';
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`ChatGPT conversation ${conversationId} not found`);
        }

        const stats = fs.statSync(filePath);
        let content = '';
        let messageCount = 1;

        try {
            if (stats.isDirectory()) {
                // Project directory - list contents
                const projectFiles = fs.readdirSync(filePath);
                content = `Project directory containing ${projectFiles.length} files:\n${projectFiles.join('\n')}`;
                messageCount = projectFiles.length;
            } else {
                // Encrypted conversation file - provide metadata only
                content = `Encrypted ChatGPT conversation data (${stats.size} bytes).\nNote: ChatGPT Desktop stores conversations in encrypted format.\nThis conversation was last modified on ${stats.mtime.toISOString()}.`;
                
                // Try to extract any readable metadata (very limited)
                const buffer = fs.readFileSync(filePath);
                const readableChars = buffer.toString('utf8').match(/[\x20-\x7E]+/g);
                if (readableChars && readableChars.length > 0) {
                    const metadata = readableChars.filter(s => s.length > 5).slice(0, 3).join(' | ');
                    if (metadata.length > 0) {
                        content += `\nPossible metadata: ${metadata.substring(0, 100)}...`;
                    }
                }
            }
        } catch (error) {
            content = `Unable to read ChatGPT conversation data: ${error.message}`;
        }

        const messages = [{
            type: 'CHATGPT_DATA',
            timestamp: stats.mtime.toISOString(),
            content: content,
            context: {
                storageType: storageType,
                fileSize: stats.size,
                encrypted: storageType === 'conversation',
                userId: this.userId,
                source: 'chatgpt_desktop'
            }
        }];

        return {
            id: conversationId,
            source: 'chatgpt',
            created: stats.ctime.toISOString(),
            updated: stats.mtime.toISOString(),
            messageCount: messageCount,
            workingDirectories: [path.dirname(filePath)],
            timespan: {
                start: stats.ctime.toISOString(),
                end: stats.mtime.toISOString(),
                duration: stats.mtime - stats.ctime
            },
            messages: messages
        };
    }
}

module.exports = {
    ContextExtractor,
    ContextSource,
    WarpContextSource,
    AugmentContextSource,
    ClaudeContextSource,
    CursorContextSource,
    CopilotContextSource,
    ChatGPTContextSource
};
