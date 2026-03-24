package com.inventory.report.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryEvent(
    UUID productId,
    Integer quantity,
    String type,
    UUID performedBy,
    LocalDateTime timestamp
) {}
