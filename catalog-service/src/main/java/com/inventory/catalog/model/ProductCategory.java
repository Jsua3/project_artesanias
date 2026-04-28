package com.inventory.catalog.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Table("product_categories")
public class ProductCategory implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID productId;
    private UUID categoryId;

    @Transient
    private boolean isNew = false;

    public ProductCategory() {}

    public ProductCategory(UUID id, UUID productId, UUID categoryId) {
        this.id = id;
        this.productId = productId;
        this.categoryId = categoryId;
    }

    public UUID getId()         { return id; }
    public UUID getProductId()  { return productId; }
    public UUID getCategoryId() { return categoryId; }
    public UUID productId()     { return productId; }
    public UUID categoryId()    { return categoryId; }

    public void setId(UUID id)               { this.id = id; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public void setCategoryId(UUID catId)    { this.categoryId = catId; }

    @Override public boolean isNew() { return isNew; }
    public ProductCategory withIsNew(boolean v) { this.isNew = v; return this; }
}
