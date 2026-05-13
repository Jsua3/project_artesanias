package com.inventory.inventory.controller;

import com.inventory.inventory.dto.ClienteResponse;
import com.inventory.inventory.dto.PaymentConfigStatusResponse;
import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.service.StripeService;
import com.inventory.inventory.service.ClienteService;
import com.inventory.inventory.service.VentaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RoleGuardControllerTest {

    @Test
    void clientesListRejectsNonAdminWithForbidden() {
        ClienteController controller = new ClienteController(mock(ClienteService.class));

        StepVerifier.create(controller.getAllClientes("CLIENTE"))
                .expectErrorMatches(error -> isStatus(error, HttpStatus.FORBIDDEN))
                .verify();
    }

    @Test
    void clientesListAllowsAdmin() {
        ClienteService service = mock(ClienteService.class);
        ClienteResponse cliente = new ClienteResponse(
                UUID.randomUUID(),
                "Cliente",
                "3000000000",
                "cliente@example.com",
                "Armenia",
                LocalDateTime.now()
        );
        when(service.getAllClientes()).thenReturn(Flux.just(cliente));

        ClienteController controller = new ClienteController(service);

        StepVerifier.create(controller.getAllClientes("ADMIN"))
                .expectNext(cliente)
                .verifyComplete();
    }

    @Test
    void ventasListRejectsClienteWithForbidden() {
        VentaController controller = new VentaController(mock(VentaService.class), mock(StripeService.class));

        StepVerifier.create(controller.getAllVentas("CLIENTE"))
                .expectErrorMatches(error -> isStatus(error, HttpStatus.FORBIDDEN))
                .verify();
    }

    @Test
    void deliveriesRejectMissingUserWithUnauthorized() {
        VentaController controller = new VentaController(mock(VentaService.class), mock(StripeService.class));

        StepVerifier.create(controller.getDeliveries("DOMICILIARIO", ""))
                .expectErrorMatches(error -> isStatus(error, HttpStatus.UNAUTHORIZED))
                .verify();
    }

    @Test
    void clienteVentasMiasRejectsMissingUserWithUnauthorized() {
        ClienteVentaController controller = new ClienteVentaController(
                mock(VentaService.class),
                mock(StripeService.class)
        );

        StepVerifier.create(controller.mias(""))
                .expectErrorMatches(error -> isStatus(error, HttpStatus.UNAUTHORIZED))
                .verify();
    }

    @Test
    void ventasListAllowsArtesano() {
        VentaService service = mock(VentaService.class);
        VentaResponse venta = new VentaResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new BigDecimal("120000"),
                "COMPLETADA",
                LocalDateTime.now(),
                null,
                List.of()
        );
        when(service.getAllVentas()).thenReturn(Flux.just(venta));

        VentaController controller = new VentaController(service, mock(StripeService.class));

        StepVerifier.create(controller.getAllVentas("ARTESANO"))
                .expectNext(venta)
                .verifyComplete();
    }

    @Test
    void paymentStatusAllowsAdminOnly() {
        StripeService stripeService = mock(StripeService.class);
        PaymentConfigStatusResponse response = new PaymentConfigStatusResponse(
                true,
                true,
                "READY",
                "Stripe listo",
                "cop",
                true,
                true
        );
        when(stripeService.configStatus()).thenReturn(response);
        VentaController controller = new VentaController(mock(VentaService.class), stripeService);

        StepVerifier.create(controller.paymentStatus("CLIENTE"))
                .expectErrorMatches(error -> isStatus(error, HttpStatus.FORBIDDEN))
                .verify();

        StepVerifier.create(controller.paymentStatus("ADMIN"))
                .expectNext(response)
                .verifyComplete();
    }

    private boolean isStatus(Throwable error, HttpStatus status) {
        return error instanceof ResponseStatusException ex && ex.getStatusCode().equals(status);
    }
}
