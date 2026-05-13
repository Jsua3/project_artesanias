package com.inventory.ai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Table("custom_design_notifications")
public class CustomDesignNotification implements Persistable<UUID> {
    @Id
    private UUID id;
    @Transient
    private boolean isNew;
    private UUID userId;
    private UUID designId;
    private String title;
    private String message;
    private String status;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    @Override
    public boolean isNew() { return isNew; }
    public void markNew() { this.isNew = true; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getDesignId() { return designId; }
    public void setDesignId(UUID designId) { this.designId = designId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
