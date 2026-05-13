package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ArtesanoResponse;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.service.ArtesanoService;
import com.inventory.catalog.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ArtesanoControllerRoleGuardTest {

    @Test
    void adminListRejectsNonAdminWithForbidden() {
        ArtesanoController controller = new ArtesanoController(mock(ArtesanoService.class));

        StepVerifier.create(controller.getAllArtesanosForManagement("CLIENTE"))
                .expectErrorMatches(error -> error instanceof ResponseStatusException ex
                        && ex.getStatusCode().equals(HttpStatus.FORBIDDEN))
                .verify();
    }

    @Test
    void adminListAllowsAdmin() {
        ArtesanoService service = mock(ArtesanoService.class);
        ArtesanoResponse artesano = new ArtesanoResponse(
                UUID.randomUUID(),
                "Doña Elvira",
                "3000000000",
                "elvira@example.com",
                "Cestería",
                "Filandia",
                "/images/elvira.jpg",
                true,
                UUID.randomUUID(),
                LocalDateTime.now()
        );
        when(service.getAllArtesanos()).thenReturn(Flux.just(artesano));

        ArtesanoController controller = new ArtesanoController(service);

        StepVerifier.create(controller.getAllArtesanosForManagement("ADMIN"))
                .expectNext(artesano)
                .verifyComplete();
    }

    @Test
    void productManagementListRejectsClienteWithForbidden() {
        ProductController controller = new ProductController(mock(ProductService.class));

        StepVerifier.create(controller.getAllProductsForManagement("CLIENTE", UUID.randomUUID().toString()))
                .expectErrorMatches(error -> error instanceof ResponseStatusException ex
                        && ex.getStatusCode().equals(HttpStatus.FORBIDDEN))
                .verify();
    }

    @Test
    void productManagementListAllowsArtesano() {
        ProductService service = mock(ProductService.class);
        UUID userId = UUID.randomUUID();
        ProductResponse product = new ProductResponse(
                UUID.randomUUID(),
                "Canasto",
                "Tejido a mano",
                "SKU-1",
                new BigDecimal("45000"),
                "/images/canasto.jpg",
                5,
                UUID.randomUUID(),
                List.of(UUID.randomUUID()),
                UUID.randomUUID(),
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        when(service.getAllProductsForArtesano(userId)).thenReturn(Flux.just(product));

        ProductController controller = new ProductController(service);

        StepVerifier.create(controller.getAllProductsForManagement("ARTESANO", userId.toString()))
                .expectNext(product)
                .verifyComplete();
    }
}
