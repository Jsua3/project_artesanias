package com.inventory.inventory.dto;

import java.util.UUID;

public record StockResponse(
    UUID productId,
    Integer quantity
) {}
