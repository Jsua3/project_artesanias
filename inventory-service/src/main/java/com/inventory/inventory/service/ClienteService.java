package com.inventory.inventory.service;

import com.inventory.inventory.dto.ClienteRequest;
import com.inventory.inventory.dto.ClienteResponse;
import com.inventory.inventory.model.Cliente;
import com.inventory.inventory.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public Mono<ClienteResponse> createCliente(ClienteRequest request) {
        UUID id = UUID.randomUUID();
        Cliente cliente = new Cliente(id, request.nombre(), request.telefono(),
                                      request.email(), request.direccion(), LocalDateTime.now());
        return clienteRepository.save(cliente.withIsNew(true))
                .map(this::toResponse);
    }

    public Mono<ClienteResponse> getCliente(UUID id) {
        return clienteRepository.findById(id)
                .map(this::toResponse);
    }

    public Flux<ClienteResponse> getAllClientes() {
        return clienteRepository.findAll()
                .map(this::toResponse);
    }

    @Transactional
    public Mono<ClienteResponse> updateCliente(UUID id, ClienteRequest request) {
        return clienteRepository.findById(id)
                .flatMap(existing -> {
                    Cliente updated = new Cliente(id, request.nombre(), request.telefono(),
                                                  request.email(), request.direccion(), existing.createdAt());
                    return clienteRepository.save(updated);
                })
                .map(this::toResponse);
    }

    @Transactional
    public Mono<Void> deleteCliente(UUID id) {
        return clienteRepository.deleteById(id);
    }

    private ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(cliente.id(), cliente.nombre(), cliente.telefono(),
                                   cliente.email(), cliente.direccion(), cliente.createdAt());
    }
}
