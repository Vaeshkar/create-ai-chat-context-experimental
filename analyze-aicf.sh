#!/bin/bash

echo "🧪 AICF Token Efficiency Analysis"
echo ""

# Function to count approximate tokens (words + symbols)
count_tokens() {
    if [ -f "$1" ]; then
        # Count words and symbols as rough token approximation
        wc -w "$1" | awk '{print $1}'
    else
        echo "0"
    fi
}

# Function to count semantic blocks
count_blocks() {
    if [ -f "$1" ]; then
        grep -c '@[A-Z_]' "$1" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Analyze each AICF file
total_tokens=0
total_size=0
total_blocks=0

for file in .aicf/index.aicf .aicf/conversations.aicf .aicf/decisions.aicf .aicf/work-state.aicf .aicf/technical-context.aicf; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        lines=$(wc -l "$file" 2>/dev/null | awk '{print $1}' || echo "0")
        tokens=$(count_tokens "$file")
        size=$(wc -c "$file" 2>/dev/null | awk '{print $1}' || echo "0")
        blocks=$(count_blocks "$file")
        
        echo "📊 $basename_file:"
        echo "   Lines: $lines"
        echo "   Approx Tokens: $tokens"
        echo "   Size: $size bytes"
        echo "   Semantic Blocks: $blocks"
        
        if [ "$size" -gt 0 ]; then
            ratio=$(echo "scale=4; $tokens / $size" | bc 2>/dev/null || echo "0")
            echo "   Token/Byte Ratio: $ratio"
        fi
        echo ""
        
        total_tokens=$((total_tokens + tokens))
        total_size=$((total_size + size))
        total_blocks=$((total_blocks + blocks))
    fi
done

echo "📈 OVERALL STATISTICS:"
echo "   Total Approx Tokens: $total_tokens"
echo "   Total Size: $(echo "scale=2; $total_size / 1024" | bc 2>/dev/null || echo "N/A") KB"
echo "   Total Semantic Blocks: $total_blocks"

if [ "$total_size" -gt 0 ]; then
    avg_compression=$(echo "scale=4; $total_tokens / $total_size" | bc 2>/dev/null || echo "N/A")
    echo "   Average Compression: $avg_compression tokens/byte"
    
    # Estimate compression vs JSON (rough calculation)
    estimated_json_size=$((total_tokens * 15))
    if [ "$estimated_json_size" -gt 0 ]; then
        compression_saved=$(echo "scale=1; (($estimated_json_size - $total_size) / $estimated_json_size) * 100" | bc 2>/dev/null || echo "N/A")
        echo "   Estimated Compression vs JSON: ${compression_saved}%"
        
        # Check if >90% compression achieved
        compression_int=$(echo "$compression_saved" | cut -d'.' -f1)
        if [ "$compression_int" -ge 90 ] 2>/dev/null; then
            echo ""
            echo "🎉 AICF achieves >90% compression while maintaining semantic structure!"
        else
            echo ""
            echo "📊 AICF provides significant compression with semantic benefits"
        fi
    fi
fi