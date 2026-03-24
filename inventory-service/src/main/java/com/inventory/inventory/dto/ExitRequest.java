package com.inventory.inventory.dto;

import java.util.UUID;

public record ExitRequest(
    UUID productId,
    Integer quantity,
    String notes
) {}
