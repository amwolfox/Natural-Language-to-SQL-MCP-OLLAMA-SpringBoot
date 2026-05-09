package com.nl2sql.service;

import com.nl2sql.model.ApiModels.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OllamaService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:qwen2.5-coder}")
    private String model;

    private static final Pattern SQL_BLOCK = Pattern.compile(
            "```(?:sql)?\\s*([\\s\\S]+?)```", Pattern.CASE_INSENSITIVE);

    public String generateSql(String userQuestion, String schemaJson) {
        String prompt = buildPrompt(userQuestion, schemaJson);

        OllamaRequest request = new OllamaRequest(
                model,
                prompt,
                false,
                new OllamaOptions(512)
        );

        OllamaResponse response = restTemplate.postForObject(
                ollamaBaseUrl + "/api/generate", request, OllamaResponse.class);

        if (response == null || response.response() == null) {
            throw new RuntimeException("No response from Ollama");
        }

        return extractSql(response.response().trim());
    }

    private String buildPrompt(String question, String schemaJson) {
        return """
                You are an expert SQL assistant. Your ONLY job is to convert natural language questions into valid PostgreSQL SELECT queries.

                Rules:
                - Output ONLY a SQL SELECT statement wrapped in a ```sql ... ``` code block.
                - Do not explain. Do not add any text before or after the code block.
                - Never use INSERT, UPDATE, DELETE, DROP, or any DDL.
                - Use proper JOINs when querying across multiple tables.
                - Use aliases for readability.
                - Limit results to 100 rows unless the user asks for more.

                Database schema (table name + columns):
                %s

                Question: %s

                SQL:
                """.formatted(schemaJson, question);
    }

    private String extractSql(String raw) {
        Matcher m = SQL_BLOCK.matcher(raw);
        if (m.find()) {
            return m.group(1).trim();
        }
        // Fallback: assume the whole response is SQL if no code block found
        if (raw.toUpperCase().startsWith("SELECT")) {
            return raw;
        }
        throw new RuntimeException("Could not extract SQL from model response: " + raw);
    }
}
