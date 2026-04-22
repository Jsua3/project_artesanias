package com.inventory.catalog.repository;

import com.inventory.catalog.model.Artesano;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ArtesanoRepository extends ReactiveCrudRepository<Artesano, UUID> {
    /** Fase 2c: lookup para el endpoint de maestro. */
    Mono<Artesano> findByUserAccountId(UUID userAccountId);
}
