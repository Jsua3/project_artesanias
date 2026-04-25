package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("community_post_likes")
public class CommunityPostLike implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID postId;
    private UUID userId;
    private LocalDateTime createdAt;

    @Transient
    private boolean isNew = false;

    public CommunityPostLike() {
    }

    public CommunityPostLike(UUID id, UUID postId, UUID userId, LocalDateTime createdAt) {
        this.id = id;
        this.postId = postId;
        this.userId = userId;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public UUID id() {
        return id;
    }

    public UUID postId() {
        return postId;
    }

    public UUID userId() {
        return userId;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    public CommunityPostLike withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
