package com.inventory.auth.service;

import com.inventory.auth.dto.ArtisanApprovalRequest;
import com.inventory.auth.dto.AuthResponse;
import com.inventory.auth.dto.SyncArtesanoRequest;
import com.inventory.auth.dto.LoginRequest;
import com.inventory.auth.dto.ProfileUpdateRequest;
import com.inventory.auth.dto.RefreshRequest;
import com.inventory.auth.dto.RegisterClienteRequest;
import com.inventory.auth.dto.RegisterRequest;
import com.inventory.auth.dto.UserProfileResponse;
import com.inventory.auth.model.ApprovalStatus;
import com.inventory.auth.model.CourierMode;
import com.inventory.auth.model.RefreshToken;
import com.inventory.auth.model.UserAccount;
import com.inventory.auth.model.UserRole;
import com.inventory.auth.repository.RefreshTokenRepository;
import com.inventory.auth.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.UUID;

@Service
public class AuthService {

    private final UserAccountRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final WebClient catalogWebClient;

    public AuthService(UserAccountRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       @Qualifier("catalogWebClient") WebClient catalogWebClient) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.catalogWebClient = catalogWebClient;
    }

    public Mono<UserAccount> register(RegisterRequest request) {
        final String username = request.username() == null ? "" : request.username().trim();
        if (username.isBlank()) {
            return Mono.error(new RuntimeException("El nombre de usuario es obligatorio"));
        }
        if (request.password() == null || request.password().isBlank()) {
            return Mono.error(new RuntimeException("La contrasena es obligatoria"));
        }

        UserRole role = resolveRole(request.role());
        ApprovalStatus approvalStatus = requiresAdminApproval(role) ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED;
        CourierMode courierMode = role == UserRole.DOMICILIARIO ? resolveCourierMode(request.courierMode()) : null;
        String courierCompany = normalizeCourierCompany(courierMode, request.courierCompany());
        LocalDateTime now = LocalDateTime.now();

        return userRepository.existsByUsername(username)
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new RuntimeException("El usuario ya existe"));
                    }

                    UserAccount user = new UserAccount();
                    user.setId(UUID.randomUUID());
                    user.setUsername(username);
                    user.setPasswordHash(passwordEncoder.encode(request.password()));
                    user.setRole(role);
                    user.setApprovalStatus(approvalStatus);
                    user.setCourierMode(courierMode);
                    user.setCourierCompany(courierCompany);
                    user.setDisplayName(defaultDisplayName(username, request.displayName()));
                    user.setCreatedAt(now);
                    user.setApprovedAt(approvalStatus == ApprovalStatus.APPROVED ? now : null);
                    return userRepository.save(user)
                            .map(saved -> {
                                saved.setNew(false);
                                return saved;
                            });
                });
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        final String username = request.username() == null ? "" : request.username().trim();
        final String password = request.password() == null ? "" : request.password();

        if (username.isBlank() || password.isBlank()) {
            return Mono.error(new RuntimeException("Invalid credentials"));
        }

        return userRepository.findByUsername(username)
                .map(user -> {
                    user.setNew(false);
                    return user;
                })
                .filter(user -> passwordMatches(password, user.getPasswordHash()))
                .flatMap(this::ensureLoginAllowed)
                .flatMap(user -> {
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
                                return new AuthResponse(accessToken, refreshTokenStr, user.getUsername(), effectiveRole.name(), user.getId());
                            });
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid credentials")));
    }

    private boolean passwordMatches(String rawPassword, String encodedPassword) {
        try {
            return encodedPassword != null && passwordEncoder.matches(rawPassword, encodedPassword);
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public Mono<AuthResponse> refresh(RefreshRequest request) {
        return refreshTokenRepository.findByToken(request.refreshToken())
                .filter(token -> token.getExpiryDate().isAfter(Instant.now()))
                .flatMap(token -> userRepository.findById(token.getUserId())
                        .map(user -> {
                            user.setNew(false);
                            UserRole effectiveRole = normalizeRole(user.getRole());
                            String accessToken = jwtService.generateToken(user.getId().toString(), effectiveRole.name());
                            return new AuthResponse(accessToken, token.getToken(), user.getUsername(), effectiveRole.name(), user.getId());
                        }))
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid or expired refresh token")));
    }

    public Mono<UserProfileResponse> me(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setNew(false);
                    return toUserProfileResponse(user);
                });
    }

    public Mono<UserAccount> registerCliente(RegisterClienteRequest request) {
        return userRepository.findByUsername(request.username())
                .flatMap(u -> Mono.<UserAccount>error(new RuntimeException("El usuario ya existe")))
                .switchIfEmpty(Mono.defer(() -> {
                    UserAccount user = new UserAccount();
                    user.setId(UUID.randomUUID());
                    user.setUsername(request.username());
                    user.setPasswordHash(passwordEncoder.encode(request.password()));
                    user.setRole(UserRole.CLIENTE);
                    user.setDisplayName(request.displayName());
                    user.setApprovalStatus(ApprovalStatus.APPROVED);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setNew(true);
                    return userRepository.save(user);
                }));
    }

    public Flux<UserProfileResponse> findAllUsers() {
        return userRepository.findAll()
                .map(user -> {
                    user.setNew(false);
                    return toUserProfileResponse(user);
                });
    }

    public Flux<UserProfileResponse> findPendingApprovalRequests() {
        return userRepository.findAllByApprovalStatus(ApprovalStatus.PENDING)
                .filter(user -> {
                    UserRole role = normalizeRole(user.getRole());
                    return role == UserRole.ARTESANO || role == UserRole.DOMICILIARIO;
                })
                .sort(Comparator.comparing(UserAccount::getCreatedAt))
                .map(user -> {
                    user.setNew(false);
                    return toUserProfileResponse(user);
                });
    }

    public Mono<UserProfileResponse> reviewApprovalRequest(UUID userId, UUID adminUserId, ArtisanApprovalRequest request) {
        ApprovalStatus nextStatus = resolveDecision(request.decision());
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("No se encontro la solicitud indicada")))
                .flatMap(user -> {
                    user.setNew(false);
                    UserRole normalizedRole = normalizeRole(user.getRole());
                    if (normalizedRole != UserRole.ARTESANO && normalizedRole != UserRole.DOMICILIARIO) {
                        return Mono.error(new RuntimeException("La solicitud indicada no requiere aprobacion administrativa"));
                    }

                    user.setRole(normalizedRole);
                    user.setApprovalStatus(nextStatus);
                    user.setApprovedAt(LocalDateTime.now());
                    user.setApprovedBy(adminUserId);
                    return userRepository.save(user);
                })
                .flatMap(savedUser -> {
                    // Al aprobar un ARTESANO, crea automaticamente su entrada en catalog-service
                    UserRole normalizedRole = normalizeRole(savedUser.getRole());
                    if (nextStatus == ApprovalStatus.APPROVED && normalizedRole == UserRole.ARTESANO) {
                        return syncArtesanoInCatalog(savedUser).thenReturn(savedUser);
                    }
                    return Mono.just(savedUser);
                })
                .map(this::toUserProfileResponse);
    }

    private Mono<Void> syncArtesanoInCatalog(UserAccount user) {
        SyncArtesanoRequest req = new SyncArtesanoRequest(
                user.getId(),
                hasText(user.getDisplayName()) ? user.getDisplayName() : user.getUsername(),
                user.getUsername(),
                user.getCraftType(),
                user.getLocality(),
                user.getAvatarUrl()
        );
        return catalogWebClient.post()
                .uri("/internal/artesanos/sync-user")
                .bodyValue(req)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    System.err.println("[AuthService] No se pudo sincronizar artesano en catalog-service: " + e.getMessage());
                    return Mono.empty();
                });
    }

    public Mono<UserProfileResponse> updateProfile(UUID userId, ProfileUpdateRequest request) {
        return userRepository.findById(userId)
                .flatMap(user -> {
                    user.setNew(false);
                    if (request.displayName() != null) {
                        user.setDisplayName(normalizeOptional(request.displayName()));
                    }
                    if (request.avatarUrl() != null) {
                        user.setAvatarUrl(normalizeOptional(request.avatarUrl()));
                    }
                    if (request.firstName() != null) {
                        user.setFirstName(normalizeOptional(request.firstName()));
                    }
                    if (request.lastName() != null) {
                        user.setLastName(normalizeOptional(request.lastName()));
                    }
                    if (request.phone() != null) {
                        user.setPhone(normalizeOptional(request.phone()));
                    }
                    if (request.bio() != null) {
                        user.setBio(normalizeOptional(request.bio()));
                    }
                    if (request.locality() != null) {
                        user.setLocality(normalizeOptional(request.locality()));
                    }
                    if (request.craftType() != null) {
                        user.setCraftType(normalizeOptional(request.craftType()));
                    }
                    if (request.address() != null) {
                        user.setAddress(normalizeOptional(request.address()));
                    }
                    return userRepository.save(user);
                })
                .map(this::toUserProfileResponse);
    }

    private UserRole resolveRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return UserRole.CLIENTE;
        }

        try {
            UserRole requestedRole = UserRole.valueOf(rawRole.trim().toUpperCase());

            if (requestedRole == UserRole.ADMIN) {
                throw new RuntimeException("Las cuentas de administrador no se crean desde el registro publico");
            }

            // OPERATOR y MAESTRO son alias históricos de ARTESANO
            if (requestedRole == UserRole.OPERATOR || requestedRole == UserRole.MAESTRO) {
                return UserRole.ARTESANO;
            }

            return requestedRole;
        } catch (IllegalArgumentException ex) {
            return UserRole.CLIENTE;
        }
    }

    private ApprovalStatus resolveDecision(String decision) {
        if (decision == null || decision.isBlank()) {
            throw new RuntimeException("La decision de aprobacion es obligatoria");
        }

        try {
            return ApprovalStatus.valueOf(decision.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("La decision debe ser APPROVED o REJECTED");
        }
    }

    private CourierMode resolveCourierMode(String rawCourierMode) {
        if (rawCourierMode == null || rawCourierMode.isBlank()) {
            return CourierMode.INDEPENDIENTE;
        }

        try {
            return CourierMode.valueOf(rawCourierMode.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("La modalidad del domiciliario debe ser INDEPENDIENTE o EMPRESA");
        }
    }

    private String normalizeCourierCompany(CourierMode courierMode, String rawCompany) {
        if (courierMode != CourierMode.EMPRESA) {
            return null;
        }

        String company = rawCompany == null ? "" : rawCompany.trim();
        if (company.isBlank()) {
            throw new RuntimeException("Debes indicar la empresa del domiciliario");
        }
        return company;
    }

    private Mono<UserAccount> ensureLoginAllowed(UserAccount user) {
        UserRole effectiveRole = normalizeRole(user.getRole());
        if (user.getApprovalStatus() == ApprovalStatus.PENDING && requiresAdminApproval(effectiveRole)) {
            String profileLabel = effectiveRole == UserRole.DOMICILIARIO ? "domiciliario" : "artesano";
            return Mono.error(new RuntimeException("Tu solicitud de " + profileLabel + " esta pendiente de aprobacion por un administrador"));
        }
        if (user.getApprovalStatus() == ApprovalStatus.REJECTED && requiresAdminApproval(effectiveRole)) {
            String profileLabel = effectiveRole == UserRole.DOMICILIARIO ? "domiciliario" : "artesano";
            return Mono.error(new RuntimeException("Tu solicitud de " + profileLabel + " fue rechazada por un administrador"));
        }
        return Mono.just(user);
    }

    private boolean requiresAdminApproval(UserRole role) {
        return role == UserRole.ARTESANO || role == UserRole.MAESTRO || role == UserRole.DOMICILIARIO;
    }

    public UserProfileResponse toUserProfileResponse(UserAccount user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                normalizeRole(user.getRole()).name(),
                user.getApprovalStatus() != null ? user.getApprovalStatus().name() : ApprovalStatus.APPROVED.name(),
                user.getCourierMode() != null ? user.getCourierMode().name() : null,
                user.getCourierCompany(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getBio(),
                user.getLocality(),
                user.getCraftType(),
                user.getAddress(),
                profileCompletion(user),
                profileComplete(user),
                user.getCreatedAt(),
                user.getApprovedAt()
        );
    }

    private UserRole normalizeRole(UserRole role) {
        // OPERATOR y MAESTRO son alias históricos — el rol canónico es ARTESANO
        if (role == UserRole.OPERATOR || role == UserRole.MAESTRO) {
            return UserRole.ARTESANO;
        }
        return role;
    }

    private String defaultDisplayName(String username, String displayName) {
        String normalized = normalizeOptional(displayName);
        return normalized != null ? normalized : username;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private int profileCompletion(UserAccount user) {
        UserRole role = normalizeRole(user.getRole());
        int total = 4;
        int done = 0;

        if (hasText(user.getDisplayName())) done++;
        if (hasText(user.getAvatarUrl())) done++;
        if (hasText(user.getFirstName()) || hasText(user.getLastName())) done++;
        if (hasText(user.getPhone())) done++;

        if (role == UserRole.ARTESANO) {
            total += 3;
            if (hasText(user.getLocality())) done++;
            if (hasText(user.getCraftType())) done++;
            if (hasText(user.getBio())) done++;
        } else if (role == UserRole.DOMICILIARIO) {
            total += 2;
            if (hasText(user.getAddress()) || hasText(user.getLocality())) done++;
            if (user.getCourierMode() != null) done++;
        } else if (role == UserRole.CLIENTE) {
            total += 1;
            if (hasText(user.getAddress()) || hasText(user.getLocality())) done++;
        }

        return Math.round(done * 100f / total);
    }

    private boolean profileComplete(UserAccount user) {
        UserRole role = normalizeRole(user.getRole());
        boolean baseComplete = hasText(user.getDisplayName())
                && (hasText(user.getFirstName()) || hasText(user.getLastName()))
                && hasText(user.getPhone());

        if (role == UserRole.ARTESANO) {
            return baseComplete && hasText(user.getLocality()) && hasText(user.getCraftType()) && hasText(user.getBio());
        }
        if (role == UserRole.DOMICILIARIO) {
            return baseComplete && (hasText(user.getAddress()) || hasText(user.getLocality())) && user.getCourierMode() != null;
        }
        if (role == UserRole.CLIENTE) {
            return baseComplete && (hasText(user.getAddress()) || hasText(user.getLocality()));
        }
        return baseComplete;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
