package com.inventory.inventory.controller;

import com.inventory.inventory.dto.DeliveryTrackingUpdateRequest;
import com.inventory.inventory.dto.VentaRequest;
import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.service.VentaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping
    public Flux<VentaResponse> getAllVentas(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!hasAnyRole(userRole, "ADMIN", "ARTESANO")) {
            return Flux.empty();
        }
        return ventaService.getAllVentas();
    }

    @GetMapping("/entregas")
    public Flux<VentaResponse> getDeliveries(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (!hasAnyRole(userRole, "ADMIN", "DOMICILIARIO")) {
            return Flux.empty();
        }
        if (userId.isEmpty()) {
            return Flux.empty();
        }
        return ventaService.getDeliveriesForUser(normalizeRole(userRole), UUID.fromString(userId));
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<VentaResponse>> getVenta(@PathVariable UUID id) {
        return ventaService.getVenta(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/cliente/{clienteId}")
    public Flux<VentaResponse> getVentasByCliente(@PathVariable UUID clienteId) {
        return ventaService.getVentasByCliente(clienteId);
    }

    @PostMapping
    public Mono<ResponseEntity<VentaResponse>> createVenta(
            @RequestBody VentaRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        if (!hasAnyRole(userRole, "ADMIN", "ARTESANO")) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return ventaService.createVenta(request, UUID.fromString(userId))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}/anular")
    public Mono<ResponseEntity<VentaResponse>> anularVenta(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (!hasAnyRole(userRole, "ADMIN")) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return ventaService.anularVenta(id, UUID.fromString(userId))
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/seguimiento")
    public Mono<ResponseEntity<VentaResponse>> updateDeliveryTracking(
            @PathVariable UUID id,
            @RequestBody DeliveryTrackingUpdateRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (!hasAnyRole(userRole, "ADMIN", "DOMICILIARIO")) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return ventaService.updateDeliveryTracking(id, UUID.fromString(userId), normalizeRole(userRole), request)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private boolean hasAnyRole(String userRole, String... allowedRoles) {
        String normalizedRole = normalizeRole(userRole);
        for (String allowedRole : allowedRoles) {
            if (allowedRole.equals(normalizedRole)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeRole(String userRole) {
        return userRole == null ? "" : userRole.trim().toUpperCase();
    }
}
