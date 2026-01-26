# CAPO Orchestrator

Automated roadmap execution using Claude Code agents.

## Prerequisites

The orchestrator requires `jq` for JSON parsing. Install it using:

```bash
# On macOS with Homebrew
brew install jq

# On Ubuntu/Debian
sudo apt-get install jq

# On Fedora
sudo dnf install jq

# Or download from https://stedolan.github.io/jq/download/
```

## Overview

The orchestrator automatically:
1. Reads the roadmap from `memory-bank/roadmap.md`
2. Identifies the next unclaimed phase/requirement
3. Spawns Claude Code agents in a three-stage workflow:
   - **STAGE 1 (WORK)**: Implements the requirement
   - **STAGE 2 (REVIEW)**: Reviews, fixes issues, and writes tests
   - **STAGE 3 (COMMIT)**: Creates commit, updates docs, pushes to GitHub
4. Tracks progress in `.orchestrator-state.json`
5. Processes multiple requirements in parallel within a phase
6. Ensures all requirements in a phase complete before moving to the next

## Usage

```bash
# Start the orchestration loop
./orchestrator.sh start

# Show current status
./orchestrator.sh status

# Manually set current phase
./orchestrator.sh phase 3

# Reset all state (USE WITH CAUTION)
./orchestrator.sh reset

# Show help
./orchestrator.sh help
```

## How It Works

### Phase Processing

The orchestrator processes phases sequentially (1 through 12):

1. **Parses the roadmap** to extract all phases and their requirements
2. **Tracks state** in a JSON file including:
   - Current phase number
   - Phase status (pending/in_progress/completed)
   - Requirement status and timestamps
   - Agent PIDs for running processes

3. **For each phase**:
   - Launches up to `MAX_PARALLEL_JOBS` (default: 4) workflows in parallel
   - Each workflow processes one requirement
   - Waits for all workflows to complete
   - Marks phase as complete when all requirements are done
   - Moves to the next phase

### Three-Stage Workflow

Each requirement goes through three Claude Code instances:

#### STAGE 1: WORK Agent
- Reads the requirement from the roadmap
- Analyzes and implements the solution
- Writes clean, documented code
- Updates documentation as needed

#### STAGE 2: REVIEW Agent
- Reviews the implementation
- Identifies and fixes bugs/issues
- Writes comprehensive tests
- Ensures all tests pass

#### STAGE 3: COMMIT Agent
- Verifies work is complete
- Creates descriptive commit message
- Updates documentation (README, roadmap)
- Commits and pushes to GitHub

### Parallel Execution

Within a phase, multiple requirements are processed in parallel:
- Default maximum: 4 parallel workflows
- Configurable via `MAX_PARALLEL_JOBS` variable
- No requirement from the next phase starts until current phase completes

## State File

The `.orchestrator-state.json` file tracks:

```json
{
  "current_phase": 1,
  "phases": [
    {
      "number": 1,
      "title": "Foundation - Schema & Storage",
      "status": "pending",
      "requirements": [
        {
          "id": "1-Schema_Definition",
          "text": "Schema-Definition: Zod Schema Definition",
          "status": "pending",
          "agent_pid": null,
          "started_at": null,
          "completed_at": null
        }
      ]
    }
  ],
  "last_updated": "2026-01-09T00:00:00Z"
}
```

## Logs

All agent activity is logged to `.orchestrator-work/logs/`:
- `{req_id}-work.log`: Work agent output
- `{req_id}-review.log`: Review agent output
- `{req_id}-commit.log`: Commit agent output
- `{req_id}-*-prompt.txt`: Prompts sent to agents

## Configuration

Edit these variables at the top of `orchestrator.sh`:

- `ROADMAP_FILE`: Path to roadmap (default: `memory-bank/roadmap.md`)
- `STATE_FILE`: Path to state JSON (default: `.orchestrator-state.json`)
- `MAX_PARALLEL_JOBS`: Max concurrent workflows (default: 4)
- `CLAUDE_CMD`: Claude Code command (default: `claude`)

## Safety Features

- **Dangerously skip permissions mode**: Agents can run without manual approval
- **Print parameter**: Agent output is captured to log files
- **State tracking**: Progress persists across script restarts
- **Phase gating**: Cannot skip ahead without completing current phase
- **Error handling**: Failed agents don't block other requirements

## Claude Code Flags Used

```bash
claude --dangerously-skip-permissions --print "PROMPT"
```

- `--dangerously-skip-permissions`: Bypasses approval prompts
- `--print`: Sends prompt via CLI instead of interactive mode

## Example Workflow

```bash
# Start orchestrator
./orchestrator.sh start

[INFO] Initializing orchestrator...
[INFO] Parsing roadmap...
[INFO] Found 12 phases in roadmap
[INFO] Starting Phase 1 execution...
[INFO] Found 5 requirements to process in Phase 1

[INFO] Starting workflow for 1-Schema_Definition (batch 1)
[INFO] STAGE 1: Launching work agent...
[SUCCESS] Work agent launched with PID: 12345

# ... agent runs, completes work ...

[INFO] STAGE 2: Launching review agent...
[SUCCESS] Review agent launched with PID: 12346

# ... agent reviews, fixes, tests ...

[INFO] STAGE 3: Launching commit agent...
[SUCCESS] Commit agent launched with PID: 12347

# ... agent commits and pushes ...

[SUCCESS] Phase 1 completed successfully!
[INFO] Updating current phase to 2...
```

## Troubleshooting

### Script fails to start
- Ensure `jq` is installed: `which jq`
- Check roadmap file exists: `ls memory-bank/roadmap.md`
- Verify script is executable: `chmod +x orchestrator.sh`

### Agents not launching
- Check Claude Code is installed: `which claude`
- Verify `CLAUDE_CMD` variable is correct
- Review agent logs in `.orchestrator-work/logs/`

### Phase stuck in "in_progress"
- Check for running agent processes: `ps aux | grep claude`
- Manually update state file (advanced)
- Use `./orchestrator.sh reset` to start over (CAUTION)

## Roadmap Format

The script expects the roadmap to follow this structure:

```markdown
## Phase 1: Phase Title (Week X)

**Demo:** "Description"

**Requirements:**
- Requirement 1
- Requirement 2
- Requirement 3

**Success Criteria:**
- Criteria 1
- Criteria 2

---

## Phase 2: Next Phase...
```

Only the lines under `**Requirements:**` starting with `- ` are processed as work items.

## Advanced Usage

### Resume from specific phase
```bash
./orchestrator.sh phase 5
./orchestrator.sh start  # Will start from phase 5
```

### Process single phase
```bash
./orchestrator.sh phase 3
# Edit state file, set other phases to "completed"
./orchestrator.sh start
```

### Monitor progress in real-time
```bash
watch -n 5 './orchestrator.sh status'
```

## Contributing

When modifying the orchestrator:
1. Test with `./orchestrator.sh help` first
2. Test status display with `./orchestrator.sh status`
3. Try phase setting with `./orchestrator.sh phase 1`
4. Only run `start` when you're ready to execute

## License

Same as the main CAPO project.
