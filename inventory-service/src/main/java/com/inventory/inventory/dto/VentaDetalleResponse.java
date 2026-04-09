package com.inventory.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record VentaDetalleResponse(
    UUID id,
    UUID productId,
    Integer cantidad,
    BigDecimal precioUnitario,
    BigDecimal subtotal
) {}
