package com.inventory.inventory.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Table("venta_detalle")
public class VentaDetalle implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID ventaId;
    private UUID productId;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    /** Fase 2c: snapshot del artesano al momento de la compra (nullable). */
    private UUID artesanoId;

    @Transient
    private boolean isNew = false;

    public VentaDetalle() {
    }

    public VentaDetalle(UUID id, UUID ventaId, UUID productId, Integer cantidad,
                        BigDecimal precioUnitario, BigDecimal subtotal) {
        this(id, ventaId, productId, cantidad, precioUnitario, subtotal, null);
    }

    public VentaDetalle(UUID id, UUID ventaId, UUID productId, Integer cantidad,
                        BigDecimal precioUnitario, BigDecimal subtotal, UUID artesanoId) {
        this.id = id;
        this.ventaId = ventaId;
        this.productId = productId;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
        this.artesanoId = artesanoId;
    }

    // Record-style accessors
    public UUID id() {
        return id;
    }

    public UUID ventaId() {
        return ventaId;
    }

    public UUID productId() {
        return productId;
    }

    public Integer cantidad() {
        return cantidad;
    }

    public BigDecimal precioUnitario() {
        return precioUnitario;
    }

    public BigDecimal subtotal() {
        return subtotal;
    }

    public UUID artesanoId() {
        return artesanoId;
    }

    // Standard getters/setters for R2DBC mapping
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getVentaId() {
        return ventaId;
    }

    public void setVentaId(UUID ventaId) {
        this.ventaId = ventaId;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public UUID getArtesanoId() {
        return artesanoId;
    }

    public void setArtesanoId(UUID artesanoId) {
        this.artesanoId = artesanoId;
    }

    // Persistable
    @Override
    public boolean isNew() {
        return isNew;
    }

    public VentaDetalle withIsNew(boolean isNew) {
        this.isNew = isNew;
        return this;
    }
}
