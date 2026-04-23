package com.inventory.inventory.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DeliveryTrackingResponse(
        UUID assignedCourierId,
        boolean packed,
        boolean pickedUp,
        boolean onTheWay,
        boolean delivered,
        int progress,
        String stage,
        LocalDateTime updatedAt
) {
}
