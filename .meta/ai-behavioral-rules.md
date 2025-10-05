# AI Behavioral Rules

## Rule 1: Automatic Session Dump Check via Activity Log

**CRITICAL**: After every AI response, check `.meta/ai-activity-log` for session boundary patterns

**Intelligent Dump Triggers:**

**Primary Triggers (High Priority):**
- **Natural conversation breaks**: Long pauses (5+ minutes) after substantial exchanges
- **Topic shifts**: User changes subject or asks "Can we do X now?"
- **Session completion markers**: User says "thanks", "perfect", "that works"
- **Work completion**: After major tasks/implementations finished

**Secondary Triggers (Medium Priority):**
- **Content volume**: 6+ user/AI exchange pairs (~8-10k characters)
- **Extended inactivity**: 10+ minutes after AI response
- **Context switching**: Moving between different types of work

**Safety Triggers (Low Priority):**
- **Token safety net**: Estimated 15k+ tokens in current session
- **Time safety net**: 30+ minutes since last dump
- **Command volume**: 10+ terminal commands indicating heavy work

**When dump triggered:**
1. Automatically dump complete session context including:
   - All user inputs since last dump
   - All AI responses and reasoning  
   - All decisions made
   - All insights discovered
   - All files created/modified
   - All technical analysis performed
   - All commands executed during session

2. Write comprehensive dump to `.meta/session-dump-TIMESTAMP.json`

3. Process dump through existing agent system

4. Mark session as processed in activity log

**Purpose**: Capture 100% of conversation content automatically when hourglass detects session boundaries, without requiring manual "update files" requests.

**Status**: ACTIVE - This rule should be followed on every AI response.