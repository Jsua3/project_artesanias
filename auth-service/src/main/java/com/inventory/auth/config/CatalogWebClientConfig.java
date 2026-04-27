package com.inventory.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class CatalogWebClientConfig {

    @Bean("catalogWebClient")
    public WebClient catalogWebClient(
            @Value("${catalog.service.url:http://catalog-service:8082}") String baseUrl,
            @Value("${security.jwt.internal-token:my-super-secret-internal-token}") String internalToken) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("X-Internal-Token", internalToken)
                .build();
    }
}
