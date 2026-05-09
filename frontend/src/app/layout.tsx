import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NL→SQL | Ask your database anything",
  description: "Natural language to SQL powered by Ollama qwen2.5-coder and PostgreSQL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
