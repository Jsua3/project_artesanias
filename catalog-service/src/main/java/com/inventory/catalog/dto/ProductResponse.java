package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String name,
    String description,
    String sku,
    BigDecimal price,
    String imageUrl,
    Integer stockMinimo,
    UUID categoryId,        // categoría primaria (compatibilidad)
    List<UUID> categoryIds, // todas las categorías
    UUID artesanoId,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
