package com.inventory.report.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Table("stock_snapshots")
public class StockSnapshot implements Persistable<UUID> {
    @Id
    private UUID productId;
    private Integer currentQuantity;
    private LocalDateTime lastUpdated;

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

    public void setNew(boolean isNew) {
        this.isNew = isNew;
    }

    public StockSnapshot() {}

    public StockSnapshot(UUID productId, Integer currentQuantity, LocalDateTime lastUpdated) {
        this.productId = productId;
        this.currentQuantity = currentQuantity;
        this.lastUpdated = lastUpdated;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public Integer getCurrentQuantity() {
        return currentQuantity;
    }

    public void setCurrentQuantity(Integer currentQuantity) {
        this.currentQuantity = currentQuantity;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
