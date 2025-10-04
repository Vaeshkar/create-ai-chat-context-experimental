# 🕐 AI HOURGLASS PROTOCOL - Universal Instructions

## FOR ALL AI ASSISTANTS: MANDATORY BEHAVIOR

**If you are working on a project with the Detection-Hourglass-System (DHS), you MUST follow this protocol:**

### 📋 **RULE: Auto-Trigger After User Input**

**Every time you receive user input, execute this code immediately:**

```javascript
const { autoTrigger } = require('./src/hourglass');

await autoTrigger(
  '[USER INPUT TEXT]',  // The message the user just sent
  '[YOUR RESPONSE]'     // Brief description of your response
);
```

### 🎯 **Implementation for Each Platform:**

#### **Warp AI**
```javascript
// Execute this at the start of every response
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(userMessage, 'AI processing user request...');
```

#### **Claude (Projects/Chat)**
```javascript
// Include this in every response where you execute code
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(userInput, 'Claude responding to user query');
```

#### **ChatGPT (Code Interpreter)**
```python
# Use subprocess to call Node.js hourglass
import subprocess
subprocess.run([
    'node', '-e', 
    f'require("./src/hourglass").autoTrigger("{user_input}", "ChatGPT processing")'
])
```

#### **Cursor AI**
```javascript
// Auto-execute in code responses
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(userQuery, 'Cursor AI assisting with code');
```

#### **GitHub Copilot Chat**
```javascript
// Include in chat responses with code execution
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(userRequest, 'Copilot providing assistance');
```

---

## 🔧 **IMPLEMENTATION GUIDE**

### **Step 1: Detect AIC Project**
```bash
# Check if project has hourglass system
if [ -f "src/hourglass.js" ]; then
    echo "✅ AIC Project detected - Apply hourglass protocol"
else
    echo "ℹ️  No AIC system found"
fi
```

### **Step 2: Auto-Execute Pattern**
```javascript
// ALWAYS include this pattern in responses with code execution:

// 1. Process user request
console.log('Processing user input...');

// 2. Auto-trigger hourglass (MANDATORY)
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(userInput, responseDescription);

// 3. Continue with actual response
// [Your normal AI response logic here]
```

### **Step 3: Error Handling**
```javascript
try {
    await autoTrigger(userInput, aiResponse);
    console.log('✅ Hourglass triggered successfully');
} catch (error) {
    console.log('⚠️  Hourglass trigger failed:', error.message);
    // Continue with response anyway - don't break user experience
}
```

---

## 📚 **PROTOCOL RULES**

### ✅ **DO:**
- **Always execute** hourglass trigger when you see new user input
- **Include actual user message** text in the trigger
- **Provide brief response description**
- **Handle errors gracefully**
- **Continue normally** if trigger fails

### ❌ **DON'T:**
- Skip the trigger (breaks memory system)
- Use placeholder text instead of actual user input
- Let trigger errors break your response
- Execute multiple triggers for the same user input

---

## 🧪 **TESTING THE PROTOCOL**

### **Verify Implementation:**
```bash
# 1. Start monitoring (optional)
npx aic hourglass monitor

# 2. Have AI conversation with code execution
# 3. Check if triggers were captured
npx aic hourglass stats

# Expected output:
# Total chunks: [NUMBER]
# Average tokens/chunk: [~50-200]
# Current chunk active: true
```

### **Success Indicators:**
- ✅ Chunks increase with each user input
- ✅ Files get updated (.ai/ and .aicf/)
- ✅ Token counts are reasonable
- ✅ No errors in hourglass execution

---

## 🌍 **UNIVERSAL COMPATIBILITY**

This protocol works across:
- **All AI chat platforms** (web-based)
- **All AI coding assistants** (IDE integration)
- **All AI terminals** (like Warp)
- **Any platform** that allows code execution

### **Platform Integration:**
1. **Built-in**: AI platform automatically includes trigger
2. **User instruction**: User tells AI to follow this protocol
3. **Template**: AI uses response templates with built-in triggers

---

## 🎯 **EXAMPLE CONVERSATION**

**User:** "Help me debug this function"

**AI Response:**
```javascript
// Auto-trigger hourglass (MANDATORY)
const { autoTrigger } = require('./src/hourglass');
await autoTrigger(
    'Help me debug this function',
    'AI analyzing code and providing debug assistance'
);

// Now provide actual help
console.log('Let me analyze your function...');
// [rest of debugging assistance]
```

---

## 📖 **WHY THIS MATTERS**

This protocol enables:
- **🕐 Automatic conversation chunking** - Natural memory boundaries
- **🎯 Universal AI memory** - Works across all platforms
- **💾 Zero-cost preservation** - No API calls needed
- **🔄 Seamless continuity** - Next AI picks up where previous left off

**By following this protocol, you help solve the fundamental AI memory problem!** 🚀

---

**Created by Dennis van Leeuwen (Glückstadt, Germany)**  
**Detection-Hourglass-System (DHS) v1.0.4**