package com.nl2sql.model;

import java.util.List;
import java.util.Map;

public class ApiModels {

    public record QueryRequest(String question) {}

    public record QueryResponse(
            String question,
            String sql,
            List<Map<String, Object>> rows,
            int rowCount,
            String error
    ) {}

    public record OllamaRequest(
            String model,
            String prompt,
            boolean stream,
            OllamaOptions options
    ) {}

    public record OllamaOptions(int num_predict) {}

    public record OllamaResponse(String response, boolean done) {}

    public record McpToolCall(String name, Object arguments) {}

    public record McpToolResult(List<McpContent> content, Boolean isError) {}

    public record McpContent(String type, String text) {}
}
