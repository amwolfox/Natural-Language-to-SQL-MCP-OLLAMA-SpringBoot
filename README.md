# NL → SQL

Ask your PostgreSQL database anything in plain English. Your question flows through:

```
Browser → Next.js (3000) → Spring Boot (8080) → Ollama qwen2.5-coder (11434) → MCP Server (3001) → PostgreSQL
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Java | 21+ | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| Ollama | latest | https://ollama.com |
| PostgreSQL | 16+ | https://www.postgresql.org |

---
## Screenshot

![img.png](img.png)

## Setup

### 1. Create the database and seed sample data

```bash
psql -U postgres -c "CREATE USER nl2sql WITH PASSWORD 'nl2sql';"
psql -U postgres -c "CREATE DATABASE nl2sql OWNER nl2sql;"
psql -U nl2sql -d nl2sql -f scripts/init.sql
```

> Skip the seed step and set `DATABASE_URL` to point at your own database.

### 2. Start everything

```bash
chmod +x start.sh stop.sh
./start.sh
```

This pulls the model (once, ~4 GB), builds the backend, and starts all four services. Then open **http://localhost:3000**.

### 3. Stop everything

```bash
./stop.sh
```

---

## Manual startup (four terminals)

**Terminal 1 — Ollama**
```bash
ollama pull qwen2.5-coder   # first time only
ollama serve
```

**Terminal 2 — MCP server**
```bash
cd mcp-server
npm install
DATABASE_URL=postgresql://nl2sql:nl2sql@localhost:5432/nl2sql node src/index.js
```

**Terminal 3 — Spring Boot backend**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 4 — Next.js frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
nl-to-sql/
├── start.sh / stop.sh
├── scripts/init.sql              # Sample schema + seed data
├── frontend/                     # Next.js 14 + TypeScript
├── backend/                      # Spring Boot 3 (Java 21)
│   └── src/main/java/com/nl2sql/
│       ├── controller/           # POST /api/query
│       ├── service/
│       │   ├── OllamaService     # Prompts Ollama, extracts SQL
│       │   ├── McpClientService  # Schema fetch + query execution
│       │   └── QueryService      # Orchestrates the full flow
│       └── model/
└── mcp-server/                   # Node.js — wraps PostgreSQL as MCP tools
    └── src/index.js              # list_tables · describe_table · execute_query
```

---

## Configuration

**Change the model** — `backend/src/main/resources/application.properties`:
```
ollama.model=codellama
```

**Custom database** — set env var before starting the MCP server:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/mydb node src/index.js
```
