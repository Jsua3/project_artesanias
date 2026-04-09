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
    List<VentaDetalleResponse> detalles
) {}
