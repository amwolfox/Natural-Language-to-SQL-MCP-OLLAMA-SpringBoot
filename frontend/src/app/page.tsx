"use client";

import { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type QueryResult = {
  question: string;
  sql: string | null;
  rows: Record<string, unknown>[] | null;
  rowCount: number;
  error: string | null;
  duration?: number;
};

const EXAMPLE_QUESTIONS = [
  "Show all employees with their department names",
  "Which department has the highest average salary?",
  "List active projects and how many employees are assigned to each",
  "Who are the top 3 highest paid employees?",
  "Show all employees hired after 2021",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryResult[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function runQuery(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data: QueryResult = await res.json();
      data.duration = Date.now() - start;
      setHistory((h) => [...h, data]);
    } catch {
      setHistory((h) => [
        ...h,
        { question: q, sql: null, rows: null, rowCount: 0, error: "Network error — is the backend running?", duration: Date.now() - start },
      ]);
    } finally {
      setLoading(false);
      setQuestion("");
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runQuery(question);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <header style={{ padding: "20px 0 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>NL → SQL</h1>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>qwen2.5-coder · PostgreSQL · MCP</p>
        </div>
      </header>

      {/* Messages */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        {history.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 15 }}>Ask anything about your database in plain English.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} onClick={() => { setQuestion(q); inputRef.current?.focus(); }}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 20, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((item, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            {/* Question bubble */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)", borderRadius: "16px 16px 4px 16px", padding: "10px 16px", maxWidth: "70%", fontSize: 14 }}>
                {item.question}
              </div>
            </div>

            {/* Response card */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {item.error ? (
                <div style={{ padding: 16, color: "var(--error)", fontSize: 13 }}>
                  ⚠ {item.error}
                </div>
              ) : (
                <>
                  {/* SQL block */}
                  {item.sql && (
                    <div style={{ borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Generated SQL</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.duration}ms</span>
                      </div>
                      <pre className="mono" style={{ margin: 0, padding: "12px 16px", fontSize: 13, color: "#93c5fd", overflowX: "auto", whiteSpace: "pre-wrap" }}>
                        {item.sql}
                      </pre>
                    </div>
                  )}

                  {/* Results table */}
                  {item.rows && item.rows.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <div style={{ padding: "8px 16px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                        {item.rowCount} row{item.rowCount !== 1 ? "s" : ""} returned
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            {Object.keys(item.rows[0]).map((col) => (
                              <th key={col} className="mono" style={{ textAlign: "left", padding: "8px 16px", color: "var(--muted)", fontWeight: 500, fontSize: 11, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.rows.map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: ri < item.rows!.length - 1 ? "1px solid var(--border)" : "none" }}>
                              {Object.values(row).map((val, vi) => (
                                <td key={vi} style={{ padding: "8px 16px", color: "var(--text)", whiteSpace: "nowrap" }}>
                                  {val === null ? <span style={{ color: "var(--muted)" }}>NULL</span> : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : item.rows?.length === 0 ? (
                    <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>No rows returned.</div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", fontSize: 13, color: "var(--muted)" }}>
              <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>⚡ Generating SQL…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer style={{ padding: "12px 0 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about your data… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              padding: "12px 16px",
              fontSize: 14,
              resize: "none",
              outline: "none",
              lineHeight: 1.5,
              fontFamily: "inherit",
              minHeight: 44,
              maxHeight: 200,
              overflowY: "auto",
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 200) + "px";
            }}
          />
          <button
            onClick={() => runQuery(question)}
            disabled={loading || !question.trim()}
            style={{
              background: loading || !question.trim() ? "var(--border)" : "var(--accent)",
              color: loading || !question.trim() ? "var(--muted)" : "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "…" : "Run →"}
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        textarea:focus { border-color: var(--accent) !important; }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </div>
  );
}
