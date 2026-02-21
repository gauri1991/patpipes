#!/bin/bash

# Patent Analytics Platform - Stop Servers
# Usage: ./scripts/stop.sh [frontend|backend|all|force]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# PID files
FRONTEND_PID_FILE="$SCRIPT_DIR/.frontend.pid"
BACKEND_PID_FILE="$SCRIPT_DIR/.backend.pid"

stop_frontend() {
    echo -e "${BLUE}Stopping Frontend...${NC}"

    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID" 2>/dev/null
            sleep 2
            ps -p "$PID" > /dev/null 2>&1 && kill -9 "$PID" 2>/dev/null
            echo -e "${GREEN}Frontend stopped${NC}"
        else
            echo -e "${YELLOW}Frontend was not running${NC}"
        fi
        rm -f "$FRONTEND_PID_FILE"
    else
        echo -e "${YELLOW}No frontend PID file${NC}"
    fi

    pkill -f "next dev" 2>/dev/null || true
}

stop_backend() {
    echo -e "${BLUE}Stopping Backend...${NC}"

    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID" 2>/dev/null
            sleep 2
            ps -p "$PID" > /dev/null 2>&1 && kill -9 "$PID" 2>/dev/null
            echo -e "${GREEN}Backend stopped${NC}"
        else
            echo -e "${YELLOW}Backend was not running${NC}"
        fi
        rm -f "$BACKEND_PID_FILE"
    else
        echo -e "${YELLOW}No backend PID file${NC}"
    fi

    pkill -f "manage.py runserver" 2>/dev/null || true
}

stop_force() {
    echo -e "${BLUE}Force stopping all processes...${NC}"
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "manage.py runserver" 2>/dev/null || true
    lsof -ti:3000,3001,8000 2>/dev/null | xargs kill -9 2>/dev/null || true
    rm -f "$FRONTEND_PID_FILE" "$BACKEND_PID_FILE"
    echo -e "${GREEN}All processes stopped${NC}"
}

case "${1:-all}" in
    frontend|fe|f) stop_frontend ;;
    backend|be|b) stop_backend ;;
    all|"") stop_frontend; stop_backend ;;
    force|kill) stop_force ;;
    *)
        echo "Usage: $0 [frontend|backend|all|force]"
        exit 1
        ;;
esac
