package com.inventory.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("security.jwt")
public record JwtProperties(String secret, long expiration, long refreshExpiration) {
}
