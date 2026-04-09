package com.inventory.inventory.dto;

import java.util.UUID;

public record VentaItemRequest(
    UUID productId,
    Integer cantidad
) {}
