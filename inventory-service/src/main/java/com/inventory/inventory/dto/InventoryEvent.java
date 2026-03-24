package com.inventory.inventory.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record InventoryEvent(
    UUID productId,
    Integer quantity,
    MovementType type,
    UUID performedBy,
    LocalDateTime timestamp
) {}
