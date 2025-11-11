# 🚀 MCP Automatic Mode - Always Use All 4 RAG Stores

**User-controlled automatic mode for AETHER MCP integration**

---

## 🎯 What This Does

**Forces AETHER MCP to ALWAYS use all 4 QuadIndex stores:**

1. ✅ **VectorStore** - Semantic search (always used)
2. ✅ **MetadataStore** - Exact filters (used when filters specified)
3. ✅ **GraphStore** - Relationship traversal (now **always ON** by default)
4. ✅ **ReasoningStore** - Deep thinking with alternatives (now **always ON** by default)

**Before:** AI decides when to use relationships and reasoning  
**After:** User controls defaults via environment variables

---

## 🔧 How It Works

### **Environment Variables**

Two new environment variables control the defaults:

- **`AETHER_INCLUDE_RELATIONSHIPS`** - Default: `true` (always include relationships)
- **`AETHER_INCLUDE_REASONING`** - Default: `true` (always include reasoning)

### **Behavior**

```typescript
// Default: true (unless explicitly set to "false")
const defaultIncludeRelationships = process.env['AETHER_INCLUDE_RELATIONSHIPS'] !== 'false';
const defaultIncludeReasoning = process.env['AETHER_INCLUDE_REASONING'] !== 'false';

// Use defaults if not explicitly specified
includeRelationships: args.includeRelationships ?? defaultIncludeRelationships,
includeReasoning: args.includeReasoning ?? defaultIncludeReasoning,
```

**This means:**
- ✅ If env var is **not set** → Default is `true` (automatic mode)
- ✅ If env var is `"true"` → Use all 4 stores
- ✅ If env var is `"false"` → Only use VectorStore + MetadataStore
- ✅ AI can still override by explicitly passing `includeRelationships: false`

---

## 📝 Configuration

### **Augment (Recommended)**

Add to your MCP configuration in Augment Settings Panel:

```json
{
  "mcpServers": {
    "aether": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Programming/aether/packages/aether/dist/esm/aether/src/mcp/server.js"
      ],
      "env": {
        "AETHER_PROJECT_DIR": "${workspaceFolder}",
        "AETHER_VERBOSE": "false",
        "AETHER_INCLUDE_RELATIONSHIPS": "true",
        "AETHER_INCLUDE_REASONING": "true"
      }
    }
  }
}
```

### **Claude Desktop**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["tsx", "/path/to/aether/packages/aether/src/mcp/server.ts"],
      "env": {
        "AETHER_PROJECT_DIR": "/path/to/your/project",
        "AETHER_INCLUDE_RELATIONSHIPS": "true",
        "AETHER_INCLUDE_REASONING": "true"
      }
    }
  }
}
```

---

## 🎯 Why This Matters

### **Problem: AI Decides When to Use Full RAG**

**Before this change:**
- AI decides: "This question needs relationships" → Uses GraphStore
- AI decides: "This question needs reasoning" → Uses ReasoningStore
- AI decides: "This is simple" → Only uses VectorStore

**Result:** Inconsistent context loading, AI makes decisions instead of user

### **Solution: User Controls Defaults**

**After this change:**
- User sets: `AETHER_INCLUDE_RELATIONSHIPS=true` → Always use GraphStore
- User sets: `AETHER_INCLUDE_REASONING=true` → Always use ReasoningStore
- AI queries AETHER → Gets full context automatically

**Result:** Consistent context loading, user controls behavior

---

## 📊 Example Queries

### **Before (Manual Decision)**

```typescript
// AI decides: "This needs relationships"
query_principles_aether({
  query: "TypeScript strict mode",
  includeRelationships: true,  // AI decided to include this
  includeReasoning: false       // AI decided NOT to include this
})
```

**Problem:** AI might forget to include reasoning, missing valuable context!

### **After (Automatic Mode)**

```typescript
// User configured: AETHER_INCLUDE_RELATIONSHIPS=true, AETHER_INCLUDE_REASONING=true
query_principles_aether({
  query: "TypeScript strict mode"
  // includeRelationships defaults to true (from env var)
  // includeReasoning defaults to true (from env var)
})
```

**Result:** Always gets full context (relationships + reasoning) automatically!

---

## 🔥 Benefits

### **1. Consistent Context Loading**
- ✅ Every query uses all 4 stores
- ✅ No AI decision-making about which stores to use
- ✅ Your second brain grows with full RAG power

### **2. User Control**
- ✅ You decide the defaults, not the AI
- ✅ Can disable if needed (set to `"false"`)
- ✅ Can override per-query if needed

### **3. Automatic Mode Philosophy**
- ✅ Aligns with AETHER's "automatic mode only" philosophy
- ✅ No manual decisions needed
- ✅ Just works!

---

## 🚫 What This DOESN'T Solve

**This does NOT force the AI to call the MCP tool on every response.**

**Why?**
- AI behavior is controlled by Augment/Claude, not by AETHER configuration
- There's no environment variable that can force AI to call a tool
- This is a limitation of the AI system, not AETHER

**What this DOES solve:**
- ✅ When AI DOES query AETHER, it uses all 4 stores automatically
- ✅ User controls the defaults, not the AI
- ✅ Consistent behavior when MCP is used

**What you still need to do:**
- 👀 Watch for the `🔧 aether query_principles` indicator
- 📣 Call out the AI when it forgets to query AETHER
- 🤝 Trust + Oversight (AI isn't perfect)

---

## 🛠️ Technical Details

### **Code Changes**

**File:** `packages/aether/src/mcp/tools.ts`

**Before:**
```typescript
includeRelationships: args.includeRelationships || false,  // Default: OFF
includeReasoning: args.includeReasoning || false,          // Default: OFF
```

**After:**
```typescript
// Get defaults from environment variables (user-controlled automatic mode)
const defaultIncludeRelationships = process.env['AETHER_INCLUDE_RELATIONSHIPS'] !== 'false'; // Default: true
const defaultIncludeReasoning = process.env['AETHER_INCLUDE_REASONING'] !== 'false'; // Default: true

includeRelationships: args.includeRelationships ?? defaultIncludeRelationships,
includeReasoning: args.includeReasoning ?? defaultIncludeReasoning,
```

**Key difference:** Uses `??` (nullish coalescing) instead of `||` (logical OR)
- `??` only uses default if value is `null` or `undefined`
- `||` uses default if value is falsy (including `false`)
- This allows explicit `false` to override the default

---

## 📚 Learn More

- **MCP Integration Guide:** `packages/aether/docs/MCP-INTEGRATION.md`
- **QuadIndex Architecture:** `packages/lill-core/README.md`
- **AETHER Philosophy:** `.augment/guidelines.md`

---

## 🎉 Summary

**You now have user-controlled automatic mode!**

- ✅ Set `AETHER_INCLUDE_RELATIONSHIPS=true` → Always use GraphStore
- ✅ Set `AETHER_INCLUDE_REASONING=true` → Always use ReasoningStore
- ✅ No AI decision-making about which stores to use
- ✅ Your second brain grows with full RAG power automatically

**Rebuild and restart MCP server to apply changes:**

```bash
cd packages/aether
npm run build
# Then restart Augment or Claude Desktop
```

**Questions? Issues? Open an issue on GitHub!** 🦆

