package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductRequest(
    String name,
    String description,
    String sku,
    BigDecimal price,
    String imageUrl,
    Integer stockMinimo,
    UUID categoryId,
    UUID artesanoId
) {}
