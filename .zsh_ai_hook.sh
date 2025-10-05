# ZSH hooks for AI detection with boundary detection
preexec() {
    echo "COMMAND_START:$$:$(date -u +%Y-%m-%dT%H:%M:%SZ):$1" >> .meta/ai-activity-log
}

precmd() {
    echo "COMMAND_END:$$:$(date -u +%Y-%m-%dT%H:%M:%SZ):$?" >> .meta/ai-activity-log
    # Trigger session boundary detection for AI terminals
    if [ -f .meta/terminal-registry ] && grep -q "AI_TERMINAL_REGISTERED:$$:" .meta/terminal-registry; then
        node .meta/session-boundary-detector.js 2>/dev/null
    fi
}
