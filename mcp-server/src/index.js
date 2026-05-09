import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_tables",
    description: "List all user tables in the PostgreSQL database with their column names and types.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "describe_table",
    description: "Get detailed schema for a specific table including column names, types, nullability, and foreign keys.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "The name of the table to describe." },
      },
      required: ["table_name"],
    },
  },
  {
    name: "execute_query",
    description: "Execute a read-only SQL SELECT query and return the results as JSON.",
    inputSchema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "A SQL SELECT statement to execute." },
      },
      required: ["sql"],
    },
  },
];

// ─── Tool implementations ────────────────────────────────────────────────────

async function listTables() {
  const res = await pool.query(`
    SELECT
      t.table_name,
      array_agg(c.column_name || ' ' || c.data_type ORDER BY c.ordinal_position) AS columns
    FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    GROUP BY t.table_name
    ORDER BY t.table_name
  `);
  return res.rows;
}

async function describeTable(tableName) {
  const cols = await pool.query(`
    SELECT
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      kcu.constraint_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name AND kcu.table_schema = 'public'
    LEFT JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
    WHERE c.table_schema = 'public' AND c.table_name = $1
    ORDER BY c.ordinal_position
  `, [tableName]);
  return cols.rows;
}

async function executeQuery(sql) {
  const trimmed = sql.trim().replace(/;$/, "");
  if (!/^SELECT/i.test(trimmed)) {
    throw new Error("Only SELECT queries are allowed.");
  }
  const res = await pool.query(trimmed);
  return { rows: res.rows, rowCount: res.rowCount };
}

// ─── MCP HTTP endpoints ──────────────────────────────────────────────────────

// List available tools
app.get("/tools", (req, res) => {
  res.json({ tools: TOOLS });
});

// Call a tool
app.post("/tools/call", async (req, res) => {
  const { name, arguments: args } = req.body;
  try {
    let result;
    switch (name) {
      case "list_tables":
        result = await listTables();
        break;
      case "describe_table":
        result = await describeTable(args.table_name);
        break;
      case "execute_query":
        result = await executeQuery(args.sql);
        break;
      default:
        return res.status(404).json({ error: `Unknown tool: ${name}` });
    }
    res.json({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  } catch (err) {
    res.status(500).json({
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP PostgreSQL server running on http://localhost:${PORT}`);
});
