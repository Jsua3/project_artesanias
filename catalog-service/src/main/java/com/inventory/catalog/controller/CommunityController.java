package com.inventory.catalog.controller;

import com.inventory.catalog.dto.CommunityEventRequest;
import com.inventory.catalog.dto.CommunityEventResponse;
import com.inventory.catalog.dto.CommunityEventReviewRequest;
import com.inventory.catalog.dto.CommunityPostRequest;
import com.inventory.catalog.dto.CommunityPostResponse;
import com.inventory.catalog.dto.CommunityPostStatusRequest;
import com.inventory.catalog.service.CommunityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/comunidad")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping("/posts")
    public Flux<CommunityPostResponse> getPosts(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return communityService.getActivePosts(parseUserId(userId));
    }

    @GetMapping("/posts/moderacion")
    public Flux<CommunityPostResponse> getPostsForModeration(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!isAdmin(userRole)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo ADMIN puede moderar publicaciones."));
        }
        return communityService.getPostsForModeration(parseRequiredUserId(userId));
    }

    @PostMapping("/posts")
    public Mono<ResponseEntity<CommunityPostResponse>> createPost(
            @RequestBody CommunityPostRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canPublishCommunity(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return communityService.createPost(parseRequiredUserId(userId), request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PostMapping("/posts/{id}/report")
    public Mono<ResponseEntity<CommunityPostResponse>> reportPost(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return communityService.reportPost(id, parseRequiredUserId(userId))
                .map(ResponseEntity::ok);
    }

    @PostMapping("/posts/{id}/like")
    public Mono<ResponseEntity<CommunityPostResponse>> toggleLike(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return communityService.toggleLike(id, parseRequiredUserId(userId))
                .map(ResponseEntity::ok);
    }

    @PatchMapping("/posts/{id}/estado")
    public Mono<ResponseEntity<CommunityPostResponse>> updatePostStatus(
            @PathVariable UUID id,
            @RequestBody CommunityPostStatusRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!isAdmin(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return communityService.updatePostStatus(id, request.estado(), parseRequiredUserId(userId))
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/posts/{id}")
    public Mono<ResponseEntity<Void>> deletePost(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        UUID currentUserId = parseRequiredUserId(userId);
        return communityService.deletePost(id, currentUserId, isAdmin(userRole))
                .then(Mono.just(ResponseEntity.noContent().build()));
    }

    @GetMapping("/eventos")
    public Flux<CommunityEventResponse> getEvents(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!isAdmin(userRole)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo ADMIN puede ver todos los eventos."));
        }
        return communityService.getAllEvents();
    }

    @GetMapping("/eventos/mis")
    public Flux<CommunityEventResponse> getMyEvents(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return communityService.getMyEvents(parseRequiredUserId(userId));
    }

    @GetMapping("/eventos/pending")
    public Flux<CommunityEventResponse> getPendingEvents(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!isAdmin(userRole)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo ADMIN puede revisar eventos."));
        }
        return communityService.getPendingEvents();
    }

    @PostMapping("/eventos")
    public Mono<ResponseEntity<CommunityEventResponse>> createEvent(
            @RequestBody CommunityEventRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canPublishCommunity(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return communityService.createEvent(parseRequiredUserId(userId), request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PatchMapping("/eventos/{id}/review")
    public Mono<ResponseEntity<CommunityEventResponse>> reviewEvent(
            @PathVariable UUID id,
            @RequestBody CommunityEventReviewRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!isAdmin(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return communityService.reviewEvent(id, parseRequiredUserId(userId), request.decision(), request.comentario())
                .map(ResponseEntity::ok);
    }

    private UUID parseUserId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return UUID.fromString(value);
    }

    private UUID parseRequiredUserId(String value) {
        UUID userId = parseUserId(value);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado.");
        }
        return userId;
    }

    private boolean isAdmin(String role) {
        return "ADMIN".equals(role);
    }

    private boolean canPublishCommunity(String role) {
        return "ADMIN".equals(role) || "ARTESANO".equals(role) || "MAESTRO".equals(role);
    }
}
