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
        LocalDateTime updatedAt,
        UUID updatedBy,
        LocalDateTime packedAt,
        LocalDateTime pickedUpAt,
        LocalDateTime onTheWayAt,
        LocalDateTime deliveredAt,
        Double latitude,
        Double longitude,
        String evidenceUrl,
        String notes
) {
}
