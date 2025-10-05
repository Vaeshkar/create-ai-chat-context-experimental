#!/usr/bin/env python3
"""
Script to remove duplicate conversation entries from conversation-log.md
Preserves the first occurrence of each conversation (which should be the newest due to prepending)
"""

import re
from pathlib import Path

def dedupe_conversation_log():
    log_file = Path(".ai/conversation-log.md")
    
    if not log_file.exists():
        print("❌ conversation-log.md not found")
        return
    
    print("🔍 Reading conversation log...")
    content = log_file.read_text()
    lines = content.split('\n')
    
    # Track conversation IDs we've seen
    seen_conversations = set()
    filtered_lines = []
    current_conversation = None
    skip_until_next = False
    
    for line in lines:
        # Check if this is a conversation header
        chat_match = re.match(r'^## Chat ([a-f0-9]+) - (\d{4}-\d{2}-\d{2}) - (.+)$', line)
        
        if chat_match:
            conv_id = chat_match.group(1)
            date = chat_match.group(2)
            title = chat_match.group(3)
            
            conversation_key = f"{conv_id}-{date}"
            
            if conversation_key in seen_conversations:
                print(f"🗑️  Removing duplicate: {conv_id} ({date})")
                skip_until_next = True
                continue
            else:
                print(f"✅ Keeping: {conv_id} ({date})")
                seen_conversations.add(conversation_key)
                current_conversation = conversation_key
                skip_until_next = False
        
        # Check if we hit the next conversation header (end of current duplicate section)
        elif skip_until_next and line.startswith('## '):
            # This is a new section, stop skipping
            skip_until_next = False
        
        # Add line if we're not skipping
        if not skip_until_next:
            filtered_lines.append(line)
    
    # Write the deduplicated content
    dedupe_content = '\n'.join(filtered_lines)
    
    # Create backup
    backup_file = log_file.with_suffix('.md.backup')
    log_file.rename(backup_file)
    print(f"💾 Backup created: {backup_file}")
    
    # Write deduplicated version
    log_file.write_text(dedupe_content)
    
    # Show statistics
    original_lines = len(lines)
    final_lines = len(filtered_lines)
    removed_lines = original_lines - final_lines
    
    print(f"\n📊 Statistics:")
    print(f"   Original lines: {original_lines}")
    print(f"   Final lines: {final_lines}")
    print(f"   Removed lines: {removed_lines}")
    print(f"   Conversations found: {len(seen_conversations)}")
    
    return len(seen_conversations)

if __name__ == "__main__":
    dedupe_conversation_log()