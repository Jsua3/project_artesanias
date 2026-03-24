package com.inventory.inventory.dto;

import java.util.UUID;

public record EntryRequest(
    UUID productId,
    Integer quantity,
    String notes
) {}
