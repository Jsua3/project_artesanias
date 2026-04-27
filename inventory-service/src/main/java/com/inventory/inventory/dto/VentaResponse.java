package com.inventory.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record VentaResponse(
    UUID id,
    UUID clienteId,
    UUID vendedorId,
    BigDecimal total,
    String estado,
    LocalDateTime createdAt,
    DeliveryTrackingResponse delivery,
    List<VentaDetalleResponse> detalles,
    ShippingInfoDto shipping,
    CourierCardDto courier,
    String clienteName
) {
    public VentaResponse(UUID id, UUID clienteId, UUID vendedorId, BigDecimal total,
                         String estado, LocalDateTime createdAt, DeliveryTrackingResponse delivery,
                         List<VentaDetalleResponse> detalles) {
        this(id, clienteId, vendedorId, total, estado, createdAt, delivery, detalles, null, null, null);
    }
}
