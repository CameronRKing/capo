#!/bin/bash

###############################################################################
# Taillogs Helper Script
#
# Displays logs from Docker containers with configurable line count
# Also checks for application log files in the ./logs directory
#
# Usage:
#   ./scripts/taillogs.sh <service> [linecount]
#
# Arguments:
#   service   - Either "frontend" or "backend"
#   linecount - Optional number of lines to show (default: 100)
#
# Examples:
#   ./scripts/taillogs.sh frontend 50     # Show last 50 lines of frontend logs
#   ./scripts/taillogs.sh backend         # Show last 100 lines of backend logs
#   ./scripts/taillogs.sh frontend 1000   # Show last 1000 lines of frontend logs
###############################################################################

set -e

# Default values
DEFAULT_LINE_COUNT=100
CONTAINER_NAME_FRONTEND="capo-frontend"
CONTAINER_NAME_BACKEND="capo-backend"
LOG_DIR_FRONTEND="./logs/frontend"
LOG_DIR_BACKEND="./logs/backend"

# Parse arguments
SERVICE=$1
LINE_COUNT=${2:-$DEFAULT_LINE_COUNT}

# Validate line count is a number
if ! [[ "$LINE_COUNT" =~ ^[0-9]+$ ]]; then
    echo "Error: linecount must be a positive number"
    echo "Usage: $0 <frontend|backend> [linecount]"
    exit 1
fi

# Function to show Docker logs
show_docker_logs() {
    local container=$1
    local lines=$2
    local service_name=$3

    echo ""
    echo "=========================================="
    echo "Docker Container Logs: $service_name"
    echo "Container: $container"
    echo "Lines: $lines"
    echo "=========================================="
    echo ""

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        docker logs --tail "$lines" --follow "$container"
    else
        echo "Container $container is not running"
        echo "Available containers:"
        docker ps --format 'table {{.Names}}\t{{.Status}}'
    fi
}

# Function to show application log files
show_app_logs() {
    local log_dir=$1
    local service_name=$2
    local lines=$3

    if [ -d "$log_dir" ]; then
        # Find log files in the directory
        log_files=$(find "$log_dir" -type f \( -name "*.log" -o -name "*.txt" \) 2>/dev/null)

        if [ -n "$log_files" ]; then
            echo ""
            echo "=========================================="
            echo "Application Log Files: $service_name"
            echo "Directory: $log_dir"
            echo "Lines: $lines"
            echo "=========================================="
            echo ""

            for log_file in $log_files; do
                echo ""
                echo "--- File: $log_file ---"
                tail -n "$lines" "$log_file"
                echo ""
            done
        fi
    fi
}

# Main logic
case "$SERVICE" in
    frontend)
        echo "Showing logs for FRONTEND service..."
        show_docker_logs "$CONTAINER_NAME_FRONTEND" "$LINE_COUNT" "Frontend"
        show_app_logs "$LOG_DIR_FRONTEND" "Frontend" "$LINE_COUNT"
        ;;
    backend)
        echo "Showing logs for BACKEND service..."
        show_docker_logs "$CONTAINER_NAME_BACKEND" "$LINE_COUNT" "Backend"
        show_app_logs "$LOG_DIR_BACKEND" "Backend" "$LINE_COUNT"
        ;;
    *)
        echo "Error: Unknown service '$SERVICE'"
        echo "Usage: $0 <frontend|backend> [linecount]"
        echo ""
        echo "Examples:"
        echo "  $0 frontend 50"
        echo "  $0 backend"
        echo "  $0 frontend 1000"
        exit 1
        ;;
esac
