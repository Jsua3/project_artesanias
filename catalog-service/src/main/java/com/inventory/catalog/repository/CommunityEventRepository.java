package com.inventory.catalog.repository;

import com.inventory.catalog.model.CommunityEvent;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface CommunityEventRepository extends ReactiveCrudRepository<CommunityEvent, UUID> {

    @Query("SELECT * FROM community_events WHERE artesano_id = :artesanoId ORDER BY created_at DESC")
    Flux<CommunityEvent> findByArtesanoIdOrdered(UUID artesanoId);

    @Query("SELECT * FROM community_events WHERE estado = :estado ORDER BY created_at DESC")
    Flux<CommunityEvent> findByEstadoOrdered(String estado);

    @Query("SELECT * FROM community_events ORDER BY created_at DESC")
    Flux<CommunityEvent> findAllOrdered();
}
