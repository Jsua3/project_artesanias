package com.inventory.auth.controller;

import com.inventory.auth.dto.PagedResponse;
import com.inventory.auth.dto.UserProfileResponse;
import com.inventory.auth.repository.UserAccountRepository;
import com.inventory.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/db")
public class AdminDbController {

    private final UserAccountRepository userRepository;
    private final AuthService authService;

    public AdminDbController(UserAccountRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping("/users")
    public Mono<PagedResponse<UserProfileResponse>> listUsers(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        int safeSize = Math.min(size, 100);
        return userRepository.findAll()
                .filter(u -> search.isBlank()
                        || u.getUsername().toLowerCase().contains(search.toLowerCase())
                        || (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(search.toLowerCase())))
                .collectList()
                .map(all -> {
                    long total = all.size();
                    int totalPages = (int) Math.ceil((double) total / safeSize);
                    var content = all.stream()
                            .skip((long) page * safeSize)
                            .limit(safeSize)
                            .peek(u -> u.setNew(false))
                            .map(authService::toUserProfileResponse)
                            .toList();
                    return new PagedResponse<>(content, page, safeSize, total, totalPages);
                });
    }
}
