package com.inventory.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(
        String apiKey,
        String model,
        String imageModel,
        String baseUrl
) {
    public boolean enabled() {
        return apiKey != null && !apiKey.isBlank();
    }
}
