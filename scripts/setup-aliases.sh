#!/bin/bash

# AI Context Update Aliases Setup
# Run: source setup-aliases.sh

echo "🤖 Setting up AI context update aliases..."

# Quick update alias
alias aicupdate='npx aic update --conversation'
echo "✅ Added alias: aicupdate (quick manual update)"

# Auto-updater aliases
alias aicauto='npx aic auto-update --start'
alias aicauto15='npx aic auto-update --start --interval 15'
alias aicstatus='npx aic auto-update'
echo "✅ Added alias: aicauto (start 30-min auto-updates)"
echo "✅ Added alias: aicauto15 (start 15-min auto-updates)" 
echo "✅ Added alias: aicstatus (show auto-update commands)"

echo ""
echo "🎉 Aliases ready! Usage:"
echo "  aicupdate      # Quick manual update"
echo "  aicauto        # Start 30-minute auto-updates"
echo "  aicauto15      # Start 15-minute auto-updates"
echo "  aicstatus      # Show auto-update help"
echo ""
echo "💡 To make aliases permanent, add them to your ~/.zshrc:"
echo "   echo 'alias aicupdate=\"npx aic update --conversation\"' >> ~/.zshrc"
echo "   echo 'alias aicauto=\"npx aic auto-update --start\"' >> ~/.zshrc"
echo ""