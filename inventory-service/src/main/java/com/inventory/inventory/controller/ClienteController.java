package com.inventory.inventory.controller;

import com.inventory.inventory.dto.ClienteRequest;
import com.inventory.inventory.dto.ClienteResponse;
import com.inventory.inventory.service.ClienteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public Flux<ClienteResponse> getAllClientes(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Flux.empty();
        }
        return clienteService.getAllClientes();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ClienteResponse>> getCliente(@PathVariable UUID id) {
        return clienteService.getCliente(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<ClienteResponse>> createCliente(
            @RequestBody ClienteRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return clienteService.createCliente(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ClienteResponse>> updateCliente(
            @PathVariable UUID id,
            @RequestBody ClienteRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return clienteService.updateCliente(id, request)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
