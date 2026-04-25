package com.inventory.inventory.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
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
    private UUID assignedCourierId;
    private boolean packed;
    private boolean pickedUp;
    private boolean onTheWay;
    private boolean delivered;
    private LocalDateTime deliveryUpdatedAt;
    private UUID deliveryUpdatedBy;
    private LocalDateTime packedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime onTheWayAt;
    private LocalDateTime deliveredAt;
    private Double trackingLatitude;
    private Double trackingLongitude;
    private String deliveryEvidenceUrl;
    private String deliveryNotes;
    private LocalDateTime createdAt;

    /** Stripe Checkout Session ID (cs_...). Null hasta que se genere la sesion de pago. */
    @Column("stripe_session_id")
    private String stripeSessionId;

    @Transient
    private boolean isNew = false;

    public Venta() {
    }

    public Venta(UUID id, UUID clienteId, UUID vendedorId, BigDecimal total,
                 String estado, LocalDateTime createdAt) {
        this(id, clienteId, vendedorId, total, estado, createdAt, null);
    }

    public Venta(UUID id, UUID clienteId, UUID vendedorId, BigDecimal total,
                 String estado, LocalDateTime createdAt, String stripeSessionId) {
        this.id = id;
        this.clienteId = clienteId;
        this.vendedorId = vendedorId;
        this.total = total != null ? total : BigDecimal.ZERO;
        this.estado = estado != null ? estado : "COMPLETADA";
        this.assignedCourierId = null;
        this.packed = false;
        this.pickedUp = false;
        this.onTheWay = false;
        this.delivered = false;
        this.deliveryUpdatedAt = null;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.stripeSessionId = stripeSessionId;
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

    public UUID assignedCourierId() {
        return assignedCourierId;
    }

    public boolean packed() {
        return packed;
    }

    public boolean pickedUp() {
        return pickedUp;
    }

    public boolean onTheWay() {
        return onTheWay;
    }

    public boolean delivered() {
        return delivered;
    }

    public LocalDateTime deliveryUpdatedAt() {
        return deliveryUpdatedAt;
    }

    public UUID deliveryUpdatedBy() {
        return deliveryUpdatedBy;
    }

    public LocalDateTime packedAt() {
        return packedAt;
    }

    public LocalDateTime pickedUpAt() {
        return pickedUpAt;
    }

    public LocalDateTime onTheWayAt() {
        return onTheWayAt;
    }

    public LocalDateTime deliveredAt() {
        return deliveredAt;
    }

    public Double trackingLatitude() {
        return trackingLatitude;
    }

    public Double trackingLongitude() {
        return trackingLongitude;
    }

    public String deliveryEvidenceUrl() {
        return deliveryEvidenceUrl;
    }

    public String deliveryNotes() {
        return deliveryNotes;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public String stripeSessionId() {
        return stripeSessionId;
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

    public UUID getAssignedCourierId() {
        return assignedCourierId;
    }

    public void setAssignedCourierId(UUID assignedCourierId) {
        this.assignedCourierId = assignedCourierId;
    }

    public boolean isPacked() {
        return packed;
    }

    public void setPacked(boolean packed) {
        this.packed = packed;
    }

    public boolean isPickedUp() {
        return pickedUp;
    }

    public void setPickedUp(boolean pickedUp) {
        this.pickedUp = pickedUp;
    }

    public boolean isOnTheWay() {
        return onTheWay;
    }

    public void setOnTheWay(boolean onTheWay) {
        this.onTheWay = onTheWay;
    }

    public boolean isDelivered() {
        return delivered;
    }

    public void setDelivered(boolean delivered) {
        this.delivered = delivered;
    }

    public LocalDateTime getDeliveryUpdatedAt() {
        return deliveryUpdatedAt;
    }

    public void setDeliveryUpdatedAt(LocalDateTime deliveryUpdatedAt) {
        this.deliveryUpdatedAt = deliveryUpdatedAt;
    }

    public UUID getDeliveryUpdatedBy() {
        return deliveryUpdatedBy;
    }

    public void setDeliveryUpdatedBy(UUID deliveryUpdatedBy) {
        this.deliveryUpdatedBy = deliveryUpdatedBy;
    }

    public LocalDateTime getPackedAt() {
        return packedAt;
    }

    public void setPackedAt(LocalDateTime packedAt) {
        this.packedAt = packedAt;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public LocalDateTime getOnTheWayAt() {
        return onTheWayAt;
    }

    public void setOnTheWayAt(LocalDateTime onTheWayAt) {
        this.onTheWayAt = onTheWayAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public Double getTrackingLatitude() {
        return trackingLatitude;
    }

    public void setTrackingLatitude(Double trackingLatitude) {
        this.trackingLatitude = trackingLatitude;
    }

    public Double getTrackingLongitude() {
        return trackingLongitude;
    }

    public void setTrackingLongitude(Double trackingLongitude) {
        this.trackingLongitude = trackingLongitude;
    }

    public String getDeliveryEvidenceUrl() {
        return deliveryEvidenceUrl;
    }

    public void setDeliveryEvidenceUrl(String deliveryEvidenceUrl) {
        this.deliveryEvidenceUrl = deliveryEvidenceUrl;
    }

    public String getDeliveryNotes() {
        return deliveryNotes;
    }

    public void setDeliveryNotes(String deliveryNotes) {
        this.deliveryNotes = deliveryNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStripeSessionId() {
        return stripeSessionId;
    }

    public void setStripeSessionId(String stripeSessionId) {
        this.stripeSessionId = stripeSessionId;
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
