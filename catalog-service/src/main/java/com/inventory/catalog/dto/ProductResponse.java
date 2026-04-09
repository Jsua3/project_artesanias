package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String name,
    String description,
    String sku,
    BigDecimal price,
    String imageUrl,
    Integer stockMinimo,
    UUID categoryId,
    UUID artesanoId,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
