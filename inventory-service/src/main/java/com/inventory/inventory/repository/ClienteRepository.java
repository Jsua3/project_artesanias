package com.inventory.inventory.repository;

import com.inventory.inventory.model.Cliente;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ClienteRepository extends ReactiveCrudRepository<Cliente, UUID> {
    Mono<Cliente> findByUserAccountId(UUID userAccountId);
}
