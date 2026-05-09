package com.nl2sql.service;

import com.nl2sql.model.ApiModels.*;
import org.springframework.stereotype.Service;

@Service
public class QueryService {

    private final OllamaService ollamaService;
    private final McpClientService mcpClientService;

    public QueryService(OllamaService ollamaService, McpClientService mcpClientService) {
        this.ollamaService = ollamaService;
        this.mcpClientService = mcpClientService;
    }

    public QueryResponse processQuestion(String question) {
        try {
            // 1. Fetch schema from MCP server
            String schemaJson = mcpClientService.getSchema();

            // 2. Generate SQL via Ollama
            String sql = ollamaService.generateSql(question, schemaJson);

            // 3. Execute the generated SQL via MCP server
            McpClientService.QueryResult result = mcpClientService.executeQuery(sql);

            return new QueryResponse(question, sql, result.rows(), result.rowCount(), null);

        } catch (Exception e) {
            return new QueryResponse(question, null, null, 0, e.getMessage());
        }
    }
}
