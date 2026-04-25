package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("community_posts")
public class CommunityPost implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID authorId;
    private String authorName;
    private String authorAvatarUrl;
    private String content;
    private String imageUrl;
    private Integer likesCount;
    private Integer commentsCount;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private boolean isNew = false;

    public CommunityPost() {
    }

    public CommunityPost(UUID id, UUID authorId, String authorName, String authorAvatarUrl,
                         String content, String imageUrl, Integer likesCount, Integer commentsCount,
                         String estado, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorAvatarUrl = authorAvatarUrl;
        this.content = content;
        this.imageUrl = imageUrl;
        this.likesCount = likesCount != null ? likesCount : 0;
        this.commentsCount = commentsCount != null ? commentsCount : 0;
        this.estado = estado != null ? estado : "ACTIVO";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public UUID id() {
        return id;
    }

    public UUID authorId() {
        return authorId;
    }

    public String authorName() {
        return authorName;
    }

    public String authorAvatarUrl() {
        return authorAvatarUrl;
    }

    public String content() {
        return content;
    }

    public String imageUrl() {
        return imageUrl;
    }

    public Integer likesCount() {
        return likesCount;
    }

    public Integer commentsCount() {
        return commentsCount;
    }

    public String estado() {
        return estado;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public LocalDateTime updatedAt() {
        return updatedAt;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public void setAuthorId(UUID authorId) {
        this.authorId = authorId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorAvatarUrl() {
        return authorAvatarUrl;
    }

    public void setAuthorAvatarUrl(String authorAvatarUrl) {
        this.authorAvatarUrl = authorAvatarUrl;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(Integer likesCount) {
        this.likesCount = likesCount;
    }

    public Integer getCommentsCount() {
        return commentsCount;
    }

    public void setCommentsCount(Integer commentsCount) {
        this.commentsCount = commentsCount;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    public CommunityPost withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
