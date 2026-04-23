package com.inventory.auth.controller;

import com.inventory.auth.dto.*;
import com.inventory.auth.service.AuthService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Mono<UserProfileResponse> register(@RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(user -> new UserProfileResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole().name(),
                        user.getApprovalStatus().name(),
                        user.getCourierMode() != null ? user.getCourierMode().name() : null,
                        user.getCourierCompany(),
                        user.getDisplayName(),
                        user.getAvatarUrl(),
                        user.getCreatedAt(),
                        user.getApprovedAt()
                ));
    }

    @PostMapping("/login")
    public Mono<AuthResponse> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public Mono<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @GetMapping("/me")
    public Mono<UserProfileResponse> me(@AuthenticationPrincipal UUID userId) {
        return authService.me(userId);
    }

    @PutMapping("/profile")
    public Mono<UserProfileResponse> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(UUID.fromString(userId), request);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Flux<UserProfileResponse> findAllUsers() {
        return authService.findAllUsers();
    }

    @GetMapping("/approval-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public Flux<UserProfileResponse> findPendingApprovalRequests() {
        return authService.findPendingApprovalRequests();
    }

    @GetMapping("/artisan-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public Flux<UserProfileResponse> findPendingArtisanRequests() {
        return authService.findPendingApprovalRequests();
    }

    @PatchMapping("/approval-requests/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<UserProfileResponse> reviewApprovalRequest(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID adminUserId,
            @RequestBody ArtisanApprovalRequest request) {
        return authService.reviewApprovalRequest(userId, adminUserId, request);
    }

    @PatchMapping("/artisan-requests/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<UserProfileResponse> reviewArtisanRequest(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID adminUserId,
            @RequestBody ArtisanApprovalRequest request) {
        return authService.reviewApprovalRequest(userId, adminUserId, request);
    }
}
