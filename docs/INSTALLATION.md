# 📦 Installation Guide

**Complete setup for the Checkpoint Agent SDK**

---

## 🚀 Quick Install

### **Option 1: Automatic (Recommended)**

```bash
# Make script executable
chmod +x install-sdks.sh

# Run installation
./install-sdks.sh
```

### **Option 2: Manual**

```bash
# Install all SDKs
npm install @anthropic-ai/sdk openai @openai/agents
```

---

## 📋 Required Packages

### **1. Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

**Used for:**
- Claude Haiku ($0.00325/checkpoint)
- Claude Sonnet 3.5 ($0.039/checkpoint)
- Claude Sonnet 4 ($0.039/checkpoint)

### **2. OpenAI SDK**

```bash
npm install openai
```

**Used for:**
- GPT-5 Nano ($0.00074/checkpoint) 🏆
- GPT-5 Mini ($0.00370/checkpoint)
- GPT-5 ($0.01850/checkpoint)
- GPT-4o Mini ($0.00186/checkpoint)

### **3. OpenAI Agents SDK**

```bash
npm install @openai/agents
```

**Used for:**
- Multi-agent orchestration
- Handoffs between agents
- Tool use (future)

---

## 🔑 API Key Setup

### **Step 1: Get API Keys**

#### **Anthropic (Claude):**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy your key (starts with `sk-ant-...`)

#### **OpenAI (GPT):**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-proj-...` or `sk-...`)

---

### **Step 2: Create .env.local**

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local
nano .env.local  # or use your preferred editor
```

### **Step 3: Add Your Keys**

```bash
# .env.local

# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# OpenAI API Key
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

**Note:** You only need ONE key (either Anthropic or OpenAI). The agent will auto-detect which one is available.

---

## ✅ Verify Installation

### **Test 1: Check Packages**

```bash
# Check if packages are installed
npm list @anthropic-ai/sdk openai @openai/agents
```

**Expected output:**
```
create-ai-chat-context@0.10.0
├── @anthropic-ai/sdk@0.32.1
├── @openai/agents@0.1.0
└── openai@4.77.3
```

### **Test 2: Check API Keys**

```bash
# Check if .env.local exists
ls -la .env.local

# Check if keys are loaded (without showing them)
node -e "require('dotenv').config({path:'.env.local'}); console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Found' : 'Not found'); console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Not found');"
```

**Expected output:**
```
ANTHROPIC_API_KEY: Found
OPENAI_API_KEY: Found
```

### **Test 3: Run Test Script**

```bash
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
   Length: 2552 characters
   Estimated tokens: 638

--- Test 3: Verify Prompt Structure ---
   Has Input section: ✅
   Has Target section: ✅
   Has Goal section: ✅
   Has Instructions: ✅
   Has AICF 3.0 sections: ✅

✅ Prompt structure is valid

--- Test 4: Check API Keys ---
✅ ANTHROPIC_API_KEY found (sk-ant-api...)
✅ OPENAI_API_KEY found (sk-proj-...)

=== Test Summary ===
✅ Checkpoint file readable
✅ JSON parsing works
✅ Prompt generation works
✅ Prompt structure valid
✅ API keys available

🚀 Ready to process checkpoints!
```

---

## 🎯 First Run

### **Process Your First Checkpoint**

```bash
# Process all pending checkpoints
node bin/cli.js checkpoint-agent --process-all
```

**Expected output:**
```
🤖 Processing All Checkpoints

   Provider: openai
   Mode: Agent SDK (Multi-Agent)
   Queue: /path/to/.aicf/checkpoint-queue

📦 Found 1 pending checkpoint(s)

📝 Processing C13-CP1-raw.aicf...
   Checkpoint: C13-CP1
   Messages: 50
   Tokens: 10234
   Model: gpt-5-nano-2025-08-07
   🤖 Orchestrator: Starting multi-agent processing (OpenAI)
   📝 Analysis Agent: Compressing checkpoint...
   ✅ Quality Agent: Verifying compression...
   📋 Format Agent: Validating AICF 3.0 format...
   ✅ Format Agent: Format valid
   ✅ Compressed: 10234 → 587 tokens (94% reduction)
   Duration: 5s
   ✅ Checkpoint C13-CP1 saved and cleaned up

📊 Summary:
   ✅ Successful: 1
   📉 Total compression: 10234 → 587 tokens (94%)
```

---

## 🐛 Troubleshooting

### **Problem: "Cannot find module '@anthropic-ai/sdk'"**

**Solution:**
```bash
npm install @anthropic-ai/sdk
```

### **Problem: "Cannot find module 'openai'"**

**Solution:**
```bash
npm install openai
```

### **Problem: "Cannot find module '@openai/agents'"**

**Solution:**
```bash
npm install @openai/agents
```

### **Problem: "No API key found"**

**Solution:**
```bash
# Check if .env.local exists
ls -la .env.local

# If not, create it
cp .env.example .env.local

# Edit and add your API key
nano .env.local
```

### **Problem: "API error: Invalid API key"**

**Solution:**
1. Check your API key is correct (no extra spaces)
2. Verify the key is active in your API dashboard
3. Make sure you're using the right key for the right provider

### **Problem: npm install fails**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

---

## 📊 Which Provider Should I Use?

### **Use OpenAI (GPT-5 Nano) if:**
- ✅ You want the cheapest option ($1.67/month)
- ✅ You're processing high volumes
- ✅ You want latest technology (GPT-5)

### **Use Anthropic (Claude Haiku) if:**
- ✅ You prefer Claude's quality
- ✅ You're already using Claude
- ✅ Cost is not the primary concern ($7.31/month)

### **Use Both:**
- ✅ Set both API keys
- ✅ Switch between them with `--model` flag
- ✅ Use GPT-5 Nano for normal, Claude Sonnet 4 for important

---

## 💰 Cost Summary

| Provider | Model | Monthly (25/day) | Best For |
|----------|-------|------------------|----------|
| **OpenAI** | GPT-5 Nano | **$1.67** | Everyone! |
| OpenAI | GPT-4o Mini | $4.19 | Budget users |
| Anthropic | Claude Haiku | $7.31 | Claude fans |
| OpenAI | GPT-5 Mini | $8.33 | Better quality |
| OpenAI | GPT-5 | $41.63 | Complex tasks |
| Anthropic | Claude Sonnet 4 | $87.75 | Best quality |

---

## 🎉 You're Ready!

**Installation complete!** Now you can:

1. ✅ Process checkpoints with GPT-5 Nano ($1.67/month)
2. ✅ Switch to Claude Haiku if needed ($7.31/month)
3. ✅ Use multi-agent architecture for quality
4. ✅ Save 77% vs Claude Haiku

**Next steps:**
- Read [OPENAI_AGENT_SDK.md](./OPENAI_AGENT_SDK.md) for usage guide
- Read [PRICING_COMPARISON.md](./PRICING_COMPARISON.md) for cost analysis
- Run `node bin/cli.js checkpoint-agent --help` for all options

---

**Questions?** Check the troubleshooting section or create an issue on GitHub.

