package com.inventory.catalog.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InternalGatewayFilter implements WebFilter {

    @Value("${security.jwt.internal-token}")
    private String internalToken;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().pathWithinApplication().value();
        if (path.equals("/actuator/health") || path.startsWith("/actuator/health/")) {
            return chain.filter(exchange);
        }

        String tokenHeader = exchange.getRequest().getHeaders().getFirst("X-Internal-Token");

        if (tokenHeader == null || !tokenHeader.equals(internalToken)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }
}
