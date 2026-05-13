package com.inventory.ai.controller;

import com.inventory.ai.config.OpenAiProperties;
import com.inventory.ai.dto.OpenAiConfigStatusResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/ai/admin")
public class AiAdminController {

    private final OpenAiProperties properties;

    public AiAdminController(OpenAiProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/config-status")
    public Mono<OpenAiConfigStatusResponse> configStatus(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role
    ) {
        if (!"ADMIN".equals(normalizeRole(role))) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        boolean configured = properties.enabled();
        return Mono.just(new OpenAiConfigStatusResponse(
                configured,
                configured ? "READY" : "WARN",
                configured
                        ? "OpenAI esta configurado para texto e imagen."
                        : "OPENAI_API_KEY no esta configurada; el servicio usara fallback local.",
                properties.model(),
                properties.imageModel(),
                true
        ));
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }
}
