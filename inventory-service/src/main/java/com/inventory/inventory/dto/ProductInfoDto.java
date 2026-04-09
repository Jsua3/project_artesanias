package com.inventory.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductInfoDto(
    UUID id,
    String name,
    BigDecimal price
) {}
