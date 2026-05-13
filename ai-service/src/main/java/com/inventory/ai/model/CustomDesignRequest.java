package com.inventory.ai.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Table("custom_design_requests")
public class CustomDesignRequest implements Persistable<UUID> {
    @Id
    private UUID id;
    @Transient
    private boolean isNew;
    private UUID userId;
    private String title;
    private String productType;
    private String status;
    private String specJson;
    private String priceBreakdownJson;
    private BigDecimal estimatedPrice;
    private Integer estimatedDays;
    private String customerNotes;
    private String reviewNotes;
    private String previewPrompt;
    private String previewImageBase64;
    private String previewMimeType;
    private String previewSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    @Override
    public boolean isNew() { return isNew; }
    public void markNew() { this.isNew = true; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSpecJson() { return specJson; }
    public void setSpecJson(String specJson) { this.specJson = specJson; }
    public String getPriceBreakdownJson() { return priceBreakdownJson; }
    public void setPriceBreakdownJson(String priceBreakdownJson) { this.priceBreakdownJson = priceBreakdownJson; }
    public BigDecimal getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(BigDecimal estimatedPrice) { this.estimatedPrice = estimatedPrice; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer estimatedDays) { this.estimatedDays = estimatedDays; }
    public String getCustomerNotes() { return customerNotes; }
    public void setCustomerNotes(String customerNotes) { this.customerNotes = customerNotes; }
    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
    public String getPreviewPrompt() { return previewPrompt; }
    public void setPreviewPrompt(String previewPrompt) { this.previewPrompt = previewPrompt; }
    public String getPreviewImageBase64() { return previewImageBase64; }
    public void setPreviewImageBase64(String previewImageBase64) { this.previewImageBase64 = previewImageBase64; }
    public String getPreviewMimeType() { return previewMimeType; }
    public void setPreviewMimeType(String previewMimeType) { this.previewMimeType = previewMimeType; }
    public String getPreviewSource() { return previewSource; }
    public void setPreviewSource(String previewSource) { this.previewSource = previewSource; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
