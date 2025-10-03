#!/bin/bash

# Restore script if chat-finish-v2 test fails
# Date: 2025-10-03

if [ -z "$1" ]; then
  echo "❌ Error: Please specify backup directory"
  echo ""
  echo "Usage: ./restore-backup.sh backup-YYYYMMDD-HHMMSS"
  echo ""
  echo "Available backups:"
  ls -d backup-* 2>/dev/null || echo "   (none found)"
  exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "🔄 Restoring from backup: $BACKUP_DIR"
echo ""

# Restore .ai/ folder
if [ -d "$BACKUP_DIR/.ai" ]; then
  echo "📁 Restoring .ai/ folder..."
  rm -rf .ai
  cp -r "$BACKUP_DIR/.ai" ./
  echo "   ✅ .ai/ restored"
fi

# Restore .aicf/ folder
if [ -d "$BACKUP_DIR/.aicf" ]; then
  echo "📁 Restoring .aicf/ folder..."
  rm -rf .aicf
  cp -r "$BACKUP_DIR/.aicf" ./
  echo "   ✅ .aicf/ restored"
fi

# Restore chat-finish.js
if [ -f "$BACKUP_DIR/chat-finish.js" ]; then
  echo "📁 Restoring src/chat-finish.js..."
  cp "$BACKUP_DIR/chat-finish.js" src/
  echo "   ✅ chat-finish.js restored"
fi

echo ""
echo "✅ Restore complete!"
echo ""
echo "📋 Backup preserved at: $BACKUP_DIR"

