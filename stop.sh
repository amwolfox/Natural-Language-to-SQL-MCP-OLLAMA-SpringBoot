#!/usr/bin/env bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/logs"

GREEN='\033[0;32m'; NC='\033[0m'
info() { echo -e "${GREEN}[nl2sql]${NC} $*"; }

# Ollama is not managed by this project — only stop what we started
for service in frontend backend mcp; do
  PID_FILE="$LOG_DIR/$service.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && info "Stopped $service (pid $PID)"
    fi
    rm -f "$PID_FILE"
  fi
done

info "Done. Ollama was left running (manage it separately)."
