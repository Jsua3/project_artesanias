package com.inventory.catalog.repository;

import com.inventory.catalog.model.CommunityPostLike;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface CommunityPostLikeRepository extends ReactiveCrudRepository<CommunityPostLike, UUID> {
    Mono<CommunityPostLike> findByPostIdAndUserId(UUID postId, UUID userId);
}
