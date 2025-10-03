#!/bin/bash

# Backup script before testing chat-finish-v2
# Date: 2025-10-03

echo "🛡️  Creating backup before testing chat-finish-v2..."

BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# Backup .ai/ folder
if [ -d ".ai" ]; then
  echo "📁 Backing up .ai/ folder..."
  cp -r .ai "$BACKUP_DIR/"
  echo "   ✅ .ai/ backed up"
fi

# Backup .aicf/ folder
if [ -d ".aicf" ]; then
  echo "📁 Backing up .aicf/ folder..."
  cp -r .aicf "$BACKUP_DIR/"
  echo "   ✅ .aicf/ backed up"
fi

# Backup old chat-finish.js
if [ -f "src/chat-finish.js" ]; then
  echo "📁 Backing up src/chat-finish.js..."
  cp src/chat-finish.js "$BACKUP_DIR/"
  echo "   ✅ chat-finish.js backed up"
fi

echo ""
echo "✅ Backup complete: $BACKUP_DIR"
echo ""
echo "📋 To restore if something goes wrong:"
echo "   cp -r $BACKUP_DIR/.ai ./"
echo "   cp -r $BACKUP_DIR/.aicf ./"
echo "   cp $BACKUP_DIR/chat-finish.js src/"
echo ""
echo "🚀 Ready to test: aic chat-finish"

