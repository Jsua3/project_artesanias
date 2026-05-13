package com.inventory.ai.repository;

import com.inventory.ai.model.CustomDesignRequest;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface CustomDesignRequestRepository extends ReactiveCrudRepository<CustomDesignRequest, UUID> {
    Flux<CustomDesignRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
