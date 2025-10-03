# Checkpoint System Setup Guide

**Quick Start:** Get the checkpoint system running in 5 minutes

---

## 📋 Prerequisites

- Node.js 14+ installed
- `create-ai-chat-context` package installed
- An AI API key (Anthropic Claude or OpenAI)

---

## 🚀 Setup Steps

### **Step 1: Get an API Key**

Choose one:

#### **Option A: Anthropic Claude (Recommended)**

**Why:** 5x cheaper than OpenAI (~$0.003 vs ~$0.015 per checkpoint)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy your key (starts with `sk-ant-...`)

**Cost:** ~$0.30/month for 100 checkpoints

#### **Option B: OpenAI GPT**

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-...`)

**Cost:** ~$1.50/month for 100 checkpoints

---

### **Step 2: Configure API Key**

#### **Method 1: .env File (Recommended)**

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env and add your API key
# For Claude:
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# For OpenAI:
OPENAI_API_KEY=sk-your-actual-key-here

# 3. Save the file
```

**Benefits:**
- ✅ Project-specific (only this project uses the key)
- ✅ Easy to see which keys are configured
- ✅ Automatically loaded by the agent
- ✅ Safe (`.env` is in `.gitignore`)

#### **Method 2: Environment Variable**

```bash
# Add to your shell profile (~/.zshrc or ~/.bashrc)
export ANTHROPIC_API_KEY="sk-ant-your-actual-key-here"

# Or set temporarily for one session
export ANTHROPIC_API_KEY="sk-ant-your-actual-key-here"
```

---

### **Step 3: Test the Setup**

```bash
# Run the test script
node test-checkpoint-agent.js
```

**Expected output:**
```
🧪 Testing Checkpoint Agent

--- Test 1: Read Checkpoint File ---
✅ Checkpoint loaded: C13-CP1
   Messages: 50
   Tokens: 10234
   Status: pending

--- Test 2: Build Analysis Prompt ---
✅ Prompt generated
   Length: 2847 characters
   Estimated tokens: 711

--- Test 3: Verify Prompt Structure ---
   Has Input section: ✅
   Has Target section: ✅
   Has Goal section: ✅
   Has Instructions: ✅
   Has AICF 3.0 sections: ✅

✅ Prompt structure is valid

--- Test 4: Check API Keys ---
✅ ANTHROPIC_API_KEY found (sk-ant-api...)

=== Test Summary ===
✅ Checkpoint file readable
✅ JSON parsing works
✅ Prompt generation works
✅ Prompt structure valid
✅ API key available

🚀 Ready to process checkpoints!
```

---

### **Step 4: Process Your First Checkpoint**

```bash
# Process all pending checkpoints
npx aic checkpoint-agent --process-all
```

**Expected output:**
```
🤖 Processing All Checkpoints

   Provider: anthropic
   Queue: /path/to/.aicf/checkpoint-queue

📦 Found 1 pending checkpoint(s)

📝 Processing C13-CP1-raw.aicf...
   Checkpoint: C13-CP1
   Messages: 50
   Tokens: 10234
   ✅ Compressed: 10234 → 587 tokens (94% reduction)
   Duration: 3s
   ✅ Checkpoint C13-CP1 saved and cleaned up

📊 Summary:
   ✅ Successful: 1
   📉 Total compression: 10234 → 587 tokens (94%)
```

---

### **Step 5: Start Watch Mode (Optional)**

For continuous processing:

```bash
# Terminal 1: Start the agent
npx aic checkpoint-agent --watch

# Terminal 2: Continue working, create checkpoints
npx aic checkpoint-dump
```

**Agent output:**
```
🤖 Checkpoint Agent Started

   Provider: anthropic
   Queue: /path/to/.aicf/checkpoint-queue

👀 Watching for new checkpoints...
   (Press Ctrl+C to stop)

🔔 New checkpoint detected: C13-CP2-raw.aicf

📝 Processing C13-CP2-raw.aicf...
   Checkpoint: C13-CP2
   Messages: 45
   Tokens: 9876
   ✅ Compressed: 9876 → 543 tokens (94% reduction)
   Duration: 2s
   ✅ Checkpoint C13-CP2 saved and cleaned up

👀 Watching for new checkpoints...
```

---

## 🔍 Verify It's Working

### **Check the compressed checkpoint:**

```bash
cat .aicf/conversations.aicf
```

**Expected format:**
```
@CONVERSATION:C13-CP1
timestamp_start=2025-10-02T16:15:00Z
timestamp_end=2025-10-02T16:30:00Z
messages=50
tokens=10234

@FLOW
user_asked|ai_explained|user_agreed|ai_implemented

@DETAILS:user_said
quote="What if you dump and let an agent process it?"
impact=CRITICAL|solved_downtime_problem

@INSIGHTS
async_agent_solves_downtime|user_never_waits|CRITICAL

@DECISIONS
use_json_format|structured_parseable|IMPACT:HIGH

@STATE
working_on=checkpoint_system
current_phase=complete
next_action=test_with_real_data
blockers=none
```

---

## 🐛 Troubleshooting

### **Problem: "No API key found"**

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# If not, create it
cp .env.example .env

# Edit and add your key
nano .env  # or use your preferred editor
```

### **Problem: "Checkpoint file not found"**

**Solution:**
```bash
# Create a checkpoint first
npx aic checkpoint-dump

# Then process it
npx aic checkpoint-agent --process-all
```

### **Problem: "API error: Invalid API key"**

**Solution:**
1. Check your API key is correct (no extra spaces)
2. Verify the key is active in your API dashboard
3. Make sure you're using the right key for the right provider

### **Problem: Agent not detecting new files**

**Solution:**
```bash
# Stop the agent (Ctrl+C)
# Restart it
npx aic checkpoint-agent --watch
```

---

## 📊 Cost Estimation

### **Anthropic Claude (Recommended)**

- **Input:** 10,000 tokens @ $0.003 per 1M tokens = $0.00003
- **Output:** 600 tokens @ $0.015 per 1M tokens = $0.000009
- **Total per checkpoint:** ~$0.003

**Monthly costs:**
- 10 checkpoints: $0.03
- 100 checkpoints: $0.30
- 1,000 checkpoints: $3.00

### **OpenAI GPT-4o**

- **Input:** 10,000 tokens @ $0.0025 per 1K tokens = $0.025
- **Output:** 600 tokens @ $0.010 per 1K tokens = $0.006
- **Total per checkpoint:** ~$0.015

**Monthly costs:**
- 10 checkpoints: $0.15
- 100 checkpoints: $1.50
- 1,000 checkpoints: $15.00

---

## 🎯 Next Steps

1. ✅ API key configured
2. ✅ Test passed
3. ✅ First checkpoint processed
4. 🚀 **Start using it in your workflow!**

### **Recommended Workflow:**

```bash
# Option 1: Manual (when you remember)
npx aic checkpoint-dump
npx aic checkpoint-agent --process-all

# Option 2: Watch mode (automatic)
# Terminal 1: Start agent once
npx aic checkpoint-agent --watch

# Terminal 2: Work normally
# Agent processes checkpoints automatically
```

---

## 📚 Additional Resources

- [Checkpoint Dump Implementation](./checkpoint-dump-implementation.md)
- [Checkpoint Agent Implementation](./checkpoint-agent-implementation.md)
- [AICF 3.0 Format Specification](./aicf-3.0-spec.md)

---

**Questions?** Check the troubleshooting section or create an issue on GitHub.

