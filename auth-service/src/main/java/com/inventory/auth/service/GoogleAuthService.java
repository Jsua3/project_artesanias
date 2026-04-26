package com.inventory.auth.service;

import com.inventory.auth.dto.AuthResponse;
import com.inventory.auth.dto.GoogleUserInfo;
import com.inventory.auth.model.ApprovalStatus;
import com.inventory.auth.model.RefreshToken;
import com.inventory.auth.model.UserAccount;
import com.inventory.auth.model.UserRole;
import com.inventory.auth.repository.RefreshTokenRepository;
import com.inventory.auth.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class GoogleAuthService {

    private final WebClient googleWebClient;
    private final UserAccountRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client-id:}")
    private String googleClientId;

    public GoogleAuthService(
            @Qualifier("googleWebClient") WebClient googleWebClient,
            UserAccountRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder) {
        this.googleWebClient = googleWebClient;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean isConfigured() {
        return googleClientId != null && !googleClientId.isBlank();
    }

    public String getClientId() {
        return isConfigured() ? googleClientId : "";
    }

    /**
     * Valida el ID token de Google, resuelve o crea el usuario y emite
     * un JWT propio del sistema.
     */
    public Mono<AuthResponse> authenticate(String credential) {
        if (!isConfigured()) {
            return Mono.error(new RuntimeException("Google login no esta configurado en el servidor"));
        }
        if (credential == null || credential.isBlank()) {
            return Mono.error(new RuntimeException("Token de Google requerido"));
        }

        return googleWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tokeninfo")
                        .queryParam("id_token", credential)
                        .build())
                .retrieve()
                .onStatus(HttpStatus.BAD_REQUEST::equals,
                        resp -> Mono.error(new RuntimeException("Token de Google invalido o expirado")))
                .onStatus(status -> status.isError(),
                        resp -> Mono.error(new RuntimeException("Error verificando token con Google")))
                .bodyToMono(GoogleUserInfo.class)
                .flatMap(info -> {
                    if (!googleClientId.equals(info.aud())) {
                        return Mono.error(new RuntimeException("El token no corresponde a esta aplicacion"));
                    }
                    if (!"true".equals(info.emailVerified())) {
                        return Mono.error(new RuntimeException("El email de Google no esta verificado"));
                    }
                    if (info.email() == null || info.email().isBlank()) {
                        return Mono.error(new RuntimeException("No se pudo obtener el email de Google"));
                    }
                    return findOrCreateUser(info);
                })
                .flatMap(this::generateTokens);
    }

    private Mono<UserAccount> findOrCreateUser(GoogleUserInfo info) {
        return userRepository.findByUsername(info.email())
                .map(user -> {
                    user.setNew(false);
                    return user;
                })
                .switchIfEmpty(Mono.defer(() -> {
                    UserAccount user = new UserAccount();
                    user.setId(UUID.randomUUID());
                    user.setUsername(info.email());
                    // Contraseña aleatoria — el usuario Google nunca la usará
                    user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                    user.setRole(UserRole.CLIENTE);
                    user.setApprovalStatus(ApprovalStatus.APPROVED);
                    user.setDisplayName(info.name());
                    user.setAvatarUrl(info.picture());
                    user.setCreatedAt(LocalDateTime.now());
                    user.setApprovedAt(LocalDateTime.now());
                    user.setNew(true);
                    return userRepository.save(user);
                }));
    }

    private Mono<AuthResponse> generateTokens(UserAccount user) {
        UserRole effectiveRole = normalizeRole(user.getRole());
        String accessToken = jwtService.generateToken(user.getId().toString(), effectiveRole.name());
        String refreshTokenStr = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UUID.randomUUID());
        refreshToken.setUserId(user.getId());
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setExpiryDate(Instant.now().plusSeconds(86400));

        return refreshTokenRepository.deleteByUserId(user.getId())
                .then(refreshTokenRepository.save(refreshToken))
                .map(token -> {
                    token.setNew(false);
                    return new AuthResponse(
                            accessToken, refreshTokenStr,
                            user.getUsername(), effectiveRole.name(),
                            user.getId());
                });
    }

    private UserRole normalizeRole(UserRole role) {
        if (role == UserRole.OPERATOR || role == UserRole.MAESTRO) return UserRole.ARTESANO;
        return role;
    }
}
