#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()  { echo -e "${GREEN}[nl2sql]${NC} $*"; }
warn()  { echo -e "${YELLOW}[nl2sql]${NC} $*"; }
error() { echo -e "${RED}[nl2sql]${NC} $*"; exit 1; }

# ── Prerequisite checks ───────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || error "Node.js not found. Install from https://nodejs.org"
command -v java >/dev/null 2>&1 || error "Java 21 not found. Install from https://adoptium.net"
command -v mvn  >/dev/null 2>&1 || error "Maven not found. Install from https://maven.apache.org"
command -v psql >/dev/null 2>&1 || warn  "psql not found — assuming PostgreSQL is already set up"

# ── Verify Ollama is already running ─────────────────────────────────────────
info "Checking Ollama..."
if ! curl -sf http://localhost:11434 >/dev/null 2>&1; then
  error "Ollama is not running. Start it first with: ollama serve"
fi
if ! ollama list 2>/dev/null | grep -q "qwen2.5-coder"; then
  warn "qwen2.5-coder not found. Pulling now (may take a few minutes)..."
  ollama pull qwen2.5-coder
fi
info "Ollama ready on :11434"

# ── Install & start MCP server ────────────────────────────────────────────────
info "Installing MCP server dependencies..."
cd "$ROOT/mcp-server"
npm install --silent

info "Starting MCP server on :3001..."
DATABASE_URL="${DATABASE_URL:-postgresql://mesut@localhost:5432/springbootmicroservicesdemo}" \
  node src/index.js > "$LOG_DIR/mcp.log" 2>&1 &
echo $! > "$LOG_DIR/mcp.pid"
sleep 1

# ── Build & start Spring Boot backend ────────────────────────────────────────
info "Building Spring Boot backend (first run takes ~1 min)..."
cd "$ROOT/backend"
mvn package -DskipTests -q

info "Starting Spring Boot backend on :8080..."
java -jar target/*.jar > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$LOG_DIR/backend.pid"

info "Waiting for backend to start..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

# ── Install & start Next.js frontend ─────────────────────────────────────────
info "Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent

info "Starting Next.js frontend on :3000..."
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$LOG_DIR/frontend.pid"

sleep 3
echo ""
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "  All services started!"
info "  App  →  http://localhost:3000"
info "  API  →  http://localhost:8080"
info "  MCP  →  http://localhost:3001"
info "  Logs →  $LOG_DIR/"
info "  Stop →  ./stop.sh"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
