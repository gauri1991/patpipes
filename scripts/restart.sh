#!/bin/bash

# Patent Analytics Platform - Restart Servers
# Usage: ./scripts/restart.sh [frontend|backend|all]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Restarting servers..."
"$SCRIPT_DIR/stop.sh" "${1:-all}"
sleep 2
"$SCRIPT_DIR/start.sh" "${1:-all}"
echo "Restart complete!"
