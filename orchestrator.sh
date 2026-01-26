#!/bin/bash

###############################################################################
# CAPO ORCHESTRATOR
# Automated roadmap execution using Claude Code agents
###############################################################################

set -euo pipefail

# Configuration
ROADMAP_FILE="memory-bank/roadmap.md"
STATE_FILE=".orchestrator-state.json"
WORK_DIR=".orchestrator-work"
LOG_DIR="$WORK_DIR/logs"
MAX_PARALLEL_JOBS=4
CLAUDE_CMD="claude"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# LOGGING FUNCTIONS
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

###############################################################################
# INITIALIZATION
###############################################################################

init_orchestrator() {
    log_info "Initializing orchestrator..."

    # Create working directories
    mkdir -p "$WORK_DIR"
    mkdir -p "$LOG_DIR"

    # Initialize state file if it doesn't exist
    if [[ ! -f "$STATE_FILE" ]]; then
        init_state_file
    fi

    log_success "Orchestrator initialized"
}

init_state_file() {
    log_info "Creating state file..."

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed."

        # Try to install jq on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                log_info "Attempting to install jq via Homebrew..."
                brew install jq
            else
                log_error "Please install jq manually:"
                log_error "  brew install jq"
                exit 1
            fi
        else
            log_error "Please install jq manually using your package manager"
            exit 1
        fi

        # Verify installation
        if ! command -v jq &> /dev/null; then
            log_error "Failed to install jq. Please install it manually."
            exit 1
        fi
        log_success "jq installed successfully"
    fi

    # Parse roadmap and create initial state
    parse_and_init_phases
}

get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

parse_and_init_phases() {
    log_info "Parsing roadmap..."

    local temp_state=$(mktemp)

    # Extract phases from roadmap
    local phase_count=$(grep -c "^## Phase [0-9]" "$ROADMAP_FILE" || true)

    if [[ $phase_count -eq 0 ]]; then
        log_error "No phases found in roadmap!"
        exit 1
    fi

    log_info "Found $phase_count phases in roadmap"

    # Start building state JSON
    cat > "$temp_state" << 'JSONEOF'
{
  "current_phase": 1,
  "phases": [
JSONEOF

    local first=true
    for ((i=1; i<=phase_count; i++)); do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$temp_state"
        fi

        # Extract phase title
        local phase_title=$(awk "/^## Phase $i:/,/^## Phase $((i+1)):/" "$ROADMAP_FILE" | head -1 | sed 's/^## Phase [0-9]*: //' | sed 's/ (Week.*)//' | sed 's/"/\\"/g')

        # Extract requirements
        local requirements=$(awk "/^## Phase $i:/,/^## Phase $((i+1)):/" "$ROADMAP_FILE" | awk '/^Requirements:/,/^---/' | grep "^- " || true)

        # Count requirements
        local req_count=$(echo "$requirements" | wc -l | tr -d ' ')

        # Build phase JSON
        cat >> "$temp_state" << PHASEEOF
    {
      "number": $i,
      "title": "$phase_title",
      "status": "pending",
      "requirements": [
PHASEEOF

        # Add each requirement
        local req_first=true
        while IFS= read -r req; do
            if [[ -z "$req" ]]; then
                continue
            fi

            if [[ "$req_first" == "true" ]]; then
                req_first=false
            else
                echo "," >> "$temp_state"
            fi

            # Clean requirement text and create ID
            local clean_req=$(echo "$req" | sed 's/^- //' | sed 's/:$//' | tr ' ' '_' | tr -d '[:punct:]')
            local req_text=$(echo "$req" | sed 's/^- //' | sed 's/"/\\"/g')

            # Build requirement JSON
            cat >> "$temp_state" << REQEOF
        {
          "id": "$i-$clean_req",
          "text": "$req_text",
          "status": "pending",
          "agent_pid": null,
          "started_at": null,
          "completed_at": null
        }
REQEOF
        done <<< "$requirements"

        # Close requirements array and phase object
        cat >> "$temp_state" << PHASEENDEOF

      ]
    }
PHASEENDEOF
    done

    # Close phases array and add metadata
    local timestamp=$(get_timestamp)
    cat >> "$temp_state" << MAINENDEOF

  ],
  "last_updated": "$timestamp"
}
MAINENDEOF

    mv "$temp_state" "$STATE_FILE"
    log_success "State file initialized with $phase_count phases"
}

###############################################################################
# STATE MANAGEMENT
###############################################################################

get_current_phase() {
    jq -r '.current_phase' "$STATE_FILE"
}

get_phase_status() {
    local phase_num=$1
    jq -r ".phases[$((phase_num-1))].status" "$STATE_FILE"
}

get_pending_requirements() {
    local phase_num=$1
    jq -r ".phases[$((phase_num-1))].requirements[] | select(.status == \"pending\") | .id" "$STATE_FILE"
}

get_requirement_text() {
    local req_id=$1
    # Extract phase number from req_id
    local phase_num=$(echo "$req_id" | cut -d'-' -f1)
    jq -r ".phases[$((phase_num-1))].requirements[] | select(.id == \"$req_id\") | .text" "$STATE_FILE"
}

update_requirement_status() {
    local req_id=$1
    local status=$2
    local pid=${3:-null}
    local timestamp=$(get_timestamp)

    local temp_state=$(mktemp)

    # Update requirement
    jq "(.phases[].requirements[] | select(.id == \"$req_id\")) |= {
        id: .id,
        text: .text,
        status: \"$status\",
        agent_pid: $pid,
        started_at: (if \"$status\" == \"in_progress\" then \"$timestamp\" else .started_at end),
        completed_at: (if \"$status\" == \"completed\" then \"$timestamp\" else .completed_at end)
    }" "$STATE_FILE" > "$temp_state"
    mv "$temp_state" "$STATE_FILE"

    # Update last_updated timestamp
    timestamp=$(get_timestamp)
    jq --arg ts "$timestamp" '.last_updated = $ts' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

update_phase_status() {
    local phase_num=$1
    local status=$2

    local temp_state=$(mktemp)
    jq ".phases[$((phase_num-1))].status = \"$status\"" "$STATE_FILE" > "$temp_state"
    mv "$temp_state" "$STATE_FILE"

    # Update last_updated timestamp
    local timestamp=$(get_timestamp)
    jq --arg ts "$timestamp" '.last_updated = $ts' "$STATE_FILE" > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
}

check_phase_complete() {
    local phase_num=$1

    # Check if all requirements are completed
    local pending_count=$(jq -r ".phases[$((phase_num-1))].requirements[] | select(.status != \"completed\") | .id" "$STATE_FILE" | wc -l | tr -d ' ')

    if [[ $pending_count -eq 0 ]]; then
        return 0  # Phase is complete
    else
        return 1  # Phase is not complete
    fi
}

###############################################################################
# CLAUDE CODE AGENT MANAGEMENT
###############################################################################

launch_work_agent() {
    local req_id=$1
    local req_text=$2

    log_info "Launching WORK agent for requirement: $req_id"

    local prompt_file="$LOG_DIR/${req_id}-work-prompt.txt"
    local log_file="$LOG_DIR/${req_id}-work.log"

    # Create the prompt
    cat > "$prompt_file" << EOF
You are a WORK agent. Your task is to implement the following requirement:

REQUIREMENT: $req_text

CONTEXT:
- Read the roadmap at memory-bank/roadmap.md to understand the full context
- Read the existing codebase to understand the architecture
- Review any existing implementations in this phase

YOUR TASK:
1. Analyze the requirement and understand what needs to be built
2. Design and implement the solution
3. Write clean, well-documented code
4. Ensure your implementation follows the project's coding standards
5. Update any relevant documentation as you go

IMPORTANT:
- Work incrementally and test your changes
- If you encounter blockers or dependencies on other requirements, document them clearly
- When you believe the work is complete, confirm by running tests and verifying the implementation

Start working on this requirement now.
EOF

    # Launch Claude Code in background
    $CLAUDE_CMD --dangerously-skip-permissions --print "$(cat "$prompt_file")" > "$log_file" 2>&1 &
    local agent_pid=$!

    log_success "Work agent launched with PID: $agent_pid"
    log_info "Log file: $log_file"

    # Update state with agent PID
    update_requirement_status "$req_id" "in_progress" "$agent_pid"

    echo "$agent_pid"
}

launch_review_agent() {
    local req_id=$1
    local req_text=$2

    log_info "Launching REVIEW agent for requirement: $req_id"

    local prompt_file="$LOG_DIR/${req_id}-review-prompt.txt"
    local log_file="$LOG_DIR/${req_id}-review.log"

    # Create the prompt
    cat > "$prompt_file" << EOF
You are a REVIEW agent. Your task is to review the implementation of:

REQUIREMENT: $req_text

YOUR TASK:
1. Review the code changes made for this requirement
2. Identify any issues, bugs, or areas for improvement
3. Check for:
   - Code quality and readability
   - Proper error handling
   - Security vulnerabilities
   - Performance concerns
   - Missing edge cases
   - Incomplete implementations
4. Fix any issues you find
5. Write comprehensive tests (unit tests, integration tests as appropriate)
6. Ensure all tests pass

IMPORTANT:
- Be thorough but constructive
- If you find critical issues, fix them
- Add tests to prevent regressions
- Document any trade-offs or decisions made

Start reviewing now.
EOF

    # Launch Claude Code in background
    $CLAUDE_CMD --dangerously-skip-permissions --print "$(cat "$prompt_file")" > "$log_file" 2>&1 &
    local agent_pid=$!

    log_success "Review agent launched with PID: $agent_pid"
    log_info "Log file: $log_file"

    echo "$agent_pid"
}

launch_commit_agent() {
    local req_id=$1
    local req_text=$2

    log_info "Launching COMMIT agent for requirement: $req_id"

    local prompt_file="$LOG_DIR/${req_id}-commit-prompt.txt"
    local log_file="$LOG_DIR/${req_id}-commit.log"

    # Create the prompt
    cat > "$prompt_file" << EOF
You are a COMMIT agent. Your task is to finalize and commit the work for:

REQUIREMENT: $req_text

YOUR TASK:
1. Verify that the work is complete and all tests pass
2. Review the changes one more time
3. Create a descriptive commit message following conventional commit format:
   - Use type: (feat:, fix:, docs:, etc.)
   - Include a concise summary
   - Reference the requirement
   - Add body if needed to explain the "why"
4. Update documentation:
   - Update README.md if user-facing changes were made
   - Update memory-bank/roadmap.md to mark this requirement as complete
   - Update any other relevant documentation
5. Create the git commit
6. Push the changes to GitHub

IMPORTANT:
- Do NOT push if tests are failing
- Ensure the commit message is clear and descriptive
- Verify all documentation is updated
- Confirm the roadmap is updated to show this requirement is complete

Start the commit process now.
EOF

    # Launch Claude Code in background
    $CLAUDE_CMD --dangerously-skip-permissions --print "$(cat "$prompt_file")" > "$log_file" 2>&1 &
    local agent_pid=$!

    log_success "Commit agent launched with PID: $agent_pid"
    log_info "Log file: $log_file"

    echo "$agent_pid"
}

wait_for_agent() {
    local agent_pid=$1
    local req_id=$2
    local agent_type=$3

    log_info "Waiting for $agent_type agent (PID: $agent_pid) to complete..."

    # Wait for the process to complete
    while kill -0 "$agent_pid" 2>/dev/null; do
        sleep 5
    done

    # Check exit status
    wait "$agent_pid" 2>/dev/null
    local exit_status=$?

    if [[ $exit_status -eq 0 ]]; then
        log_success "$agent_type agent completed successfully"
        return 0
    else
        log_warning "$agent_type agent exited with status: $exit_status"
        return 1
    fi
}

###############################################################################
# WORKFLOW ORCHESTRATION
###############################################################################

execute_requirement_workflow() {
    local req_id=$1
    local req_text=$2

    log_info "=========================================="
    log_info "Starting workflow for: $req_id"
    log_info "=========================================="

    # STAGE 1: WORK
    log_info "STAGE 1: Launching work agent..."
    local work_pid=$(launch_work_agent "$req_id" "$req_text")
    wait_for_agent "$work_pid" "$req_id" "WORK"

    # STAGE 2: REVIEW
    log_info "STAGE 2: Launching review agent..."
    local review_pid=$(launch_review_agent "$req_id" "$req_text")
    wait_for_agent "$review_pid" "$req_id" "REVIEW"

    # STAGE 3: COMMIT
    log_info "STAGE 3: Launching commit agent..."
    local commit_pid=$(launch_commit_agent "$req_id" "$req_text")
    wait_for_agent "$commit_pid" "$req_id" "COMMIT"

    # Mark requirement as completed
    update_requirement_status "$req_id" "completed"

    log_success "=========================================="
    log_success "Workflow completed for: $req_id"
    log_success "=========================================="
}

execute_phase_parallel() {
    local phase_num=$1

    log_info "Starting Phase $phase_num execution..."

    # Update phase status to in_progress
    update_phase_status "$phase_num" "in_progress"

    # Get all pending requirements
    local pending_reqs=$(get_pending_requirements "$phase_num")

    if [[ -z "$pending_reqs" ]]; then
        log_warning "No pending requirements found for Phase $phase_num"
        return
    fi

    local req_count=$(echo "$pending_reqs" | wc -l | tr -d ' ')
    log_info "Found $req_count requirements to process in Phase $phase_num"

    # Process requirements in parallel batches
    local completed=0
    local batch_num=0

    while IFS= read -r req_id; do
        # Check if we've reached max parallel jobs
        local running_jobs=$(jobs -r 2>/dev/null | wc -l | tr -d ' ')

        while [[ $running_jobs -ge $MAX_PARALLEL_JOBS ]]; do
            log_info "Waiting for jobs to complete... ($running_jobs running)"
            sleep 10
            running_jobs=$(jobs -r 2>/dev/null | wc -l | tr -d ' ')
        done

        # Get requirement text
        local req_text=$(get_requirement_text "$req_id")

        # Execute workflow in background
        log_info "Starting workflow for $req_id (batch $((batch_num + 1)))"
        execute_requirement_workflow "$req_id" "$req_text" &

        completed=$((completed + 1))
        if [[ $completed -ge $MAX_PARALLEL_JOBS ]]; then
            batch_num=$((batch_num + 1))
            completed=0
        fi
    done <<< "$pending_reqs"

    # Wait for all background jobs to complete
    log_info "All workflows launched, waiting for completion..."
    wait

    # Verify phase is complete
    if check_phase_complete "$phase_num"; then
        update_phase_status "$phase_num" "completed"
        log_success "Phase $phase_num completed successfully!"

        # Move to next phase
        local next_phase=$((phase_num + 1))
        if [[ $next_phase -le 12 ]]; then
            log_info "Updating current phase to $next_phase..."
            local temp_state=$(mktemp)
            jq ".current_phase = $next_phase" "$STATE_FILE" > "$temp_state"
            mv "$temp_state" "$STATE_FILE"
        fi
    else
        log_error "Phase $phase_num did not complete successfully!"
        log_error "Some requirements may still be pending. Check logs for details."
        return 1
    fi
}

###############################################################################
# MAIN ORCHESTRATION LOOP
###############################################################################

main_orchestration_loop() {
    log_info "=========================================="
    log_info "Starting CAPO Orchestrator"
    log_info "=========================================="

    while true; do
        local current_phase=$(get_current_phase)
        local phase_status=$(get_phase_status "$current_phase")

        log_info "Current Phase: $current_phase"
        log_info "Phase Status: $phase_status"

        # Check if all phases are complete
        if [[ "$current_phase" -gt 12 ]]; then
            log_success "=========================================="
            log_success "ALL PHASES COMPLETED!"
            log_success "=========================================="
            break
        fi

        # Execute phase if pending
        if [[ "$phase_status" == "pending" ]]; then
            execute_phase_parallel "$current_phase"
        elif [[ "$phase_status" == "in_progress" ]]; then
            log_warning "Phase $current_phase is already in progress. Resuming..."
            execute_phase_parallel "$current_phase"
        elif [[ "$phase_status" == "completed" ]]; then
            log_info "Phase $current_phase is already complete. Moving to next phase..."
            local next_phase=$((current_phase + 1))
            local temp_state=$(mktemp)
            jq ".current_phase = $next_phase" "$STATE_FILE" > "$temp_state"
            mv "$temp_state" "$STATE_FILE"
            sleep 2
        fi

        # Check if we should continue
        if [[ "$current_phase" -gt 12 ]]; then
            log_success "=========================================="
            log_success "ALL PHASES COMPLETED!"
            log_success "=========================================="
            break
        fi
    done
}

###############################################################################
# UTILITY FUNCTIONS
###############################################################################

show_status() {
    echo ""
    echo "=========================================="
    echo "ORCHESTRATOR STATUS"
    echo "=========================================="
    echo ""

    local current_phase=$(get_current_phase)
    echo "Current Phase: $current_phase"
    echo ""

    jq -r '.phases[] | "Phase \(.number): \(.title)\n  Status: \(.status)\n  Requirements:\n    \(.requirements[] | "  - \(.text): \(.status) | Started: \(.started_at // \"N/A\") | Completed: \(.completed_at // \"N/A\")")"' "$STATE_FILE"

    echo ""
    echo "=========================================="
}

reset_orchestrator() {
    log_warning "Resetting orchestrator state..."
    rm -f "$STATE_FILE"
    rm -rf "$WORK_DIR"
    init_state_file
    log_success "Orchestrator reset complete"
}

###############################################################################
# COMMAND LINE INTERFACE
###############################################################################

print_usage() {
    cat << EOF
Usage: $0 <command>

Commands:
    start       Start the orchestration loop
    status      Show current status
    reset       Reset orchestrator state (USE WITH CAUTION)
    phase <n>   Manually set current phase
    help        Show this help message

Examples:
    $0 start           # Start orchestration
    $0 status          # Show status
    $0 phase 3         # Set current phase to 3
    $0 reset           # Reset all state

EOF
}

###############################################################################
# MAIN ENTRY POINT
###############################################################################

main() {
    # Initialize orchestrator
    init_orchestrator

    # Parse command
    local command=${1:-start}

    case "$command" in
        start)
            main_orchestration_loop
            ;;
        status)
            show_status
            ;;
        reset)
            reset_orchestrator
            ;;
        phase)
            local new_phase=$2
            if [[ -z "$new_phase" ]]; then
                log_error "Please specify a phase number"
                exit 1
            fi
            local temp_state=$(mktemp)
            jq ".current_phase = $new_phase" "$STATE_FILE" > "$temp_state"
            mv "$temp_state" "$STATE_FILE"
            log_success "Current phase set to $new_phase"
            ;;
        help|--help|-h)
            print_usage
            ;;
        *)
            log_error "Unknown command: $command"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
