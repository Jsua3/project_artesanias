package com.inventory.inventory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient catalogWebClient() {
        return WebClient.builder()
                .baseUrl("http://catalog-service:8082")
                .build();
    }
}
