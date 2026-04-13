package com.inventory.inventory.controller;

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
        if (!"ADMIN".equals(userRole)) {
            return Flux.empty();
        }
        return ventaService.getAllVentas();
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
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return ventaService.createVenta(request, UUID.fromString(userId))
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}/anular")
    public Mono<ResponseEntity<VentaResponse>> anularVenta(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return ventaService.anularVenta(id, UUID.fromString(userId))
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
