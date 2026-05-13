package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PublicProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        UUID categoryId,
        List<UUID> categoryIds,
        UUID artesanoId
) {}
