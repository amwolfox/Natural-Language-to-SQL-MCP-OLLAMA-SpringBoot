package com.nl2sql.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nl2sql.model.ApiModels.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class McpClientService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${mcp.base-url}")
    private String mcpBaseUrl;

    public String getSchema() {
        try {
            McpToolCall call = new McpToolCall("list_tables", Map.of());
            McpToolResult result = restTemplate.postForObject(
                    mcpBaseUrl + "/tools/call", call, McpToolResult.class);
            if (result != null && result.content() != null && !result.content().isEmpty()) {
                return result.content().get(0).text();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch schema from MCP: " + e.getMessage(), e);
        }
        return "[]";
    }

    @SuppressWarnings("unchecked")
    public QueryResult executeQuery(String sql) {
        try {
            McpToolCall call = new McpToolCall("execute_query", Map.of("sql", sql));
            McpToolResult result = restTemplate.postForObject(
                    mcpBaseUrl + "/tools/call", call, McpToolResult.class);

            if (result == null || result.content() == null || result.content().isEmpty()) {
                throw new RuntimeException("Empty response from MCP server");
            }

            if (Boolean.TRUE.equals(result.isError())) {
                throw new RuntimeException(result.content().get(0).text());
            }

            String json = result.content().get(0).text();
            Map<String, Object> parsed = mapper.readValue(json, Map.class);
            List<Map<String, Object>> rows = (List<Map<String, Object>>) parsed.get("rows");
            int rowCount = (int) parsed.get("rowCount");
            return new QueryResult(rows, rowCount);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute query via MCP: " + e.getMessage(), e);
        }
    }

    public record QueryResult(List<Map<String, Object>> rows, int rowCount) {}
}
