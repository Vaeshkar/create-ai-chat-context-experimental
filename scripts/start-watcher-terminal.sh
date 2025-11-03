#!/bin/bash

# Start AETHER watcher in a new terminal window
# This script opens a new Terminal.app window and starts the watcher

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../../.." && pwd )"

# Parse arguments
VERBOSE=""
if [[ "$1" == "--verbose" ]]; then
  VERBOSE="--verbose"
fi

# AppleScript to open new Terminal window and run watcher
osascript <<EOF
tell application "Terminal"
    activate
    set newTab to do script "cd '$PROJECT_ROOT' && clear && echo '🚀 Starting AETHER Watcher...' && echo '' && npx tsx packages/aice/src/cli.ts watch --foreground $VERBOSE"
    set custom title of newTab to "AETHER Watcher"
end tell
EOF

echo "✅ Watcher started in new terminal window"
echo "   Check the new Terminal window to see watcher output"

