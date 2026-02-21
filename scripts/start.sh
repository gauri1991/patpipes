#!/bin/bash

# Patent Analytics Platform - Start Servers
# Usage: ./scripts/start.sh [frontend|backend|all]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_ROOT="$PROJECT_ROOT/frontend"
BACKEND_ROOT="$PROJECT_ROOT/backend"
VENV_PATH="$BACKEND_ROOT/venv"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# PID & Log files
FRONTEND_PID_FILE="$SCRIPT_DIR/.frontend.pid"
BACKEND_PID_FILE="$SCRIPT_DIR/.backend.pid"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"
BACKEND_LOG="$SCRIPT_DIR/backend.log"

start_frontend() {
    echo -e "${BLUE}Starting Frontend (Next.js)...${NC}"

    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Frontend already running (PID: $PID)${NC}"
            return 0
        fi
    fi

    cd "$FRONTEND_ROOT"
    nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    sleep 3

    if ps -p $(cat "$FRONTEND_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend started (PID: $(cat $FRONTEND_PID_FILE))${NC}"
        echo -e "${GREEN}URL: http://localhost:3000${NC}"
    else
        echo -e "${RED}Failed to start frontend. Check: $FRONTEND_LOG${NC}"
        return 1
    fi
}

start_backend() {
    echo -e "${BLUE}Starting Backend (Django)...${NC}"

    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Backend already running (PID: $PID)${NC}"
            return 0
        fi
    fi

    cd "$BACKEND_ROOT"

    # Use venv python directly
    PYTHON="$VENV_PATH/bin/python"
    if [ ! -f "$PYTHON" ]; then
        PYTHON=$(which python3 || which python)
    fi

    nohup "$PYTHON" manage.py runserver 0.0.0.0:8000 > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    sleep 3

    if ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}Backend started (PID: $(cat $BACKEND_PID_FILE))${NC}"
        echo -e "${GREEN}URL: http://localhost:8000${NC}"
    else
        echo -e "${RED}Failed to start backend. Check: $BACKEND_LOG${NC}"
        return 1
    fi
}

case "${1:-all}" in
    frontend|fe|f) start_frontend ;;
    backend|be|b) start_backend ;;
    all|"") start_backend; start_frontend ;;
    *)
        echo "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac
