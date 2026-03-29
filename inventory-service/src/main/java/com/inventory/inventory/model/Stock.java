package com.inventory.inventory.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import java.util.UUID;

@Table("stocks")
public class Stock implements Persistable<UUID> {
    @Id
    private UUID productId;
    private Integer quantity;

    @Transient
    private boolean isNew = true;

    @Override
    public UUID getId() {
        return productId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    public void markExisting() {
        this.isNew = false;
    }

    public Stock() {}

    public Stock(UUID productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
