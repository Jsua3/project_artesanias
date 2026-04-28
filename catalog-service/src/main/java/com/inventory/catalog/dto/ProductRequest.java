package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductRequest(
    String name,
    String description,
    String sku,
    BigDecimal price,
    String imageUrl,
    Integer stockMinimo,
    UUID categoryId,       // legacy — primer elemento si categoryIds está vacío
    List<UUID> categoryIds, // múltiples categorías
    UUID artesanoId
) {}
