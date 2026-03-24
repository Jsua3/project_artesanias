package com.inventory.auth.service;

import com.inventory.auth.dto.*;
import com.inventory.auth.model.RefreshToken;
import com.inventory.auth.model.UserAccount;
import com.inventory.auth.model.UserRole;
import com.inventory.auth.repository.RefreshTokenRepository;
import com.inventory.auth.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserAccountRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public Mono<UserAccount> register(RegisterRequest request) {
        UserAccount user = new UserAccount();
        user.setId(UUID.randomUUID());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        
        UserRole role = UserRole.OPERATOR;
        if (request.role() != null) {
            try {
                role = UserRole.valueOf(request.role().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid roles, default to OPERATOR
            }
        }
        user.setRole(role);
        
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user)
                .map(u -> {
                    u.setNew(false);
                    return u;
                });
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        return userRepository.findByUsername(request.username())
                .map(user -> {
                    user.setNew(false);
                    return user;
                })
                .filter(user -> passwordEncoder.matches(request.password(), user.getPasswordHash()))
                .flatMap(user -> {
                    String accessToken = jwtService.generateToken(user.getId().toString(), user.getRole().name());
                    String refreshTokenStr = UUID.randomUUID().toString();
                    
                    RefreshToken refreshToken = new RefreshToken();
                    refreshToken.setId(UUID.randomUUID());
                    refreshToken.setUserId(user.getId());
                    refreshToken.setToken(refreshTokenStr);
                    refreshToken.setExpiryDate(Instant.now().plusSeconds(86400)); // 24h

                    return refreshTokenRepository.deleteByUserId(user.getId())
                            .then(refreshTokenRepository.save(refreshToken))
                            .map(token -> {
                                token.setNew(false);
                                return new AuthResponse(accessToken, refreshTokenStr, user.getUsername(), user.getRole().name());
                            });
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid credentials")));
    }

    public Mono<AuthResponse> refresh(RefreshRequest request) {
        return refreshTokenRepository.findByToken(request.refreshToken())
                .filter(token -> token.getExpiryDate().isAfter(Instant.now()))
                .flatMap(token -> userRepository.findById(token.getUserId())
                        .map(user -> {
                            user.setNew(false);
                            String accessToken = jwtService.generateToken(user.getId().toString(), user.getRole().name());
                            return new AuthResponse(accessToken, token.getToken(), user.getUsername(), user.getRole().name());
                        }))
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid or expired refresh token")));
    }

    public Mono<UserProfileResponse> me(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setNew(false);
                    return new UserProfileResponse(user.getId(), user.getUsername(), user.getRole().name());
                });
    }

    public Flux<UserProfileResponse> findAllUsers() {
        return userRepository.findAll()
                .map(user -> {
                    user.setNew(false);
                    return new UserProfileResponse(user.getId(), user.getUsername(), user.getRole().name());
                });
    }
}
