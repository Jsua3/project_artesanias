package com.inventory.inventory.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Table("ventas")
public class Venta implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID clienteId;
    private UUID vendedorId;
    private BigDecimal total;
    private String estado;
    private LocalDateTime createdAt;

    @Transient
    private boolean isNew = false;

    public Venta() {
    }

    public Venta(UUID id, UUID clienteId, UUID vendedorId, BigDecimal total,
                 String estado, LocalDateTime createdAt) {
        this.id = id;
        this.clienteId = clienteId;
        this.vendedorId = vendedorId;
        this.total = total != null ? total : BigDecimal.ZERO;
        this.estado = estado != null ? estado : "COMPLETADA";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    // Record-style accessors
    public UUID id() {
        return id;
    }

    public UUID clienteId() {
        return clienteId;
    }

    public UUID vendedorId() {
        return vendedorId;
    }

    public BigDecimal total() {
        return total;
    }

    public String estado() {
        return estado;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    // Standard getters/setters for R2DBC mapping
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getClienteId() {
        return clienteId;
    }

    public void setClienteId(UUID clienteId) {
        this.clienteId = clienteId;
    }

    public UUID getVendedorId() {
        return vendedorId;
    }

    public void setVendedorId(UUID vendedorId) {
        this.vendedorId = vendedorId;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
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

    // Persistable
    @Override
    public boolean isNew() {
        return isNew;
    }

    public Venta withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
