package com.inventory.ai.controller;

import com.inventory.ai.dto.ConfirmDesignRequest;
import com.inventory.ai.dto.CustomDesignResponse;
import com.inventory.ai.dto.DesignNotificationResponse;
import com.inventory.ai.dto.DesignTurnRequest;
import com.inventory.ai.dto.DesignTurnResponse;
import com.inventory.ai.dto.PreviewRequest;
import com.inventory.ai.dto.PreviewResponse;
import com.inventory.ai.dto.UpdateDesignStatusRequest;
import com.inventory.ai.service.DesignAgentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai/design")
public class DesignAgentController {

    private final DesignAgentService designAgentService;

    public DesignAgentController(DesignAgentService designAgentService) {
        this.designAgentService = designAgentService;
    }

    @PostMapping("/message")
    public Mono<DesignTurnResponse> message(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody DesignTurnRequest request
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.nextTurn(userId, request);
    }

    @PostMapping("/preview")
    public Mono<PreviewResponse> preview(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody PreviewRequest request
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.generatePreview(userId, request.spec());
    }

    @PostMapping("/confirm")
    public Mono<CustomDesignResponse> confirm(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @Valid @RequestBody ConfirmDesignRequest request
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.confirmDesign(userId, request);
    }

    @GetMapping("/mine")
    public Flux<CustomDesignResponse> mine(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.myDesigns(userId);
    }

    @GetMapping("/notifications")
    public Flux<DesignNotificationResponse> notifications(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.notifications(userId);
    }

    @GetMapping("/notifications/unread-count")
    public Mono<Long> unreadNotificationCount(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.unreadNotificationCount(userId);
    }

    @PatchMapping("/notifications/{id}/read")
    public Mono<DesignNotificationResponse> markNotificationRead(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @PathVariable UUID id
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.markNotificationRead(id, userId);
    }

    @PatchMapping("/notifications/read-all")
    public Mono<Void> markAllNotificationsRead(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.markAllNotificationsRead(userId);
    }

    @GetMapping("/{id:[0-9a-fA-F\\-]{36}}")
    public Mono<CustomDesignResponse> detail(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @PathVariable UUID id
    ) {
        if (!"CLIENTE".equals(role) && !"ADMIN".equals(role) && !"ARTESANO".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.getDesign(id, userId, role);
    }

    @GetMapping("/review")
    public Flux<CustomDesignResponse> review(
            @RequestHeader("X-User-Role") String role
    ) {
        if (!"ADMIN".equals(role) && !"ARTESANO".equals(role)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.reviewQueue();
    }

    @PatchMapping("/{id}/status")
    public Mono<CustomDesignResponse> updateStatus(
            @RequestHeader("X-User-Role") String role,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDesignStatusRequest request
    ) {
        if (!"ADMIN".equals(role) && !"ARTESANO".equals(role)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return designAgentService.updateStatus(id, request.status(), request.reviewNotes());
    }
}
