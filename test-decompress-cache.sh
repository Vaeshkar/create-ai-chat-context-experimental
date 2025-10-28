#!/bin/bash

# Find a recent cache file with chat_conversations
CACHE_FILE=$(grep -l "chat_conversations" ~/Library/Application\ Support/Claude/Cache/Cache_Data/*_0 2>/dev/null | head -1)

if [ -z "$CACHE_FILE" ]; then
    echo "No cache file with chat_conversations found"
    exit 1
fi

echo "Found cache file: $CACHE_FILE"
echo ""
echo "Trying to extract and decompress..."
echo ""

# Try to extract the compressed data and decompress it
# Chromium cache format has headers, so we need to skip them
# The actual data usually starts after some binary headers

# Try different offsets to find the zstd compressed data
for offset in 0 256 512 1024 2048 4096; do
    echo "Trying offset $offset..."
    dd if="$CACHE_FILE" bs=1 skip=$offset 2>/dev/null | zstd -d 2>/dev/null | head -c 5000 | grep -a "Augment\|Dammit\|8 weeks" && echo "FOUND AT OFFSET $offset!" && break
done

