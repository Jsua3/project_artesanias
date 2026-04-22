package com.inventory.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /**
     * WebClient para hablar con catalog-service. catalog-service tiene un
     * InternalGatewayFilter que exige el header X-Internal-Token en todas
     * las rutas — lo inyectamos por default aqui para que cualquier
     * request desde inventory-service lo incluya automaticamente.
     */
    @Bean
    public WebClient catalogWebClient(
            @Value("${catalog.service.url:http://catalog-service:8082}") String baseUrl,
            @Value("${security.jwt.internal-token:my-super-secret-internal-token}") String internalToken) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Internal-Token", internalToken)
                .build();
    }
}
