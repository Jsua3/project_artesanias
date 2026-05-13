package com.inventory.gateway.controller;

import com.inventory.gateway.dto.SystemHealthResponse;
import com.inventory.gateway.service.JwtTokenService;
import com.inventory.gateway.service.SystemHealthService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/system-health")
public class SystemHealthController {

    private final SystemHealthService systemHealthService;
    private final JwtTokenService jwtTokenService;

    public SystemHealthController(SystemHealthService systemHealthService, JwtTokenService jwtTokenService) {
        this.systemHealthService = systemHealthService;
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping
    public Mono<SystemHealthResponse> snapshot(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        requireAdmin(authorization);
        return systemHealthService.snapshot();
    }

    private void requireAdmin(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        try {
            Claims claims = jwtTokenService.getClaims(authorization.substring(7));
            String role = claims.get("role", String.class);
            if (!"ADMIN".equals(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }
}
