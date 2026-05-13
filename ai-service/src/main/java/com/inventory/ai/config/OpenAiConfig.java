package com.inventory.ai.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties({OpenAiProperties.class, PricingRulesProperties.class})
public class OpenAiConfig {

    @Bean
    WebClient openAiWebClient(OpenAiProperties properties) {
        WebClient.Builder builder = WebClient.builder()
                .baseUrl(properties.baseUrl() == null || properties.baseUrl().isBlank()
                        ? "https://api.openai.com/v1"
                        : properties.baseUrl());

        if (properties.enabled()) {
            builder.defaultHeader("Authorization", "Bearer " + properties.apiKey());
        }

        return builder.build();
    }
}
