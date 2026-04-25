package com.inventory.catalog.repository;

import com.inventory.catalog.model.CommunityPost;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface CommunityPostRepository extends ReactiveCrudRepository<CommunityPost, UUID> {

    @Query("SELECT * FROM community_posts WHERE estado = 'ACTIVO' ORDER BY created_at DESC")
    Flux<CommunityPost> findActiveFeed();

    @Query("SELECT * FROM community_posts WHERE estado <> 'ELIMINADO' ORDER BY created_at DESC")
    Flux<CommunityPost> findModerationFeed();
}
