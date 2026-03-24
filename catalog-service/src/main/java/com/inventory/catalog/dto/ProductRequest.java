package com.inventory.catalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductRequest(String name, String sku, BigDecimal price, UUID categoryId) {
}
