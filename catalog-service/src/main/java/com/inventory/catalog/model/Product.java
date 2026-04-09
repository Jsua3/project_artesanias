package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Table("products")
public class Product implements Persistable<UUID> {

    @Id
    private UUID id;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private String imageUrl;
    private Integer stockMinimo;
    private UUID categoryId;
    private UUID artesanoId;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private boolean isNew = false;

    public Product() {
    }

    public Product(UUID id, String name, String description, String sku, BigDecimal price,
                   String imageUrl, Integer stockMinimo, UUID categoryId, UUID artesanoId,
                   Boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.price = price;
        this.imageUrl = imageUrl;
        this.stockMinimo = stockMinimo != null ? stockMinimo : 5;
        this.categoryId = categoryId;
        this.artesanoId = artesanoId;
        this.active = active != null ? active : true;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    // Record-style accessors
    public UUID id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String description() {
        return description;
    }

    public String sku() {
        return sku;
    }

    public BigDecimal price() {
        return price;
    }

    public String imageUrl() {
        return imageUrl;
    }

    public Integer stockMinimo() {
        return stockMinimo;
    }

    public UUID categoryId() {
        return categoryId;
    }

    public UUID artesanoId() {
        return artesanoId;
    }

    public Boolean active() {
        return active;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public LocalDateTime updatedAt() {
        return updatedAt;
    }

    // Standard getters/setters for R2DBC mapping
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getStockMinimo() {
        return stockMinimo;
    }

    public void setStockMinimo(Integer stockMinimo) {
        this.stockMinimo = stockMinimo;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public UUID getArtesanoId() {
        return artesanoId;
    }

    public void setArtesanoId(UUID artesanoId) {
        this.artesanoId = artesanoId;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    // Persistable
    @Override
    public boolean isNew() {
        return isNew;
    }

    public Product withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
