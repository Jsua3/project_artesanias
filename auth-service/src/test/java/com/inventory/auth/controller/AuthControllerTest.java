package com.inventory.auth.controller;

import com.inventory.auth.dto.RegisterRequest;
import com.inventory.auth.model.UserAccount;
import com.inventory.auth.model.UserRole;
import com.inventory.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebFluxTest(AuthController.class)
@org.springframework.context.annotation.Import({
        com.inventory.auth.config.WebSecurityConfig.class,
        com.inventory.auth.exception.GlobalExceptionHandler.class
})
class AuthControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private AuthService authService;

    @MockBean
    private com.inventory.auth.repository.UserAccountRepository userRepository;

    @MockBean
    private com.inventory.auth.repository.RefreshTokenRepository refreshTokenRepository;

    @MockBean
    private com.inventory.auth.service.JwtService jwtService;

    @MockBean
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    @org.springframework.security.test.context.support.WithMockUser
    void registerWithUnknownPropertyShouldWorkByDefault() {
        UserAccount user = new UserAccount();
        user.setUsername("admin");
        user.setRole(UserRole.OPERATOR);

        when(authService.register(any(RegisterRequest.class))).thenReturn(Mono.just(user));

        String json = """
                {
                    "username": "admin",
                    "password": "admin123",
                    "role": "ADMIN"
                }
                """;

        webTestClient.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(json)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    @org.springframework.security.test.context.support.WithMockUser
    void registerWithDuplicateUsernameShouldReturnConflict() {
        // R2DBC throws something like DataIntegrityViolationException or similar.
        // Let's mock a DataIntegrityViolationException.
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(Mono.error(new org.springframework.dao.DataIntegrityViolationException("Duplicate username")));

        String json = """
                {
                    "username": "admin",
                    "password": "admin123"
                }
                """;

        webTestClient.post()
                .uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(json)
                .exchange()
                .expectStatus().isEqualTo(org.springframework.http.HttpStatus.CONFLICT)
                .expectBody()
                .jsonPath("$.error").isEqualTo("Conflict");
    }
}
