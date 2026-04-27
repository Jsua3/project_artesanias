package com.inventory.auth.controller;

import com.inventory.auth.dto.PublicUserCardResponse;
import com.inventory.auth.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private final UserAccountRepository userRepository;

    public InternalUserController(UserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/public-card")
    public Mono<ResponseEntity<PublicUserCardResponse>> publicCard(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setNew(false);
                    String displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
                    return ResponseEntity.ok(new PublicUserCardResponse(
                            user.getId(), displayName, user.getAvatarUrl(), user.getPhone()));
                })
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
