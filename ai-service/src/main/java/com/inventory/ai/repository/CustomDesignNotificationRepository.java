package com.inventory.ai.repository;

import com.inventory.ai.model.CustomDesignNotification;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface CustomDesignNotificationRepository extends ReactiveCrudRepository<CustomDesignNotification, UUID> {
    Flux<CustomDesignNotification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Mono<Long> countByUserIdAndReadAtIsNull(UUID userId);
    Flux<CustomDesignNotification> findByUserIdAndReadAtIsNull(UUID userId);
}
